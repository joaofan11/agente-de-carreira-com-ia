// matchScorer.ts — pontuação determinística de compatibilidade vaga↔candidato.
// Critérios: competências técnicas (40), formação acadêmica (25),
// experiências/cursos/projetos (20), disponibilidade e preferências (15).
// Classificação: 0-49 baixo, 50-79 médio, 80-100 alto (forte).
// Bloqueios eliminatórios limitam a pontuação a no máximo 79 (médio).

export interface CompatibleCompetence {
  competencia: string;
  evidencia: string;
}

export interface AIAnalysis {
  requisitos_identificados: string[];
  competencias_compativeis: CompatibleCompetence[];
  competencias_ausentes: string[];
  evidencias_perfil: string[];
  bloqueios: string[];
  justificativa: string;
  dados_insuficientes: string;
  formacao_nivel: number; // 0 | 0.5 | 1
  experiencia_nivel: number; // 0 | 0.5 | 1
}

export interface JobData {
  modalidade?: string;
  localizacao?: string;
}

export interface PreferenceData {
  modalidades?: string[];
  localizacoes?: string[];
  disponibilidade?: string;
  regiao_amazonia?: boolean;
}

const REGIOES_GLOBAIS = [
  "brasil", "global", "worldwide", "anywhere",
  "remote", "remoto", "mundo", "latam", "latin america",
];

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

// Filtro geográfico obrigatório (backend): vaga remota com região restrita
// que não inclui Brasil/global pode não ser acessível do Brasil.
export function checkGeographicBlock(job: JobData): string | null {
  if (job.modalidade === "remoto" && job.localizacao) {
    const loc = String(job.localizacao).toLowerCase();
    const isGlobal = REGIOES_GLOBAIS.some((r) => loc.includes(r));
    if (!isGlobal) {
      return `Restrição geográfica: vaga remota limitada a ${job.localizacao}, pode não ser acessível do Brasil.`;
    }
  }
  return null;
}

export interface ScoreResult {
  score: number;
  nivel: "alto" | "medio" | "baixo";
  breakdown: {
    tecnicas: number;
    formacao: number;
    experiencia: number;
    preferencias: number;
  };
  bloqueios: string[];
  hasBloqueios: boolean;
}

export function computeScore(
  ai: AIAnalysis,
  job: JobData,
  pref: PreferenceData | null
): ScoreResult {
  // 1. Competências técnicas — até 40 pontos
  const reqCount = (ai.requisitos_identificados || []).length;
  const compCount = (ai.competencias_compativeis || []).length;
  const tecnicas = reqCount > 0 ? Math.round(40 * (compCount / reqCount)) : 0;

  // 2. Formação acadêmica — até 25 pontos
  const formacao = Math.round(25 * clamp01(ai.formacao_nivel));

  // 3. Experiências, cursos e projetos — até 20 pontos
  const experiencia = Math.round(20 * clamp01(ai.experiencia_nivel));

  // 4. Disponibilidade e preferências — até 15 pontos
  let prefFracao = 0;
  if (pref) {
    // modalidade (1/3)
    const modMatch =
      (pref.modalidades || []).includes("indiferente") ||
      (!!job.modalidade && (pref.modalidades || []).includes(job.modalidade));
    if (modMatch) prefFracao += 1 / 3;

    // localização (1/3)
    const locMatch = (pref.localizacoes || []).some(
      (l) => job.localizacao && String(job.localizacao).toLowerCase().includes(String(l).toLowerCase())
    );
    if (locMatch) prefFracao += 1 / 3;
    else if (pref.regiao_amazonia && job.localizacao && String(job.localizacao).toLowerCase().includes("amazon"))
      prefFracao += 1 / 3;

    // disponibilidade (1/3)
    if (pref.disponibilidade === "imediata" || pref.disponibilidade === "flexivel")
      prefFracao += 1 / 3;
  }
  const preferencias = Math.round(15 * prefFracao);

  let total = Math.min(100, Math.max(0, tecnicas + formacao + experiencia + preferencias));

  // Bloqueios eliminatórios — soma bloqueios da IA + filtro geográfico do backend
  const bloqueios = [...(ai.bloqueios || [])];
  const geoBlock = checkGeographicBlock(job);
  if (geoBlock) bloqueios.push(geoBlock);

  const hasBloqueios = bloqueios.length > 0;
  if (hasBloqueios) total = Math.min(total, 79);

  let nivel: "alto" | "medio" | "baixo";
  if (total >= 80 && !hasBloqueios) nivel = "alto";
  else if (total >= 50) nivel = "medio";
  else nivel = "baixo";

  return {
    score: total,
    nivel,
    breakdown: { tecnicas, formacao, experiencia, preferencias },
    bloqueios,
    hasBloqueios,
  };
}