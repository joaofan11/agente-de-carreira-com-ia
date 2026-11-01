import { automationPaused, requireAutomationAdmin } from '../../shared/automationControls.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { fetchJobicyJobs } from "../../shared/jobicyClient.ts";
import { normalizeJobicyJob, filterEntryLevel } from "../../shared/jobNormalizer.ts";
import { saveNewJobs } from "../../shared/jobStorage.ts";

// runJobCollection — coleta automática de vagas do Jobicy.
// Verifica pausa e lock, registra execução em AutomationRun.
export default async function(req) {
  const base44 = createClientFromRequest(req);
  const startTime = Date.now();

  // Verifica se é execução manual (admin) ou agendada (sistema)
  const user = await requireAutomationAdmin(base44);
  if (!user) return Response.json({ error: 'Execução administrativa autenticada obrigatória.' }, { status: 403 });
  const isManual = true; // Do not infer trusted scheduler identity from a failed login.
  if (await automationPaused(base44)) {
    return Response.json({ skipped: true, reason: 'Automação pausada.' });
  }

  // Verifica lock — não iniciar execução equivalente enquanto já houver uma em andamento
  const lockCheck = await base44.asServiceRole.entities.AutomationRun.filter(
    { tipo: "coleta", status: "em_andamento" }, { limit: 1 }
  );
  if (lockCheck.items?.length > 0) {
    const stale = lockCheck.items[0];
    const ageMin = (Date.now() - new Date(stale.inicio_em).getTime()) / 60000;
    if (ageMin < 30) {
      return Response.json({ skipped: true, reason: "Coleta já em andamento.", run_id: stale.id });
    }
    // Marca run antiga como erro (stale)
    await base44.asServiceRole.entities.AutomationRun.update(stale.id, {
      status: "erro", fim_em: new Date().toISOString(),
      erros: ["Timeout: execução interrompida por inatividade (>30min)."],
    });
  }

  // Cria registro de execução
  const run = await base44.asServiceRole.entities.AutomationRun.create({
    tipo: "coleta",
    status: "em_andamento",
    inicio_em: new Date().toISOString(),
    origem: isManual ? "manual" : "agendado",
    vagas_encontradas: 0, vagas_novas: 0, analises_realizadas: 0, analises_reutilizadas: 0,
    candidaturas_criadas: 0, alertas_enviados: 0, erros: [],
  });

  try {
    // Coleta — 1 página (200 vagas) por execução para respeitar limites da API
    let allRaw = [];
    let cursor = null;
    let lastUpdate = "";
    for (let p = 0; p < 1; p++) {
      const page = await fetchJobicyJobs({ count: 200, cursor });
      allRaw = allRaw.concat(page.jobs);
      lastUpdate = page.lastUpdate || lastUpdate;
      cursor = page.nextCursor;
      if (!cursor) break;
    }

    // Normalização e filtro
    const normalized = allRaw.map(normalizeJobicyJob).filter(Boolean);
    const entryLevel = filterEntryLevel(normalized);

    // Deduplicação e armazenamento
    const result = await saveNewJobs(base44, entryLevel);

    const duration = Date.now() - startTime;
    await base44.asServiceRole.entities.AutomationRun.update(run.id, {
      status: "concluido",
      fim_em: new Date().toISOString(),
      duracao_ms: duration,
      vagas_encontradas: allRaw.length,
      vagas_novas: result.saved,
      detalhes: { entry_level: entryLevel.length, duplicates: result.duplicates, lastUpdate },
    });

    return Response.json({
      success: true,
      run_id: run.id,
      fetched: allRaw.length,
      saved: result.saved,
      duplicates: result.duplicates,
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
