// Armazenamento — deduplica por source_id e salva apenas vagas novas na entidade Job.
// Usa service role (a entidade Job tem criação restrita a admins; a função popula o
// quadro público de vagas em nome do sistema).

export async function saveNewJobs(base44, jobs) {
  const clean = (jobs || []).filter((j) => j && j.source_id);
  if (clean.length === 0) return { saved: 0, duplicates: 0 };

  // Deduplica dentro do próprio lote.
  const seen = new Set();
  const unique = [];
  for (const j of clean) {
    if (seen.has(j.source_id)) continue;
    seen.add(j.source_id);
    unique.push(j);
  }

  const sourceIds = unique.map((j) => j.source_id);
  const existing = await base44.asServiceRole.entities.Job.filter(
    { source_id: { $in: sourceIds } },
    { limit: 500, fields: ["source_id"] }
  );
  const existingIds = new Set((existing.items || []).map((j) => j.source_id));
  const newJobs = unique.filter((j) => !existingIds.has(j.source_id));

  if (newJobs.length === 0) return { saved: 0, duplicates: unique.length };

  const created = await base44.asServiceRole.entities.Job.bulkCreate(newJobs);
  return { saved: Array.isArray(created) ? created.length : 0, duplicates: unique.length - (Array.isArray(created) ? created.length : 0) };
}