import { realProfile, ownedRecord, assertConsistentOwner, ownerQuery } from './personalOwnership.ts';
import { canonicalWhatsAppPhone } from './whatsappIdentity.ts';
import { applicationSnapshotQuery } from './applicationSnapshot.ts';
import { getTwilioConfig, generateApprovalCode, sendWhatsAppMessage } from './twilioClient.ts';
import { recruitmentEmail } from './emailDelivery.ts';
import { emailProvider } from './emailOAuth.ts';
export async function requestWhatsAppApproval(client,userId,applicationId,recipient,secrets){
 const config=getTwilioConfig(secrets);if(!config.configured||!config.webhookUrl)throw Error('Configure Twilio e TWILIO_WEBHOOK_URL.');
 const profile=await realProfile(client,userId),phone=canonicalWhatsAppPhone(profile?.telefone_whatsapp);if(!phone)throw Error('Cadastre seu WhatsApp com DDD e país em Meu Perfil.');
 const prefs=await client.asServiceRole.entities.UserIntegration.filter({$and:[ownerQuery(userId),{provedor:'whatsapp',is_demo:{$ne:true}}]},{limit:1});
 if(prefs.items?.[0]?.notificacoes_ativas!==true)throw Error('Ative as notificações WhatsApp em Configurações.');
 const app=await ownedRecord(client,'Application',applicationId,userId);assertConsistentOwner(app,userId);
 if(app.status!=='pendente_aprovacao'||!['gmail','outlook'].includes(app.metodo_envio)||app.is_demo||app.envio_token||app.enviado_em)throw Error('Selecione candidatura real pendente com canal Gmail ou Outlook.');
 if(!emailProvider(app.metodo_envio,secrets).configured)throw Error('Configure OAuth de e-mail antes da aprovação por WhatsApp.');
 const to=recruitmentEmail(recipient);if(!to)throw Error('Confirme o endereço publicado para receber candidaturas.');
 const resume=await ownedRecord(client,'ResumeVersion',app.resume_version_id,userId),job=await client.asServiceRole.entities.Job.get(app.job_id);assertConsistentOwner(resume,userId);
 if(!job||job.status!=='ativa'||job.is_demo||resume.is_demo||resume.job_id!==app.job_id||resume.status_revisao!=='pronto'||!/^(?:mp\/)?private\//.test(resume.referencia_pdf_privado||''))throw Error('Currículo ou vaga inválida para aprovação.');
 const accounts=await client.asServiceRole.entities.EmailAccount.filter({owner_user_id:userId,provider:app.metodo_envio,active:true},{limit:2});if(accounts.items?.length!==1)throw Error('Conecte sua conta de envio em Configurações.');
 const account=accounts.items[0],code=generateApprovalCode(),expires=new Date(Date.now()+86400000).toISOString();
 const query={...applicationSnapshotQuery(app,userId),...(app.codigo_aprovacao?{codigo_aprovacao:app.codigo_aprovacao}:{})};
 const saved=await client.asServiceRole.entities.Application.updateMany(query,{$set:{codigo_aprovacao:code,codigo_aprovacao_expira_em:expires,destinatario_confirmado:to,email_account_id:account.id,enviar_apos_aprovacao:true,whatsapp_solicitado_em:new Date().toISOString()}});
 if(saved?.updated!==1)throw Object.assign(Error('Candidatura alterada. Atualize e revise novamente.'),{status:409});
 const clean=value=>String(value||'').replace(/[\r\n]/g,' ').slice(0,180);
 const message='Anexa.AI — aprovação de candidatura\nCargo: '+clean(job.cargo)+'\nEmpresa: '+clean(job.empresa)+'\nCurrículo: v'+(resume.numero_versao||1)+'\nDe: '+account.email+'\nPara: '+to+'\nAo aprovar, autorizo enviar este currículo por '+app.metodo_envio+'.\nRevise o currículo no Anexa.AI: https://anexa-ai.base44.app/curriculos?job_id='+encodeURIComponent(job.id)+'\nAPROVAR '+code+'\nRECUSAR '+code+'\nCódigo válido por 24 horas. Nenhum envio antes da aprovação.';
 const result=await sendWhatsAppMessage(config,'whatsapp:'+phone,message,{variables:{'1':clean(job.cargo),'2':clean(job.empresa),'3':String(resume.numero_versao||1),'4':account.email,'5':to,'6':code,'7':'https://anexa-ai.base44.app/curriculos?job_id='+encodeURIComponent(job.id),'8':app.metodo_envio}});
 let notification_recorded=true;
 try{await client.asServiceRole.entities.Notification.create({user_id:userId,owner_user_id:userId,application_id:app.id,canal:'whatsapp',direcao:'enviada',destino:'whatsapp:'+phone,conteudo:message,status:result.success&&result.data?.sid?'enviado':'falhou',resultado:result.success&&result.data?.sid?'sucesso':'erro',identificador_externo:result.data?.sid||null,criado_em:new Date().toISOString(),is_demo:false});}catch{notification_recorded=false;}
 if(!result.success||!result.data?.sid)throw Object.assign(Error('Twilio não confirmou a solicitação. Confira a configuração antes de repetir.'),{status:502});
 return {success:true,configured:true,message_sid:result.data.sid,expires_at:expires,notification_recorded};
}
