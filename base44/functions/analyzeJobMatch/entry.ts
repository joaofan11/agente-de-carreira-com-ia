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
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const jobId = body.job_id;
    if (!jobId) {
      return Response.json({ error: "job_id é obrigatório" }, { status: 400 });
    }

    // Modo teste (admin only): profile fictício para demonstração, sem sobrescrever perfil real.
    // dry_run: não salva JobMatch, apenas retorna análise + pontuação.
    const useTestProfile = !!body.test_profile;
    const dryRun = !!body.dry_run || useTestProfile;
    if (useTestProfile && user.role !== "admin") {
      return Response.json({ error: "Apenas administradores podem usar perfis de teste." }, { status: 403 });
    }

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

    // 3. Buscar preferências do candidato (ou usar preferências de teste)
    let pref = null;
    if (useTestProfile && body.test_preferences) {
      pref = body.test_preferences;
    } else if (!useTestProfile) {
      const prefPage = await base44.asServiceRole.entities.JobPreference.filter(
        { $and: [ownerQuery(user.id), { is_demo: { $ne: true } }] }, { limit: 1 }
      );
      pref = prefPage.items?.[0] || null;
    }

    const fingerprint = await matchFingerprint(profile, job, pref);
    if (!dryRun) {
      const cached = await base44.asServiceRole.entities.JobMatch.filter({ $and: [ownerQuery(user.id), { job_id: jobId, is_demo: { $ne: true } }] }, { limit: 1 });
      if (cached.items?.[0]?.cache_fingerprint === fingerprint) {
        const match = cached.items[0];
        return Response.json({ match, reused: true, analysis: null, score: { score: match.score, nivel: match.nivel_compatibilidade, bloqueios: match.bloqueios || [] } });
      }
    }
    // 4. Enviar perfil + vaga + preferências para a IA
    const prompt = buildAnalysisPrompt(profile, job, pref);
    const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: ANALYSIS_SCHEMA,
    });

    // 5. Calcular pontuação determinística
    const scoreResult = computeScore(aiResult, job, pref);

    // 6. Salvar resultado em JobMatch (create ou update) — exceto em dry_run
    const matchData = {
      cache_fingerprint: fingerprint,
      user_id: user.id,
      owner_user_id: user.id,
      job_id: jobId,
      score: scoreResult.score,
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
      const existingPage = await base44.asServiceRole.entities.JobMatch.filter(
        { $and: [ownerQuery(user.id), { job_id: jobId, is_demo: { $ne: true } }] }, { limit: 1 }
      );
      const existing = existingPage.items?.[0];
      if (existing) {
        assertConsistentOwner(existing, user.id);
        const { user_id, owner_user_id, ...patch } = matchData;
        match = await base44.asServiceRole.entities.JobMatch.update(existing.id, patch);
      } else {
        match = await base44.asServiceRole.entities.JobMatch.create({ ...matchData, is_demo: job.is_demo === true, ...(job.is_demo ? { demo_batch_id: job.demo_batch_id } : {}) });
      }
    }

    return Response.json({
      match,
      analysis: aiResult,
      score: scoreResult,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}