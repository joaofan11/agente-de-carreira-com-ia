import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadSourceModule } from './helpers/backend-handler.mjs';
import { matchFingerprint } from '../base44/shared/matchCache.ts';

const wrapper=({children})=>React.createElement('div',null,children);
const icon=()=>null;
const Component=loadSourceModule(new URL('../src/components/opportunities/MatchResult.jsx',import.meta.url),{
  React,useNavigate:()=>()=>{},Button:wrapper,Badge:wrapper,Progress:icon,Separator:icon,
  CheckCircle2:icon,XCircle:icon,AlertTriangle:icon,FileText:icon,ShieldAlert:icon,Lightbulb:icon,
});
const match={id:'synthetic-match',job_id:'synthetic-job',score:90,nivel_compatibilidade:'alto',pontuacao_detalhada:{tecnicas:40,formacao:25,experiencia:20,preferencias:5},competencias_evidenciadas:[{competencia:'Python',evidencia:'Curso fictício de Python'}],competencias_compativeis:['Python'],justificativas:['Curso e projeto compatíveis'],bloqueios:[]};
const render=result=>renderToStaticMarkup(React.createElement(Component,{result,onReanalyze:()=>{},reanalyzing:false}));

test('cached result keeps criteria, competence evidence and strong level even without a new AI response',()=>{
  const html=render({match,analysis:null,reused:true,score:{score:90,nivel:'alto'}});
  for(const text of ['Forte','40/40','25/25','20/20','5/15','Python','Curso fictício de Python','Análise anterior reutilizada','Não representa probabilidade de contratação','Verificar atualização']) assert.ok(html.includes(text),text);
});
test('legacy cached result remains usable without inventing a missing breakdown',()=>{
  const {pontuacao_detalhada,competencias_evidenciadas,...legacy}=match;
  const html=render({match:legacy,analysis:null,reused:true});
  assert.ok(html.includes('Forte'));assert.ok(html.includes('Python'));
  assert.equal(html.includes('40/40'),false);
});
test('low score, missing evidence, eliminatory blocks and audit warning remain visible',()=>{
  const html=render({match:{score:20,nivel_compatibilidade:'baixo',bloqueios:['Inglês obrigatório não comprovado'],competencias_ausentes:['Inglês'],dados_insuficientes:'Informe o curso'},score:{score:20,nivel:'baixo'},audit_recorded:false});
  for(const text of ['Baixo','Inglês obrigatório não comprovado','Requisitos não atendidos','Informe o curso','falha no registro de auditoria']) assert.ok(html.includes(text),text);
});
test('approved courses, hours and CTPS experience changes invalidate the compatibility fingerprint',async()=>{
  const profile={nome_completo:'Teste',cursos_complementares:[{nome:'Curso fictício',carga_horaria:'40 horas'}],experiencias:[{empresa:'Empresa fictícia',cargo:'Assistente',data_inicio:'02/2024'}]};
  const baseline=await matchFingerprint(profile,{id:'job'},null);
  const same=await matchFingerprint(structuredClone(profile),{id:'job'},null);assert.equal(same,baseline);
  const course=structuredClone(profile);course.cursos_complementares[0].carga_horaria='80 horas';
  const experience=structuredClone(profile);experience.experiencias[0].cargo='Analista';
  assert.notEqual(await matchFingerprint(course,{id:'job'},null),baseline);
  assert.notEqual(await matchFingerprint(experience,{id:'job'},null),baseline);
});
