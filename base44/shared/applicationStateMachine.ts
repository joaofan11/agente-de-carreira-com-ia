// applicationStateMachine.ts — máquina de estados para candidaturas.
// Lógica central compartilhada entre funções web (in_app) e futuro handler do WhatsApp.
// Cada função recebe o client base44 + userId, para que ambos os canais usem a mesma lógica.

export const VALID_TRANSITIONS = {
  rascunho: ["pendente_aprovacao"],
  pendente_aprovacao: ["aprovado", "recusado"],
  aprovado: ["enviado"],
  enviado: ["em_analise", "entrevista", "recusado"],
  em_analise: ["entrevista", "recusado"],
  entrevista: [],
  recusado: [],
};

const ACTIVE_STATUSES = [
  "rascunho", "pendente_aprovacao", "aprovado", "enviado", "em_analise", "entrevista",
];

const VALID_SEND_METHODS = ["whatsapp", "email", "link_externo"];

export function isValidTransition(from, to) {
  return (VALID_TRANSITIONS[from] || []).includes(to);
}

// Valida que a transição de status é permitida. Lança erro se não for.
function assertTransition(app, targetStatus) {
  if (!isValidTransition(app.status, targetStatus)) {
    throw new Error(
      `Transição inválida: ${app.status} → ${targetStatus}. ` +
      `Permitido a partir de ${app.status}: ${(VALID_TRANSITIONS[app.status] || []).join(", ") || "nenhuma"}.`
    );
  }
}

// Valida que a candidatura pertence ao usuário.
function assertOwnership(app, userId) {
  if (app.user_id !== userId) {
    throw new Error("Candidatura não pertence ao usuário.");
  }
}

// Valida que o currículo vinculado pertence ao usuário e está pronto.
async function validateResumeVersion(base44, resumeVersionId, userId) {
  if (!resumeVersionId) {
    throw new Error("Currículo não vinculado à candidatura.");
  }
  let resume;
  try {
    resume = await base44.entities.ResumeVersion.get(resumeVersionId);
  } catch {
    throw new Error("Currículo vinculado não encontrado.");
  }
  if (!resume) throw new Error("Currículo vinculado não encontrado.");
  if (resume.user_id !== userId) {
    throw new Error("Currículo não pertence ao usuário.");
  }
  return resume;
}

// prepareApplication — cria candidatura em pendente_aprovacao.
// Vincula vaga, currículo e método de envio. Impede candidatura duplicada.
export async function prepareApplication(base44, userId, params) {
  const { jobId, resumeVersionId, metodoEnvio } = params;
  if (!jobId) throw new Error("job_id é obrigatório.");
  if (!metodoEnvio || !VALID_SEND_METHODS.includes(metodoEnvio)) {
    throw new Error("metodo_envio inválido. Use: whatsapp, email ou link_externo.");
  }

  // Valida vaga
  let job;
  try {
    job = await base44.entities.Job.get(jobId);
  } catch {
    throw new Error("Vaga não encontrada.");
  }
  if (!job) throw new Error("Vaga não encontrada.");
  if (job.status && job.status !== "ativa") {
    throw new Error("Vaga não está ativa.");
  }

  // Valida currículo
  await validateResumeVersion(base44, resumeVersionId, userId);

  // Impede candidatura duplicada (mesmo usuário + vaga + status ativo)
  const existing = await base44.entities.Application.filter(
    { user_id: userId, job_id: jobId, status: { $in: ACTIVE_STATUSES } },
    { limit: 1 }
  );
  if (existing.items && existing.items.length > 0) {
    throw new Error("Já existe uma candidatura ativa para esta vaga.");
  }

  const app = await base44.entities.Application.create({
    user_id: userId,
    job_id: jobId,
    resume_version_id: resumeVersionId,
    metodo_envio: metodoEnvio,
    status: "pendente_aprovacao",
    criado_em: new Date().toISOString(),
  });

  return app;
}

// approveApplication — aprova candidatura pendente.
// Registra data, canal e origem. Impede aprovação duplicada.
export async function approveApplication(base44, userId, params) {
  const { applicationId, canal, origem } = params;
  if (!applicationId) throw new Error("application_id é obrigatório.");

  const app = await base44.entities.Application.get(applicationId);
  if (!app) throw new Error("Candidatura não encontrada.");
  assertOwnership(app, userId);
  assertTransition(app, "aprovado");

  // Valida que o currículo vinculado continua válido
  await validateResumeVersion(base44, app.resume_version_id, userId);

  // Valida que método de envio está definido
  if (!app.metodo_envio) {
    throw new Error("Método de envio não definido. Não é possível aprovar.");
  }

  const updated = await base44.entities.Application.update(applicationId, {
    status: "aprovado",
    aprovado_em: new Date().toISOString(),
    codigo_aprovacao: crypto.randomUUID(),
    canal_aprovacao: canal || "in_app",
    origem_aprovacao: origem || "web",
  });

  return updated;
}

// rejectApplication — recusa candidatura pendente.
// Registra data e motivo. Impede rejeição duplicada.
export async function rejectApplication(base44, userId, params) {
  const { applicationId, motivo, canal, origem } = params;
  if (!applicationId) throw new Error("application_id é obrigatório.");

  const app = await base44.entities.Application.get(applicationId);
  if (!app) throw new Error("Candidatura não encontrada.");
  assertOwnership(app, userId);
  assertTransition(app, "recusado");

  const updated = await base44.entities.Application.update(applicationId, {
    status: "recusado",
    rejeitado_em: new Date().toISOString(),
    motivo_rejeicao: motivo || "Recusado pelo usuário",
    canal_aprovacao: canal || "in_app",
    origem_aprovacao: origem || "web",
  });

  return updated;
}

// dispatchApprovedApplication — envia candidatura aprovada.
// Valida que o currículo é o mesmo aprovado. Impede envio duplicado.
// Não executa envio externo real até provedores configurados.
export async function dispatchApprovedApplication(base44, userId, params) {
  const { applicationId } = params;
  if (!applicationId) throw new Error("application_id é obrigatório.");

  const app = await base44.entities.Application.get(applicationId);
  if (!app) throw new Error("Candidatura não encontrada.");
  assertOwnership(app, userId);
  assertTransition(app, "enviado");

  // Valida que o currículo é o mesmo que foi aprovado (existe e pertence ao usuário)
  const resume = await validateResumeVersion(base44, app.resume_version_id, userId);

  // Valida que método de envio está definido
  if (!app.metodo_envio) {
    throw new Error("Método de envio não definido. Não é possível enviar.");
  }

  // TODO (ETAPA futura): Quando provedores forem configurados, executar envio real aqui.
  // Por enquanto, apenas registra o envio sem disparar para canal externo.
  // Exemplo futuro:
  //   if (app.metodo_envio === "whatsapp") { await sendViaWhatsApp(...); }
  //   if (app.metodo_envio === "email") { await sendViaEmail(...); }

  const updated = await base44.entities.Application.update(applicationId, {
    status: "enviado",
    enviado_em: new Date().toISOString(),
  });

  return updated;
}