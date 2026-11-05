import { analysisMode, assertTestCacheJob, analysisCacheQuery } from '../../shared/analysisCacheScope.ts';
import { recordAuditEvent, recordAuditCompleted } from '../../shared/auditEvents.ts';
import { rows } from '../../shared/automationControls.ts';
import { authenticatedUser } from '../../shared/requestAuth.ts';
import { matchFingerprint } from '../../shared/matchCache.ts';
import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { computeScore } from "../../shared/matchScorer.ts";
import { realProfile, ownerQuery, assertConsistentOwner } from '../../shared/personalOwnership.ts';
import { buildAnalysisPrompt, ANALYSIS_SCHEMA } from "../../shared/jobMatchAnalysis.ts";

// analyzeJobMatch — analisa a compatibilidade entre uma vaga e o perfil REAL
// do candidato autenticado usando LLM + pontuação determinística.
// Processo: perfil → vaga → preferências → IA → pontuação → JobMatch.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await authenticatedUser(base44);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const jobId = body.job_id;
    if (!jobId) {
      return Response.json({ error: "job_id é obrigatório" }, { status: 400 });
    }

    // Modo teste (admin only): profile fictício para demonstração, sem sobrescrever perfil real.
    // dry_run: não salva JobMatch, apenas retorna análise + pontuação.
    const { useTestProfile, dryRun, testNamespace } = analysisMode(body, user);

    // 1. Buscar perfil do usuário autenticado (ou usar perfil de teste)
    let profile;
    if (useTestProfile) {
      profile = body.test_profile;
    } else {
      profile = await realProfile(base44, user.id);
    }
    if (!profile) {
      return Response.json(
        { error: "Perfil incompleto. Preencha seu perfil em 'Meu Perfil' antes de analisar compatibilidade." },
        { status: 400 }
      );
    }

    // 2. Buscar requisitos da vaga
    const job = await base44.entities.Job.get(jobId);
    if (!job) {
      return Response.json({ error: "Vaga não encontrada." }, { status: 404 });
    }

    assertTestCacheJob(job, testNamespace);

    // 3. Buscar preferências do candidato (ou usar preferências de teste)
    let pref = null;
    if (useTestProfile && body.test_preferences) {
      pref = body.test_preferences;
    } else if (!useTestProfile) {
      const prefPage = await base44.asServiceRole.entities.JobPreference.filter(
        { $and: [ownerQuery(user.id), { is_demo: { $ne: true } }] }, { limit: 1 }
      );
      pref = rows(prefPage)[0] || null;
    }

    const fingerprint = await matchFingerprint(profile, job, pref);
    const cacheQuery = analysisCacheQuery(user.id, jobId, testNamespace);
    const eventPrefix = testNamespace ? 'homologacao_compatibilidade' : 'compatibilidade';
    if (!dryRun) {
      const cached = rows(await base44.asServiceRole.entities.JobMatch.filter(cacheQuery, { limit: 1 }));
      if (cached[0]?.cache_fingerprint === fingerprint) {
        const match = cached[0];
        assertConsistentOwner(match, user.id);
        const audit_recorded = await recordAuditCompleted(base44, user.id, eventPrefix + '_cache_reutilizado', 'JobMatch', match.id);
        return Response.json({ match, reused: true, ai_calls: 0, test_cache_namespace: testNamespace, audit_recorded, analysis: null, score: { score: match.score, nivel: match.nivel_compatibilidade, bloqueios: match.bloqueios || [], breakdown: match.pontuacao_detalhada, hasBloqueios: (match.bloqueios || []).length > 0 } });
      }
    }
    // 4. Enviar perfil + vaga + preferências para a IA
    const prompt = buildAnalysisPrompt(profile, job, pref);
    const auditRequest = dryRun ? null : await recordAuditEvent(base44, user.id, eventPrefix + '_solicitada', 'Job', jobId);
    let aiResult;
    try {
      aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: ANALYSIS_SCHEMA });
    } catch (error) {
      if (!dryRun) await recordAuditCompleted(base44, user.id, eventPrefix + '_falhou', 'Job', jobId, 'erro');
      throw error;
    }

    // 5. Calcular pontuação determinística
    const scoreResult = computeScore(aiResult, job, pref);

    // 6. Salvar resultado em JobMatch (create ou update) — exceto em dry_run
    const matchData = {
      cache_fingerprint: fingerprint,
      user_id: user.id,
      owner_user_id: user.id,
      job_id: jobId,
      score: scoreResult.score,
      pontuacao_detalhada: scoreResult.breakdown,
      competencias_evidenciadas: aiResult.competencias_compativeis || [],
      nivel_compatibilidade: scoreResult.nivel,
      justificativas: [aiResult.justificativa || ""].filter(Boolean),
      competencias_compativeis: (aiResult.competencias_compativeis || []).map(
        (c) => c.competencia
      ),
      competencias_ausentes: aiResult.competencias_ausentes || [],
      bloqueios: scoreResult.bloqueios,
      requisitos_identificados: aiResult.requisitos_identificados || [],
      evidencias: aiResult.evidencias_perfil || [],
      dados_insuficientes: aiResult.dados_insuficientes || "",
      data_analise: new Date().toISOString(),
    };

    let match = matchData;
    if (!dryRun) {
      const existingPage = rows(await base44.asServiceRole.entities.JobMatch.filter(cacheQuery, { limit: 1 }));
      const existing = existingPage[0];
      if (existing) {
        assertConsistentOwner(existing, user.id);
        const { user_id, owner_user_id, ...patch } = matchData;
        match = await base44.asServiceRole.entities.JobMatch.update(existing.id, patch);
      } else {
        match = await base44.asServiceRole.entities.JobMatch.create({ ...matchData, is_demo: !!testNamespace || job.is_demo === true, ...((testNamespace || job.is_demo) ? { demo_batch_id: testNamespace || job.demo_batch_id } : {}) });
      }
    }

    const audit_recorded = dryRun ? null : await recordAuditCompleted(base44, user.id, eventPrefix + '_concluida', 'JobMatch', match.id);
    return Response.json({
      reused: false, ai_calls: 1, test_cache_namespace: testNamespace, audit_recorded, audit_request_id: auditRequest?.id,
      match,
      analysis: aiResult,
      score: scoreResult,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: error.status || 500 });
  }
}
