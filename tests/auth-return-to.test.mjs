import test from 'node:test';
import assert from 'node:assert/strict';
import { safeReturnTo } from '../src/lib/authReturnTo.js';

function resolve(value) {
  const previous = globalThis.window;
  globalThis.window = { location: { origin: 'https://example.com', search: '?' + new URLSearchParams({ returnTo: value }) } };
  try { return safeReturnTo(); } finally { globalThis.window = previous; }
}
test('login redirects reject external and backslash/protocol-relative destinations', () => {
  for (const value of ['https://other.example/path', '//other.example', '/\\other.example', '/.//other.example', 'javascript:alert(1)']) {
    assert.equal(resolve(value), '/', value);
  }
});
test('login redirects preserve internal navigation after router update', () => {
  assert.equal(resolve('/curriculos?tab=meus'), '/curriculos?tab=meus');
  assert.equal(resolve('/dashboard'), '/dashboard');
});
test('login redirects cannot inject SDK bootstrap parameters', () => {
  assert.equal(resolve('/dashboard?access_token=synthetic&app_id=bad&normal=1'), '/dashboard?normal=1');
});
