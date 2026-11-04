import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { authenticatedUser } from '../base44/shared/requestAuth.ts';
import { canonicalWhatsAppPhone, findWhatsAppProfile } from '../base44/shared/whatsappIdentity.ts';
import { recordAuditEvent, recordAuditCompleted } from '../base44/shared/auditEvents.ts';
import { loadBackendHandler } from './helpers/backend-handler.mjs';
import { validateProfile } from '../base44/shared/profileFields.ts';
import { allowFields, texts, functionError } from '../base44/shared/personalValidation.ts';
import { ownedRecord, ownerQuery, assertConsistentOwner, realProfile } from '../base44/shared/personalOwnership.ts';

test('authentication helper preserves infrastructure errors', async () => {
  const error = Object.assign(new Error('provider unavailable'), { status: 503 });
  await assert.rejects(authenticatedUser({ auth: { me: async () => { throw error; } } }), error);
});

const functionRoot = new URL('../base44/functions/', import.meta.url);
for (const name of readdirSync(functionRoot)) {
  const url = new URL(name + '/entry.ts', functionRoot);
  if (!readFileSync(url, 'utf8').includes('await authenticatedUser(base44)')) continue;
  test(name + ' returns 401 on absent or expired session before effects', async () => {
    for (const variant of ['absent', 'expired', 'axios-style']) {
      const client = new Proxy({ auth: { me: async () => {
        if (variant === 'absent') return null;
        throw variant === 'expired' ? Object.assign(new Error('Authentication required'), { status: 401 }) : { response: { status: 401 } };
      } } }, { get(target, key) { if (key !== 'auth') throw new Error('Unexpected operation: ' + String(key)); return target.auth; } });
      const handler = loadBackendHandler(url, { createClientFromRequest: () => client, authenticatedUser });
      assert.equal((await handler(new Request('https://example.com', { method: 'POST' }))).status, 401, variant);
    }
  });
}

function phoneClient(profiles) {
  let queries = 0;
  return { get queries() { return queries; }, asServiceRole: { entities: { CandidateProfile: {
    async filter(query, options) {
      queries++;
      const pattern = new RegExp(query.telefone_whatsapp.$regex, query.telefone_whatsapp.$options);
      return { items: profiles.filter(p => !p.is_demo && pattern.test(p.telefone_whatsapp)).slice(0, options.limit) };
    },
  } } } };
}
const phoneProfile = phone => ({ owner_user_id: 'owner', user_id: 'owner', telefone_whatsapp: phone });
test('phone authentication accepts full E164 and legacy Brazilian formatting', async () => {
  for (const stored of ['+5592999999999', '5592999999999', '(92) 99999-9999', '+55 (92) 99999-9999']) {
    const result = await findWhatsAppProfile(phoneClient([phoneProfile(stored)]), 'whatsapp:+5592999999999');
    assert.equal(result.userId, 'owner', stored);
  }
  assert.equal(canonicalWhatsAppPhone('+1 (415) 555-2671'), '+14155552671');
});
test('phone authentication never accepts substrings, regex injection or ambiguous profiles', async () => {
  assert.equal(await findWhatsAppProfile(phoneClient([phoneProfile('+15592999999999')]), 'whatsapp:+5592999999999'), null);
  assert.equal(await findWhatsAppProfile(phoneClient([phoneProfile('+5592999999999'), phoneProfile('(92) 99999-9999')]), 'whatsapp:+5592999999999'), null);
  const client = phoneClient([]);
  assert.equal(await findWhatsAppProfile(client, 'whatsapp:+55.*'), null);
  assert.equal(client.queries, 0);
});
test('phone authentication rejects demo profiles and conflicting owners', async () => {
  const p = phoneProfile('+5592999999999');
  for (const bad of [{ ...p, is_demo: true }, { ...p, user_id: 'other' }, { telefone_whatsapp: p.telefone_whatsapp }]) {
    assert.equal(await findWhatsAppProfile(phoneClient([bad]), p.telefone_whatsapp), null);
  }
});

test('audit event includes metadata only and completion failure is visible', async () => {
  const events = [];
  const client = { asServiceRole: { entities: { AuditLog: { create: async value => { events.push(value); return { id: 'event' }; } } } } };
  await recordAuditEvent(client, 'user', 'perfil_salvo', 'CandidateProfile', 'profile');
  assert.deepEqual(Object.keys(events[0]).sort(), ['user_id','acao','entidade','entidade_id','resultado','data_evento'].sort());
  client.asServiceRole.entities.AuditLog.create = async () => { throw new Error('unavailable'); };
  assert.equal(await recordAuditCompleted(client, 'user', 'perfil_salvo', 'CandidateProfile', 'profile'), false);
});

for (const config of [
  { name: 'saveCandidateProfile', body: { fields: { nome_completo: 'Teste' } }, entity: 'CandidateProfile', action: 'perfil_salvo' },
  { name: 'saveJobPreferences', body: { fields: { modalidades: ['remoto'] } }, entity: 'JobPreference', action: 'preferencias_salvas' },
]) {
  test(config.name + ' records a genuine request and completion without storing field contents', async () => {
    const events = []; let writes = 0;
    const client = { auth: { me: async () => ({ id: 'user' }) }, asServiceRole: { entities: {
      [config.entity]: { filter: async () => ({ items: [] }), create: async value => { writes++; return { ...value, id: 'saved' }; } },
      AuditLog: { create: async value => { events.push(value); return { id: 'event-' + events.length }; } },
    } } };
    const handler = loadBackendHandler(new URL(config.name + '/entry.ts', functionRoot), {
      createClientFromRequest: () => client, authenticatedUser, recordAuditEvent, recordAuditCompleted,
      ownedRecord, ownerQuery, assertConsistentOwner, realProfile, validateProfile, allowFields, texts, functionError,
    });
    const invoke = () => handler(new Request('https://example.com', { method: 'POST', body: JSON.stringify(config.body) }));
    const response = await invoke();
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.audit_recorded, true);
    assert.equal(data.audit_request_id, 'event-1');
    assert.equal(events.length, 2);
    assert.equal(events[1].acao, config.action);
    assert.equal(events[1].entidade_id, 'saved');
    assert.equal(JSON.stringify(events).includes('Teste'), false);
    client.asServiceRole.entities.AuditLog.create = async () => { throw new Error('audit unavailable'); };
    assert.notEqual((await invoke()).status, 200);
    assert.equal(writes, 1);
  });
}
