import test from 'node:test';
import assert from 'node:assert/strict';
import {jsPDF} from 'jspdf';
import {loadSourceModule} from './helpers/backend-handler.mjs';
import {buildResumePdf} from '../base44/shared/resumePdfCore.js';
import {buildPrompt,RESUME_SCHEMA} from '../base44/shared/resumeGeneration.ts';
import {groundResumeDraft} from '../base44/shared/resumeGrounding.ts';
import {validateResumeContent} from '../base44/shared/resumeContent.js';
import {recruitmentEmail} from '../base44/shared/emailDelivery.ts';
import {canonicalWhatsAppPhone} from '../base44/shared/whatsappIdentity.ts';
import {ownerQuery} from '../base44/shared/personalOwnership.ts';
import {profile,job,generated} from './fixtures/resume.mjs';
function fixture(){
 const currentProfile={...structuredClone(profile),telefone_whatsapp:'+5592999999999'},selected={...structuredClone(job),status:'ativa',email_recrutamento:'jobs@example.invalid',email_recrutamento_validado:true};
 const pref={id:'pref',enabled:true,provider:'gmail',minimum_score:60};let ai=0,uploads=0,alerts=0,saved=null;const state={optIn:true,budget:true,daily:true,changed:false,disabled:false};
 const client={asServiceRole:{entities:{AutoApplicationPreference:{filter:async()=>({items:state.optIn?[pref]:[]}),updateMany:async()=>({updated:state.daily?1:0}),get:async()=>({...pref,enabled:!state.disabled})},UserIntegration:{filter:async()=>({items:[{notificacoes_ativas:true}]})},EmailAccount:{filter:async()=>({items:[{id:'account'}]})},Application:{filter:async()=>({items:[]})},Job:{get:async()=>selected},ResumeVersion:{aggregate:async()=>({rows:[]}),create:async value=>{saved={id:'resume',...value};return saved;}}},integrations:{Core:{InvokeLLM:async()=>{ai++;return structuredClone(generated);},UploadPrivateFile:async({file})=>{assert.equal(file.type,'application/pdf');assert.equal(Buffer.from(await file.arrayBuffer()).subarray(0,5).toString(),'%PDF-');uploads++;return {file_uri:'private/automatic.pdf'};}}}}};
 const automatic=loadSourceModule(new URL('../base44/shared/automaticApplication.ts',import.meta.url),{jsPDF,buildResumePdf,buildPrompt,RESUME_SCHEMA,groundResumeDraft,validateResumeContent,realProfile:async()=>state.changed?{...currentProfile,nome_completo:'changed'}:currentProfile,ownerQuery,reserveAnalysis:async()=>({allowed:state.budget,reason:'budget'}),prepareApplication:async(_,owner,params)=>{assert.equal(owner,'A');assert.equal(params.resumeVersionId,'resume');return {id:'app'};},requestWhatsAppApproval:async(_,owner,id,to)=>{assert.equal(owner,'A');assert.equal(id,'app');assert.equal(to,'jobs@example.invalid');alerts++;},recruitmentEmail,emailProvider:()=>({configured:true}),canonicalWhatsAppPhone,getTwilioConfig:()=>({configured:true,webhookUrl:'https://test.invalid'})},'automaticApplication');
 return {state,selected,run:()=>automatic(client,'A',currentProfile,selected,{id:'match',score:80,bloqueios:[]},{get:()=>null}),get ai(){return ai;},get uploads(){return uploads;},get alerts(){return alerts;},get saved(){return saved;}};
}
test('automation generates grounded private PDF and requests WhatsApp approval without sending CV',async()=>{const f=fixture();const result=await f.run();assert.equal(result.application_id,'app');assert.equal(f.ai,1);assert.equal(f.uploads,1);assert.equal(f.alerts,1);assert.equal(f.saved.owner_user_id,'A');assert.equal(f.saved.origem_geracao,'automatica_pendente_aprovacao');assert.equal(f.saved.conteudo_estruturado.contato.nome,profile.nome_completo);});
test('no opt-in, verified email, daily slot or budget means no LLM/upload/alert',async()=>{for(const kind of ['optIn','verified','daily','budget']){const f=fixture();if(kind==='verified')f.selected.email_recrutamento_validado=false;else f.state[kind]=false;assert.ok((await f.run()).skipped);assert.equal(f.ai,0);assert.equal(f.uploads,0);assert.equal(f.alerts,0);}});
test('profile or opt-in changes during generation prevent upload and WhatsApp request',async()=>{for(const kind of ['changed','disabled']){const f=fixture();f.state[kind]=true;await assert.rejects(f.run(),/alterados/);assert.equal(f.uploads,0);assert.equal(f.alerts,0);}});
