import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {componentHarness} from './helpers/component-harness.mjs';
import {loadSourceModule} from './helpers/backend-handler.mjs';
import {buildCareerHistory,computeCareerEvolution,hydrateCareerReferences,recordsForMode,confirmedSend} from '../src/lib/careerHistory.js';
import {calcProgress} from '../src/components/profile/profileHelpers.js';
import {profile,job} from './fixtures/resume.mjs';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const ui=Object.fromEntries(['Button','PageHeader','Card','CardContent','Progress','IndicatorCard','DashboardCharts','HistoryTable','Link','ApplicationCard','ApprovalDialog','NewApplicationDialog','GmailPreviewDialog','OutlookPreviewDialog'].map(name=>[name,name]));
const historyDeps={...ui,useAuth:()=>({user:{id:'A',full_name:'Pessoa'}}),calcProgress,buildCareerHistory,computeCareerEvolution,hydrateCareerReferences,recordsForMode};
const stats=(count=1)=>({data:{matchAgg:{rows:[]},appStatusAgg:{rows:[]},indicators:{totalAnalyzed:count,strongMatches:0,recused:0,sent:0,pendingApproval:0,errors:0}}});
const page=(items=[])=>({items,has_more:false,next_cursor:null});
function headerAction(h,label){const header=h.nodes().find(n=>n.type==='PageHeader');return React.Children.toArray(header.props.actions.props.children).find(n=>React.Children.toArray(n.props.children).some(c=>typeof c==='string'&&c.trim()===label));}

