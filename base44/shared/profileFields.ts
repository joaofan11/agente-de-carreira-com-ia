import { allowFields, text, texts, objectList } from './personalValidation.ts';
export const PROFILE_FIELDS = ['nome_completo','email','telefone_whatsapp','cidade','estado','instituicao','curso','semestre','previsao_conclusao','outras_formacoes','experiencias','projetos_academicos','competencias','idiomas','ferramentas','cursos_complementares','resumo_profissional','disponibilidade'];
const stringLists = ['outras_formacoes','competencias','idiomas','ferramentas'];
const lists = {
  experiencias: {empresa:'text',cargo:'text',data_inicio:'text',data_termino:'text',atividades:'text',competencias:'array'},
  projetos_academicos: {nome:'text',descricao:'text',tecnologias:'array',resultados:'text',link:'text'},
  cursos_complementares: {nome:'text',instituicao:'text',data_conclusao:'text',carga_horaria:'text'},
};
export function validateProfile(fields) {
  const clean = allowFields(fields, PROFILE_FIELDS);
  for (const [key, value] of Object.entries(clean)) {
    clean[key] = lists[key] ? objectList(value, lists[key]) : stringLists.includes(key) ? texts(value) : text(value);
  }
  if ('nome_completo' in clean && !clean.nome_completo.trim()) throw new Error('Nome completo obrigatório.');
  if (clean.nome_completo) clean.nome_completo = clean.nome_completo.trim();
  if (clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) throw new Error('E-mail inválido.');
  if (clean.telefone_whatsapp && !/^(?:55)?\d{10,11}$/.test(clean.telefone_whatsapp.replace(/\D/g, ''))) throw new Error('Informe WhatsApp com DDD válido.');
  const dateValue = (value, allowCurrent = false) => {
    if (!value || (allowCurrent && /^(atual|presente)$/i.test(value.trim()))) return null;
    const match = /^(0[1-9]|1[0-2])\/(19\d{2}|20\d{2}|21\d{2})$/.exec(value);
    if (!match) throw new Error('Data inválida. Use MM/AAAA.');
    return Number(match[2])*12 + Number(match[1]);
  };
  if (clean.previsao_conclusao) dateValue(clean.previsao_conclusao);
  for (const exp of clean.experiencias || []) {
    const start = dateValue(exp.data_inicio), end = dateValue(exp.data_termino, true);
    if (start && end && end < start) throw new Error('Término anterior ao início da experiência.');
  }
  for (const course of clean.cursos_complementares || []) dateValue(course.data_conclusao);
  for (const project of clean.projetos_academicos || []) if (project.link && !/^https?:\/\//i.test(project.link)) throw new Error('Link do projeto deve usar http ou https.');
  return clean;
}