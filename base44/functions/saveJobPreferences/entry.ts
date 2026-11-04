import { authenticatedUser } from '../../shared/requestAuth.ts';
import { recordAuditEvent, recordAuditCompleted } from '../../shared/auditEvents.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { ownedRecord, ownerQuery, assertConsistentOwner } from '../../shared/personalOwnership.ts';
import { allowFields, texts, functionError } from '../../shared/personalValidation.ts';
const KEYS=['cargos_interesse','areas_interesse','niveis','localizacoes','modalidades','tipos_contrato','disponibilidade','salario_minimo_opcional','regiao_amazonia','notificacoes_ativas'];
const ENUMS={niveis:['estagio','trainee','junior','pleno'],modalidades:['presencial','hibrido','remoto','indiferente'],tipos_contrato:['estagio','trainee','clt','pj','indiferente']};
export default async function(req) {
  try {
    const base44=createClientFromRequest(req),user=await authenticatedUser(base44);
    if(!user)return Response.json({error:'Unauthorized'},{status:401});
    const body=allowFields(await req.json(),['preference_id','fields']), fields=allowFields(body.fields,KEYS);
    for(const key of KEYS.slice(0,6)) if(key in fields) { fields[key]=texts(fields[key]); if(ENUMS[key]&&fields[key].some(v=>!ENUMS[key].includes(v))) throw new Error('Opção inválida: '+key); }
    if(fields.disponibilidade==='') delete fields.disponibilidade;
    if(fields.disponibilidade&&!['imediata','ate_30_dias','ate_60_dias','flexivel'].includes(fields.disponibilidade))throw new Error('Disponibilidade inválida.');
    for(const key of ['regiao_amazonia','notificacoes_ativas'])if(key in fields&&typeof fields[key]!=='boolean')throw new Error('Opção inválida.');
    if(fields.salario_minimo_opcional===null)delete fields.salario_minimo_opcional;
    if('salario_minimo_opcional'in fields&&(!Number.isFinite(fields.salario_minimo_opcional)||fields.salario_minimo_opcional<0))throw new Error('Salário inválido.');
    const existing=body.preference_id?await ownedRecord(base44,'JobPreference',body.preference_id,user.id):(await base44.asServiceRole.entities.JobPreference.filter({$and:[ownerQuery(user.id),{is_demo:{$ne:true}}]},{limit:1})).items?.[0];
    if(existing)assertConsistentOwner(existing,user.id);
    const auditRequest=await recordAuditEvent(base44,user.id,'preferencias_salvamento_solicitado','JobPreference',existing?.id);
    const preference=existing?await base44.asServiceRole.entities.JobPreference.update(existing.id,fields):await base44.asServiceRole.entities.JobPreference.create({...fields,user_id:user.id,owner_user_id:user.id,is_demo:false});
    const audit_recorded=await recordAuditCompleted(base44,user.id,'preferencias_salvas','JobPreference',preference.id);
    return Response.json({preference,audit_recorded,audit_request_id:auditRequest.id});
  }catch(error){return functionError(error);}
}
