// Normalização e filtro — transforma vagas do Jobicy no schema da entidade Job
// e mantém apenas oportunidades de estágio/trainee/júnior.

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// Mapeia o nível do Jobicy para o enum da entidade Job.
// Retorna null para níveis que não são de entrada (pleno/sênior/gestão).
function mapNivel(jobLevel, jobType) {
  const lv = String(jobLevel || "").toLowerCase();
  const types = Array.isArray(jobType) ? jobType.map((t) => String(t).toLowerCase()) : [];
  const all = `${lv} ${types.join(" ")}`;
  if (all.includes("intern")) return "estagio";
  if (all.includes("trainee")) return "trainee";
  if (
    all.includes("entry") ||
    all.includes("junior") ||
    all.includes("beginner") ||
    all.includes("associate") ||
    all.includes("graduate")
  ) {
    return "junior";
  }
  return null;
}

// Normaliza uma vaga bruta do Jobicy para o schema Job.
// Retorna sempre um objeto (nivel = "pleno" se não for entrada); o filtro remove depois.
export function normalizeJobicyJob(raw) {
  if (!raw || !raw.id) return null;
  const nivel = mapNivel(raw.jobLevel, raw.jobType);
  const tags = [
    ...(Array.isArray(raw.jobIndustry) ? raw.jobIndustry : []),
    ...(Array.isArray(raw.jobType) ? raw.jobType : []),
  ]
    .filter(Boolean)
    .map((t) => String(t).trim())
    .filter((t) => t.length > 0);

  return {
    source_id: String(raw.id),
    fonte: "api_externa",
    empresa: raw.companyName || "Empresa não informada",
    cargo: raw.jobTitle || "Vaga sem título",
    descricao: stripHtml(raw.jobExcerpt || raw.jobDescription || ""),
    requisitos: tags,
    localizacao: raw.jobGeo || "Remoto",
    modalidade: "remoto",
    nivel: nivel || "pleno",
    url_original: raw.url || "",
    email_recrutamento_validado: false,
    metodo_candidatura: "link_externo",
    data_publicacao: raw.pubDate ? String(raw.pubDate).slice(0, 10) : "",
    status: "ativa",
  };
}

// Filtra apenas vagas de nível de entrada (estágio/trainee/júnior).
export function filterEntryLevel(jobs) {
  const keep = ["estagio", "trainee", "junior"];
  return (jobs || []).filter((j) => j && keep.includes(j.nivel));
}