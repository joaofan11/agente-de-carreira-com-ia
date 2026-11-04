import { allowFields, text, boundedObject } from './personalValidation.ts';
import { validateProfile } from './profileFields.ts';

import { documentMonth } from './documentFiles.js';
export { DOCUMENT_TYPES, MAX_PDF_BYTES, validatePdf, documentMonth } from './documentFiles.js';
const NOT_IDENTIFIED = 'Não identificado';
const ctpsFields = ['empresa','cargo','data_admissao','data_saida'];
const courseFields = ['nome_curso','instituicao','data_conclusao','carga_horaria'];
const missing = value => typeof value !== 'string' || !value.trim() || /^n[aã]o identificado$/i.test(value.trim());
const cleanText = value => missing(value) ? '' : text(value, 500).trim();

// Whitelist the extraction shape. Schema/prompt are not a substitute for checking model output.
export function sanitizeExtraction(type, result) {
  boundedObject(result);
  const fields = type === 'ctps' ? ctpsFields : courseFields;
  const row = value => {
    boundedObject(value);
    return Object.fromEntries(fields.map(key => [key, cleanText(value[key]) || NOT_IDENTIFIED]));
  };
  if (type === 'ctps') {
    if (!Array.isArray(result.experiencias) || result.experiencias.length > 50) throw new Error('Resposta de extração inválida.');
    return { experiencias: result.experiencias.map(row) };
  }
  if (type !== 'certificado') throw new Error('Extração disponível apenas para CTPS e certificados.');
  return row(result);
}

export function reviewedProfilePatch(type, reviewed, profile) {
  const date = (value, current = false) => {
    const raw = cleanText(value), normalized = documentMonth(value, current);
    if (raw && !normalized) throw new Error('Revise as datas: use MM/AAAA ou deixe em branco quando não identificado.');
    return normalized;
  };
  const key = row => JSON.stringify(Object.values(row).map(value => typeof value === 'string' ? value.trim().toLocaleLowerCase('pt-BR') : value));
  if (type === 'ctps') {
    const data = allowFields(reviewed, ['experiencias']);
    if (!Array.isArray(data.experiencias) || data.experiencias.length > 50) throw new Error('Lista de experiências inválida.');
    const incoming = data.experiencias.map(item => {
      const value = allowFields(item, ctpsFields);
      return { empresa: cleanText(value.empresa), cargo: cleanText(value.cargo), data_inicio: date(value.data_admissao), data_termino: date(value.data_saida, true), atividades: '', competencias: [] };
    }).filter(item => item.empresa || item.cargo);
    if (!incoming.length) throw new Error('Informe ao menos uma empresa ou cargo antes de aprovar.');
    const existing = profile?.experiencias || [];
    const identity = value => key({ empresa: value.empresa || '', cargo: value.cargo || '', inicio: value.data_inicio || '', fim: value.data_termino || '' });
    const seen = new Set(existing.map(identity));
    return validateProfile({ experiencias: [...existing, ...incoming.filter(item => {
      const id = identity(item); if (seen.has(id)) return false; seen.add(id); return true;
    })] });
  }
  if (type !== 'certificado') throw new Error('Tipo não suportado.');
  const value = allowFields(reviewed, courseFields);
  const course = { nome: cleanText(value.nome_curso), instituicao: cleanText(value.instituicao), data_conclusao: date(value.data_conclusao), carga_horaria: cleanText(value.carga_horaria) };
  if (!course.nome) throw new Error('Informe o nome do curso antes de aprovar.');
  const existing = profile?.cursos_complementares || [];
  const identity = value => key({ nome: value.nome || '', instituicao: value.instituicao || '', data: value.data_conclusao || '' });
  const matched = existing.some(item => identity(item) === identity(course));
  const merged = matched
    ? existing.map(item => identity(item) === identity(course) ? {...item, carga_horaria:course.carga_horaria || item.carga_horaria || ''} : item)
    : [...existing, course];
  return validateProfile({ cursos_complementares: merged });
}
