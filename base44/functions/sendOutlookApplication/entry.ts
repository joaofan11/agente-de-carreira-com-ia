import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { authenticatedUser } from '../../shared/requestAuth.ts';
import { sendApprovedEmail } from '../../shared/emailDelivery.ts';
import { allowFields, text, functionError } from '../../shared/personalValidation.ts';
export default async function(req){try{
 const client=createClientFromRequest(req),user=await authenticatedUser(client);if(!user)return Response.json({error:'Unauthorized'},{status:401});
 const body=allowFields(await req.json(),['application_id','destinatario']);
 return Response.json(await sendApprovedEmail(client,user.id,text(body.application_id,200),'outlook',body.destinatario,secrets));
}catch(error){return functionError(error);}}
