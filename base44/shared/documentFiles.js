export const MAX_PDF_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_TYPES = ['ctps','certificado','cpf','rg','diploma','historico','comprovante_residencia','curriculo','outro'];
const missing = value => typeof value !== 'string' || !value.trim() || /^n[aã]o identificado$/i.test(value.trim());

// Reduce a known full date to month/year; never invent a month from a year alone.
export function documentMonth(value, allowCurrent = false) {
  if (missing(value)) return '';
  const raw = value.trim();
  if (allowCurrent && /^(atual|presente)$/i.test(raw)) return 'Atual';
  if (/^(0[1-9]|1[0-2])\/(19\d{2}|20\d{2}|21\d{2})$/.test(raw)) return raw;
  let match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  let day, month, year;
  if (match) [, day, month, year] = match;
  else {
    match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!match) return '';
    [, year, month, day] = match;
  }
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day)) return '';
  const result = month + '/' + year;
  return /^(0[1-9]|1[0-2])\/(19\d{2}|20\d{2}|21\d{2})$/.test(result) ? result : '';
}

export async function validatePdf(file) {
  if (!(file instanceof File) || !file.size) throw new Error('Selecione um PDF não vazio.');
  if (file.size > MAX_PDF_BYTES) throw new Error('O arquivo excede o limite de 5 MB.');
  if (!/\.pdf$/i.test(file.name) || (file.type && !['application/pdf','application/octet-stream'].includes(file.type))) throw new Error('Apenas arquivos PDF são aceitos.');
  if (new TextDecoder().decode(await file.slice(0, 5).arrayBuffer()) !== '%PDF-') throw new Error('O arquivo não contém um cabeçalho PDF válido.');
}

