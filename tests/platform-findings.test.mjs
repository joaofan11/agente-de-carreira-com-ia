import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { validateDemoReceipt } from '../base44/shared/demoReceiptValidation.ts';
import { getTwilioConfig, validateTwilioSignature } from '../base44/shared/twilioClient.ts';

function fixture() {
  const user = { id: 'owner', role: 'admin' };
  const app = { id: 'app', owner_user_id: user.id, status: 'aprovado', metodo_envio: 'api_direta', envio_token: 'reservation', job_id: 'job', resume_version_id: 'resume', is_demo: true };
  const job = { id: 'job', is_demo: true, api_endpoint: 'demo://receive-demo-application' };
  const resume = { owner_user_id: user.id, job_id: job.id, is_demo: true, status_revisao: 'pronto', referencia_pdf_privado: 'private/resume.pdf', conteudo_estruturado: { contato: { nome: 'Teste', email: 'test@example.com' } } };
  const body = { application_id: app.id, job_id: job.id, is_demo: true, pdf_base64: btoa('%PDF-test'), pdf_filename: 'test.pdf', pdf_size: 1, candidate_data: { nome: 'Untrusted' } };
  const base44 = { asServiceRole: { entities: {
    Application: { get: async () => app }, Job: { get: async () => job },
    ResumeVersion: { get: async () => resume }, ReceivedApplication: { filter: async () => ({ items: [] }) },
  } } };
  return { user, app, job, resume, body, base44 };
}
test('demo receipt rejects ordinary users before database access', async () => {
  await assert.rejects(validateDemoReceipt({}, { id: 'user', role: 'user' }, {}), { status: 403 });
});
test('demo receipt rejects inaccessible or foreign applications', async () => {
  for (const app of [null, { owner_user_id: 'other' }]) {
    const f = fixture(); f.base44.asServiceRole.entities.Application.get = async () => app;
    await assert.rejects(validateDemoReceipt(f.base44, f.user, f.body), { status: 403 });
  }
});
test('demo receipt requires approved state, correct method and send reservation', async () => {
  for (const change of [{ status: 'enviado' }, { metodo_envio: 'manual' }, { envio_token: null }]) {
    const f = fixture(); Object.assign(f.app, change);
    await assert.rejects(validateDemoReceipt(f.base44, f.user, f.body), { status: 409 });
  }
});
test('demo receipt rejects real records and mismatched or foreign resume', async () => {
  for (const [entity, change] of [['app', { is_demo: false }], ['job', { is_demo: false }], ['resume', { is_demo: false }], ['resume', { owner_user_id: 'other' }], ['resume', { job_id: 'other' }], ['resume', { referencia_pdf_privado: 'public/file' }]]) {
    const f = fixture(); Object.assign(f[entity], change);
    await assert.rejects(validateDemoReceipt(f.base44, f.user, f.body));
  }
});
test('demo receipt measures actual PDF and uses approved candidate data', async () => {
  const f = fixture(); const result = await validateDemoReceipt(f.base44, f.user, f.body);
  assert.equal(result.size, 9);
  assert.equal(result.candidate.nome, 'Teste');
  assert.equal(result.candidate.email, 'test@example.com');
});
test('demo receipt rejects invalid and oversized PDF regardless of declared size', async () => {
  for (const pdf of ['!', btoa('not a PDF'), btoa('%PDF-' + 'x'.repeat(5 * 1024 * 1024))]) {
    const f = fixture(); f.body.pdf_base64 = pdf;
    await assert.rejects(validateDemoReceipt(f.base44, f.user, f.body));
  }
});
test('demo receipt rejects a receipt already recorded', async () => {
  const f = fixture(); f.base44.asServiceRole.entities.ReceivedApplication.filter = async () => ({ items: [{ id: 'previous' }] });
  await assert.rejects(validateDemoReceipt(f.base44, f.user, f.body), { status: 409 });
});
test('searchJobs denies ordinary users before external requests or writes', async () => {
  // Execute the real handler with imported dependencies injected as doubles.
  const source = readFileSync(new URL('../base44/functions/searchJobs/entry.ts', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '').replace('export default', 'return');
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } }).outputText;
  const forbidden = () => { throw new Error('Unexpected external operation'); };
  const handler = new Function('createClientFromRequest', 'fetchJobicyJobs', 'normalizeJobicyJob', 'filterEntryLevel', 'saveNewJobs', code)(() => ({ auth: { me: async () => ({ id: 'user', role: 'user' }) } }), forbidden, forbidden, forbidden, forbidden);
  const response = await handler(new Request('https://example.com', { method: 'POST' }));
  assert.equal(response.status, 403);
});
test('missing Twilio configuration disables the integration and rejects signatures', async () => {
  assert.equal(getTwilioConfig(new Map()).configured, false);
  assert.equal(await validateTwilioSignature(undefined, '', 'signature', 'https://example.com'), false);
});
