import { ownedRecord, assertConsistentOwner } from './personalOwnership.ts';
import { claimDelivery, auditCompleted } from './applicationAudit.ts';
import { emailAccess } from './emailOAuth.ts';
import { buildMimeMessage, mimeToBase64Url } from './gmailMimeBuilder.ts';
import { bufferToBase64 } from './emailContent.ts';
export function recruitmentEmail(value){if(typeof value!=='string')return null;const email=value.trim();return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/.test(email)&&email.length<=254?email:null;}
export async function sendApprovedEmail(client,userId,applicationId,provider,recipient,secrets){
 if(!['gmail','outlook'].includes(provider))throw Error('Canal inválido.');
 const app=await ownedRecord(client,'Application',applicationId,userId);assertConsistentOwner(app,userId);
 if(app.status!=='aprovado'||app.metodo_envio!==provider)throw Error('Candidatura não aprovada ou canal divergente.');
 if(app.is_demo)throw Error('Envio real bloqueado para candidatura de demonstração.');
 const to=recruitmentEmail(recipient || app.destinatario_confirmado);if(!to)throw Error('Confirme um e-mail de candidatura publicado pela empresa.');
 if(app.destinatario_confirmado&&app.destinatario_confirmado!==to)throw Error('Destinatário diferente do revisado. Corrija e aprove novamente.');
 const resume=await ownedRecord(client,'ResumeVersion',app.resume_version_id,userId);assertConsistentOwner(resume,userId);
 const job=await client.asServiceRole.entities.Job.get(app.job_id);
 if(!job||job.status!=='ativa'||job.is_demo||resume.is_demo||resume.job_id!==app.job_id||resume.status_revisao!=='pronto'||!/^(?:mp\/)?private\//.test(resume.referencia_pdf_privado||''))throw Error('Vaga ou currículo indisponível para o envio aprovado.');
 const account=await emailAccess(client,userId,provider,secrets);
 if(app.email_account_id&&app.email_account_id!==account.accountId)throw Error('Conta de envio alterada. Solicite nova aprovação.');
 const {signed_url}=await client.asServiceRole.integrations.Core.CreateFileSignedUrl({file_uri:resume.referencia_pdf_privado});
 const response=await fetch(signed_url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('PDF privado indisponível.');
 if(Number(response.headers.get('content-length'))>5*1024*1024)throw Error('PDF excede 5 MB.');
 const buffer=await response.arrayBuffer(),bytes=new Uint8Array(buffer);
 if(bytes.length>5*1024*1024||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('PDF inválido ou maior que 5 MB.');
 const nome=String(resume.conteudo_estruturado?.contato?.nome||'Candidato(a)').replace(/[\r\n]/g,' ').slice(0,200);
 const subject=('Candidatura para '+job.cargo+' - '+nome).replace(/[\r\n]/g,' ').slice(0,500);
 const body='Prezados,\n\nApresento minha candidatura para '+String(job.cargo).slice(0,300)+'. Encaminho meu currículo em anexo para avaliação.\n\nAtenciosamente,\n'+nome;
 const pdf=bufferToBase64(buffer);
 const payload=provider==='gmail'?{raw:mimeToBase64Url(buildMimeMessage(account.email,to,subject,body,pdf,'Curriculo.pdf'))}:{message:{subject,body:{contentType:'Text',content:body},toRecipients:[{emailAddress:{address:to}}],attachments:[{'@odata.type':'#microsoft.graph.fileAttachment',name:'Curriculo.pdf',contentType:'application/pdf',contentBytes:pdf}]},saveToSentItems:true};
 const stillActive=await client.asServiceRole.entities.EmailAccount.get(account.accountId);if(!stillActive?.active||stillActive.owner_user_id!==userId)throw Error('Conta desconectada antes do envio.');
 await claimDelivery(client,app,userId,provider,to);
 // Ambiguous failures retain the delivery reservation. Never retry automatically.
 const unconfirmed=async(message)=>{await client.asServiceRole.entities.Application.update(app.id,{erro:message});throw Error(message);};
 let sent;try{sent=await fetch(provider==='gmail'?'https://gmail.googleapis.com/gmail/v1/users/me/messages/send':'https://graph.microsoft.com/v1.0/me/sendMail',{method:'POST',headers:{Authorization:'Bearer '+account.accessToken,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)});}catch{return unconfirmed('Envio sem confirmação. Reserva preservada; confira Enviados antes de repetir.');}
 if(!sent.ok){await client.asServiceRole.entities.Application.update(app.id,{erro:'Provedor recusou envio (HTTP '+sent.status+'). Reserva preservada; confira a conta antes de repetir.'});throw Error('O provedor não confirmou o envio. Confira sua conta; não repita automaticamente.');}
 let providerId=null;if(provider==='gmail'){let data;try{data=await sent.json();}catch{return unconfirmed('Gmail retornou resposta inválida. Confira Enviados antes de repetir.');}if(typeof data.id!=='string'||!data.id)return unconfirmed('Gmail sem identificador de aceite. Confira Enviados antes de repetir.');providerId=data.id;}else if(sent.status!==202)return unconfirmed('Resposta Outlook inesperada. Confira Enviados antes de repetir.');
 const receipt=providerId || 'OUT-'+crypto.randomUUID();
 const updated=await client.asServiceRole.entities.Application.update(app.id,{status:'enviado',enviado_em:new Date().toISOString(),identificador_envio:receipt,comprovante:provider==='gmail'?'gmail_message_id:'+receipt:'outlook_sendmail_202_'+receipt,erro:null});
 const audit_recorded=await auditCompleted(client,userId,'envio_'+provider+'_aceito',app.id);
 return {success:true,application:updated,message_id:receipt,audit_recorded,message:'Aceito pelo provedor. Não comprova leitura ou entrega ao recrutador.'};
}
