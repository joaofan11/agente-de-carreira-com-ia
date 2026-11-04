export const emptyExperiencia = () => ({
  empresa: "",
  cargo: "",
  data_inicio: "",
  data_termino: "",
  atividades: "",
  competencias: [],
});

export const emptyProjeto = () => ({
  nome: "",
  descricao: "",
  tecnologias: [],
  resultados: "",
  link: "",
});

export const emptyCurso = () => ({
  nome: "",
  instituicao: "",
  data_conclusao: "",
  carga_horaria: "",
});

export const emptyProfile = {
  nome_completo: "",
  email: "",
  telefone_whatsapp: "",
  cidade: "",
  estado: "",
  instituicao: "",
  curso: "",
  semestre: "",
  previsao_conclusao: "",
  outras_formacoes: [],
  experiencias: [],
  projetos_academicos: [],
  competencias: [],
  idiomas: [],
  ferramentas: [],
  cursos_complementares: [],
  resumo_profissional: "",
  disponibilidade: "",
};

const toObjArr = (arr, factory) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => (x && typeof x === "object" && !Array.isArray(x) ? { ...factory(), ...x } : factory()));
};

const toStrArr = (arr) => (Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []);

export function normalizeProfile(p) {
  if (!p) return { ...emptyProfile };
  return {
    ...emptyProfile,
    ...p,
    outras_formacoes: toStrArr(p.outras_formacoes),
    competencias: toStrArr(p.competencias),
    idiomas: toStrArr(p.idiomas),
    ferramentas: toStrArr(p.ferramentas),
    experiencias: toObjArr(p.experiencias, emptyExperiencia),
    projetos_academicos: toObjArr(p.projetos_academicos, emptyProjeto),
    cursos_complementares: toObjArr(p.cursos_complementares, emptyCurso),
  };
}

export function calcProgress(form) {
  const checks = [
    !!form.nome_completo?.trim(),
    !!form.email?.trim(),
    !!form.telefone_whatsapp?.trim(),
    !!form.cidade?.trim(),
    !!form.estado?.trim(),
    !!form.instituicao?.trim(),
    !!form.curso?.trim(),
    !!form.semestre?.trim(),
    !!form.previsao_conclusao?.trim(),
    (form.experiencias?.length || 0) > 0,
    (form.projetos_academicos?.length || 0) > 0,
    (form.competencias?.length || 0) > 0,
    (form.idiomas?.length || 0) > 0,
    (form.ferramentas?.length || 0) > 0,
    (form.cursos_complementares?.length || 0) > 0,
    !!form.resumo_profissional?.trim(),
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}