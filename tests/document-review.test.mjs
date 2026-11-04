import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { loadSourceModule } from './helpers/backend-handler.mjs';
import { documentMonth, pdfUploadPayload, decodePdfUpload } from '../base44/shared/documentFiles.js';
import { reviewedProfilePatch } from '../base44/shared/documentExtraction.ts';
import { createFunctionsModule } from '../node_modules/@base44/sdk/dist/modules/functions.js';

function review(type, extracted, confirmed=false) {
  let submitted;
  const controls=['Dialog','DialogContent','DialogHeader','DialogTitle','DialogFooter','Button','Input','Label','AlertTriangle','Loader2','Plus','Trash2'];
  const component=loadSourceModule(new URL('../src/components/documents/ExtractionReview.jsx',import.meta.url),{
    React, documentMonth, useState:()=>[extracted,()=>{}],useEffect:()=>{},...Object.fromEntries(controls.map(name=>[name,name])),
  });
  const tree=component({open:true,doc:{tipo_documento:type,extracao_confirmada_em:confirmed?'2026-11-04T00:00:00Z':null},extracted,onApprove:value=>{submitted=value;},onClose:()=>{},approving:false});
  const walk=node=>!node||typeof node!=='object'?[]:[node,...React.Children.toArray(node.props?.children).flatMap(walk)];
  const button=walk(tree).find(node=>node.type==='Button' && React.Children.toArray(node.props.children).includes('Adicionar informações aprovadas ao meu perfil'));
  assert.ok(button);
  return {button, get submitted(){return submitted;}};
}
test('actual CTPS review sends a backend-compatible payload and normalizes full dates',()=>{
  const ui=review('ctps',{experiencias:[{empresa:'Empresa fictícia',cargo:'Estágio',data_admissao:'05/03/2024',data_saida:'Não identificado'}]});
  ui.button.props.onClick();
  assert.equal(ui.submitted.experiencias[0].data_admissao,'03/2024');
  assert.equal(ui.submitted.experiencias[0].data_saida,'');
  assert.equal(reviewedProfilePatch('ctps',ui.submitted,null).experiencias.length,1);
});
test('actual certificate review preserves hours and disables resubmission after confirmation',()=>{
  const extracted={nome_curso:'Curso',instituicao:'Instituição',data_conclusao:'2024-03-05',carga_horaria:'40 horas'};
  const ui=review('certificado',extracted);ui.button.props.onClick();
  assert.equal(reviewedProfilePatch('certificado',ui.submitted,null).cursos_complementares[0].carga_horaria,'40 horas');
  assert.equal(review('certificado',extracted,true).button.props.disabled,true);
});
test('installed SDK sends upload as JSON and preserves binary PDF bytes through a JSON-only gateway',async()=>{
  const bytes=new Uint8Array([37,80,68,70,45,49,46,52,10,0,128,255,13,10]);
  const file=new File([bytes],'fixture.pdf',{type:'application/pdf'});
  let captured;
  const functions=createFunctionsModule({post:async(url,body,config)=>{captured={url,body,config};return {data:{ok:true}};}},'synthetic-app');
  await functions.invoke('manageCandidateDocument',await pdfUploadPayload(file,'ctps','Fixture'));
  assert.equal(captured.url,'/apps/synthetic-app/functions/manageCandidateDocument');
  assert.equal(captured.config.headers['Content-Type'],'application/json');
  assert.equal(captured.body instanceof FormData,false);
  const forwarded=await new Request('https://example.invalid',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(captured.body)}).json();
  const decoded=decodePdfUpload(forwarded);
  assert.deepEqual(new Uint8Array(await decoded.arrayBuffer()),bytes);
  assert.equal(decoded.name,file.name);assert.equal(decoded.type,'application/pdf');assert.equal(forwarded.tipo_documento,'ctps');
});
