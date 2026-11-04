import test from 'node:test';
import assert from 'node:assert/strict';
import { budgetKey, readBudget, reserveAnalysis } from '../base44/shared/automationControls.ts';
import { matchFingerprint } from '../base44/shared/matchCache.ts';
import { assertOwner, assertConsistentOwner } from '../base44/shared/personalOwnership.ts';
import { claimDelivery, auditCompleted } from '../base44/shared/applicationAudit.ts';
import { approveApplication, dispatchApprovedApplication, prepareApplication } from '../base44/shared/applicationStateMachine.ts';

// In-memory doubles only: no SDK, network, credentials, uploads or provider calls.
function budgetClient({ limit = 1, used = 0, missing = false, pauses = [false] } = {}) {
  const record = { id: 'budget', key: budgetKey(), value: { limit, used } };
  let reads = 0;
  const entity = {
    async filter(query) {
      if (query.key === 'automation_paused') return [{ value: { paused: pauses[Math.min(reads++, pauses.length - 1)] } }];
      return missing ? [] : [structuredClone(record)];
    },
    async updateMany(query) {
      if (query['value.used'] !== record.value.used || query['value.limit'] !== record.value.limit) return { updated: 0 };
      record.value.used++;
      return { updated: 1 };
    },
  };
  return { asServiceRole: { entities: { AppSetting: entity } }, record };
}

test('budget uses UTC calendar month across timezone boundaries', () => {
  assert.equal(budgetKey(new Date('2026-10-31T23:30:00-04:00')), 'automation_ai_budget:2026-11');
});
test('missing, exhausted and paused budgets block reservations', async () => {
  for (const options of [{ missing: true }, { used: 1 }, { pauses: [true] }]) {
    const client = budgetClient(options);
    assert.equal((await reserveAnalysis(client)).allowed, false);
    assert.equal(client.record.value.used, options.used || 0);
  }
});
test('concurrent reservations cannot spend the same last slot in the double', async () => {
  const client = budgetClient();
  const results = await Promise.all([reserveAnalysis(client), reserveAnalysis(client)]);
  assert.equal(results.filter(r => r.allowed).length, 1);
  assert.equal(client.record.value.used, 1);
});
test('pause after reservation blocks execution without refunding the slot', async () => {
  const client = budgetClient({ pauses: [false, true] });
  assert.equal((await reserveAnalysis(client)).allowed, false);
  assert.equal((await readBudget(client)).used, 1);
});
test('ambiguous storage response fails closed', async () => {
  const client = budgetClient();
  client.asServiceRole.entities.AppSetting.updateMany = async () => ({});
  assert.equal((await reserveAnalysis(client)).allowed, false);
});
test('cache survives key ordering but changes with profile, job or preferences', async () => {
  const profile = { nome_completo: 'Teste', competencias: ['JS'], experiencias: [{ empresa: 'A', cargo: 'Dev' }] };
  const job = { id: 'job', cargo: 'Dev', descricao: 'JS', is_demo: false };
  const pref = { modalidades: ['remoto'] };
  const original = await matchFingerprint(profile, job, pref);
  assert.equal(await matchFingerprint({ ...profile, experiencias: [{ cargo: 'Dev', empresa: 'A' }] }, job, pref), original);
  for (const args of [
    [{ ...profile, competencias: ['TS'] }, job, pref],
    [profile, { ...job, descricao: 'TS' }, pref],
    [profile, { ...job, is_demo: true }, pref],
    [profile, job, { modalidades: ['presencial'] }],
  ]) assert.notEqual(await matchFingerprint(...args), original);
  assert.notEqual(original, undefined); // Legacy rows without a fingerprint cannot match.
});
test('ownership rejects forged user_id and conflicting legacy ownership', () => {
  assert.throws(() => assertOwner({ created_by_id: 'other', user_id: 'me' }, 'me'));
  assert.doesNotThrow(() => assertOwner({ created_by_id: 'service_worker', user_id: 'me' }, 'me'));
  assert.throws(() => assertConsistentOwner({ owner_user_id: 'me', user_id: 'other' }, 'me'));
  assert.throws(() => assertOwner({ owner_user_id: 'me' }, null));
});

