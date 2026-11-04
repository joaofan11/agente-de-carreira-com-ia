import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { fetchJobicyJobs } from "../../shared/jobicyClient.ts";
import { normalizeJobicyJob, filterEntryLevel } from "../../shared/jobNormalizer.ts";
import { saveNewJobs } from "../../shared/jobStorage.ts";

// searchJobs — coleta vagas remotas do Jobicy, normaliza, filtra nível de entrada
// (estágio/trainee/júnior), deduplica e salva as novas na entidade Job.
// Fonte: Jobicy (https://jobicy.com) — API pública, sem chave, crédito à fonte.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'A coleta de vagas exige acesso administrativo.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const maxPages = Math.min(Math.max(Number(body.pages) || 1, 1), 3);

    // 1. Coleta — paginar até maxPages (200 vagas/página, janela de 7 dias).
    let allRaw = [];
    let cursor = null;
    let lastUpdate = "";
    for (let p = 0; p < maxPages; p++) {
      const page = await fetchJobicyJobs({ count: 200, cursor });
      allRaw = allRaw.concat(page.jobs);
      lastUpdate = page.lastUpdate || lastUpdate;
      cursor = page.nextCursor;
      if (!cursor) break;
    }

    // 2. Normalização
    const normalized = allRaw.map(normalizeJobicyJob).filter(Boolean);

    // 3. Filtro — apenas estágio/trainee/júnior
    const entryLevel = filterEntryLevel(normalized);

    // 4. Armazenamento — dedup + save
    const result = await saveNewJobs(base44, entryLevel);

    return Response.json({
      fonte: "Jobicy",
      fetched: allRaw.length,
      entryLevel: entryLevel.length,
      saved: result.saved,
      duplicates: result.duplicates,
      lastUpdate,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message, fonte: "Jobicy" }, { status: 500 });
  }
}
