// applicationStateMachine.ts — máquina de estados para candidaturas.
// Lógica central compartilhada entre funções web (in_app) e futuro handler do WhatsApp.
// Cada função recebe o client base44 + userId, para que ambos os canais usem a mesma lógica.

export const VALID_TRANSITIONS = {
  rascunho: ["pendente_aprovacao"],
  pendente_aprovacao: ["aprovado", "recusado"],
  aprovado: ["enviado", "acao_manual_necessaria"],
  acao_manual_necessaria: ["enviado", "recusado"],
  enviado: ["em_analise", "entrevista", "recusado"],
  em_analise: ["entrevista", "recusado"],
  entrevista: [],
  recusado: [],
};

const ACTIVE_STATUSES = [
  "rascunho", "pendente_aprovacao", "aprovado", "acao_manual_necessaria", "enviado", "em_analise", "entrevista",
];

// Métodos válidos para envio de currículo ao recrutador.
// WhatsApp NÃO é método de envio — é canal de alerta/aprovação apenas.
const VALID_SEND_METHODS = ["email", "gmail", "outlook", "api_direta", "manual"];

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

// Verifica se o provedor de envio está configurado para o método.
// Retorna true apenas quando há um provedor real que pode confirmar o envio.
function isProviderConfigured(metodo) {
  if (metodo === "manual") return false; // Manual sempre requer ação do usuário
  if (metodo === "email") {
    // TODO: verificar process.env.RESEND_API_KEY ou similar quando configurado
    return false;
  }
  if (metodo === "gmail") return false; // Verificado dinamicamente em dispatchApprovedApplication
  if (metodo === "outlook") return false; // Verificado dinamicamente em dispatchApprovedApplication
  if (metodo === "api_direta") {
    // TODO: verificar process.env.JOBICY_API_KEY ou similar quando configurado
    return false;
  }
  return false;
}

// Retorna o motivo de bloqueio para o método quando o provedor não está configurado.
function getMotivoBloqueio(metodo) {
  if (metodo === "manual") {
    return "Envio manual necessário. Acesse o link oficial da vaga para se candidatar diretamente.";
  }
  if (metodo === "email") {
    return "Provedor de e-mail não configurado. Configure a integração para envio automático.";
  }
  if (metodo === "gmail") {
    return "Gmail não conectado. Conecte sua conta Google em Configurações para envio automático.";
  }
  if (metodo === "outlook") {
    return "Outlook não conectado. Conecte sua conta Microsoft em Configurações para envio automático.";
  }
  if (metodo === "api_direta") {
    return "API direta não configurada. Configure a integração com a plataforma de vagas para envio automático.";
  }
  return "Provedor não configurado.";
}

