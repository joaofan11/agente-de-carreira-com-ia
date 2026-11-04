import { authenticatedUser } from '../../shared/requestAuth.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { ownedRecord, assertConsistentOwner } from '../../shared/personalOwnership.ts';
import { audit, auditCompleted } from '../../shared/applicationAudit.ts';
export default async function(req){try{
 const base44=createClientFromRequest(req),user=await authenticatedUser(base44);
 if(!user)return Response.json({error:'Unauthorized'},{status:401});
 const body=await req.json();
 const app=await ownedRecord(base44,'Application',body.application_id,user.id);
 assertConsistentOwner(app,user.id);
 if(!['rascunho','pendente_aprovacao','aprovado','acao_manual_necessaria'].includes(app.status) || app.envio_token || app.enviado_em)throw new Error('Candidatura já enviada ou com envio iniciado não pode ser alterada.');
 const resume=await ownedRecord(base44,'ResumeVersion',body.resume_version_id,user.id);
 assertConsistentOwner(resume,user.id);
 if(resume.job_id!==app.job_id || resume.status_revisao!=='pronto' || !resume.referencia_pdf_privado || !!resume.is_demo!==!!app.is_demo)throw new Error('Selecione uma versão aprovada com PDF para esta vaga.');
 if(!['manual','gmail','outlook','api_direta'].includes(body.metodo_envio))throw new Error('Canal inválido.');
 await audit(base44,user.id,'correcao_candidatura_solicitada',app.id);
 const result=await base44.asServiceRole.entities.Application.updateMany({id:app.id,status:app.status,$or:[{envio_token:{$exists:false}},{envio_token:null},{envio_token:''}]},{$set:{resume_version_id:resume.id,metodo_envio:body.metodo_envio,status:'pendente_aprovacao',aprovado_em:null,codigo_aprovacao:null,motivo_bloqueio:null,erro:null}});
 if(result?.updated!==1)throw new Error('Candidatura alterada. Recarregue.');
 await auditCompleted(base44,user.id,'candidatura_corrigida_requer_aprovacao',app.id);
 return Response.json({application:await base44.asServiceRole.entities.Application.get(app.id)});
}catch(error){return Response.json({error:error.message},{status:400});}}
