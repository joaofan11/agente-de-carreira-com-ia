import { jsPDF } from 'npm:jspdf@4.2.1';
import { buildResumePdf } from './resumePdfCore.js';
import { buildPrompt, RESUME_SCHEMA } from './resumeGeneration.ts';
import { groundResumeDraft } from './resumeGrounding.ts';
import { validateResumeContent } from './resumeContent.js';
import { realProfile, ownerQuery } from './personalOwnership.ts';
import { reserveAnalysis } from './automationControls.ts';
import { prepareApplication } from './applicationStateMachine.ts';
import { requestWhatsAppApproval } from './requestWhatsAppApproval.ts';
import { recruitmentEmail } from './emailDelivery.ts';
import { emailProvider } from './emailOAuth.ts';
import { canonicalWhatsAppPhone } from './whatsappIdentity.ts';
import { getTwilioConfig } from './twilioClient.ts';
// Called only by authenticated administrative processing, for explicitly opted-in owners.
export async function automaticApplication(client,userId,profile,job,match,secrets){
 const preferences=await client.asServiceRole.entities.AutoApplicationPreference.filter({owner_user_id:userId,enabled:true},{limit:2});
 const pref=preferences.items?.[0];if(preferences.items?.length!==1)return {skipped:'sem_autorizacao'};
 if(match.score<Math.max(60,pref.minimum_score||60)||(match.bloqueios||[]).length||job.is_demo||profile.is_demo)return {skipped:'incompativel'};
 const to=recruitmentEmail(job.email_recrutamento);
 if(job.email_recrutamento_validado!==true||!to)return {skipped:'sem_email_de_candidatura_verificado'};
 const twilio=getTwilioConfig(secrets);if(!twilio.configured||!twilio.webhookUrl||!emailProvider(pref.provider,secrets).configured)return {skipped:'configuracao_pendente'};
 const notifications=await client.asServiceRole.entities.UserIntegration.filter({$and:[ownerQuery(userId),{provedor:'whatsapp',is_demo:{$ne:true}}]},{limit:1});
 if(notifications.items?.[0]?.notificacoes_ativas!==true||!canonicalWhatsAppPhone(profile.telefone_whatsapp))return {skipped:'whatsapp_sem_consentimento_ou_telefone'};
 const accounts=await client.asServiceRole.entities.EmailAccount.filter({owner_user_id:userId,provider:pref.provider,active:true},{limit:2});if(accounts.items?.length!==1)return {skipped:'conta_desconectada'};
 const active=await client.asServiceRole.entities.Application.filter({$and:[ownerQuery(userId),{job_id:job.id,status:{$in:['rascunho','pendente_aprovacao','aprovado','acao_manual_necessaria','enviado','em_analise','entrevista']}}]},{limit:1});if(active.items?.length)return {skipped:'candidatura_existente'};
 // Limit automatic generation to one attempt per owner per UTC day. Reservation is not refunded on failure.
 const day=new Date().toISOString().slice(0,10),claim=await client.asServiceRole.entities.AutoApplicationPreference.updateMany({id:pref.id,enabled:true,$or:[{last_attempt_day:{$exists:false}},{last_attempt_day:null},{last_attempt_day:{$ne:day}}]},{$set:{last_attempt_day:day}});if(claim?.updated!==1)return {skipped:'limite_diario'};
 const budget=await reserveAnalysis(client);if(!budget.allowed)return {skipped:budget.reason}; // Attempted-LLM budget also covers automatic resume generation.
 const generated=await client.asServiceRole.integrations.Core.InvokeLLM({prompt:buildPrompt(profile,job,match),response_json_schema:RESUME_SCHEMA});
 const content=validateResumeContent(groundResumeDraft(generated,profile).resume);if(!content.contato.nome)throw Error('Currículo automático sem nome.');
 const current=await realProfile(client,userId),latest=await client.asServiceRole.entities.AutoApplicationPreference.get(pref.id),currentJob=await client.asServiceRole.entities.Job.get(job.id);
 if(!latest.enabled||latest.provider!==pref.provider||JSON.stringify(current)!==JSON.stringify(profile)||currentJob.status!=='ativa'||currentJob.email_recrutamento!==to||!currentJob.email_recrutamento_validado)throw Error('Perfil, consentimento ou vaga alterados durante a geração.');
 const blob=buildResumePdf(jsPDF,content),file=new File([blob],'Curriculo.pdf',{type:'application/pdf'});
 const uploaded=await client.asServiceRole.integrations.Core.UploadPrivateFile({file});if(!/^(?:mp\/)?private\//.test(uploaded.file_uri||''))throw Error('Armazenamento privado indisponível.');
 const versions=await client.asServiceRole.entities.ResumeVersion.aggregate({query:{$and:[ownerQuery(userId),{job_id:job.id}]},max:'numero_versao'});
 const resume=await client.asServiceRole.entities.ResumeVersion.create({user_id:userId,owner_user_id:userId,job_id:job.id,match_id:match.id,conteudo_estruturado:content,referencia_pdf_privado:uploaded.file_uri,evidencias_utilizadas:content.evidencias_utilizadas||[],numero_versao:Number(versions.rows?.[0]?.max_numero_versao||0)+1,status_revisao:'pronto',origem_geracao:'automatica_pendente_aprovacao',criado_em:new Date().toISOString(),is_demo:false});
 const app=await prepareApplication(client,userId,{jobId:job.id,resumeVersionId:resume.id,metodoEnvio:pref.provider});
 try{const result=await requestWhatsAppApproval(client,userId,app.id,to,secrets);return {application_id:app.id,alert_sent:true,...(result?.notification_recorded===false?{error:'Solicitação WhatsApp aceita; histórico pendente. Não repetir.'}:{})};}
 catch{await client.asServiceRole.entities.Application.update(app.id,{erro:'Solicitação WhatsApp não confirmada. Confira Configurações e solicite aprovação na candidatura.'});return {application_id:app.id,alert_sent:false,error:'Candidatura preparada, mas solicitação WhatsApp não confirmada.'};}
}
