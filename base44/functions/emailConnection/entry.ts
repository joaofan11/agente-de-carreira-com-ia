import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { authenticatedUser } from '../../shared/requestAuth.ts';
import { emailProvider, startEmailOAuth } from '../../shared/emailOAuth.ts';
import { allowFields, functionError } from '../../shared/personalValidation.ts';
export default async function(req){try{
 const client=createClientFromRequest(req),user=await authenticatedUser(client);if(!user)return Response.json({error:'Unauthorized'},{status:401});
 const body=allowFields(await req.json(),['action','provider']);const {provider,action}=body;emailProvider(provider,secrets);
 if(action==='connect')return Response.json(await startEmailOAuth(client,user.id,provider,secrets));
 if(action==='disconnect'){await client.asServiceRole.entities.EmailAccount.updateMany({owner_user_id:user.id,provider},{$set:{active:false,token_ciphertext:null}});return Response.json({disconnected:true});}
 if(action!=='status')throw new Error('Ação inválida.');
 const page=await client.asServiceRole.entities.EmailAccount.filter({owner_user_id:user.id,provider,active:true},{limit:2});
 return Response.json({configured:emailProvider(provider,secrets).configured,connected:page.items?.length===1,email:page.items?.length===1?page.items[0].email:null});
}catch(error){return functionError(error);}}
