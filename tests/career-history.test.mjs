import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCareerHistory,computeCareerEvolution,confirmedSend,deriveCareerStatus,hydrateCareerReferences,recordsForMode} from '../src/lib/careerHistory.js';
import {loadBackendHandler} from './helpers/backend-handler.mjs';
import {authenticatedUser} from '../base44/shared/requestAuth.ts';
import {ownerQuery} from '../base44/shared/personalOwnership.ts';
import {allowFields,functionError,text} from '../base44/shared/personalValidation.ts';
const proof={status:'enviado',enviado_em:'2026-11-05T00:30:00Z',identificador_envio:'synthetic-receipt'};

test('history preserves all applications and the exact resume used, even with a newer unused version',()=>{
 const records={jobs:[{id:'job',empresa:'Empresa fictícia',cargo:'Cargo fictício'}],matches:[{id:'match',job_id:'job',score:60,nivel_compatibilidade:'medio',data_analise:'2026-11-01T10:00:00Z'}],resumes:[{id:'old',job_id:'job',numero_versao:1,criado_em:'2026-11-01T12:00:00Z',updated_date:'2026-11-07T12:00:00Z'},{id:'new',job_id:'job',numero_versao:2,criado_em:'2026-11-04T12:00:00Z'}],applications:[{id:'a',job_id:'job',resume_version_id:'old',...proof},{id:'b',job_id:'job',resume_version_id:'old',status:'recusado',rejeitado_em:'2026-11-06T10:00:00Z'}]};
 const history=buildCareerHistory(records);assert.equal(history.length,3);assert.equal(new Set(history.map(row=>row.id)).size,3);
 assert.equal(history.find(row=>row.applicationId==='a').curriculoUtilizado,'v1');assert.equal(history.find(row=>!row.applicationId).curriculoUtilizado,'v2');
 assert.equal(history[0].applicationId,'b');assert.equal(history[0].status,'RECUSADA');
});
test('missing linked resume is never replaced with the latest version of the same job',()=>{
 const history=buildCareerHistory({resumes:[{id:'new',job_id:'job',numero_versao:8}],applications:[{id:'app',job_id:'job',resume_version_id:'missing',status:'pendente_aprovacao'}]});
 const app=history.find(row=>row.applicationId==='app');assert.equal(app.curriculoUtilizado,'Versão indisponível');assert.equal(app.status,'AGUARDANDO_APROVACAO');
});
test('confirmed send needs receipt, valid date, correct state and no error; manual action is not sent',()=>{
 assert.equal(confirmedSend(proof),true);
 for(const patch of [{identificador_envio:''},{enviado_em:'invalid'},{erro:'Falha'},{status:'acao_manual_necessaria'}])assert.equal(confirmedSend({...proof,...patch}),false);
 assert.equal(deriveCareerStatus(null,null,{status:'enviado'}),'ENVIO_SEM_CONFIRMACAO');
 assert.equal(deriveCareerStatus(null,null,{status:'aprovado',envio_token:'synthetic'}),'ENVIO_EM_ANDAMENTO');
 assert.equal(deriveCareerStatus(null,null,{status:'acao_manual_necessaria'}),'ACAO_MANUAL_NECESSARIA');
});
test('evolution includes confirmed interviews, excludes invalid receipts/dates and groups in device timezone',()=>{
 const data=computeCareerEvolution([proof,{...proof,status:'entrevista'},{...proof,enviado_em:'invalid'},{...proof,identificador_envio:''},{...proof,erro:'provider failed'}],'America/La_Paz');
 assert.deepEqual(data,[{date:'04/11',count:2}]);
});
test('references hydrate inactive jobs and older resumes through user-scoped reads',async()=>{
 const calls=[];const client={entities:{Job:{get:async id=>{calls.push('job:'+id);return {id,status:'inativa',cargo:'Vaga encerrada'};}},ResumeVersion:{get:async id=>{calls.push('resume:'+id);return {id,job_id:'old-job',numero_versao:1};}}}};
 const result=await hydrateCareerReferences(client,{applications:[{id:'a',job_id:'old-job',resume_version_id:'old'}],resumes:[],jobs:[]});
 assert.equal(result.resumes[0].numero_versao,1);assert.equal(result.jobs[0].status,'inativa');assert.deepEqual(calls,['resume:old','job:old-job']);
});
test('unavailable references stay unavailable; infrastructure failures do not become empty history',async()=>{
 const unavailable={entities:{Job:{get:async()=>{throw Object.assign(new Error('missing'),{status:404});}},ResumeVersion:{get:async()=>{throw Object.assign(new Error('denied'),{status:403});}}}};
 const input={applications:[{id:'a',job_id:'j',resume_version_id:'r'}]};
 assert.equal((await hydrateCareerReferences(unavailable,input)).jobs.length,0);
 unavailable.entities.Job.get=async()=>{throw Object.assign(new Error('network'),{status:503});};
 await assert.rejects(hydrateCareerReferences(unavailable,input),/network/);
});
test('real and demo mode remain separate even if an upstream response contains both',()=>{
 const rows=[{id:'real'},{id:'demo',is_demo:true}];
 assert.deepEqual(recordsForMode(rows,false).map(row=>row.id),['real']);assert.deepEqual(recordsForMode(rows,true).map(row=>row.id),['demo']);
});

