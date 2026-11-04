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


// Function gateways may parse request bodies as JSON even when SDK invoke sends multipart.
// Keep the bytes intact and let the authenticated backend bind the resulting upload.
export async function pdfUploadPayload(file, type, title) {
  await validatePdf(file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const chunks = [];
  for (let offset = 0; offset < bytes.length; offset += 32768) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 32768)));
  }
  return {action:'upload',tipo_documento:type,nome_arquivo:title.trim() || file.name,file_name:file.name,file_type:file.type || 'application/pdf',file_base64:btoa(chunks.join(''))};
}

export function decodePdfUpload(body) {
  const encoded = body.file_base64;
  const maxEncoded = 4 * Math.ceil(MAX_PDF_BYTES / 3);
  if (typeof encoded !== 'string' || !encoded || encoded.length > maxEncoded) throw new Error('PDF ausente ou acima do limite de 5 MB.');
  if (encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error('Codificação do PDF inválida.');
  if (typeof body.file_name !== 'string' || !body.file_name || body.file_name.length > 250) throw new Error('Nome do PDF inválido.');
  if (body.file_type !== undefined && typeof body.file_type !== 'string') throw new Error('Tipo do PDF inválido.');
  const binary = atob(encoded);
  return new File([Uint8Array.from(binary, char => char.charCodeAt(0))], body.file_name, {type:body.file_type || 'application/pdf'});
}
