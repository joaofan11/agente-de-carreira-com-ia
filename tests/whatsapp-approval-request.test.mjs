import test from 'node:test';
import assert from 'node:assert/strict';
import {loadSourceModule} from './helpers/backend-handler.mjs';
import {ownedRecord,assertConsistentOwner,ownerQuery} from '../base44/shared/personalOwnership.ts';
import {applicationSnapshotQuery} from '../base44/shared/applicationSnapshot.ts';
import {canonicalWhatsAppPhone} from '../base44/shared/whatsappIdentity.ts';
import {recruitmentEmail} from '../base44/shared/emailDelivery.ts';
function fixture(){
 const app={id:'app',owner_user_id:'A',user_id:'A',status:'pendente_aprovacao',metodo_envio:'gmail',job_id:'job',resume_version_id:'resume'};let sent=0,query,patch,variables;const state={enabled:true,conflict:false};
 const client={asServiceRole:{entities:{Application:{get:async()=>app,updateMany:async(q,p)=>{query=q;patch=p.$set;return {updated:state.conflict?0:1};}},ResumeVersion:{get:async()=>({owner_user_id:'A',job_id:'job',status_revisao:'pronto',referencia_pdf_privado:'private/cv.pdf',numero_versao:2})},Job:{get:async()=>({id:'job',status:'ativa',cargo:'Cargo',empresa:'Empresa'})},UserIntegration:{filter:async()=>({items:[{notificacoes_ativas:state.enabled}]})},EmailAccount:{filter:async()=>({items:[{id:'account',email:'sender@example.invalid'}]})},Notification:{create:async()=>{if(state.logFail)throw Error('log failure');}}}}};
 const run=loadSourceModule(new URL('../base44/shared/requestWhatsAppApproval.ts',import.meta.url),{realProfile:async()=>({telefone_whatsapp:'+5592999999999'}),ownedRecord,assertConsistentOwner,ownerQuery,canonicalWhatsAppPhone,applicationSnapshotQuery,getTwilioConfig:()=>({configured:true,webhookUrl:'https://test.invalid'}),generateApprovalCode:()=> 'ABCD1234',sendWhatsAppMessage:async(_,to,msg,options)=>{sent++;variables=options.variables;assert.equal(to,'whatsapp:+5592999999999');assert.ok(msg.includes('APROVAR ABCD1234'));return {success:true,data:{sid:'SMtest'}};},recruitmentEmail,emailProvider:()=>({configured:true})},'requestWhatsAppApproval');
 return {app,state,run:()=>run(client,'A','app','jobs@example.invalid',{}),get sent(){return sent;},get query(){return query;},get patch(){return patch;},get variables(){return variables;}};
}
test('WhatsApp request binds recipient/account/version and describes exact approval to provider',async()=>{const f=fixture();await f.run();assert.equal(f.sent,1);assert.equal(f.query.resume_version_id,'resume');assert.equal(f.patch.destinatario_confirmado,'jobs@example.invalid');assert.equal(f.patch.email_account_id,'account');assert.equal(f.patch.enviar_apos_aprovacao,true);assert.equal(f.variables['3'],'2');assert.equal(f.variables['4'],'sender@example.invalid');assert.equal(f.variables['5'],'jobs@example.invalid');assert.equal(f.variables['8'],'gmail');});
test('disabled notifications, foreign application and changed snapshot cause no outgoing request',async()=>{for(const kind of ['disabled','foreign','conflict']){const f=fixture();if(kind==='disabled')f.state.enabled=false;if(kind==='foreign')f.app.owner_user_id='B';if(kind==='conflict')f.state.conflict=true;await assert.rejects(f.run());assert.equal(f.sent,0);}});

test('notification persistence failure does not mask a provider-accepted request or cause retry',async()=>{const f=fixture();f.state.logFail=true;const r=await f.run();assert.equal(r.success,true);assert.equal(r.notification_recorded,false);assert.equal(f.sent,1);});
