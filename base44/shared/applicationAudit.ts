import { assertConsistentOwner } from './personalOwnership.ts';
export async function audit(base44,userId,action,id,result='sucesso') {
  return base44.asServiceRole.entities.AuditLog.create({user_id:userId,acao:action,entidade:'Application',entidade_id:id,resultado:result,data_evento:new Date().toISOString()});
}
export async function auditCompleted(base44,userId,action,id,result='sucesso') {
  try { await audit(base44,userId,action,id,result); return true; }
  catch { console.error('Falha ao concluir registro de auditoria',action,id); return false; }
}
export async function claimDelivery(base44,app,userId,method,recipient) {
  assertConsistentOwner(app,userId);
  if(app.status!=='aprovado' || app.metodo_envio!==method) throw new Error('Canal divergente ou candidatura não aprovada.');
  await audit(base44,userId,'envio_solicitado_'+method,app.id);
  const token=crypto.randomUUID();
  const result=await base44.asServiceRole.entities.Application.updateMany({id:app.id,status:'aprovado',metodo_envio:method,$or:[{envio_token:{$exists:false}},{envio_token:null},{envio_token:''}]},{$set:{envio_token:token,envio_iniciado_em:new Date().toISOString(),...(recipient?{destinatario_confirmado:recipient}:{})}});
  if(result?.updated!==1) throw new Error('Envio já iniciado ou estado alterado. Confira o provedor antes de tentar novamente.');
  // Reservation remains on errors/timeouts: the remote provider may have accepted the request.
  return token;
}
