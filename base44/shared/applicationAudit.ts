import { applicationSnapshotQuery } from './applicationSnapshot.ts';
import { assertConsistentOwner } from './personalOwnership.ts';
import { recordAuditEvent, recordAuditCompleted } from './auditEvents.ts';
export async function audit(base44,userId,action,id,result='sucesso') {
  return recordAuditEvent(base44,userId,action,'Application',id,result);
}
export async function auditCompleted(base44,userId,action,id,result='sucesso') {
  return recordAuditCompleted(base44,userId,action,'Application',id,result);
}
export async function claimDelivery(base44,app,userId,method,recipient) {
  assertConsistentOwner(app,userId);
  if(app.status!=='aprovado' || app.metodo_envio!==method) throw new Error('Canal divergente ou candidatura não aprovada.');
  await audit(base44,userId,'envio_solicitado_'+method,app.id);
  const token=crypto.randomUUID();
  const result=await base44.asServiceRole.entities.Application.updateMany({...applicationSnapshotQuery(app,userId),status:'aprovado',metodo_envio:method},{$set:{envio_token:token,envio_iniciado_em:new Date().toISOString(),...(recipient?{destinatario_confirmado:recipient}:{})}});
  if(result?.updated!==1) throw new Error('Envio já iniciado ou estado alterado. Confira o provedor antes de tentar novamente.');
  // Reservation remains on errors/timeouts: the remote provider may have accepted the request.
  return token;
}
