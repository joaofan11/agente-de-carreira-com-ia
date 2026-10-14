import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { computeScore } from "../../shared/matchScorer.ts";
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
    const dryRun = !!body.dry_run;
    if (useTestProfile && user.role !== "admin") {
      return Response.json({ error: "Apenas administradores podem usar perfis de teste." }, { status: 403 });
    }

    // 1. Buscar perfil do usuário autenticado (ou usar perfil de teste)
    let profile;
    if (useTestProfile) {
      profile = body.test_profile;
    } else {
      const profilePage = await base44.entities.CandidateProfile.filter(
        { user_id: user.id },
        { limit: 1 }
      );
      profile = profilePage.items?.[0];
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
      const prefPage = await base44.entities.JobPreference.filter(
        { user_id: user.id },
        { limit: 1 }
      );
      pref = prefPage.items?.[0] || null;
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
      user_id: user.id,
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
      const existingPage = await base44.entities.JobMatch.filter(
        { user_id: user.id, job_id: jobId },
        { limit: 1 }
      );
      const existing = existingPage.items?.[0];
      if (existing) {
        match = await base44.entities.JobMatch.update(existing.id, matchData);
      } else {
        match = await base44.entities.JobMatch.create(matchData);
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