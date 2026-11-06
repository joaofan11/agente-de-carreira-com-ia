import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {seal,unseal,startEmailOAuth,finishEmailOAuth,emailProvider,digest} from '../base44/shared/emailOAuth.ts';
import {sendApprovedEmail,recruitmentEmail} from '../base44/shared/emailDelivery.ts';
import {getTwilioConfig,validateTwilioSignature} from '../base44/shared/twilioClient.ts';
import {loadBackendHandler} from './helpers/backend-handler.mjs';
import {applicationSnapshotQuery} from '../base44/shared/applicationSnapshot.ts';
const values={GOOGLE_OAUTH_CLIENT_ID:'google-client',GOOGLE_OAUTH_CLIENT_SECRET:'fake-secret',MICROSOFT_OAUTH_CLIENT_ID:'ms-client',MICROSOFT_OAUTH_CLIENT_SECRET:'fake-secret',EMAIL_OAUTH_CALLBACK_URL:'https://test.invalid/callback',EMAIL_TOKEN_ENCRYPTION_KEY:'synthetic-test-key-never-used-remotely-123456789',TWILIO_ACCOUNT_SID:'ACtest',TWILIO_AUTH_TOKEN:'fake-auth',TWILIO_WHATSAPP_FROM:'whatsapp:+5511999999999',TWILIO_WEBHOOK_URL:'https://test.invalid/webhook'};
const secrets={get:key=>values[key]};
test('OAuth ciphertext is randomized and bound to owner/provider; configuration never exposes secrets',async()=>{
 const a=await seal({refresh_token:'private-test'},'A:gmail',secrets),b=await seal({refresh_token:'private-test'},'A:gmail',secrets);assert.notEqual(a,b);assert.ok(!a.includes('private-test'));assert.equal((await unseal(a,'A:gmail',secrets)).refresh_token,'private-test');await assert.rejects(unseal(a,'B:gmail',secrets));await assert.rejects(unseal(a,'A:outlook',secrets));assert.equal(emailProvider('gmail',{get:()=>null}).configured,false);assert.throws(()=>emailProvider('other',secrets));
});
test('OAuth start stores hashed one-time state and encrypted PKCE verifier, returning only authorization URL',async()=>{
 let grant;const result=await startEmailOAuth({asServiceRole:{entities:{EmailOAuthState:{create:async value=>{grant=value;}}}}},'A','gmail',secrets);assert.deepEqual(Object.keys(result),['url']);const url=new URL(result.url);assert.equal(url.hostname,'accounts.google.com');assert.equal(url.searchParams.get('code_challenge_method'),'S256');assert.equal(grant.state_hash,await digest(url.searchParams.get('state')));assert.ok(!grant.verifier.includes(url.searchParams.get('code_challenge')));assert.equal(grant.owner_user_id,'A');assert.equal(grant.used,false);
});
test('OAuth callback consumes state once and saves only encrypted refresh grant for its owner',async()=>{
 const original=globalThis.fetch;let state;const accounts=[];
 const client={asServiceRole:{entities:{EmailOAuthState:{create:async fields=>{state={id:'state',...fields};},filter:async q=>({items:state&&!state.used&&state.state_hash===q.state_hash?[state]:[]}),updateMany:async()=>{if(state.used)return {updated:0};state.used=true;return {updated:1};},deleteMany:async()=>{}},EmailAccount:{create:async fields=>{accounts.push({id:'account',...fields});return accounts[0];},updateMany:async()=>({updated:0}),update:async(_,patch)=>Object.assign(accounts[0],patch)}}}};
 globalThis.fetch=async url=>String(url).includes('/token')?Response.json({access_token:'access-test',refresh_token:'refresh-test',scope:'https://www.googleapis.com/auth/gmail.send'}):Response.json({email:'sender@example.invalid'});
 try{const started=await startEmailOAuth(client,'A','gmail',secrets);const key=new URL(started.url).searchParams.get('state');const connected=await finishEmailOAuth(client,key,'auth-code',secrets);assert.equal(connected.email,'sender@example.invalid');assert.equal(accounts[0].owner_user_id,'A');assert.equal(accounts[0].active,true);assert.ok(!JSON.stringify(accounts).includes('refresh-test'));assert.equal((await unseal(accounts[0].token_ciphertext,'A:gmail',secrets)).refresh_token,'refresh-test');await assert.rejects(finishEmailOAuth(client,key,'auth-code',secrets),/utilizada/);}finally{globalThis.fetch=original;}
});
async function deliveryFixture(provider='gmail'){
 const app={id:'app',owner_user_id:'A',user_id:'A',status:'aprovado',job_id:'job',resume_version_id:'resume',metodo_envio:provider,destinatario_confirmado:'jobs@example.invalid',email_account_id:'account'};
 const account={id:'account',owner_user_id:'A',active:true,email:'sender@example.invalid',token_ciphertext:await seal({refresh_token:'refresh-test'},'A:'+provider,secrets)};
 let sends=0;const records=[];const resume={id:'resume',owner_user_id:'A',user_id:'A',job_id:'job',status_revisao:'pronto',referencia_pdf_privado:'private/resume.pdf',conteudo_estruturado:{contato:{nome:'Teste'}}};
 const client={asServiceRole:{entities:{Application:{get:async()=>app,updateMany:async(_,patch)=>{if(app.envio_token)return {updated:0};Object.assign(app,patch.$set);return {updated:1};},update:async(_,patch)=>Object.assign(app,patch)},ResumeVersion:{get:async()=>resume},Job:{get:async()=>({id:'job',status:'ativa',cargo:'Cargo teste'})},EmailAccount:{filter:async()=>({items:[account]}),get:async()=>account,updateMany:async()=>({updated:1})},AuditLog:{create:async value=>records.push(value)}},integrations:{Core:{CreateFileSignedUrl:async()=>({signed_url:'https://storage.invalid/file'})}}}};
 const fetcher=async(url,opts)=>{url=String(url);if(url.includes('/token'))return Response.json({access_token:'test-access'});if(url.includes('storage.invalid'))return new Response('%PDF-1.4\nsynthetic');sends++;assert.equal(opts.headers.Authorization,'Bearer test-access');const payload=JSON.parse(opts.body);if(provider==='gmail'){const mime=Buffer.from(payload.raw,'base64url').toString();assert.ok(mime.includes('From: sender@example.invalid'));assert.ok(mime.includes('To: jobs@example.invalid'));assert.ok(mime.includes('application/pdf'));return Response.json({id:'provider-message-id'});}assert.equal(payload.message.toRecipients[0].emailAddress.address,'jobs@example.invalid');assert.equal(payload.message.attachments.length,1);return new Response(null,{status:202});};
 return {app,resume,account,client,fetcher,records,get sends(){return sends;}};
}
test('approved Gmail and Outlook delivery uses connected owner account and exact private PDF, never login email',async()=>{
 const original=globalThis.fetch;try{for(const provider of ['gmail','outlook']){const f=await deliveryFixture(provider);globalThis.fetch=f.fetcher;const result=await sendApprovedEmail(f.client,'A','app',provider,'jobs@example.invalid',secrets);assert.equal(f.sends,1);assert.equal(result.application.status,'enviado');assert.ok(result.application.identificador_envio);assert.ok(result.message.includes('Não comprova'));await assert.rejects(sendApprovedEmail(f.client,'A','app',provider,'jobs@example.invalid',secrets));assert.equal(f.sends,1);}}finally{globalThis.fetch=original;}
});
test('delivery refuses different owner, recipient, account, demo and unapproved snapshots before send',async()=>{
 const original=globalThis.fetch;try{for(const change of ['owner','recipient','account','demo','pending']){const f=await deliveryFixture();globalThis.fetch=f.fetcher;if(change==='owner')f.app.owner_user_id='B';if(change==='recipient')f.app.destinatario_confirmado='other@example.invalid';if(change==='account')f.app.email_account_id='another';if(change==='demo')f.app.is_demo=true;if(change==='pending')f.app.status='pendente_aprovacao';await assert.rejects(sendApprovedEmail(f.client,'A','app','gmail','jobs@example.invalid',secrets));assert.equal(f.sends,0);}}finally{globalThis.fetch=original;}
 for(const value of ['a@example.invalid\r\nBcc:x@x.invalid','a,b@example.invalid','x',''])assert.equal(recruitmentEmail(value),null);
});
test('ambiguous mail timeout retains reservation and never confirms sent',async()=>{
 const original=globalThis.fetch;const f=await deliveryFixture();globalThis.fetch=async(url,opts)=>{if(String(url).includes('messages/send'))throw Error('timeout');return f.fetcher(url,opts);};
 try{await assert.rejects(sendApprovedEmail(f.client,'A','app','gmail',null,secrets));assert.ok(f.app.envio_token);assert.equal(f.app.status,'aprovado');await assert.rejects(sendApprovedEmail(f.client,'A','app','gmail',null,secrets));assert.equal(f.app.enviado_em,undefined);}finally{globalThis.fetch=original;}
});
test('Twilio signature uses sorted decoded parameters, not raw body or untrusted URL headers',async()=>{
 const body='To=whatsapp%3A%2B5511999999999&Body=APROVAR+ABCD1234&From=whatsapp%3A%2B5592999999999';
 const canonical=values.TWILIO_WEBHOOK_URL+'BodyAPROVAR ABCD1234Fromwhatsapp:+5592999999999Towhatsapp:+5511999999999';
 const signature=createHmac('sha1',values.TWILIO_AUTH_TOKEN).update(canonical).digest('base64');assert.equal(await validateTwilioSignature(values.TWILIO_AUTH_TOKEN,body,signature,values.TWILIO_WEBHOOK_URL),true);assert.equal(await validateTwilioSignature(values.TWILIO_AUTH_TOKEN,body+'x',signature,values.TWILIO_WEBHOOK_URL),false);assert.equal(await validateTwilioSignature(values.TWILIO_AUTH_TOKEN,body,signature,'https://evil.invalid'),false);
});
function webhookFixture(){
 const app={id:'app',owner_user_id:'A',status:'pendente_aprovacao',codigo_aprovacao:'ABCD1234',metodo_envio:'gmail',destinatario_confirmado:'jobs@example.invalid',email_account_id:'account',enviar_apos_aprovacao:true};let sends=0,decisions=0;const state={fail:false};
 const client={asServiceRole:{entities:{Application:{filter:async()=>({items:app.status==='pendente_aprovacao'?[app]:[]})}}}};
 const handler=loadBackendHandler(new URL('../base44/functions/whatsappWebhook/entry.ts',import.meta.url),{secrets,createClientFromRequest:()=>client,getTwilioConfig,validateTwilioSignature,findWhatsAppProfile:async()=>({userId:'A'}),canonicalWhatsAppPhone:value=>String(value).replace('whatsapp:',''),ownerQuery:()=>({owner_user_id:'A'}),approveApplication:async(_,id,params)=>{assert.equal(id,'A');assert.equal(params.approvalCode,'ABCD1234');app.status='aprovado';decisions++;return app;},rejectApplication:async()=>{app.status='recusado';decisions++;},sendApprovedEmail:async(_,id,appId,provider,to)=>{assert.equal(id,'A');assert.equal(appId,'app');assert.equal(provider,'gmail');assert.equal(to,app.destinatario_confirmado);sends++;if(state.fail)throw Error('failure');return {success:true};}});
 const invoke=async(action='APROVAR',valid=true)=>{const body=new URLSearchParams({AccountSid:'ACtest',To:values.TWILIO_WHATSAPP_FROM,From:'whatsapp:+5592999999999',Body:action+' ABCD1234'}).toString();const sorted=[...new URLSearchParams(body)].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+v).join('');const signature=createHmac('sha1',values.TWILIO_AUTH_TOKEN).update(values.TWILIO_WEBHOOK_URL+sorted).digest('base64');return handler(new Request('https://irrelevant.invalid',{method:'POST',headers:{'X-Twilio-Signature':valid?signature:'invalid','X-Base44-App-Url':'https://evil.invalid'},body}));};
 return {app,state,invoke,get sends(){return sends;},get decisions(){return decisions;}};
}
test('signed WhatsApp approval triggers one bound delivery; duplicate command and invalid signature cannot resend',async()=>{const f=webhookFixture();assert.equal((await f.invoke('APROVAR',false)).status,403);assert.equal(f.sends,0);assert.ok((await (await f.invoke()).text()).includes('aceito'));await f.invoke();assert.equal(f.sends,1);assert.equal(f.decisions,1);});
test('WhatsApp refusal sends no CV and delivery failure does not undo approval',async()=>{const refused=webhookFixture();await refused.invoke('RECUSAR');assert.equal(refused.app.status,'recusado');assert.equal(refused.sends,0);const f=webhookFixture();f.state.fail=true;assert.ok((await (await f.invoke()).text()).includes('não foi confirmado'));assert.equal(f.app.status,'aprovado');});
test('snapshot reservation includes reviewed recipient and email account',()=>{const q=applicationSnapshotQuery({id:'a',status:'aprovado',destinatario_confirmado:'jobs@example.invalid',email_account_id:'account'},'A');assert.equal(q.destinatario_confirmado,'jobs@example.invalid');assert.equal(q.email_account_id,'account');});
import {automationActor} from '../base44/shared/automationScheduler.ts';
test('scheduled processing requires a time-limited signature bound to function and body',async()=>{
 const key='scheduler-test-signing-secret-1234567890',clock=String(Date.now()),body='{}',name='runCandidateProcessing';
 const signature=createHmac('sha256',key).update(clock+'\n'+name+'\n'+body).digest('hex');const sdk={auth:{me:async()=>{throw Error('anonymous');}}},cfg={get:()=>key};
 const req=new Request('https://test.invalid',{method:'POST',body,headers:{'X-Anexa-Timestamp':clock,'X-Anexa-Signature':signature}});
 assert.equal((await automationActor(sdk,req,cfg,name)).origin,'agendado');assert.equal(await automationActor(sdk,req,cfg,'runJobCollection'),null);
 assert.equal(await automationActor(sdk,new Request('https://test.invalid',{method:'POST',body}),cfg,name),null);
 const stale=String(Date.now()-600000);assert.equal(await automationActor(sdk,new Request('https://test.invalid',{method:'POST',body,headers:{'X-Anexa-Timestamp':stale,'X-Anexa-Signature':signature}}),cfg,name),null);
});
test('expired OAuth state fails before token exchange',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('unexpected');};
 const client={asServiceRole:{entities:{EmailOAuthState:{filter:async()=>({items:[{expires_at:new Date(Date.now()-1).toISOString()}]})}}}};
 try{await assert.rejects(finishEmailOAuth(client,'state','code',secrets),/expirada/);assert.equal(calls,0);}finally{globalThis.fetch=original;}
});