// prepareApplication — cria candidatura em pendente_aprovacao.
// Vincula vaga, currículo e método de envio. Impede candidatura duplicada.
export async function prepareApplication(base44, userId, params) {
  const { jobId, resumeVersionId, metodoEnvio } = params;
  if (!jobId) throw new Error("job_id é obrigatório.");
  if (!metodoEnvio || !VALID_SEND_METHODS.includes(metodoEnvio)) {
    throw new Error("metodo_envio inválido. Use: email, api_direta ou manual.");
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

// dispatchApprovedApplication — processa o envio de candidatura aprovada.
// Sem provedor configurado, NÃO marca como enviado nem preenche enviado_em/identificador_envio/comprovante.
// Transiciona para acao_manual_necessaria com link oficial e motivo de bloqueio.
export async function dispatchApprovedApplication(base44, userId, params) {
  const { applicationId } = params;
  if (!applicationId) throw new Error("application_id é obrigatório.");

  const app = await base44.entities.Application.get(applicationId);
  if (!app) throw new Error("Candidatura não encontrada.");
  assertOwnership(app, userId);

  // Valida que o currículo é o mesmo que foi aprovado
  await validateResumeVersion(base44, app.resume_version_id, userId);

  // Valida que método de envio está definido
  if (!app.metodo_envio) {
    throw new Error("Método de envio não definido. Não é possível enviar.");
  }

  // Busca a vaga para obter o link oficial (quando aplicável)
  let job = null;
  try {
    job = await base44.entities.Job.get(app.job_id);
  } catch { /* ignore — vaga pode ter sido removida */ }
  const linkOficial = job?.url_original || null;

  // Gmail: envia via Gmail API usando token OAuth do usuário
  if (app.metodo_envio === "gmail") {
    try {
      const result = await base44.functions.invoke("sendGmailApplication", {
        application_id: applicationId,
      });
      if (result.data?.success) {
        assertTransition(app, "enviado");
        return await base44.entities.Application.update(applicationId, {
          status: "enviado",
          enviado_em: new Date().toISOString(),
          identificador_envio: result.data.message_id || null,
          comprovante: result.data.message_id || null,
        });
      } else {
        assertTransition(app, "acao_manual_necessaria");
        return await base44.entities.Application.update(applicationId, {
          status: "acao_manual_necessaria",
          motivo_bloqueio: result.data?.error || "Gmail não configurado ou não conectado.",
          link_oficial: linkOficial,
        });
      }
    } catch (err) {
      assertTransition(app, "acao_manual_necessaria");
      return await base44.entities.Application.update(applicationId, {
        status: "acao_manual_necessaria",
        motivo_bloqueio: "Erro ao enviar via Gmail: " + (err.message || "erro desconhecido"),
        link_oficial: linkOficial,
      });
    }
  }

  // Outlook: envia via Microsoft Graph API usando token OAuth do usuário
  if (app.metodo_envio === "outlook") {
    try {
      const result = await base44.functions.invoke("sendOutlookApplication", {
        application_id: applicationId,
      });
      if (result.data?.success) {
        assertTransition(app, "enviado");
        return await base44.entities.Application.update(applicationId, {
          status: "enviado",
          enviado_em: new Date().toISOString(),
          identificador_envio: result.data.message_id || null,
          comprovante: result.data.message_id || null,
        });
      } else {
        assertTransition(app, "acao_manual_necessaria");
        return await base44.entities.Application.update(applicationId, {
          status: "acao_manual_necessaria",
          motivo_bloqueio: result.data?.error || "Outlook não configurado ou não conectado.",
          link_oficial: linkOficial,
        });
      }
    } catch (err) {
      assertTransition(app, "acao_manual_necessaria");
      return await base44.entities.Application.update(applicationId, {
        status: "acao_manual_necessaria",
        motivo_bloqueio: "Erro ao enviar via Outlook: " + (err.message || "erro desconhecido"),
        link_oficial: linkOficial,
      });
    }
  }

  // API direta: envia via submitApplicationDirectly (endpoint demo ou futuro conector oficial)
  if (app.metodo_envio === "api_direta") {
    try {
      const result = await base44.functions.invoke("submitApplicationDirectly", {
        application_id: applicationId,
      });
      if (result.data?.success) {
        assertTransition(app, "enviado");
        return await base44.entities.Application.update(applicationId, {
          status: "enviado",
          enviado_em: new Date().toISOString(),
          identificador_envio: result.data.receipt_id || null,
          comprovante: result.data.receipt_id || null,
        });
      } else {
        assertTransition(app, "acao_manual_necessaria");
        return await base44.entities.Application.update(applicationId, {
          status: "acao_manual_necessaria",
          motivo_bloqueio: result.data?.error || "API direta não configurada ou endpoint não permitido.",
          link_oficial: linkOficial,
        });
      }
    } catch (err) {
      assertTransition(app, "acao_manual_necessaria");
      return await base44.entities.Application.update(applicationId, {
        status: "acao_manual_necessaria",
        motivo_bloqueio: "Erro ao enviar via API direta: " + (err.message || "erro desconhecido"),
        link_oficial: linkOficial,
      });
    }
  }

  // Verifica se o provedor está configurado para o método
  const providerConfigured = isProviderConfigured(app.metodo_envio);

  if (!providerConfigured) {
    // Sem provedor configurado — NÃO marca como enviado.
    // Transiciona para acao_manual_necessaria com motivo e link oficial.
    assertTransition(app, "acao_manual_necessaria");

    const updated = await base44.entities.Application.update(applicationId, {
      status: "acao_manual_necessaria",
      motivo_bloqueio: getMotivoBloqueio(app.metodo_envio),
      link_oficial: linkOficial,
      // NÃO preenche enviado_em, identificador_envio, comprovante
    });

    return updated;
  }

  // TODO (ETAPA futura): Quando provedores forem configurados, executar envio real aqui.
  // Só marcar como enviado após receber confirmação real do provedor/endpoint.
  // Exemplo:
  //   if (app.metodo_envio === "email") {
  //     const result = await sendViaEmail(base44, app, resume, job);
  //     if (result.success) {
  //       return await base44.entities.Application.update(applicationId, {
  //         status: "enviado",
  //         enviado_em: new Date().toISOString(),
  //         identificador_envio: result.id,
  //         comprovante: result.proof,
  //       });
  //     }
  //   }

  // Se chegou aqui, o provedor está configurado mas a implementação do envio ainda não existe.
  throw new Error("Provedor configurado mas implementação de envio ainda não disponível.");
}