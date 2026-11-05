import { applicationSnapshotQuery } from './applicationSnapshot.ts';
import { audit, auditCompleted } from './applicationAudit.ts';
// applicationStateMachine.ts — máquina de estados para candidaturas.
// Lógica central compartilhada entre funções web (in_app) e futuro handler do WhatsApp.
// Cada função recebe o client base44 + userId, para que ambos os canais usem a mesma lógica.

import { assertConsistentOwner, ownerQuery } from './personalOwnership.ts';

export const VALID_TRANSITIONS = {
  rascunho: ["pendente_aprovacao"],
  pendente_aprovacao: ["aprovado", "recusado"],
  aprovado: ["enviado", "acao_manual_necessaria"],
  acao_manual_necessaria: ["enviado", "recusado"],
  enviado: ["em_analise", "entrevista", "recusado"],
  em_analise: ["entrevista", "recusado"],
  entrevista: [],
  recusado: [],
  cancelada_duplicada: [],
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
  assertConsistentOwner(app, userId);
}

// Valida que o currículo vinculado pertence ao usuário e está pronto.
async function validateResumeVersion(base44, resumeVersionId, userId) {
  if (!resumeVersionId) {
    throw new Error("Currículo não vinculado à candidatura.");
  }
  let resume;
  try {
    resume = await base44.asServiceRole.entities.ResumeVersion.get(resumeVersionId);
  } catch {
    throw new Error("Currículo vinculado não encontrado.");
  }
  if (!resume) throw new Error("Currículo vinculado não encontrado.");
  assertConsistentOwner(resume, userId);
  if (!/^(?:mp\/)?private\//.test(resume.referencia_pdf_privado || '')) throw new Error('Currículo sem PDF privado. Salve uma versão com PDF antes de continuar.');
  if (resume.status_revisao !== 'pronto') throw new Error('Currículo ainda não está pronto.');
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
// Vincula vaga, currículo e método de envio. Mitigação de duplicidade NÃO atômica.
export async function prepareApplication(base44, userId, params) {
  const { jobId, resumeVersionId, metodoEnvio } = params;
  if (!jobId) throw new Error("job_id é obrigatório.");
  if (!metodoEnvio || !VALID_SEND_METHODS.includes(metodoEnvio)) {
    throw new Error("metodo_envio inválido. Use: email, api_direta ou manual.");
  }

  // Valida vaga
  let job;
  try {
    job = await base44.asServiceRole.entities.Job.get(jobId);
  } catch {
    throw new Error("Vaga não encontrada.");
  }
  if (!job) throw new Error("Vaga não encontrada.");
  if (job.status && job.status !== "ativa") {
    throw new Error("Vaga não está ativa.");
  }

  // Valida currículo
  const resume = await validateResumeVersion(base44, resumeVersionId, userId);
  if ((resume.is_demo === true) !== (job.is_demo === true)) throw new Error('Não é permitido misturar currículo de demonstração e vaga real.');
  if (resume.job_id !== jobId) throw new Error('Currículo vinculado a outra vaga.');
  if (resume.match_id) {
    const match = await base44.asServiceRole.entities.JobMatch.get(resume.match_id);
    assertConsistentOwner(match, userId);
    if (match.job_id !== jobId) throw new Error('Análise vinculada a outra vaga.');
  }

  // Impede candidatura duplicada (mesmo usuário + vaga + status ativo) — check pré-create.
  const existing = await base44.asServiceRole.entities.Application.filter(
    { $and: [ownerQuery(userId), { job_id: jobId, status: { $in: ACTIVE_STATUSES } }] },
    { limit: 1 }
  );
  if (existing.items && existing.items.length > 0) {
    throw new Error("Já existe uma candidatura ativa para esta vaga.");
  }

  await audit(base44,userId,'preparacao_solicitada',jobId);
  const app = await base44.asServiceRole.entities.Application.create({
    user_id: userId,
    owner_user_id: userId,
    is_demo: resume.is_demo === true || job.is_demo === true,
    ...((resume.is_demo || job.is_demo) ? { demo_batch_id: resume.demo_batch_id || job.demo_batch_id } : {}),
    job_id: jobId,
    resume_version_id: resumeVersionId,
    metodo_envio: metodoEnvio,
    status: "pendente_aprovacao",
    criado_em: new Date().toISOString(),
  });

  // Mitigação NÃO atômica: leituras/criação/cancelamento/auditoria são operações separadas.
  // Preserva evidência, sem delete. Não garante unicidade nem uma candidatura sobrevivente.
  const postCheck = await base44.asServiceRole.entities.Application.filter(
    { $and: [ownerQuery(userId), { job_id: jobId, status: { $in: ACTIVE_STATUSES } }] },
    { limit: 10 }
  );
  if (postCheck.items && postCheck.items.length > 1) {
    const reason = 'DUPLICIDADE_CONCORRENTE: candidatura cancelada; envio bloqueado. Conflitos: ' +
      postCheck.items.filter(item => item.id !== app.id).map(item => item.id).join(', ');
    await base44.asServiceRole.entities.Application.update(app.id, {
      status: 'cancelada_duplicada',
      erro: reason,
      motivo_bloqueio: 'Cancelada por duplicidade. Registro preservado para auditoria.',
    });
    // Não ocultar falha de auditoria; o cancelamento já persistido continua terminal.
    await base44.asServiceRole.entities.AuditLog.create({
      user_id: userId,
      acao: 'candidatura_cancelada_por_duplicidade',
      entidade: 'Application',
      entidade_id: app.id,
      resultado: 'erro',
      data_evento: new Date().toISOString(),
    });
    throw new Error('Concorrência detectada: candidatura ' + app.id + ' cancelada por duplicidade e preservada. Mitigação não atômica.');
  }

  await auditCompleted(base44,userId,'candidatura_preparada',app.id);
  return app;
}

// Snapshot compare-and-swap shared with repair: no decision may overwrite another decision,
// a changed resume/channel, or a delivery reservation.
function decisionConflict(message = 'A candidatura mudou durante a revisão. Atualize a lista e revise novamente.') {
  const error = new Error(message); error.status = 409; throw error;
}
function validateDecision(app, userId, params) {
  assertOwnership(app,userId);
  if (app.status !== 'pendente_aprovacao') decisionConflict('Esta candidatura não está mais aguardando aprovação. Atualize a lista.');
  if (app.envio_token || app.enviado_em || app.identificador_envio || app.comprovante) decisionConflict('Há envio iniciado ou confirmação registrada. A decisão não pode ser alterada.');
  if (params.expectedResumeVersionId !== undefined && params.expectedResumeVersionId !== (app.resume_version_id || '')) decisionConflict();
  if (params.expectedMethod !== undefined && params.expectedMethod !== (app.metodo_envio || '')) decisionConflict();
  if (params.expectedUpdatedDate !== undefined && params.expectedUpdatedDate !== app.updated_date) decisionConflict();
  const canal=params.canal || 'in_app';
  if (!['in_app','whatsapp'].includes(canal)) throw new Error('Canal de aprovação inválido.');
  if (params.origem !== undefined && (typeof params.origem !== 'string' || params.origem.length > 200)) throw new Error('Origem inválida.');
  if (canal === 'whatsapp') {
    const expiry=Date.parse(app.codigo_aprovacao_expira_em);
    if (typeof params.approvalCode !== 'string' || !params.approvalCode || params.approvalCode !== app.codigo_aprovacao || !Number.isFinite(expiry) || expiry <= Date.now()) throw new Error('Código de aprovação inválido ou expirado.');
  }
}
async function persistDecision(base44, app, userId, params, patch, action) {
  const query={...applicationSnapshotQuery(app,userId),...(params.canal === 'whatsapp' ? {codigo_aprovacao:params.approvalCode,codigo_aprovacao_expira_em:app.codigo_aprovacao_expira_em} : {})};
  await audit(base44,userId,action+'_solicitada',app.id);
  if (params.canal === 'whatsapp' && Date.parse(app.codigo_aprovacao_expira_em) <= Date.now()) throw new Error('Código de aprovação inválido ou expirado.');
  const result=await base44.asServiceRole.entities.Application.updateMany(query,{$set:{...patch,codigo_aprovacao:null,codigo_aprovacao_expira_em:null,canal_aprovacao:params.canal || 'in_app',origem_aprovacao:params.origem || 'web'}});
  if (result?.updated !== 1) {
    await auditCompleted(base44,userId,'decisao_conflitante',app.id,'erro');
    decisionConflict();
  }
  const updated=await base44.asServiceRole.entities.Application.get(app.id);
  const audit_recorded=await auditCompleted(base44,userId,action+'_concluida',app.id);
  return {...updated,audit_recorded};
}

export async function approveApplication(base44, userId, params) {
  if (!params.applicationId) throw new Error('application_id é obrigatório.');
  const app=await base44.asServiceRole.entities.Application.get(params.applicationId);
  if (!app) throw new Error('Candidatura não encontrada.');
  validateDecision(app,userId,params);
  const resume=await validateResumeVersion(base44,app.resume_version_id,userId);
  if (resume.job_id !== app.job_id || !!resume.is_demo !== !!app.is_demo) throw new Error('Currículo incompatível com a candidatura.');
  const job=await base44.asServiceRole.entities.Job.get(app.job_id);
  if (!job || job.status !== 'ativa' || !!job.is_demo !== !!app.is_demo) throw new Error('Vaga indisponível ou incompatível.');
  if (!VALID_SEND_METHODS.includes(app.metodo_envio)) throw new Error('Método de envio inválido.');
  return persistDecision(base44,app,userId,params,{status:'aprovado',aprovado_em:new Date().toISOString(),rejeitado_em:null,motivo_rejeicao:null},'aprovacao');
}

export async function rejectApplication(base44, userId, params) {
  if (!params.applicationId) throw new Error('application_id é obrigatório.');
  const app=await base44.asServiceRole.entities.Application.get(params.applicationId);
  if (!app) throw new Error('Candidatura não encontrada.');
  validateDecision(app,userId,params);
  if (params.motivo !== undefined && (typeof params.motivo !== 'string' || params.motivo.length > 1000)) throw new Error('Motivo inválido ou acima de 1000 caracteres.');
  return persistDecision(base44,app,userId,params,{status:'recusado',rejeitado_em:new Date().toISOString(),motivo_rejeicao:params.motivo?.trim() || 'Recusado pelo usuário',aprovado_em:null},'recusa');
}

// dispatchApprovedApplication — processa o envio de candidatura aprovada.
// Sem provedor configurado, NÃO marca como enviado nem preenche enviado_em/identificador_envio/comprovante.
// Transiciona para acao_manual_necessaria com link oficial e motivo de bloqueio.
export async function dispatchApprovedApplication(base44, userId, params) {
  const { applicationId } = params;
  if (!applicationId) throw new Error("application_id é obrigatório.");

  const app = await base44.asServiceRole.entities.Application.get(applicationId);
  if (!app) throw new Error("Candidatura não encontrada.");
  assertOwnership(app, userId);
  // Bloqueia estados terminais e não aprovados ANTES de qualquer envio ou efeito colateral.
  assertTransition(app, 'enviado');

  // Valida que o currículo é o mesmo que foi aprovado
  await validateResumeVersion(base44, app.resume_version_id, userId);

  // Valida que método de envio está definido
  if (!app.metodo_envio) {
    throw new Error("Método de envio não definido. Não é possível enviar.");
  }

  // Busca a vaga para obter o link oficial (quando aplicável)
  let job = null;
  try {
    job = await base44.asServiceRole.entities.Job.get(app.job_id);
  } catch { /* ignore — vaga pode ter sido removida */ }
  const linkOficial = job?.url_original || null;

  const deliveryFunction = {gmail:'sendGmailApplication',outlook:'sendOutlookApplication',api_direta:'submitApplicationDirectly'}[app.metodo_envio];
  if (deliveryFunction) {
    const recipient = params.destinatario?.trim();
    if (app.metodo_envio !== 'api_direta' && (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient))) throw new Error('Confirme o destinatário na prévia antes de enviar.');
    const result = await base44.functions.invoke(deliveryFunction,{application_id:applicationId,...(recipient?{destinatario:recipient}:{})});
    if (!result.data?.success || !result.data?.application) throw new Error(result.data?.error || 'Envio não confirmado.');
    return result.data.application;
  }

  // Verifica se o provedor está configurado para o método
  const providerConfigured = isProviderConfigured(app.metodo_envio);

  if (!providerConfigured) {
    // Sem provedor configurado — NÃO marca como enviado.
    // Transiciona para acao_manual_necessaria com motivo e link oficial.
    assertTransition(app, "acao_manual_necessaria");

    await audit(base44,userId,'encaminhamento_manual_solicitado',applicationId);
    const result = await base44.asServiceRole.entities.Application.updateMany(applicationSnapshotQuery(app,userId), {$set:{
      status: 'acao_manual_necessaria',
      motivo_bloqueio: getMotivoBloqueio(app.metodo_envio),
      link_oficial: linkOficial,
    }});
    if (result?.updated !== 1) decisionConflict();
    const updated = await base44.asServiceRole.entities.Application.get(applicationId);

    await auditCompleted(base44,userId,'acao_manual_necessaria',applicationId);
    return updated;
  }

  // TODO (ETAPA futura): Quando provedores forem configurados, executar envio real aqui.
  // Só marcar como enviado após receber confirmação real do provedor/endpoint.
  // Exemplo:
  //   if (app.metodo_envio === "email") {
  //     const result = await sendViaEmail(base44, app, resume, job);
  //     if (result.success) {
  //       return await base44.asServiceRole.entities.Application.update(applicationId, {
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