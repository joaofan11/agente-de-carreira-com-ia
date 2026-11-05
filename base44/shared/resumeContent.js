// Shared by browser preview/save and backend snapshot validation; no remote imports.
const rootKeys = ['contato','objetivo_profissional','resumo','formacao_academica','experiencias_profissionais','projetos_academicos','cursos_certificacoes','competencias_tecnicas','idiomas','evidencias_utilizadas'];
const fail = () => { throw new Error('Conteúdo do currículo inválido. Revise os campos antes de salvar.'); };
function object(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key))) fail();
  return value;
}
function string(value) {
  if (value === undefined) return '';
  if (typeof value !== 'string' || value.length > 4000) fail();
  return value.trim();
}
function strings(value, limit = 4000) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 100) fail();
  return value.map(item => { const clean = string(item); if (clean.length > limit) fail(); return clean; });
}
function list(value, keys, arrayKeys = []) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 50) fail();
  return value.map(item => {
    object(item, keys);
    return Object.fromEntries(keys.map(key => [key, arrayKeys.includes(key) ? strings(item[key]) : string(item[key])]));
  });
}
/** @returns {any} */
export function validateResumeContent(value) {
  object(value, rootKeys);
  if (JSON.stringify(value).length > 60000) fail();
  const contact = object(value.contato || {}, ['nome','email','telefone','cidade','estado']);
  const skills = object(value.competencias_tecnicas || {}, ['destacadas','demais']);
  return {
    contato: Object.fromEntries(['nome','email','telefone','cidade','estado'].map(key => [key,string(contact[key])])),
    objetivo_profissional:string(value.objetivo_profissional), resumo:string(value.resumo),
    formacao_academica:list(value.formacao_academica,['instituicao','curso','periodo','evidencia_original']),
    experiencias_profissionais:list(value.experiencias_profissionais,['empresa','cargo','periodo','atividades','evidencia_original']),
    projetos_academicos:list(value.projetos_academicos,['nome','descricao','tecnologias','evidencia_original'],['tecnologias']),
    cursos_certificacoes:list(value.cursos_certificacoes,['nome','instituicao','data_conclusao','carga_horaria','evidencia_original']),
    competencias_tecnicas:{destacadas:strings(skills.destacadas),demais:strings(skills.demais)},
    idiomas:strings(value.idiomas), evidencias_utilizadas:strings(value.evidencias_utilizadas, 500),
  };
}
