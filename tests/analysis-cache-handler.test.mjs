import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBackendHandler } from './helpers/backend-handler.mjs';
import { authenticatedUser } from '../base44/shared/requestAuth.ts';
import { analysisMode, assertTestCacheJob, analysisCacheQuery } from '../base44/shared/analysisCacheScope.ts';
import { matchFingerprint } from '../base44/shared/matchCache.ts';
import { computeScore } from '../base44/shared/matchScorer.ts';
import { rows } from '../base44/shared/automationControls.ts';
import { realProfile, ownerQuery, assertConsistentOwner } from '../base44/shared/personalOwnership.ts';
import { buildAnalysisPrompt, ANALYSIS_SCHEMA } from '../base44/shared/jobMatchAnalysis.ts';
import { recordAuditEvent, recordAuditCompleted } from '../base44/shared/auditEvents.ts';

function fixture() {
  const user = { id: 'admin', role: 'admin' };
  const job = { id: 'job', cargo: 'Estágio', is_demo: true, demo_batch_id: 'HOMOLOG-cache' };
  const events = [], saved = []; let llmCalls = 0;
  const client = { auth: { me: async () => user }, entities: { Job: { get: async () => job } }, asServiceRole: {
    entities: {
      JobMatch: {
        async filter(query) {
          const criteria = query.$and[1];
          assert.equal(criteria.is_demo, true);
          assert.equal(criteria.demo_batch_id, job.demo_batch_id);
          return { items: saved.filter(row => row.owner_user_id === user.id && row.job_id === criteria.job_id && row.demo_batch_id === criteria.demo_batch_id) };
        },
        async create(value) { const row = { ...value, id: 'match-' + (saved.length + 1) }; saved.push(row); return row; },
        async update(id, patch) { const row = saved.find(r => r.id === id); Object.assign(row, patch); return row; },
      },
      AuditLog: { create: async event => { events.push(event); return { id: 'event-' + events.length }; } },
    },
    integrations: { Core: { InvokeLLM: async () => {
      llmCalls++;
      return { requisitos_identificados: ['JS'], competencias_compativeis: [{ competencia: 'JS', evidencia: 'Projeto' }], competencias_ausentes: [], evidencias_perfil: ['Projeto'], bloqueios: [], justificativa: 'Teste', dados_insuficientes: '', formacao_nivel: 1, experiencia_nivel: 0.5 };
    } } },
  } };
  const handler = loadBackendHandler(new URL('../base44/functions/analyzeJobMatch/entry.ts', import.meta.url), {
    createClientFromRequest: () => client, authenticatedUser, analysisMode, assertTestCacheJob, analysisCacheQuery,
    matchFingerprint, computeScore, rows, realProfile, ownerQuery, assertConsistentOwner, buildAnalysisPrompt, ANALYSIS_SCHEMA,
    recordAuditEvent, recordAuditCompleted,
  });
  const body = { job_id: job.id, test_profile: { nome_completo: 'Teste', competencias: ['JS'] }, test_preferences: { modalidades: ['remoto'] }, test_cache_namespace: job.demo_batch_id };
  const invoke = async value => {
    const response = await handler(new Request('https://example.com', { method: 'POST', body: JSON.stringify(value) }));
    return { status: response.status, data: await response.json() };
  };
  return { user, job, client, saved, events, body, invoke, get llmCalls() { return llmCalls; } };
}
test('isolated demo cache reuses the same analysis and invalidates changed input', async () => {
  const f = fixture();
  const first = await f.invoke(f.body);
  assert.equal(first.status, 200);
  assert.equal(first.data.reused, false);
  assert.equal(first.data.audit_request_id, 'event-1');
  assert.equal(f.llmCalls, 1);
  assert.equal(f.saved[0].is_demo, true);
  assert.equal(f.saved[0].demo_batch_id, 'HOMOLOG-cache');
  const cached = await f.invoke(f.body);
  assert.equal(cached.data.reused, true);
  assert.equal(cached.data.ai_calls, 0);
  assert.equal(f.llmCalls, 1);
  const changed = await f.invoke({ ...f.body, test_profile: { ...f.body.test_profile, competencias: ['JS', 'SQL'] } });
  assert.equal(changed.data.reused, false);
  assert.equal(f.llmCalls, 2);
  assert.equal(f.saved.length, 1);
  assert.ok(f.events.some(e => e.acao === 'homologacao_compatibilidade_cache_reutilizado'));
  assert.equal(JSON.stringify(f.events).includes('competencias'), false);
});
test('default test_profile dry run still performs no writes or cache lookup', async () => {
  const f = fixture(); delete f.body.test_cache_namespace;
  f.client.asServiceRole.entities.JobMatch.filter = () => { throw new Error('Unexpected cache access'); };
  assert.equal((await f.invoke(f.body)).status, 200);
  assert.equal(f.llmCalls, 1);
  assert.equal(f.saved.length, 0);
  assert.equal(f.events.length, 0);
});
test('demo cache rejects ordinary users, real jobs, foreign lots and contradictory dry_run', async () => {
  for (const variant of ['user', 'real-job', 'foreign-lot', 'dry-run', 'invalid-namespace', 'missing-profile']) {
    const f = fixture();
    if (variant === 'user') f.user.role = 'user';
    if (variant === 'real-job') f.job.is_demo = false;
    if (variant === 'foreign-lot') f.job.demo_batch_id = 'HOMOLOG-other';
    if (variant === 'dry-run') f.body.dry_run = true;
    if (variant === 'invalid-namespace') f.body.test_cache_namespace = 'production';
    if (variant === 'missing-profile') delete f.body.test_profile;
    const response = await f.invoke(f.body);
    assert.ok(response.status === 400 || response.status === 403, variant);
    assert.equal(f.llmCalls, 0, variant);
    assert.equal(f.saved.length, 0, variant);
  }
});
test('cache rejects foreign-owner rows even when storage returns one', async () => {
  const f = fixture();
  const fingerprint = await matchFingerprint(f.body.test_profile, f.job, f.body.test_preferences);
  f.client.asServiceRole.entities.JobMatch.filter = async () => ({ items: [{ id: 'foreign', owner_user_id: 'other', cache_fingerprint: fingerprint }] });
  assert.equal((await f.invoke(f.body)).status, 403);
  assert.equal(f.llmCalls, 0);
});
test('audit failure before analysis prevents new LLM consumption', async () => {
  const f = fixture();
  f.client.asServiceRole.entities.AuditLog.create = async () => { throw new Error('audit unavailable'); };
  assert.equal((await f.invoke(f.body)).status, 500);
  assert.equal(f.llmCalls, 0);
});
