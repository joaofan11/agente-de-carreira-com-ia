import { secrets } from 'base44:runtime';
import { automationActor } from '../../shared/automationScheduler.ts';
import { automationPaused } from '../../shared/automationControls.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { collectJobs } from "../../shared/collectJobs.ts";

// runJobCollection — coleta de vagas das fontes configuradas.
// Verifica pausa e lock, registra execução em AutomationRun.
export default async function(req) {
  const base44 = createClientFromRequest(req);
  const startTime = Date.now();

  // Verifica se é execução manual (admin) ou agendada (sistema)
  const user = await automationActor(base44,req,secrets,'runJobCollection');
  if (!user) return Response.json({ error: 'Execução administrativa autenticada obrigatória.' }, { status: 403 });
  const isManual = user.origin !== 'agendado';
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
    const result = await collectJobs(base44);

    const duration = Date.now() - startTime;
    await base44.asServiceRole.entities.AutomationRun.update(run.id, {
      status: "concluido",
      fim_em: new Date().toISOString(),
      duracao_ms: duration,
      vagas_encontradas: result.fetched,
      vagas_novas: result.saved,
      detalhes: { entry_level: result.entryLevel, duplicates: result.duplicates, sources: result.sources },
      erros: result.warnings,
    });

    return Response.json({
      success: true,
      sources: result.sources,
      warnings: result.warnings,
      run_id: run.id,
      fetched: result.fetched,
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
