import test from 'node:test';
import assert from 'node:assert/strict';
import {componentHarness} from './helpers/component-harness.mjs';
const ui=Object.fromEntries(['Button','Badge','Textarea','Dialog','DialogContent','DialogHeader','DialogTitle','DialogDescription','DialogFooter','ResumeView','CheckCircle2','XCircle','Loader2','Send','ShieldCheck'].map(name=>[name,name]));
const base={app:{id:'app-A',job_id:'job',resume_version_id:'resume',metodo_envio:'manual',status:'pendente_aprovacao',updated_date:'2026-11-05T01:00:00Z'},job:{id:'job',cargo:'Vaga fictícia',status:'ativa'},resume:{id:'resume',status_revisao:'pronto',referencia_pdf_privado:'private/test.pdf',numero_versao:1,conteudo_estruturado:{contato:{nome:'Teste'}}},open:true};
function deferred(){let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};}
function mount(invoke,extra={}){const notices=[],actions=[],closed=[];const props={...structuredClone(base),onAction:value=>actions.push(value),onClose:()=>closed.push(true),...extra};const h=componentHarness(new URL('../src/components/applications/ApprovalDialog.jsx',import.meta.url),{...ui,base44:{functions:{invoke}},useToast:()=>({toast:value=>notices.push(value)})},props);return {h,notices,actions,closed,props};}

test('dialog submits reviewed version/channel once and approval does not invoke delivery',async()=>{
 const wait=deferred(),calls=[];const f=mount(async(name,body)=>{calls.push({name,body});await wait.promise;return {data:{application:{...base.app,status:'aprovado'},audit_recorded:false}};});
 f.h.render();const approve=f.h.button('Aprovar candidatura').props.onClick;const a=approve(),b=approve();
 assert.equal(calls.length,1);assert.equal(calls[0].name,'approveApplication');assert.equal(calls[0].body.resume_version_id,'resume');assert.equal(calls[0].body.metodo_envio,'manual');assert.equal(calls[0].body.expected_updated_date,base.app.updated_date);assert.equal('canal' in calls[0].body,false);
 f.h.nodes().find(node=>node.type==='Dialog').props.onOpenChange(false);assert.equal(f.closed.length,0);
 wait.resolve();await Promise.all([a,b]);f.h.render();assert.equal(f.actions.length,1);assert.ok(f.notices.at(-1).title.includes('auditoria'));assert.equal(calls.length,1);f.h.unmount();
});
test('switching application discards old completion and old rejection reason',async()=>{
 const wait=deferred();const f=mount(async()=>{await wait.promise;return {data:{application:{...base.app,status:'aprovado'}}};});
 f.h.render();const task=f.h.button('Aprovar candidatura').props.onClick();
 const next={...f.props,app:{...base.app,id:'app-B'}};f.h.render(next);f.h.render();wait.resolve();await task;f.h.render();
 assert.equal(f.actions.length,0);assert.equal(f.h.button('Aprovar candidatura').props.disabled,false);
 f.h.button('Recusar').props.onClick();f.h.render();f.h.nodes().find(node=>node.type==='Textarea').props.onChange({target:{value:'Motivo B'}});f.h.render();
 f.h.render({...next,open:false});f.h.render({...next,open:true,app:{...next.app,id:'app-C'}});f.h.render();f.h.button('Recusar').props.onClick();f.h.render();assert.equal(f.h.nodes().find(node=>node.type==='Textarea').props.value,'');f.h.unmount();
});
test('missing reviewable resume blocks approval but permits explicit rejection',async()=>{
 const calls=[];const f=mount(async(name,body)=>{calls.push({name,body});return {data:{application:{...base.app,status:'recusado'}}};},{resume:null});
 f.h.render();assert.equal(f.h.button('Aprovar candidatura').props.disabled,true);assert.ok(f.h.nodes().some(node=>node.props?.role==='alert'));
 f.h.button('Recusar').props.onClick();f.h.render();f.h.nodes().find(node=>node.type==='Textarea').props.onChange({target:{value:'Não desejo continuar'}});f.h.render();await f.h.button('Confirmar recusa').props.onClick();
 assert.equal(calls.length,1);assert.equal(calls[0].name,'rejectApplication');assert.equal(calls[0].body.motivo,'Não desejo continuar');assert.equal(f.actions[0].status,'recusado');f.h.unmount();
});
test('conflict is displayed without falsely completing or automatically retrying the decision',async()=>{
 let calls=0;const f=mount(async()=>{calls++;throw {response:{status:409,data:{error:'A candidatura mudou. Atualize a lista.'}}};});
 f.h.render();await f.h.button('Aprovar candidatura').props.onClick();f.h.render();
 assert.equal(calls,1);assert.equal(f.actions.length,0);assert.ok(f.notices.some(n=>n.description?.includes('Atualize a lista')));assert.equal(f.h.button('Aprovar candidatura').props.disabled,false);f.h.unmount();
});
test('new application form guards duplicate submits without sending a candidature',async()=>{
 const calls=[],wait=deferred();const controls=['Button','Label','Dialog','DialogContent','DialogHeader','DialogTitle','DialogDescription','DialogFooter','Select','SelectContent','SelectItem','SelectTrigger','SelectValue','Loader2'];
 const client={auth:{me:async()=>({})},functions:{invoke:async(name,body)=>{
   calls.push({name,body});await wait.promise;return {data:{application:{id:'new'}}};
 }}};
 const dependencies={...Object.fromEntries(controls.map(name=>[name,name])),useMemo:fn=>fn(),useToast:()=>({toast:()=>{}}),base44:client};
 const h=componentHarness(new URL('../src/components/applications/NewApplicationDialog.jsx',import.meta.url),dependencies,{open:true,jobs:[base.job],resumes:[{...base.resume,job_id:'job'}]});
 h.render();h.nodes().filter(n=>n.type==='Select')[0].props.onValueChange('job');h.render();h.nodes().filter(n=>n.type==='Select')[1].props.onValueChange('resume');h.render();
 const submit=h.nodes().find(node=>node.type==='form').props.onSubmit;const a=submit({preventDefault(){}}),b=submit({preventDefault(){}});assert.equal(calls.length,1);assert.equal(calls[0].name,'prepareApplication');wait.resolve();await Promise.all([a,b]);h.unmount();
});
