// The editor can serve the draft UI while its build-time version still says prod.
// Only a browser-reported Base44 parent selects preview; URL/query/localStorage
// parameters never override the SDK destination or credentials.
const EDITOR_ORIGIN = 'https://app.base44.com';

export function resolveFunctionsVersion({ configuredVersion = '', embedded = false, referrer = '', ancestorOrigins = [] } = {}) {
  const originOf = value => {
    try { return new URL(value).origin; } catch { return ''; }
  };
  const editorParent = embedded && (originOf(referrer) === EDITOR_ORIGIN || ancestorOrigins.some(origin => originOf(origin) === EDITOR_ORIGIN));
  if (editorParent) return 'preview';
  return configuredVersion === 'preview' ? 'preview' : 'prod';
}
