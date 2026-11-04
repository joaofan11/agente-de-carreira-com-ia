// Only identifiers and event metadata. Never include profile contents, prompts or credentials.
export async function recordAuditEvent(base44, userId, action, entity, recordId, result = 'sucesso') {
  return base44.asServiceRole.entities.AuditLog.create({
    user_id: userId, acao: action, entidade: entity, entidade_id: recordId,
    resultado: result, data_evento: new Date().toISOString(),
  });
}

export async function recordAuditCompleted(base44, userId, action, entity, recordId, result = 'sucesso') {
  try { await recordAuditEvent(base44, userId, action, entity, recordId, result); return true; }
  catch { console.error('Falha ao concluir registro de auditoria', action, recordId); return false; }
}
