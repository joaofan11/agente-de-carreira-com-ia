export default function demoProfileSnapshot(resume, legacyProfile) {
  const content = resume?.conteudo_estruturado;
  if (!content) return legacyProfile;
  const contact = content.contato || {};
  const education = content.formacao_academica?.[0] || {};
  return {
    nome_completo: contact.nome || '',
    cidade: contact.cidade || '', estado: contact.estado || '',
    curso: education.curso || '', instituicao: education.instituicao || '',
    semestre: education.periodo || '',
    competencias: [...(content.competencias_tecnicas?.destacadas || []), ...(content.competencias_tecnicas?.demais || [])],
    projetos_academicos: content.projetos_academicos || [],
  };
}