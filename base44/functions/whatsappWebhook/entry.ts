import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { findWhatsAppProfile, canonicalWhatsAppPhone } from '../../shared/whatsappIdentity.ts';
import { getTwilioConfig, validateTwilioSignature } from '../../shared/twilioClient.ts';
import { approveApplication, rejectApplication } from '../../shared/applicationStateMachine.ts';
import { ownerQuery } from '../../shared/personalOwnership.ts';
import { sendApprovedEmail } from '../../shared/emailDelivery.ts';
function twiml(message){const escaped=String(message).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');return new Response('<Response><Message>'+escaped+'</Message></Response>',{headers:{'Content-Type':'text/xml; charset=utf-8'}});}
export default async function(req){
 const config=getTwilioConfig(secrets);
 if(!config.configured||!config.webhookUrl)return Response.json({error:'WhatsApp não configurado.'},{status:503});
 const raw=await req.text();if(raw.length>65536)return new Response(null,{status:413});
 if(!await validateTwilioSignature(config.authToken,raw,req.headers.get('X-Twilio-Signature')||'',config.webhookUrl))return new Response(null,{status:403});
 const params=new URLSearchParams(raw);
 if(params.get('AccountSid')!==config.accountSid||canonicalWhatsAppPhone(params.get('To'))!==canonicalWhatsAppPhone(config.fromNumber))return new Response(null,{status:403});
 try{
  const client=createClientFromRequest(req),identity=await findWhatsAppProfile(client,params.get('From'));
  if(!identity)return twiml('Número não vinculado de forma única. Confira Meu Perfil no Anexa.AI.');
  const command=(params.get('Body')||'').trim().toUpperCase().match(/^(APROVAR|RECUSAR)\s+([A-Z0-9]{8})$/);
  if(!command)return twiml('Responda APROVAR ou RECUSAR seguido do código recebido. Solicite nova revisão pelo Anexa.AI.');
  const [,action,code]=command;
  const page=await client.asServiceRole.entities.Application.filter({$and:[ownerQuery(identity.userId),{codigo_aprovacao:code,status:'pendente_aprovacao',is_demo:{$ne:true}}]},{limit:2});
  if(page.items?.length!==1)return twiml('Código não vigente ou já utilizado. Nenhum novo envio foi realizado.');
  const app=page.items[0];
  if(action==='RECUSAR'){await rejectApplication(client,identity.userId,{applicationId:app.id,canal:'whatsapp',origem:'whatsapp_webhook',approvalCode:code});return twiml('Candidatura recusada. Nenhum currículo enviado.');}
  const approved=await approveApplication(client,identity.userId,{applicationId:app.id,canal:'whatsapp',origem:'whatsapp_webhook',approvalCode:code});
  if(!approved.enviar_apos_aprovacao||!approved.email_account_id||!approved.destinatario_confirmado||!['gmail','outlook'].includes(approved.metodo_envio))return twiml('Aprovação registrada. Envio automático não autorizado nesta revisão; confira a candidatura no Anexa.AI.');
  try{
   const result=await sendApprovedEmail(client,identity.userId,app.id,approved.metodo_envio,approved.destinatario_confirmado,secrets);
   return twiml('Aprovação registrada. Currículo aceito pelo provedor de e-mail para envio. Isso não confirma entrega ou leitura pelo recrutador.'+(result.audit_recorded===false?' Registro de auditoria pendente; não repita o envio.':''));
  }catch{return twiml('Aprovação registrada, mas o envio não foi confirmado. Confira a candidatura e a pasta Enviados antes de tentar novamente.');}
 }catch{return twiml('Não foi possível concluir a decisão. O código pode ter expirado ou a candidatura ter mudado. Atualize o Anexa.AI.');}
}
