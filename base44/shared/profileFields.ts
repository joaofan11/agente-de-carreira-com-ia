import { allowFields, text, texts, objectList } from './personalValidation.ts';
export const PROFILE_FIELDS = ['nome_completo','email','telefone_whatsapp','cidade','estado','instituicao','curso','semestre','previsao_conclusao','outras_formacoes','experiencias','projetos_academicos','competencias','idiomas','ferramentas','cursos_complementares','resumo_profissional','disponibilidade'];
const stringLists = ['outras_formacoes','competencias','idiomas','ferramentas'];
const lists = {
  experiencias: {empresa:'text',cargo:'text',data_inicio:'text',data_termino:'text',atividades:'text',competencias:'array'},
  projetos_academicos: {nome:'text',descricao:'text',tecnologias:'array',resultados:'text',link:'text'},
  cursos_complementares: {nome:'text',instituicao:'text',data_conclusao:'text'},
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
  return clean;
}