function match(row,query) {
 return Object.entries(query).every(([key,rule])=>{
  if(key==='$and')return rule.every(part=>match(row,part));
  if(key==='$or')return rule.some(part=>match(row,part));
  const value=row[key];
  if(rule&&typeof rule==='object')return Object.entries(rule).every(([op,expected])=>op==='$exists'?(value!==undefined)===expected:op==='$ne'?value!==expected:op==='$in'?expected.includes(value):op==='$nin'?!expected.includes(value):op==='$regex'?new RegExp(expected).test(value || ''):false);
  return value===rule;
 });
}
function statsFixture() {
 const user={id:'A'}, matches=[{owner_user_id:'A',nivel_compatibilidade:'alto'},{owner_user_id:'A',nivel_compatibilidade:'baixo'},{owner_user_id:'B',nivel_compatibilidade:'alto'},{owner_user_id:'A',is_demo:true,nivel_compatibilidade:'alto'}];
 const apps=[{owner_user_id:'A',...proof},{owner_user_id:'A',status:'enviado'},{owner_user_id:'A',status:'pendente_aprovacao'},{owner_user_id:'A',status:'acao_manual_necessaria'},{owner_user_id:'A',status:'aprovado',erro:'Falha'},{owner_user_id:'B',...proof},{owner_user_id:'A',is_demo:true,...proof}];
 const entity=rows=>({aggregate:async({query,groupBy})=>{const groups={};rows.filter(row=>match(row,query)).forEach(row=>{groups[row[groupBy]]=(groups[row[groupBy]]||0)+1;});return {rows:Object.entries(groups).map(([key,count])=>({[groupBy]:key,count}))};},count:async query=>rows.filter(row=>match(row,query)).length,filter:async query=>({items:rows.filter(row=>match(row,query))})});
 const client={auth:{me:async()=>user},asServiceRole:{entities:{JobMatch:entity(matches),Application:entity(apps),CandidateProfile:entity(matches)}}};
 const deps={createClientFromRequest:()=>client,authenticatedUser,ownerQuery,allowFields,functionError,text};
 const stats=loadBackendHandler(new URL('../base44/functions/getCareerDashboardStats/entry.ts',import.meta.url),deps);
 const list=loadBackendHandler(new URL('../base44/functions/listPersonalRecords/entry.ts',import.meta.url),deps);
 const invoke=async(fn,body)=>{const r=await fn(new Request('https://example.invalid',{method:'POST',body:JSON.stringify(body)}));return {status:r.status,data:await r.json()};};
 return {user,stats,list,invoke};
}
test('dashboard server aggregates only authenticated owner and selected mode; unconfirmed sends do not count',async()=>{
 const f=statsFixture();const real=await f.invoke(f.stats,{demo:false});assert.equal(real.status,200);
 assert.deepEqual(real.data.indicators,{totalAnalyzed:2,strongMatches:1,recused:0,pendingApproval:1,errors:1,sent:1});
 const demo=await f.invoke(f.stats,{demo:true});assert.equal(demo.data.indicators.totalAnalyzed,1);assert.equal(demo.data.indicators.sent,1);
 assert.equal((await f.invoke(f.stats,{demo:'true'})).status,400);
 assert.equal((await f.invoke(f.stats,{demo:false,owner_user_id:'B'})).status,400);
});
test('demo-only personal list is enforced server-side without changing legacy include-demo behavior',async()=>{
 const f=statsFixture();
 const only=await f.invoke(f.list,{kind:'profile',include_demo:true,demo_only:true});assert.equal(only.data.items.length,1);assert.ok(only.data.items.every(row=>row.is_demo===true&&row.owner_user_id==='A'));
 const real=await f.invoke(f.list,{kind:'profile'});assert.equal(real.data.items.length,2);
 const both=await f.invoke(f.list,{kind:'profile',include_demo:true});assert.equal(both.data.items.length,3);
 assert.equal((await f.invoke(f.list,{kind:'profile',demo_only:'true'})).status,400);
});

test('historical resume callback can enforce owner-filtered RPC even when client has broad admin reads',async()=>{
 let directReads=0;
 const client={entities:{ResumeVersion:{get:async()=>{directReads++;return {id:'foreign',numero_versao:9};}},Job:{get:async()=>({id:'j'})}}};
 const records=await hydrateCareerReferences(client,{applications:[{id:'a',job_id:'j',resume_version_id:'foreign'}]},async()=>null);
 assert.equal(directReads,0);assert.equal(records.resumes.length,0);
 assert.equal(buildCareerHistory(records)[0].curriculoUtilizado,'Versão indisponível');
});
