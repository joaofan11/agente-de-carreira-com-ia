import { automationActor } from '../../shared/automationScheduler.ts';
import { secrets } from 'base44:runtime';
import { automaticApplication } from '../../shared/automaticApplication.ts';
import { matchFingerprint } from '../../shared/matchCache.ts';
import { ownerOf, ownerQuery, assertConsistentOwner, realProfile } from '../../shared/personalOwnership.ts';
import { automationPaused, reserveAnalysis } from '../../shared/automationControls.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { computeScore, checkGeographicBlock } from "../../shared/matchScorer.ts";
import { buildAnalysisPrompt, ANALYSIS_SCHEMA } from "../../shared/jobMatchAnalysis.ts";

const SCORE_THRESHOLD = 60;
const MAX_CANDIDATES = 10;
const MAX_NEW_ANALYSES = 10;

// runCandidateProcessing — processa candidatos com preferências compatíveis.
// Reutiliza análises existentes (JobMatch), registra recomendações para revisão do estudante.
// WhatsApp e envios permanecem bloqueados até configuração e consentimento.
export default async function(req) {
  const base44 = createClientFromRequest(req);
  const startTime = Date.now();

  const user = await automationActor(base44,req,secrets,'runCandidateProcessing');
  if (!user) return Response.json({ error: 'Execução administrativa autenticada obrigatória.' }, { status: 403 });
  const isManual = user.origin !== 'agendado';
  if (await automationPaused(base44)) {
    return Response.json({ skipped: true, reason: 'Automação pausada.' });
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
      { status: "ativa", is_demo: { $ne: true } }, { sort: "-created_date", limit: 100 }
    );
    const jobs = jobsPage.items || [];

    // Busca candidatos com preferências
    const prefsPage = await base44.asServiceRole.entities.JobPreference.filter(
      { is_demo: { $ne: true } }, { limit: MAX_CANDIDATES }
    );
    const preferences = prefsPage.items || [];

    let analyses = 0, reused = 0, recommendations = 0, prepared = 0, alerts = 0;
    const errors = [];
    let analysesBudget = MAX_NEW_ANALYSES;

    let budgetStop = null;
    candidateLoop: for (const pref of preferences) {
      if (analysesBudget <= 0 && analyses >= MAX_NEW_ANALYSES) break;
      try {
        const userId = ownerOf(pref);
        assertConsistentOwner(pref, userId);
        const profile = await realProfile(base44, userId);
        if (!profile) continue;

        const matchingJobs = filterJobsByPreferences(jobs, pref);

        for (const job of matchingJobs) {
          if (await automationPaused(base44)) { budgetStop = 'Automação pausada.'; break candidateLoop; }
          try {
            // Reutiliza análise existente — evita chamadas repetidas à IA
            const matchPage = await base44.asServiceRole.entities.JobMatch.filter(
              { $and: [ownerQuery(userId), { job_id: job.id, is_demo: { $ne: true } }] }, { limit: 1 }
            );
            let match = matchPage.items?.[0];

            const fingerprint = await matchFingerprint(profile, job, pref);
            if (match?.cache_fingerprint === fingerprint) {
              assertConsistentOwner(match, userId);
              reused++;
            } else if (analysesBudget > 0) {
              // Nova análise via IA
              const prompt = buildAnalysisPrompt(profile, job, pref);
              const reservation = await reserveAnalysis(base44);
              if (!reservation.allowed) { budgetStop = reservation.reason; break candidateLoop; }
              analysesBudget--; // Count attempts BEFORE the provider, including failures.
              const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: ANALYSIS_SCHEMA,
              });
              const scoreResult = computeScore(aiResult, job, pref);

              const matchData = {
                cache_fingerprint: fingerprint,
                user_id: userId,
                owner_user_id: userId,
                is_demo: false,
                job_id: job.id,
                score: scoreResult.score,
                pontuacao_detalhada: scoreResult.breakdown,
                competencias_evidenciadas: aiResult.competencias_compativeis || [],
                nivel_compatibilidade: scoreResult.nivel,
                justificativas: [aiResult.justificativa || ""].filter(Boolean),
                competencias_compativeis: (aiResult.competencias_compativeis || []).map(c => c.competencia),
                competencias_ausentes: aiResult.competencias_ausentes || [],
                bloqueios: scoreResult.bloqueios,
                requisitos_identificados: aiResult.requisitos_identificados || [],
                evidencias: aiResult.evidencias_perfil || [],
                dados_insuficientes: aiResult.dados_insuficientes || "",
                data_analise: new Date().toISOString(),
              };
              if (match) { assertConsistentOwner(match,userId); match = await base44.asServiceRole.entities.JobMatch.update(match.id, matchData); }
              else match = await base44.asServiceRole.entities.JobMatch.create(matchData);
              analyses++;
            } else {
              continue; // Sem orçamento para nova análise
            }

            // A saved match is a recommendation, not consent to create a candidacy.
            // The existing curriculum review flow calls prepareApplication only after saving a PDF.
            if (match && match.score >= SCORE_THRESHOLD && (!match.bloqueios || match.bloqueios.length === 0)) {
              recommendations++;
              const automation=await automaticApplication(base44,userId,profile,job,match,secrets);
              if(automation.application_id)prepared++;
              if(automation.alert_sent)alerts++;
              if(automation.error)errors.push(automation.error);
            }
          } catch (jobErr) {
            errors.push(`Candidato ${userId}, vaga ${job.id}: ${jobErr.message}`);
          }
        }
      } catch (candErr) {
        errors.push(`Candidato ${pref.user_id}: ${candErr.message}`);
      }
    }

    // Preparação automática exige consentimento e configuração; aprovação continua obrigatória.
    const duration = Date.now() - startTime;
    await base44.asServiceRole.entities.AutomationRun.update(run.id, {
      status: errors.length > 0 ? "parcial" : "concluido",
      fim_em: new Date().toISOString(),
      duracao_ms: duration,
      vagas_encontradas: jobs.length,
      analises_realizadas: analyses,
      analises_reutilizadas: reused,
      candidaturas_criadas: prepared,
      alertas_enviados: alerts,
      erros: errors,
      detalhes: {
        candidatos_processados: preferences.length,
        recomendacoes_disponiveis: recommendations,
        tentativas_ia: MAX_NEW_ANALYSES - analysesBudget,
        motivo_interrupcao: budgetStop,
        whatsapp_pendente: "Canal não configurado. Alertas bloqueados até consentimento.",
      },
    });

    return Response.json({
      success: true,
      run_id: run.id,
      jobs_processed: jobs.length,
      candidates_processed: preferences.length,
      analyses_new: analyses,
      analyses_attempted: MAX_NEW_ANALYSES - analysesBudget,
      stop_reason: budgetStop,
      analyses_reused: reused,
      applications_created: 0,
      recommendations_available: recommendations,
      applications_prepared: prepared,
      alerts_sent: alerts,
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