import test from 'node:test';
import assert from 'node:assert/strict';
import {loadBackendHandler} from './helpers/backend-handler.mjs';
import {assertConsistentOwner} from '../base44/shared/personalOwnership.ts';
import {applicationSnapshotQuery} from '../base44/shared/applicationSnapshot.ts';
import {allowFields,text,functionError} from '../base44/shared/personalValidation.ts';
function fixture(){
 const state={user:{id:'A'},app:{id:'app',owner_user_id:'A',user_id:'A',created_by_id:'service_test',status:'recusado',job_id:'job',resume_version_id:'resume',metodo_envio:'manual'},deleted:0,query:null,audit:true};
 const client={asServiceRole:{entities:{Application:{get:async()=>{if(state.error)throw state.error;return state.app;},deleteMany:async query=>{state.query=query;state.deleted++;return {deleted:state.conflict?0:1};}}}}};
 const handler=loadBackendHandler(new URL('../base44/functions/removeApplication/entry.ts',import.meta.url),{createClientFromRequest:()=>client,authenticatedUser:async()=>state.user,assertConsistentOwner,applicationSnapshotQuery,audit:async()=>{},auditCompleted:async()=>state.audit,allowFields,text,functionError});
 state.invoke=async(body={application_id:'app'})=>{const response=await handler(new Request('https://test.invalid',{method:'POST',body:JSON.stringify(body)}));return {status:response.status,data:await response.json()};};return state;
}
test('removes service-created owned refused application with conditional ownership and state query',async()=>{const f=fixture();const r=await f.invoke();assert.equal(r.status,200);assert.equal(r.data.removed,true);assert.equal(f.query.id,'app');assert.equal(f.query.status,'recusado');assert.equal(f.query.resume_version_id,'resume');assert.ok(JSON.stringify(f.query).includes('owner_user_id'));assert.ok(JSON.stringify(f.query).includes('envio_iniciado_em'));});
test('authentication and ownership cannot be forged',async()=>{const f=fixture();f.user=null;assert.equal((await f.invoke()).status,401);f.user={id:'B'};assert.equal((await f.invoke()).status,403);f.user={id:'A'};assert.equal((await f.invoke({application_id:'app',user_id:'A'})).status,400);assert.equal(f.deleted,0);});
test('sent, approved, pending and reserved applications cannot be removed',async()=>{for(const status of ['aprovado','pendente_aprovacao','enviado','cancelada_duplicada']){const f=fixture();f.app.status=status;assert.equal((await f.invoke()).status,409);assert.equal(f.deleted,0);}for(const field of ['envio_token','envio_iniciado_em','enviado_em','identificador_envio','comprovante']){const f=fixture();f.app[field]='present';assert.equal((await f.invoke()).status,409);assert.equal(f.deleted,0);}});
test('missing record is idempotent while infrastructure failures remain errors',async()=>{const f=fixture();f.error=Object.assign(Error('not found'),{status:404});assert.equal((await f.invoke()).data.already_absent,true);f.error=Object.assign(Error('offline'),{status:503});assert.equal((await f.invoke()).status,503);assert.equal(f.deleted,0);});
test('concurrent change does not falsely confirm removal and audit failure does not undo removal',async()=>{const f=fixture();f.conflict=true;assert.equal((await f.invoke()).status,409);f.conflict=false;f.audit=false;const r=await f.invoke();assert.equal(r.data.removed,true);assert.equal(r.data.audit_recorded,false);});
