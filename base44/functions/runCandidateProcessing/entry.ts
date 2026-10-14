import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { computeScore, checkGeographicBlock } from "../../shared/matchScorer.ts";
import { buildAnalysisPrompt, ANALYSIS_SCHEMA } from "../../shared/jobMatchAnalysis.ts";

const SCORE_THRESHOLD = 60;
const MAX_CANDIDATES = 10;
const MAX_NEW_ANALYSES = 10;

// runCandidateProcessing — processa candidatos com preferências compatíveis.
// Reutiliza análises existentes (JobMatch), cria candidaturas AGUARDANDO_APROVACAO.
// WhatsApp e envios permanecem bloqueados até configuração e consentimento.
export default async function(req) {
  const base44 = createClientFromRequest(req);
  const startTime = Date.now();

  let isManual = false;
  try {
    const user = await base44.auth.me();
    if (user) {
      if (user.role !== "admin") return Response.json({ error: "Apenas administradores." }, { status: 403 });
      isManual = true;
    }
  } catch {}

  if (!isManual) {
    const pauseSetting = await base44.asServiceRole.entities.AppSetting.filter(
      { key: "automation_paused" }, { limit: 1 }
    );
    if (pauseSetting.items?.[0]?.value?.paused === true) {
      return Response.json({ skipped: true, reason: "Automação pausada." });
    }
  }

  // Lock
  const lockCheck = await base44.asServiceRole.entities.AutomationRun.filter(
    { tipo: "processamento", status: "em_andamento" }, { limit: 1 }
  );
  if (lockCheck.items?.length > 0) {
    const stale = lockCheck.items[0];
    const ageMin = (Date.now() - new Date(stale.inicio_em).getTime()) / 60000;
    if (ageMin < 30) {
      return Response.json({ skipped: true, reason: "Processamento já em andamento." });
    }
    await base44.asServiceRole.entities.AutomationRun.update(stale.id, {
      status: "erro", fim_em: new Date().toISOString(),
      erros: ["Timeout: execução interrompida por inatividade (>30min)."],
    });
  }

  const run = await base44.asServiceRole.entities.AutomationRun.create({
    tipo: "processamento",
    status: "em_andamento",
    inicio_em: new Date().toISOString(),
    origem: isManual ? "manual" : "agendado",
    vagas_encontradas: 0, vagas_novas: 0, analises_realizadas: 0, analises_reutilizadas: 0,
    candidaturas_criadas: 0, alertas_enviados: 0, erros: [],
  });

  try {
    // Busca vagas ativas
    const jobsPage = await base44.asServiceRole.entities.Job.filter(
      { status: "ativa" }, { sort: "-created_date", limit: 100 }
    );
    const jobs = jobsPage.items || [];

    // Busca candidatos com preferências
    const prefsPage = await base44.asServiceRole.entities.JobPreference.filter(
      {}, { limit: MAX_CANDIDATES }
    );
    const preferences = prefsPage.items || [];

    let analyses = 0, reused = 0, appsCreated = 0, alerts = 0;
    const errors = [];
    let analysesBudget = MAX_NEW_ANALYSES;

    for (const pref of preferences) {
      if (analysesBudget <= 0 && analyses >= MAX_NEW_ANALYSES) break;
      try {
        const userId = pref.user_id;
        const profilePage = await base44.asServiceRole.entities.CandidateProfile.filter(
          { user_id: userId }, { limit: 1 }
        );
        const profile = profilePage.items?.[0];
        if (!profile) continue;

        const matchingJobs = filterJobsByPreferences(jobs, pref);

        for (const job of matchingJobs) {
          try {
            // Reutiliza análise existente — evita chamadas repetidas à IA
            const matchPage = await base44.asServiceRole.entities.JobMatch.filter(
              { user_id: userId, job_id: job.id }, { limit: 1 }
            );
            let match = matchPage.items?.[0];

            if (match) {
              reused++;
            } else if (analysesBudget > 0) {
              // Nova análise via IA
              const prompt = buildAnalysisPrompt(profile, job, pref);
              const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: ANALYSIS_SCHEMA,
              });
              const scoreResult = computeScore(aiResult, job, pref);

              match = await base44.asServiceRole.entities.JobMatch.create({
                user_id: userId,
                job_id: job.id,
                score: scoreResult.score,
                nivel_compatibilidade: scoreResult.nivel,
                justificativas: [aiResult.justificativa || ""].filter(Boolean),
                competencias_compativeis: (aiResult.competencias_compativeis || []).map(c => c.competencia),
                competencias_ausentes: aiResult.competencias_ausentes || [],
                bloqueios: scoreResult.bloqueios,
                requisitos_identificados: aiResult.requisitos_identificados || [],
                evidencias: aiResult.evidencias_perfil || [],
                dados_insuficientes: aiResult.dados_insuficientes || "",
                data_analise: new Date().toISOString(),
              });
              analyses++;
              analysesBudget--;
            } else {
              continue; // Sem orçamento para nova análise
            }

            // Cria candidatura AGUARDANDO_APROVACAO se score alto e sem bloqueios
            if (match && match.score >= SCORE_THRESHOLD && (!match.bloqueios || match.bloqueios.length === 0)) {
              const appPage = await base44.asServiceRole.entities.Application.filter(
                { user_id: userId, job_id: job.id }, { limit: 1 }
              );
              if (appPage.items?.length === 0) {
                await base44.asServiceRole.entities.Application.create({
                  user_id: userId,
                  job_id: job.id,
                  status: "pendente_aprovacao",
                  metodo_envio: "manual",
                  criado_em: new Date().toISOString(),
                });
                appsCreated++;
              }
            }
          } catch (jobErr) {
            errors.push(`Candidato ${userId}, vaga ${job.id}: ${jobErr.message}`);
          }
        }
      } catch (candErr) {
        errors.push(`Candidato ${pref.user_id}: ${candErr.message}`);
      }
    }

    // WhatsApp: pendente — canal não configurado. Alertas bloqueados até configuração e consentimento.
    const duration = Date.now() - startTime;
    await base44.asServiceRole.entities.AutomationRun.update(run.id, {
      status: errors.length > 0 ? "parcial" : "concluido",
      fim_em: new Date().toISOString(),
      duracao_ms: duration,
      vagas_encontradas: jobs.length,
      analises_realizadas: analyses,
      analises_reutilizadas: reused,
      candidaturas_criadas: appsCreated,
      alertas_enviados: 0,
      erros: errors,
      detalhes: {
        candidatos_processados: preferences.length,
        whatsapp_pendente: "Canal não configurado. Alertas bloqueados até consentimento.",
      },
    });

    return Response.json({
      success: true,
      run_id: run.id,
      jobs_processed: jobs.length,
      candidates_processed: preferences.length,
      analyses_new: analyses,
      analyses_reused: reused,
      applications_created: appsCreated,
      errors: errors.length,
      duration_ms: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    await base44.asServiceRole.entities.AutomationRun.update(run.id, {
      status: "erro",
      fim_em: new Date().toISOString(),
      duracao_ms: duration,
      erros: [error.message],
    });
    return Response.json({ success: false, error: error.message, run_id: run.id }, { status: 500 });
  }
}

// Filtra vagas por preferências do candidato — respeita restrição geográfica (remoto não é automático no Brasil)
function filterJobsByPreferences(jobs, pref) {
  return jobs.filter(job => {
    // Filtro de nível
    if (pref.niveis && pref.niveis.length > 0 && !pref.niveis.includes(job.nivel)) return false;

    // Filtro de modalidade — remoto só se candidato aceitar
    if (job.modalidade === "remoto") {
      if (!pref.modalidades || (!pref.modalidades.includes("remoto") && !pref.modalidades.includes("indiferente"))) {
        return false;
      }
    } else if (pref.modalidades && pref.modalidades.length > 0 && !pref.modalidades.includes("indiferente") && !pref.modalidades.includes(job.modalidade)) {
      return false;
    }

    // Restrição geográfica — pula vagas remotas não acessíveis no Brasil
    const geoBlock = checkGeographicBlock(job);
    if (geoBlock) return false;

    // Filtro de cargo (texto)
    if (pref.cargos_interesse && pref.cargos_interesse.length > 0) {
      const cargoMatch = pref.cargos_interesse.some(c =>
        job.cargo && job.cargo.toLowerCase().includes(c.toLowerCase())
      );
      if (!cargoMatch) return false;
    }

    return true;
  });
}