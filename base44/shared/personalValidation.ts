export function boundedObject(value, maxBytes = 60000) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || JSON.stringify(value).length > maxBytes) throw new Error('Dados inválidos ou muito extensos.');
  return value;
}
export function allowFields(value, keys) {
  boundedObject(value);
  const unknown = Object.keys(value).filter(key => !keys.includes(key));
  if (unknown.length) throw new Error('Campos não permitidos: ' + unknown.join(', '));
  return { ...value };
}
export function text(value, limit = 4000) {
  if (typeof value !== 'string' || value.length > limit) throw new Error('Texto inválido ou muito extenso.');
  return value;
}
export function texts(value) {
  if (!Array.isArray(value) || value.length > 100) throw new Error('Lista inválida.');
  return value.map(item => text(item, 500));
}
export function objectList(value, spec) {
  if (!Array.isArray(value) || value.length > 50) throw new Error('Lista inválida.');
  return value.map(item => {
    const result = allowFields(item, Object.keys(spec));
    for (const [key, field] of Object.entries(result)) result[key] = spec[key] === 'array' ? texts(field) : text(field);
    return result;
  });
}
export function functionError(error) {
  return Response.json({ error: error.message || 'Falha na operação.' }, { status: error.status || 400 });
}