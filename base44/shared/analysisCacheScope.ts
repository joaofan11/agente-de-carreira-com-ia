import { ownerQuery } from './personalOwnership.ts';

function reject(message, status = 400) {
  const error = new Error(message); error.status = status; throw error;
}

export function analysisMode(body, user) {
  const useTestProfile = !!body.test_profile;
  const testNamespace = body.test_cache_namespace ?? null;
  if (useTestProfile && user.role !== 'admin') reject('Apenas administradores podem usar perfis de teste.', 403);
  if (testNamespace !== null) {
    if (user.role !== 'admin') reject('Cache de homologação restrito a administradores.', 403);
    if (!useTestProfile || typeof testNamespace !== 'string' || !/^HOMOLOG-[A-Za-z0-9_-]{1,80}$/.test(testNamespace)) reject('Informe perfil fictício e lote HOMOLOG válido.');
    if (body.dry_run) reject('dry_run não grava cache; use o modo explícito de cache de homologação.');
  }
  return { useTestProfile, testNamespace, dryRun: !!body.dry_run || (useTestProfile && !testNamespace) };
}

export function assertTestCacheJob(job, namespace) {
  if (namespace && (job.is_demo !== true || job.demo_batch_id !== namespace)) reject('O cache de homologação exige uma vaga demo do mesmo lote.');
}

export function analysisCacheQuery(userId, jobId, namespace) {
  return { $and: [ownerQuery(userId), {
    job_id: jobId,
    is_demo: namespace ? true : { $ne: true },
    ...(namespace ? { demo_batch_id: namespace } : {}),
  }] };
}
