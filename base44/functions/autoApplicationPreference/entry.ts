import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { authenticatedUser } from '../../shared/requestAuth.ts';
import { allowFields, functionError } from '../../shared/personalValidation.ts';
export default async function(req){try{
 const client=createClientFromRequest(req),user=await authenticatedUser(client);if(!user)return Response.json({error:'Unauthorized'},{status:401});
 const body=allowFields(await req.json(),['enabled','provider']);
 const table=client.asServiceRole.entities.AutoApplicationPreference,page=await table.filter({owner_user_id:user.id},{limit:2});
 if(page.items?.length>1)throw Error('Preferência duplicada; revisão necessária.');
 if(body.enabled===undefined)return Response.json({preference:page.items?.[0]?{enabled:page.items[0].enabled,provider:page.items[0].provider}:{enabled:false,provider:'gmail'}});
 if(typeof body.enabled!=='boolean'||!['gmail','outlook'].includes(body.provider))throw Error('Preferência inválida.');
 const fields={enabled:body.enabled,provider:body.provider,minimum_score:60,consented_at:new Date().toISOString()};
 if(page.items?.[0])await table.update(page.items[0].id,fields);else await table.create({owner_user_id:user.id,...fields});
 return Response.json({preference:fields});
}catch(error){return functionError(error);}}
