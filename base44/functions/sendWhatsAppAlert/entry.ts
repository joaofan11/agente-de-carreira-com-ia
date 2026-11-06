import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { authenticatedUser } from '../../shared/requestAuth.ts';
import { realProfile, ownerQuery } from '../../shared/personalOwnership.ts';
import { canonicalWhatsAppPhone } from '../../shared/whatsappIdentity.ts';
import { requestWhatsAppApproval } from '../../shared/requestWhatsAppApproval.ts';
import { getTwilioConfig, sendWhatsAppMessage } from '../../shared/twilioClient.ts';
import { allowFields, text, functionError } from '../../shared/personalValidation.ts';
export default async function(req){try{
 const client=createClientFromRequest(req),user=await authenticatedUser(client);if(!user)return Response.json({error:'Unauthorized'},{status:401});
 const body=allowFields(await req.json(),['application_id','destinatario','is_test']);
 if(body.is_test!==undefined&&typeof body.is_test!=='boolean')throw Error('Modo de teste inválido.');
 const config=getTwilioConfig(secrets);if(!config.configured||!config.webhookUrl)return Response.json({configured:false,error:'Configure Twilio e TWILIO_WEBHOOK_URL antes de solicitar aprovação.'},{status:503});
 if(body.is_test!==true)return Response.json(await requestWhatsAppApproval(client,user.id,text(body.application_id,200),body.destinatario,secrets));
 const profile=await realProfile(client,user.id),phone=canonicalWhatsAppPhone(profile?.telefone_whatsapp);if(!phone)throw Error('Cadastre seu WhatsApp com DDD e país em Meu Perfil.');
 const prefs=await client.asServiceRole.entities.UserIntegration.filter({$and:[ownerQuery(user.id),{provedor:'whatsapp',is_demo:{$ne:true}}]},{limit:1});
 if(prefs.items?.[0]?.notificacoes_ativas!==true)throw Error('Ative as notificações WhatsApp em Configurações.');
 if(body.is_test===true){const sent=await sendWhatsAppMessage(config,'whatsapp:'+phone,'Teste de conexão Anexa.AI. Nenhuma candidatura foi aprovada ou enviada.');if(!sent.success||!sent.data?.sid)throw Error('Twilio não confirmou o teste. Confira o sandbox ou a janela de mensagens.');return Response.json({configured:true,success:true,message_sid:sent.data.sid});}
 return Response.json({error:'Solicitação inválida.'},{status:400});
}catch(error){return functionError(error);}}
