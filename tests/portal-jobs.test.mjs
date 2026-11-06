import test from 'node:test';
import assert from 'node:assert/strict';
import {portalLink,normalizePortalJobs,fetchPortalJobs} from '../base44/shared/portalJobs.ts';
import {jobSource} from '../src/lib/jobSource.js';
const raw={title:'Estágio em tecnologia',company_name:'Empresa teste',description:'Descrição original',location:'Manaus',apply_options:[{link:'https://empresa.gupy.io/jobs/123?utm_source=google'},{link:'https://br.linkedin.com/jobs/view/456'},{link:'https://www.infojobs.com.br/vaga-de-estagio-em-amazonas__123.aspx'}]};
test('preserves actual portal links and content with namespaced identifiers',()=>{
 const jobs=normalizePortalJobs(raw);assert.equal(jobs.length,3);assert.deepEqual(jobs.map(j=>jobSource(j).label),['Gupy','LinkedIn','InfoJobs']);assert.equal(jobs[0].descricao,raw.description);assert.equal(jobs[0].modalidade,'nao_informada');assert.equal(jobs[0].data_publicacao,undefined);assert.equal(jobs[0].url_original,'https://empresa.gupy.io/jobs/123');assert.ok(jobs[0].source_id.startsWith('gupy:'));assert.ok(jobs.every(j=>j.metodo_candidatura==='link_externo'));
});
test('rejects spoofed domains, scripts, redirect paths and senior results',()=>{
 for(const url of ['https://gupy.io.attacker.test/jobs/1','javascript:alert(1)','https://linkedin.com/redirect?url=x','https://user:pass@empresa.gupy.io/jobs/1','https://linkedin.com:444/jobs/view/1','https://infojobs.com.br/'])assert.equal(portalLink(url),null);
 assert.deepEqual(normalizePortalJobs({...raw,title:'Desenvolvedor sênior'}),[]);assert.deepEqual(normalizePortalJobs({...raw,company_name:''}),[]);assert.equal(jobSource({fonte:'api_externa',url_original:'javascript:alert(1)'}).url,null);
});
test('deduplicates application options and never treats unknown external source as Jobicy',()=>{
 assert.equal(normalizePortalJobs({...raw,apply_options:[raw.apply_options[0],raw.apply_options[0]]}).length,1);
 assert.equal(jobSource({fonte:'api_externa',url_original:'https://example.com/vaga'}).label,'Site da vaga');assert.equal(jobSource({url_original:'https://jobicy.com/jobs/1'}).label,'Jobicy');
});
test('missing API key does not request or pretend a successful portal search',async()=>{
 let calls=0;const r=await fetchPortalJobs({fetcher:()=>calls++});assert.equal(calls,0);assert.equal(r.status,'nao_configurado');
});
test('provider request uses only query/location and handles valid, empty, invalid and error results',async()=>{
 let url;const fetcher=async u=>{url=new URL(u);return Response.json({jobs_results:[raw]});};const r=await fetchPortalJobs({apiKey:'fake',query:'estágio',location:'Manaus',fetcher});assert.equal(r.jobs.length,3);assert.equal(url.searchParams.get('engine'),'google_jobs');assert.equal(url.searchParams.get('q'),'estágio');assert.equal(url.searchParams.get('location'),'Manaus');
 for(const fetcher of [async()=>new Response('',{status:429}),async()=>Response.json({error:'secret error'}),async()=>Response.json({}),async()=>{throw Error('sensitive')}])await assert.rejects(fetchPortalJobs({apiKey:'fake',fetcher}),e=>!e.message.includes('sensitive')&&!e.message.includes('secret error'));
 assert.equal((await fetchPortalJobs({apiKey:'fake',fetcher:async()=>Response.json({jobs_results:[]})})).jobs.length,0);
});
import {collectJobs} from '../base44/shared/collectJobs.ts';
import {loadBackendHandler} from './helpers/backend-handler.mjs';
import {allowFields,text,functionError} from '../base44/shared/personalValidation.ts';
test('collector preserves Jobicy when portal credential is missing and saves no fabricated portal jobs',async()=>{
 const originalFetch=globalThis.fetch,originalDeno=globalThis.Deno;let created=[];
 globalThis.Deno={env:{get:()=>undefined}};globalThis.fetch=async()=>Response.json({jobs:[{id:123,jobTitle:'Intern',jobLevel:'Intern',companyName:'Teste',url:'https://jobicy.com/jobs/123'}]});
 try{const r=await collectJobs({asServiceRole:{entities:{Job:{filter:async()=>({items:[]}),bulkCreate:async jobs=>{created=jobs;return jobs;}}}}});assert.equal(r.saved,1);assert.equal(created[0].origem_portal,'jobicy');assert.equal(r.sources[1].status,'nao_configurado');assert.equal(r.warnings.length,1);}finally{globalThis.fetch=originalFetch;globalThis.Deno=originalDeno;}
});
test('collector does not claim success when all sources fail',async()=>{
 const originalFetch=globalThis.fetch,originalDeno=globalThis.Deno;globalThis.Deno={env:{get:()=>undefined}};globalThis.fetch=async()=>{throw Error('offline');};
 try{await assert.rejects(collectJobs({}),/Nenhuma fonte/);}finally{globalThis.fetch=originalFetch;globalThis.Deno=originalDeno;}
});
test('search endpoint requires admin before collection and validates search text',async()=>{
 let user=null,calls=0;
 const handler=loadBackendHandler(new URL('../base44/functions/searchJobs/entry.ts',import.meta.url),{createClientFromRequest:()=>({}),authenticatedUser:async()=>user,collectJobs:async(_,args)=>{calls++;return args;},allowFields,text,functionError});
 const request=body=>new Request('https://test.invalid',{method:'POST',body:JSON.stringify(body)});
 assert.equal((await handler(request({}))).status,401);user={id:'A',role:'user'};assert.equal((await handler(request({}))).status,403);assert.equal(calls,0);user.role='admin';assert.equal((await handler(request({query:'x'.repeat(201)}))).status,400);assert.equal(calls,0);
 const r=await handler(request({query:'Estágio',location:'Manaus',pages:99}));assert.equal(r.status,200);assert.deepEqual(await r.json(),{query:'Estágio',location:'Manaus',pages:3});
});
