import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { authenticatedUser } from '../../shared/requestAuth.ts';
import { getTwilioConfig } from '../../shared/twilioClient.ts';
export default async function(req){const client=createClientFromRequest(req),user=await authenticatedUser(client);if(!user)return Response.json({error:'Unauthorized'},{status:401});const c=getTwilioConfig(secrets);return Response.json({whatsapp:{configured:c.configured&&!!c.webhookUrl,template_configured:!!c.contentSid}});}
