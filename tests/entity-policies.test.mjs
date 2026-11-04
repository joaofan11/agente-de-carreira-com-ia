import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Declaration checks only. These do not emulate or certify Base44's RLS engine.
const entity = name => JSON.parse(readFileSync(new URL(`../base44/entities/${name}.jsonc`, import.meta.url), 'utf8'));
test('legacy personal entities declare creator-only access for every operation', () => {
  for (const name of ['Document', 'Resume', 'StudentProfile']) {
    for (const operation of ['read', 'create', 'update', 'delete']) {
      assert.deepEqual(entity(name).rls[operation], { created_by_id: '{{user.id}}' }, `${name}.${operation}`);
    }
  }
});
test('legacy opportunities use authenticated roles and admin-only writes', () => {
  assert.deepEqual(entity('Opportunity').rls.read, entity('Job').rls.read);
  assert.notDeepEqual(entity('Opportunity').rls.read, {});
  for (const operation of ['create', 'update', 'delete']) {
    assert.deepEqual(entity('Opportunity').rls[operation], { user_condition: { role: 'admin' } });
  }
});
test('audit log declares admin-only read and no ordinary-user writes', () => {
  assert.deepEqual(entity('AuditLog').rls.read, { user_condition: { role: 'admin' } });
  for (const operation of ['create', 'update', 'delete']) {
    assert.deepEqual(entity('AuditLog').rls[operation], { user_condition: { role: 'service_role_only' } });
  }
});
