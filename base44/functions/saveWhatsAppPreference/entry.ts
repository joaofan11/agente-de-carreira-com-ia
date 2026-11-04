import { authenticatedUser } from '../../shared/requestAuth.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { ownerQuery } from '../../shared/personalOwnership.ts';
import { allowFields, functionError } from '../../shared/personalValidation.ts';
export default async function(req) {
  try {
    const base44=createClientFromRequest(req),user=await authenticatedUser(base44);
    if(!user)return Response.json({error:'Unauthorized'},{status:401});
    const body=allowFields(await req.json(),['enabled']);
    if(typeof body.enabled!=='boolean')throw new Error('Preferência inválida.');
    const page=await base44.asServiceRole.entities.UserIntegration.filter({$and:[ownerQuery(user.id),{provedor:'whatsapp',is_demo:{$ne:true}}]},{limit:1});
    const fields={notificacoes_ativas:body.enabled,atualizado_em:new Date().toISOString()};
    const integration=page.items?.[0]?await base44.asServiceRole.entities.UserIntegration.update(page.items[0].id,fields):await base44.asServiceRole.entities.UserIntegration.create({...fields,user_id:user.id,owner_user_id:user.id,provedor:'whatsapp',status_conexao:'desconectado',is_demo:false});
    const {referencia_credencial_segura,...safe}=integration;
    return Response.json({integration:safe});
  }catch(error){return functionError(error);}
}