function applicationClient(overrides = {}) {
  const app = { id: 'app', owner_user_id: 'me', user_id: 'me', status: 'pendente_aprovacao', metodo_envio: 'manual', resume_version_id: 'resume', job_id: 'job', ...overrides };
  const resume = { id: 'resume', owner_user_id: 'me', job_id: 'job', referencia_pdf_privado: 'private/resume.pdf', status_revisao: 'pronto' };
  const entities = {
    Application: {
      async get() { return structuredClone(app); },
      async update(id, patch) { return Object.assign(app, patch); },
      async updateMany(query, patch) {
        if (app.envio_token || app.status !== query.status || app.metodo_envio !== query.metodo_envio) return { updated: 0 };
        Object.assign(app, patch.$set);
        return { updated: 1 };
      },
    },
    ResumeVersion: { async get() { return resume; } },
    Job: { async get() { return { id: 'job', status: 'ativa', url_original: 'https://example.com/job' }; } },
    AuditLog: { async create() { return {}; } },
  };
  return { app, resume, asServiceRole: { entities } };
}
test('approval requires owner, ready resume and private PDF', async () => {
  for (const change of [{ owner_user_id: 'other' }, { status_revisao: 'rascunho' }, { referencia_pdf_privado: 'public/file.pdf' }]) {
    const client = applicationClient();
    Object.assign(client.resume, change);
    await assert.rejects(approveApplication(client, 'me', { applicationId: 'app' }));
    assert.equal(client.app.status, 'pendente_aprovacao');
  }
  const client = applicationClient();
  assert.equal((await approveApplication(client, 'me', { applicationId: 'app' })).status, 'aprovado');
  await assert.rejects(approveApplication(client, 'me', { applicationId: 'app' }));
});
test('preparation rejects missing PDF, demo mixing and resume for another job', async () => {
  for (const change of [{ referencia_pdf_privado: '' }, { is_demo: true }, { job_id: 'other' }]) {
    const client = applicationClient();
    Object.assign(client.resume, change);
    await assert.rejects(prepareApplication(client, 'me', { jobId: 'job', resumeVersionId: 'resume', metodoEnvio: 'manual' }));
  }
});
test('dispatch blocks unapproved state and manual flow never confirms a send', async () => {
  const client = applicationClient();
  await assert.rejects(dispatchApprovedApplication(client, 'me', { applicationId: 'app' }));
  client.app.status = 'aprovado';
  const result = await dispatchApprovedApplication(client, 'me', { applicationId: 'app' });
  assert.equal(result.status, 'acao_manual_necessaria');
  assert.equal(result.enviado_em, undefined);
  assert.equal(result.comprovante, undefined);
});
test('dispatch requires recipient and preserves mocked provider confirmation', async () => {
  const client = applicationClient({ status: 'aprovado', metodo_envio: 'gmail' });
  const confirmation = { id: 'app', status: 'enviado', comprovante: 'mock-proof' };
  client.functions = { async invoke(name, body) {
    assert.equal(name, 'sendGmailApplication');
    assert.equal(body.destinatario, 'test@example.com');
    return { data: { success: true, application: confirmation } };
  } };
  await assert.rejects(dispatchApprovedApplication(client, 'me', { applicationId: 'app' }));
  assert.equal(await dispatchApprovedApplication(client, 'me', { applicationId: 'app', destinatario: 'test@example.com' }), confirmation);
});
test('delivery reservation allows one contender and remains after simulated timeout', async () => {
  const client = applicationClient({ status: 'aprovado', metodo_envio: 'gmail' });
  const snapshot = structuredClone(client.app);
  const results = await Promise.allSettled([claimDelivery(client, snapshot, 'me', 'gmail', 'test@example.com'), claimDelivery(client, snapshot, 'me', 'gmail', 'test@example.com')]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  await assert.rejects(claimDelivery(client, snapshot, 'me', 'gmail', 'test@example.com'));
  assert.ok(client.app.envio_token);
});
test('delivery rejects wrong owner, channel and unapproved state', async () => {
  for (const change of [{ owner_user_id: 'other' }, { metodo_envio: 'outlook' }, { status: 'pendente_aprovacao' }]) {
    const client = applicationClient({ status: 'aprovado', metodo_envio: 'gmail', ...change });
    await assert.rejects(claimDelivery(client, client.app, 'me', 'gmail', 'test@example.com'));
    assert.equal(client.app.envio_token, undefined);
  }
});
test('audit completion failure does not overwrite provider confirmation', async () => {
  const client = applicationClient({ status: 'enviado', comprovante: 'mock-proof' });
  client.asServiceRole.entities.AuditLog.create = async () => { throw new Error('simulated storage failure'); };
  assert.equal(await auditCompleted(client, 'me', 'envio_concluido', 'app'), false);
  assert.equal(client.app.status, 'enviado');
  assert.equal(client.app.comprovante, 'mock-proof');
});
