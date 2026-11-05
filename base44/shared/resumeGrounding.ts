import { validateResumeContent } from './resumeContent.js';

const key = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('pt-BR').replace(/\s+/g,' ');
const period = source => [source.data_inicio,source.data_termino].filter(Boolean).join(' — ');
export function groundResumeDraft(value, profile) {
  const resume = validateResumeContent(value);
  if (!resume.objetivo_profissional && !resume.resumo) throw new Error('Rascunho sem conteúdo gerado.');
  const fromSource = (items, sources, identity, restore) => {
    const used = new Set();
    return items.map(item => {
      let matches = sources.filter(source => identity(item,source));
      if (matches.length > 1 && item.periodo) matches = matches.filter(source => [source.data_inicio,source.data_termino].filter(Boolean).every(date => item.periodo.includes(date)));
      if (matches.length > 1 && item.data_conclusao) matches = matches.filter(source => source.data_conclusao === item.data_conclusao);
      if (matches.length !== 1) throw new Error('A IA retornou um item sem correspondência única no perfil aprovado.');
      const source = matches[0];
      if (used.has(source)) return null;
      used.add(source);return restore(source);
    }).filter(Boolean);
  };
  // Identity and dates come from the approved profile, never from model-generated contact/facts.
  resume.contato = {nome:profile.nome_completo || '',email:profile.email || '',telefone:profile.telefone_whatsapp || '',cidade:profile.cidade || '',estado:profile.estado || ''};
  const education = [
    ...((profile.curso || profile.instituicao) ? [{curso:profile.curso || '',instituicao:profile.instituicao || '',periodo:[profile.semestre ? 'Semestre: '+profile.semestre : '',profile.previsao_conclusao ? 'Conclusão prevista: '+profile.previsao_conclusao : ''].filter(Boolean).join(' | ')}] : []),
    ...(profile.outras_formacoes || []).map(curso=>({curso,instituicao:'',periodo:''})),
  ];
  resume.formacao_academica = fromSource(resume.formacao_academica,education,(a,b)=>key(a.curso)===key(b.curso)&&key(a.instituicao)===key(b.instituicao),source=>({...source,evidencia_original:[source.curso,source.instituicao,source.periodo].filter(Boolean).join(' | ')}));
  resume.experiencias_profissionais = fromSource(resume.experiencias_profissionais,profile.experiencias || [],(a,b)=>key(a.empresa)===key(b.empresa)&&key(a.cargo)===key(b.cargo),source=>({empresa:source.empresa || '',cargo:source.cargo || '',periodo:period(source),atividades:source.atividades || '',evidencia_original:[source.empresa,source.cargo,period(source)].filter(Boolean).join(' | ')}));
  resume.projetos_academicos = fromSource(resume.projetos_academicos,profile.projetos_academicos || [],(a,b)=>key(a.nome)===key(b.nome),source=>({nome:source.nome,descricao:source.descricao || '',tecnologias:source.tecnologias || [],evidencia_original:source.nome}));
  resume.cursos_certificacoes = fromSource(resume.cursos_certificacoes,profile.cursos_complementares || [],(a,b)=>key(a.nome)===key(b.nome)&&key(a.instituicao)===key(b.instituicao),source=>({nome:source.nome,instituicao:source.instituicao || '',data_conclusao:source.data_conclusao || '',carga_horaria:source.carga_horaria || '',evidencia_original:[source.nome,source.instituicao,source.data_conclusao,source.carga_horaria].filter(Boolean).join(' | ')}));
  const allowedSkills = [...(profile.competencias || []),...(profile.ferramentas || []),...(profile.experiencias || []).flatMap(e=>e.competencias || []),...(profile.projetos_academicos || []).flatMap(p=>p.tecnologias || [])];
  const seen = new Set(); let omitted = false;
  const restrict = (items, allowed) => items.flatMap(item=>{
    const source = allowed.find(original=>key(item)===key(original));
    if (!source) {omitted=true;return [];}
    if (seen.has(key(source))) return [];
    seen.add(key(source));return [source];
  });
  resume.competencias_tecnicas = {destacadas:restrict(resume.competencias_tecnicas.destacadas,allowedSkills),demais:restrict(resume.competencias_tecnicas.demais,allowedSkills)};
  seen.clear();resume.idiomas=restrict(resume.idiomas,profile.idiomas || []);
  resume.evidencias_utilizadas = [...new Set([...resume.formacao_academica,...resume.experiencias_profissionais,...resume.projetos_academicos,...resume.cursos_certificacoes].map(row=>row.evidencia_original.slice(0,500)).filter(Boolean))];
  return {resume:validateResumeContent(resume),warnings:omitted ? ['Competências ou idiomas sugeridos sem correspondência nas listas do perfil foram omitidos. Confira o perfil e revise o texto.'] : []};
}
