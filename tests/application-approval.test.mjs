import test from 'node:test';
import assert from 'node:assert/strict';
import {approveApplication,rejectApplication,dispatchApprovedApplication} from '../base44/shared/applicationStateMachine.ts';
import {applicationSnapshotQuery} from '../base44/shared/applicationSnapshot.ts';
import {claimDelivery,audit,auditCompleted} from '../base44/shared/applicationAudit.ts';
import {authenticatedUser} from '../base44/shared/requestAuth.ts';
import {ownedRecord,assertConsistentOwner} from '../base44/shared/personalOwnership.ts';
import {allowFields,text,functionError} from '../base44/shared/personalValidation.ts';
import {loadBackendHandler} from './helpers/backend-handler.mjs';
function matches(row,query){return Object.entries(query).every(([key,value])=>{
 if(key==='$and')return value.every(part=>matches(row,part));if(key==='$or')return value.some(part=>matches(row,part));
 if(value&&typeof value==='object')return Object.entries(value).every(([op,expected])=>op==='$exists'?(row[key]!==undefined)===expected:op==='$nin'?!expected.includes(row[key]):op==='$regex'?new RegExp(expected).test(row[key] || ''):false);
 return row[key]===value;
});}
function fixture(){
 const user={id:'A',role:'user'},app={id:'app',job_id:'job',resume_version_id:'resume',metodo_envio:'manual',status:'pendente_aprovacao',owner_user_id:'A',user_id:'A',updated_date:'2026-11-05T01:00:00.000Z',codigo_aprovacao:'TEST-CODE',codigo_aprovacao_expira_em:new Date(Date.now()+3600000).toISOString()};
 const resume={id:'resume',job_id:'job',owner_user_id:'A',status_revisao:'pronto',referencia_pdf_privado:'private/synthetic.pdf'},job={id:'job',status:'ativa'},events=[];let writes=0,hook=null,failCompleted=false;
 const client={auth:{me:async()=>user},asServiceRole:{entities:{Application:{get:async()=>structuredClone(app),updateMany:async(query,patch)=>{if(!matches(app,query))return {updated:0};Object.assign(app,patch.$set);app.updated_date='2026-11-05T01:00:00.'+String(++writes).padStart(3,'0')+'Z';return {updated:1};}},ResumeVersion:{get:async()=>structuredClone(resume)},Job:{get:async()=>job},AuditLog:{create:async event=>{events.push(event);if(hook)await hook(event);if(failCompleted&&event.acao.endsWith('_concluida'))throw new Error('audit unavailable');return {id:'event-'+events.length};}}}}};
 const deps={createClientFromRequest:()=>client,authenticatedUser,approveApplication,rejectApplication,allowFields,text,functionError,ownedRecord,assertConsistentOwner,applicationSnapshotQuery,audit,auditCompleted};
 const handlers=Object.fromEntries(['approveApplication','rejectApplication','repairApplicationResume'].map(name=>[name,loadBackendHandler(new URL('../base44/functions/'+name+'/entry.ts',import.meta.url),deps)]));
 const invoke=async(name,body)=>{const r=await handlers[name](new Request('https://example.invalid',{method:'POST',body:JSON.stringify(body)}));return {status:r.status,data:await r.json()};};
 const body=()=>({application_id:app.id,resume_version_id:app.resume_version_id,metodo_envio:app.metodo_envio,expected_updated_date:app.updated_date});
 return {client,user,app,resume,job,events,invoke,body,get writes(){return writes;},set hook(value){hook=value;},set failCompleted(value){failCompleted=value;}};
}
test('approval binds reviewed resume/channel, records metadata and consumes code without sending',async()=>{
 const f=fixture();const r=await f.invoke('approveApplication',f.body());assert.equal(r.status,200);assert.equal(r.data.application.status,'aprovado');assert.equal(r.data.audit_recorded,true);assert.ok(r.data.application.aprovado_em);assert.equal(r.data.application.codigo_aprovacao,null);assert.equal(r.data.application.codigo_aprovacao_expira_em,null);assert.equal(r.data.application.canal_aprovacao,'in_app');assert.equal(r.data.application.enviado_em,undefined);
 assert.equal(f.writes,1);assert.equal(f.events.filter(e=>e.acao==='aprovacao_concluida').length,1);assert.equal(JSON.stringify(f.events).includes('TEST-CODE'),false);
});
test('concurrent approve/approve and approve/reject have one state winner',async()=>{
 for(const other of [approveApplication,rejectApplication]){
  const f=fixture();const results=await Promise.allSettled([approveApplication(f.client,'A',{applicationId:'app'}),other(f.client,'A',{applicationId:'app'})]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.status===409).length,1);assert.equal(f.writes,1);assert.ok(['aprovado','recusado'].includes(f.app.status));
 }
});
test('stale dialog snapshot or concurrent repair cannot approve a different resume/channel',async()=>{
 const f=fixture(),body=f.body();f.app.resume_version_id='new';assert.equal((await f.invoke('approveApplication',body)).status,409);assert.equal(f.writes,0);
 const g=fixture();g.hook=event=>{if(event.acao==='aprovacao_solicitada'){g.app.resume_version_id='new';g.app.metodo_envio='gmail';}};
 await assert.rejects(approveApplication(g.client,'A',{applicationId:'app'}),error=>error.status===409);assert.equal(g.writes,0);assert.equal(g.app.status,'pendente_aprovacao');
});
test('web caller cannot spoof WhatsApp channel or omit the reviewed version',async()=>{
 const f=fixture();assert.equal((await f.invoke('approveApplication',{...f.body(),canal:'whatsapp'})).status,400);assert.equal((await f.invoke('approveApplication',{application_id:'app'})).status,400);assert.equal(f.writes,0);
});
test('foreign owner, wrong job, unready resume, inactive job and invalid channel are blocked',async()=>{
 for(const variant of ['owner','job','resume','inactive','method']){
  const f=fixture();if(variant==='owner')f.app.owner_user_id='B';if(variant==='job')f.resume.job_id='other';if(variant==='resume')f.resume.status_revisao='rascunho';if(variant==='inactive')f.job.status='inativa';if(variant==='method')f.app.metodo_envio='whatsapp';
  assert.ok([400,403].includes((await f.invoke('approveApplication',f.body())).status),variant);assert.equal(f.writes,0);
 }
});
test('rejection is terminal for the approval flow and cannot rewrite sent or reserved records',async()=>{
 const f=fixture();const r=await f.invoke('rejectApplication',{...f.body(),motivo:'  Vaga não adequada  '});assert.equal(r.status,200);assert.equal(r.data.application.motivo_rejeicao,'Vaga não adequada');assert.equal(r.data.application.codigo_aprovacao,null);assert.ok(r.data.application.rejeitado_em);assert.equal((await f.invoke('approveApplication',f.body())).status,409);
 for(const patch of [{status:'enviado',enviado_em:new Date().toISOString()},{envio_token:'reserved'},{identificador_envio:'receipt'}]){const g=fixture();Object.assign(g.app,patch);assert.equal((await g.invoke('rejectApplication',{...g.body()})).status,409);assert.equal(g.writes,0);}
});
test('WhatsApp code must match and expire for approval and rejection; web decision does not depend on expired WhatsApp code',async()=>{
 for(const action of [approveApplication,rejectApplication]){
  for(const patch of [{codigo_aprovacao:'OTHER'},{codigo_aprovacao_expira_em:'invalid'},{codigo_aprovacao_expira_em:'2000-01-01T00:00:00Z'}]){const f=fixture();Object.assign(f.app,patch);await assert.rejects(action(f.client,'A',{applicationId:'app',canal:'whatsapp',approvalCode:'TEST-CODE'}),/inválido ou expirado/);assert.equal(f.writes,0);}
  const valid=fixture();assert.ok((await action(valid.client,'A',{applicationId:'app',canal:'whatsapp',approvalCode:'TEST-CODE'})).status);assert.equal(valid.app.codigo_aprovacao,null);
 }
 const web=fixture();web.app.codigo_aprovacao_expira_em='2000-01-01T00:00:00Z';assert.equal((await web.invoke('approveApplication',web.body())).status,200);
});
test('repair revokes prior approval, channel metadata and pending codes, and requires a new decision',async()=>{
 const f=fixture();Object.assign(f.app,{status:'aprovado',aprovado_em:'2026-11-05T01:00:00Z',canal_aprovacao:'whatsapp',origem_aprovacao:'whatsapp_webhook'});
 const r=await f.invoke('repairApplicationResume',{application_id:'app',resume_version_id:'resume',metodo_envio:'gmail'});assert.equal(r.status,200);assert.equal(r.data.application.status,'pendente_aprovacao');for(const key of ['aprovado_em','codigo_aprovacao','codigo_aprovacao_expira_em','canal_aprovacao','origem_aprovacao'])assert.equal(r.data.application[key],null,key);
});
test('delivery reservation rejects a stale resume snapshot after repair and reapproval',async()=>{
 const f=fixture();Object.assign(f.app,{status:'aprovado',metodo_envio:'gmail'});const stale=structuredClone(f.app);f.app.resume_version_id='new';f.app.updated_date='2026-11-05T02:00:00Z';await assert.rejects(claimDelivery(f.client,stale,'A','gmail','test@example.invalid'),/alterado/);assert.equal(f.app.envio_token,undefined);
});
test('audit completion failure is visible without reverting a saved approval',async()=>{
 const f=fixture();f.failCompleted=true;const r=await f.invoke('approveApplication',f.body());assert.equal(r.status,200);assert.equal(r.data.audit_recorded,false);assert.equal(r.data.application.status,'aprovado');assert.equal(f.writes,1);
});

test('manual dispatch cannot overwrite a repair that reset approval during processing',async()=>{
 const f=fixture();f.app.status='aprovado';f.hook=event=>{if(event.acao==='encaminhamento_manual_solicitado'){f.app.resume_version_id='new';f.app.status='pendente_aprovacao';}};
 await assert.rejects(dispatchApprovedApplication(f.client,'A',{applicationId:'app'}),error=>error.status===409);assert.equal(f.app.status,'pendente_aprovacao');assert.equal(f.writes,0);assert.equal(f.app.enviado_em,undefined);
});
