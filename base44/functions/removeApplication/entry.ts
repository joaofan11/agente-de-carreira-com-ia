import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { authenticatedUser } from '../../shared/requestAuth.ts';
import { assertConsistentOwner } from '../../shared/personalOwnership.ts';
import { applicationSnapshotQuery } from '../../shared/applicationSnapshot.ts';
import { audit, auditCompleted } from '../../shared/applicationAudit.ts';
import { allowFields, text, functionError } from '../../shared/personalValidation.ts';
export default async function(req) {
  try {
    const client=createClientFromRequest(req),user=await authenticatedUser(client);
    if(!user)return Response.json({error:'Unauthorized'},{status:401});
    const body=allowFields(await req.json(),['application_id']);
    const id=text(body.application_id,200).trim();if(!id)throw new Error('Informe a candidatura.');
    let app;
    try {app=await client.asServiceRole.entities.Application.get(id);}catch(error){
      if((error.status || error.response?.status)===404)return Response.json({removed:true,already_absent:true});
      throw error;
    }
    if(!app)return Response.json({removed:true,already_absent:true});
    assertConsistentOwner(app,user.id);
    if(!['rascunho','recusado','acao_manual_necessaria'].includes(app.status) || app.envio_token || app.envio_iniciado_em || app.enviado_em || app.identificador_envio || app.comprovante){
      return Response.json({error:'Candidatura com envio iniciado, confirmado ou em estado protegido não pode ser removida.'},{status:409});
    }
    await audit(client,user.id,'remocao_candidatura_solicitada',id);
    const query=applicationSnapshotQuery(app,user.id);
    query.$and.push({$or:[{envio_iniciado_em:{$exists:false}},{envio_iniciado_em:null},{envio_iniciado_em:''}]});
    const result=await client.asServiceRole.entities.Application.deleteMany(query);
    if(result?.deleted!==1)return Response.json({error:'A candidatura mudou ou já foi removida. Atualize a lista.'},{status:409});
    const audit_recorded=await auditCompleted(client,user.id,'candidatura_removida',id);
    return Response.json({removed:true,audit_recorded});
  }catch(error){return functionError(error);}
}
