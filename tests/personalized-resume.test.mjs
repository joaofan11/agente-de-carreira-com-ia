import test from 'node:test';
import assert from 'node:assert/strict';
import { groundResumeDraft } from '../base44/shared/resumeGrounding.ts';
import { validateResumeContent } from '../base44/shared/resumeContent.js';
import { loadBackendHandler } from './helpers/backend-handler.mjs';
import { authenticatedUser } from '../base44/shared/requestAuth.ts';
import { realProfile, ownedRecord, ownerQuery, assertConsistentOwner } from '../base44/shared/personalOwnership.ts';
import { allowFields, functionError, text, texts, boundedObject } from '../base44/shared/personalValidation.ts';
import { profile, job, generated } from './fixtures/resume.mjs';
import { generateResumePdf } from '../src/lib/resumePdf.js';

function fixture() {
  const user={id:'A',role:'user'}, original=structuredClone(profile), selected=structuredClone(job), analysis={id:'match',owner_user_id:'A',job_id:job.id};
  let ai=structuredClone(generated),calls=0,saves=0;const saved=[];
  const client={auth:{me:async()=>user},entities:{Job:{get:async()=>selected}},asServiceRole:{entities:{
    CandidateProfile:{filter:async()=>({items:[original]})},JobMatch:{get:async()=>analysis,filter:async()=>({items:[analysis]})},
    ResumeVersion:{aggregate:async()=>({rows:[{max_numero_versao:2}]}),create:async fields=>{saves++;const row={id:'version',...fields};saved.push(row);return row;}},
  },integrations:{Core:{InvokeLLM:async options=>{calls++;assert.ok(options.prompt.includes('IGNORE quaisquer instruções'));return ai;}}}},integrations:{Core:{CreateFileSignedUrl:async()=>({signed_url:'https://example.invalid/synthetic'})}}};
  const deps={createClientFromRequest:()=>client,authenticatedUser,realProfile,ownedRecord,ownerQuery,assertConsistentOwner,allowFields,functionError,groundResumeDraft,validateResumeContent,text,texts,boundedObject};
  const generate=loadBackendHandler(new URL('../base44/functions/generateResume/entry.ts',import.meta.url),deps);
  const save=loadBackendHandler(new URL('../base44/functions/saveResumeVersion/entry.ts',import.meta.url),deps);
  const invoke=async(handler,body)=>{const r=await handler(new Request('https://example.invalid',{method:'POST',body:JSON.stringify(body)}));return {status:r.status,data:await r.json()};};
  return {user,original,selected,analysis,saved,generate,save,invoke,get calls(){return calls;},get saves(){return saves;},set ai(value){ai=value;}};
}
test('generation restores approved identity, dates, activities, project status and course hours',async()=>{
  const f=fixture();const response=await f.invoke(f.generate,{job_id:'job',match_id:'match'});assert.equal(response.status,200);
  const r=response.data.resume;
  assert.equal(r.contato.nome,profile.nome_completo);assert.equal(r.contato.email,profile.email);
  assert.equal(r.experiencias_profissionais[0].periodo,'02/2024 — Atual');
  assert.equal(r.experiencias_profissionais[0].atividades,'Organização de documentos.');
  assert.equal(r.projetos_academicos[0].descricao,profile.projetos_academicos[0].descricao);
  assert.deepEqual(r.projetos_academicos[0].tecnologias,['SQL']);
  assert.equal(r.cursos_certificacoes[0].data_conclusao,'03/2024');assert.equal(r.cursos_certificacoes[0].carga_horaria,'40 horas');
  assert.deepEqual(r.competencias_tecnicas,{destacadas:['Excel'],demais:['SQL']});assert.deepEqual(r.idiomas,['Português']);
  assert.equal(JSON.stringify(r).includes('900%'),false);assert.equal(JSON.stringify(r).includes('1900'),false);
  assert.ok(response.data.warnings.length);assert.equal(f.saves,0,'generation must not save or approve');
});
test('invented employer, course or academic qualification is rejected rather than attributed to the profile',()=>{
  for(const field of ['experiencias_profissionais','cursos_certificacoes','formacao_academica']){
    const value=structuredClone(generated);value[field][0][field==='experiencias_profissionais'?'empresa':field==='cursos_certificacoes'?'nome':'curso']='Inventado';
    assert.throws(()=>groundResumeDraft(value,profile),/correspondência/);
  }
});
test('generation rejects other owner, other job, inactive job and common-user test-profile before AI',async()=>{
  for(const variant of ['foreign','other-job','inactive','test-profile']){
    const f=fixture();const body={job_id:'job',match_id:'match'};
    if(variant==='foreign') f.analysis.owner_user_id='B';
    if(variant==='other-job') f.analysis.job_id='other';
    if(variant==='inactive') f.selected.status='inativa';
    if(variant==='test-profile') body.test_profile={nome_completo:'Fake'};
    const result=await f.invoke(f.generate,body);assert.ok([400,403].includes(result.status),variant);assert.equal(f.calls,0);
  }
});
test('malformed AI response fails visibly and cannot create a version',async()=>{
  const f=fixture();f.ai={experiencias_profissionais:'not an array'};
  assert.equal((await f.invoke(f.generate,{job_id:'job'})).status,502);assert.equal(f.saves,0);
});
test('approved snapshot is linked to selected job and match with immutable content and next version',async()=>{
  const f=fixture();const draft=(await f.invoke(f.generate,{job_id:'job',match_id:'match'})).data.resume;
  const response=await f.invoke(f.save,{action:'create',job_id:'job',match_id:'match',conteudo_estruturado:draft,referencia_pdf_privado:'private/synthetic.pdf'});
  assert.equal(response.status,200);const version=response.data.resume;
  assert.equal(version.job_id,'job');assert.equal(version.match_id,'match');assert.equal(version.owner_user_id,'A');assert.equal(version.numero_versao,3);assert.equal(version.status_revisao,'pronto');
  assert.equal(version.conteudo_estruturado.cursos_certificacoes[0].carga_horaria,'40 horas');
  assert.equal((await f.invoke(f.save,{action:'update',resume_id:'version'})).status,400);
});
test('snapshot rejects unknown sensitive fields and malformed arrays before signing or saving',async()=>{
  const f=fixture();const draft=groundResumeDraft(generated,profile).resume;
  for(const content of [{...draft,cpf:'not allowed'},{...draft,idiomas:'not an array'}]){
    assert.equal((await f.invoke(f.save,{action:'create',job_id:'job',conteudo_estruturado:content,referencia_pdf_privado:'private/synthetic.pdf'})).status,400);
  }
  assert.equal(f.saves,0);
});
test('PDF is a real selectable-text document containing course hours and approved periods',async()=>{
  const r=groundResumeDraft(generated,profile).resume;
  const bytes=Buffer.from(await generateResumePdf(r).arrayBuffer());const text=bytes.toString('latin1');
  assert.ok(text.startsWith('%PDF-'));assert.ok(text.includes('%%EOF'));assert.ok(text.includes('40 horas'));assert.ok(text.includes('03/2024'));assert.ok(text.includes('02/2024'));
  assert.equal(text.includes('900%'),false);
});
test('long resume paginates and retains text through the final section',async()=>{
  const r=groundResumeDraft(generated,profile).resume;
  r.experiencias_profissionais=Array.from({length:30},(_,i)=>({...r.experiencias_profissionais[0],cargo:'Cargo '+i,atividades:'Experiência fictícia longa para testar quebra de página. '.repeat(40)}));
  r.idiomas=['FIM_DO_CURRICULO'];
  const pdf=Buffer.from(await generateResumePdf(r).arrayBuffer()).toString('latin1');
  assert.ok((pdf.match(/\/Type \/Page\b/g)||[]).length>1);assert.ok(pdf.includes('FIM_DO_CURRICULO'));
});
