import test from 'node:test';
import assert from 'node:assert/strict';
import { componentHarness } from './helpers/component-harness.mjs';
import { groundResumeDraft } from '../base44/shared/resumeGrounding.ts';
import { validateResumeContent } from '../base44/shared/resumeContent.js';
import { generateResumePdf } from '../src/lib/resumePdf.js';
import { profile,job,generated } from './fixtures/resume.mjs';
const controls=['Button','Card','CardContent','Tabs','TabsList','TabsTrigger','TabsContent','ResumeView','OriginalProfile','ResumeEditor','Sparkles','Loader2','Download','Pencil','Check','Send'];
const ui=Object.fromEntries(controls.map(name=>[name,name]));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};}

test('generator guards duplicate generation/approval and requires reapproval after edits',async()=>{
  const draft=groundResumeDraft(generated,profile).resume,calls=[],uploaded=[],approved=[];const generation=deferred(),saving=deferred();let versions=0;
  const client={functions:{invoke:async(name,body)=>{calls.push({name,body});if(name==='generateResume'){await generation.promise;return {data:{resume:draft}};}if(name==='saveResumeVersion'){await saving.promise;return {data:{resume:{id:'version-'+(++versions),numero_versao:versions}}};}throw new Error('Unexpected application preparation');}},integrations:{Core:{UploadPrivateFile:async({file})=>{uploaded.push(file);return {file_uri:'private/resume.pdf'};}}}};
  const h=componentHarness(new URL('../src/components/resume/ResumeGenerator.jsx',import.meta.url),{...ui,base44:client,useToast:()=>({toast:()=>{}}),useNavigate:()=>()=>{},generateResumePdf,validateResumeContent},{job,profile,matchId:'match',onApproved:()=>approved.push(true)});
  h.render();const start=h.button('Gerar com IA').props.onClick;
  const first=start(),second=start();assert.equal(calls.length,1);generation.resolve();await Promise.all([first,second]);h.render();
  assert.equal(calls[0].body.job_id,job.id);assert.equal(calls[0].body.match_id,'match');
  const approve=h.button('Aprovar versão').props.onClick;const p1=approve(),p2=approve();await tick();assert.equal(uploaded.length,1);saving.resolve();await Promise.all([p1,p2]);h.render();
  assert.equal(h.button('Versão aprovada').props.disabled,true);await h.button('Versão aprovada').props.onClick();assert.equal(uploaded.length,1);assert.equal(versions,1);assert.equal(approved.length,1);
  const snapshot=calls.find(call=>call.name==='saveResumeVersion');assert.equal(snapshot.body.job_id,job.id);assert.equal(snapshot.body.match_id,'match');
  assert.equal(snapshot.body.conteudo_estruturado.cursos_certificacoes[0].carga_horaria,'40 horas');
  h.button('Editar').props.onClick();h.render();const editor=h.nodes().find(node=>node.type==='ResumeEditor');assert.equal(editor.props.open,true);
  editor.props.onSave({...draft,resumo:'Texto revisado pelo titular.'});h.render();assert.equal(h.button('Aprovar versão').props.disabled,false);
  assert.equal(calls.some(call=>call.name==='prepareApplication'),false);h.unmount();
});
test('late generation response cannot create a stale PDF after leaving the selected job',async()=>{
  const pending=deferred();let pdfs=0;
  const h=componentHarness(new URL('../src/components/resume/ResumeGenerator.jsx',import.meta.url),{...ui,base44:{functions:{invoke:async()=>{await pending.promise;return {data:{resume:groundResumeDraft(generated,profile).resume}};}}},useToast:()=>({toast:()=>{}}),useNavigate:()=>()=>{},validateResumeContent,generateResumePdf:()=>{pdfs++;return new Blob();}},{job,profile});
  h.render();const task=h.button('Gerar com IA').props.onClick();h.unmount();pending.resolve();await task;assert.equal(pdfs,0);
});
test('changing selected job ignores a late prior load and gives the new generator a distinct identity',async()=>{
  let selected='A',match='match-A';const old=deferred();
  const h=componentHarness(new URL('../src/pages/Curriculos.jsx',import.meta.url),{...ui,useAuth:()=>({user:{id:'A'}}),useNavigate:()=>()=>{},useSearchParams:()=>[new URLSearchParams({job_id:selected,match_id:match})],useToast:()=>({toast:()=>{}}),personalPage:async kind=>({items:kind==='profile'?[profile]:[]}),base44:{entities:{Job:{get:async id=>id==='A'?old.promise:{...job,id}}}},PageHeader:'PageHeader',ResumeGenerator:'ResumeGenerator',Badge:'Badge',Files:'Files',FileText:'FileText',Trash2:'Trash2',generateResumePdf});
  h.render();selected='B';match='match-B';h.render();await tick();h.render();
  let generator=h.nodes().find(node=>node.type==='ResumeGenerator');assert.equal(generator.props.job.id,'B');const initialKey=generator.key;
  old.resolve({...job,id:'A'});await tick();h.render();generator=h.nodes().find(node=>node.type==='ResumeGenerator');assert.equal(generator.props.job.id,'B');
  match='another-match-B';h.render();generator=h.nodes().find(node=>node.type==='ResumeGenerator');assert.notEqual(generator.key,initialKey);h.unmount();
});