test('dashboard load failure is explicit and does not present empty charts or zero-valued success indicators',async()=>{
 const h=componentHarness(new URL('../src/pages/Dashboard.jsx',import.meta.url),{...historyDeps,personalPage:async()=>{throw new Error('network failed');},base44:{functions:{invoke:async()=>stats()}}});
 h.render();await tick();h.render();
 assert.ok(h.nodes().some(node=>node.props?.role==='alert'));assert.equal(h.nodes().some(node=>node.type==='IndicatorCard'||node.type==='DashboardCharts'||node.type==='HistoryTable'),false);h.unmount();
});
test('switching demo mode ignores late real responses and sends server-side demo-only filters',async()=>{
 let resolveReal;const real=new Promise(resolve=>{resolveReal=resolve;});const calls=[];
 const h=componentHarness(new URL('../src/pages/Dashboard.jsx',import.meta.url),{...historyDeps,personalPage:async(kind,options)=>{
  calls.push({kind,options});
  if(kind==='profile')return options.demo_only?page([{nome_completo:'Demo',is_demo:true},{nome_completo:'Real'}]):real;
  return page();
 },base44:{functions:{invoke:async(_,body)=>stats(body.demo?3:99)}}});
 h.render();headerAction(h,'Modo demo').props.onClick();h.render();await tick();h.render();
 assert.ok(h.nodes().find(node=>node.type==='PageHeader').props.title.includes('Demo'));
 assert.equal(h.nodes().find(node=>node.type==='IndicatorCard').props.value,3);
 resolveReal(page([{nome_completo:'Real'}]));await tick();h.render();
 assert.ok(h.nodes().find(node=>node.type==='PageHeader').props.title.includes('Demo'));assert.equal(h.nodes().find(node=>node.type==='IndicatorCard').props.value,3);
 assert.ok(calls.some(call=>call.options.demo_only===true));h.unmount();
});
test('dashboard uses profile progress formula and treats approved resume as prepared rather than sent',async()=>{
 const h=componentHarness(new URL('../src/pages/Dashboard.jsx',import.meta.url),{...historyDeps,personalPage:async kind=>page(kind==='profile'?[profile]:kind==='resumes'?[{id:'resume',job_id:job.id,numero_versao:1,status_revisao:'pronto'}]:kind==='matches'?[{id:'match',job_id:job.id,score:15,nivel_compatibilidade:'baixo'}]:[]),base44:{functions:{invoke:async()=>stats()},entities:{Job:{get:async()=>job}}}});
 h.render();await tick();h.render();
 assert.equal(h.nodes().find(node=>node.type==='Progress').props.value,calcProgress(profile));
 assert.equal(h.nodes().find(node=>node.type==='IndicatorCard'&&node.props.label==='Envios confirmados').props.value,0);
 assert.equal(h.nodes().find(node=>node.type==='HistoryTable').props.history[0].status,'CURRICULO_PREPARADO');h.unmount();
});
function appHarness(personalPage,client){return componentHarness(new URL('../src/pages/Candidaturas.jsx',import.meta.url),{...ui,personalPage,base44:client,hydrateCareerReferences,useLocation:()=>({pathname:'/candidaturas'}),useNavigate:()=>()=>{},useToast:()=>({toast:()=>{}})});}
test('applications load failure does not become the successful empty-state card',async()=>{
 const h=appHarness(async()=>{throw new Error('offline');},{entities:{Job:{filter:async()=>page()}}});h.render();await tick();h.render();
 assert.ok(h.nodes().some(node=>node.props?.role==='alert'));assert.equal(h.nodes().some(node=>node.type==='Card'),false);h.unmount();
});
test('applications load older pages and retain inactive job and exact historical resume',async()=>{
 const calls=[];const first={id:'first',job_id:'inactive',resume_version_id:'old',status:'pendente_aprovacao'},second={...first,id:'second',status:'recusado'};
 const h=appHarness(async(kind,options)=>{calls.push({kind,options});if(kind==='resumes')return page([{id:'new',job_id:'inactive',numero_versao:2}]);return options.cursor?page([second]):{...page([first]),has_more:true,next_cursor:'next-page'};},{entities:{Job:{filter:async()=>page(),get:async()=>({id:'inactive',cargo:'Vaga encerrada',status:'inativa'})},ResumeVersion:{get:async()=>({id:'old',job_id:'inactive',numero_versao:1})}}});
 h.render();await tick();h.render();let cards=h.nodes().filter(node=>node.type==='ApplicationCard');assert.equal(cards[0].props.job.status,'inativa');assert.equal(cards[0].props.resume.numero_versao,1);
 await h.button('Carregar mais candidaturas').props.onClick();h.render();cards=h.nodes().filter(node=>node.type==='ApplicationCard');assert.deepEqual(cards.map(card=>card.props.app.id),['first','second']);
 assert.ok(calls.some(call=>call.options.cursor==='next-page'));assert.equal(h.nodes().find(node=>node.type==='NewApplicationDialog').props.jobs.length,0);h.unmount();
});
test('application card does not claim a sent application without a receipt',()=>{
 const wrap=({children})=>React.createElement('div',null,children),icon=()=>null;
 const Component=loadSourceModule(new URL('../src/components/applications/ApplicationCard.jsx',import.meta.url),{React,confirmedSend,Badge:wrap,Button:wrap,Card:wrap,CardContent:wrap,...Object.fromEntries(['Send','CheckCircle2','Clock','XCircle','Lock','FileText','Trash2','Eye','AlertTriangle','Loader2','ExternalLink'].map(name=>[name,icon]))});
 const html=renderToStaticMarkup(React.createElement(Component,{app:{status:'enviado',enviado_em:'2026-11-04T10:00:00Z'},resume:{numero_versao:1}}));
 assert.ok(html.includes('Envio sem confirmação'));assert.ok(html.includes('Currículo utilizado: v1'));assert.equal(html.includes('Candidatura enviada — aguardando resposta'),false);
});
test('history period filter follows latest activity rather than an older analysis timestamp',()=>{
 const tableUi=Object.fromEntries(['Card','CardContent','CardHeader','CardTitle','Input','Button','Select','SelectContent','SelectItem','SelectTrigger','SelectValue','StatusBadge','CompatBadge','Search','Filter','Eye','FileText','ExternalLink','Inbox','Link'].map(name=>[name,name]));
 const h=componentHarness(new URL('../src/components/dashboard/HistoryTable.jsx',import.meta.url),{...tableUi,statusConfig:{ENVIADA:{label:'Enviada'}},useMemo:callback=>callback()},{history:[{id:'application:a',jobId:'j',empresa:'Fictícia',cargo:'Vaga',status:'ENVIADA',dataAnalise:'2020-01-01T10:00:00Z',dataAtividade:'2026-11-04T12:00:00Z'}],loading:false});
 h.render();h.nodes().find(node=>node.type==='Input'&&node.props.type==='date').props.onChange({target:{value:'2026-11-01'}});h.render();
 assert.equal(h.nodes().filter(node=>node.type==='tbody').length,1);h.unmount();
});
