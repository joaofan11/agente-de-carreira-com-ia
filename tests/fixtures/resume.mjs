export const profile = {
  id:'profile',owner_user_id:'A',nome_completo:'Pessoa Fictícia',email:'teste@example.invalid',cidade:'Manaus',estado:'AM',
  curso:'Administração',instituicao:'Universidade Fictícia',previsao_conclusao:'12/2027',
  competencias:['Excel','SQL'],ferramentas:[],idiomas:['Português'],
  experiencias:[{empresa:'Oficina Ficticia Aurora',cargo:'Assistente administrativo',data_inicio:'02/2024',data_termino:'Atual',atividades:'Organização de documentos.',competencias:['Excel']}],
  projetos_academicos:[{nome:'Projeto acadêmico fictício',descricao:'Análise de dados em sala de aula.',tecnologias:['SQL']}],
  cursos_complementares:[{nome:'Introducao a Analise de Dados',instituicao:'Instituto Ficticio Horizonte',data_conclusao:'03/2024',carga_horaria:'40 horas'}],
};
export const job = {id:'job',cargo:'Assistente administrativo',empresa:'Empresa Fictícia',status:'ativa',descricao:'Organização de documentos e planilhas.'};
export const generated = {
  contato:{nome:'Nome alterado pela IA',email:'errado@example.invalid'},objetivo_profissional:'Atuar como assistente administrativo.',resumo:'Perfil fictício com experiência administrativa.',
  formacao_academica:[{curso:profile.curso,instituicao:profile.instituicao,periodo:'Data inventada'}],
  experiencias_profissionais:[{empresa:profile.experiencias[0].empresa,cargo:profile.experiencias[0].cargo,periodo:'01/1900',atividades:'Inventou um resultado de 900%.'}],
  projetos_academicos:[{nome:profile.projetos_academicos[0].nome,descricao:'Projeto vendido como emprego.',tecnologias:['Tecnologia inventada']}],
  cursos_certificacoes:[{nome:profile.cursos_complementares[0].nome,instituicao:profile.cursos_complementares[0].instituicao,data_conclusao:'01/1900',carga_horaria:'999 horas'}],
  competencias_tecnicas:{destacadas:['Excel','C++'],demais:['SQL','Excel']},idiomas:['Português','Inglês fluente'],evidencias_utilizadas:['Uma afirmação inventada'],
};
