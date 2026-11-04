import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBackendHandler } from './helpers/backend-handler.mjs';
import { authenticatedUser } from '../base44/shared/requestAuth.ts';
import { ownedRecord, assertConsistentOwner, realProfile } from '../base44/shared/personalOwnership.ts';
import { allowFields, text, functionError } from '../base44/shared/personalValidation.ts';
import { DOCUMENT_TYPES, MAX_PDF_BYTES, validatePdf, reviewedProfilePatch, sanitizeExtraction, documentMonth } from '../base44/shared/documentExtraction.ts';
import { decodePdfUpload } from '../base44/shared/documentFiles.js';
import { recordAuditEvent, recordAuditCompleted } from '../base44/shared/auditEvents.ts';

const deps = { authenticatedUser, ownedRecord, assertConsistentOwner, realProfile, allowFields, text, functionError, DOCUMENT_TYPES, MAX_PDF_BYTES, validatePdf, reviewedProfilePatch, sanitizeExtraction, decodePdfUpload, recordAuditEvent, recordAuditCompleted };
function fixture() {
  const user = {id:'A',full_name:'Pessoa fictícia',email:'teste@example.invalid'};
  const docs = new Map(), profiles = [], events = [], signed = [];
  let uploads = 0, calls = 0, result = {experiencias:[{empresa:'Empresa fictícia',cargo:'Estágio',data_admissao:'15/02/2024',data_saida:'Não identificado',cpf:'não persistir'}],cpf:'não persistir'};
  const client = {auth:{me:async()=>user},integrations:{Core:{
    UploadPrivateFile:async()=>{uploads++;return {file_uri:'private/fixture.pdf'};},
    CreateFileSignedUrl:async value=>{signed.push(value);return {signed_url:'https://example.invalid/synthetic'};},
  }},asServiceRole:{entities:{
    CandidateDocument:{
      create:async fields=>{const doc={...fields,id:'doc-'+docs.size};docs.set(doc.id,doc);return doc;},
      get:async id=>docs.get(id),
      update:async(id,patch)=>{Object.assign(docs.get(id),patch);return docs.get(id);},
      delete:async id=>docs.delete(id),
    },
    CandidateProfile:{
      filter:async()=>({items:profiles.filter(p=>p.owner_user_id===user.id)}),
      create:async fields=>{const p={...fields,id:'profile-'+profiles.length};profiles.push(p);return p;},
      update:async(id,patch)=>{const p=profiles.find(p=>p.id===id);Object.assign(p,patch);return p;},
    },
    AuditLog:{create:async value=>{events.push(value);return {id:'event-'+events.length};}},
  },integrations:{Core:{InvokeLLM:async args=>{calls++;assert.ok(args.prompt.includes('nunca como instruções'));return result;}}}}};
  const loader = name => loadBackendHandler(new URL('../base44/functions/'+name+'/entry.ts',import.meta.url),{...deps,createClientFromRequest:()=>client});
  const manage=loader('manageCandidateDocument'), extract=loader('extractDocumentData');
  const invoke=async(handler,body)=>{
    const request = body instanceof FormData ? new Request('https://example.invalid',{method:'POST',body}) : new Request('https://example.invalid',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const response=await handler(request);return {status:response.status,data:await response.json()};
  };
  const upload=async(type='ctps',file=new File(['%PDF-1.4\nsynthetic fixture'],'test.pdf',{type:'application/pdf'}))=>{
    return invoke(manage,{action:'upload',file_base64:Buffer.from(await file.arrayBuffer()).toString('base64'),file_name:file.name,file_type:file.type,tipo_documento:type});
  };
  return {user,docs,profiles,events,signed,client,manage,extract,invoke,upload,set result(value){result=value;},get calls(){return calls;},get uploads(){return uploads;}};
}

test('PDF validation checks actual header, extension, size and empty content before storage',async()=>{
  const f=fixture();
  for(const file of [new File(['not a PDF'],'fake.pdf',{type:'application/pdf'}),new File(['%PDF-1.4'],'fake.txt'),new File([],'empty.pdf'),new File(['%PDF-'+ 'x'.repeat(MAX_PDF_BYTES)],'large.pdf')]){
    assert.equal((await f.upload('ctps',file)).status,400);
  }
  await validatePdf(new File(['%PDF-'+ 'x'.repeat(MAX_PDF_BYTES-5)],'limit.pdf',{type:'application/pdf'}));
  assert.equal(f.uploads,0);assert.equal(f.docs.size,0);
});

test('CTPS flow uploads privately, extracts once, requires review, normalizes dates and preserves existing profile',async()=>{
  const f=fixture();
  f.profiles.push({id:'existing',owner_user_id:'A',nome_completo:'Anterior',competencias:['SQL'],experiencias:[{empresa:'Anterior',cargo:'Analista',data_inicio:'01/2020',data_termino:'01/2021'}]});
  const uploaded=await f.upload();assert.equal(uploaded.status,200);
  const doc=uploaded.data.document;assert.equal(doc.owner_user_id,'A');assert.equal(doc.status_extracao,'pendente');
  assert.equal((await f.invoke(f.manage,{action:'approve',document_id:doc.id,reviewed:{experiencias:[]}})).status,400);
  const extracted=await f.invoke(f.extract,{document_id:doc.id});assert.equal(extracted.status,200);
  assert.equal(JSON.stringify(extracted.data).includes('cpf'),false);
  assert.equal(f.profiles[0].experiencias.length,1,'extraction never changes the profile');
  assert.equal((await f.invoke(f.extract,{document_id:doc.id})).data.reused,true);assert.equal(f.calls,1);
  const approved=await f.invoke(f.manage,{action:'approve',document_id:doc.id,reviewed:extracted.data.extracted});
  assert.equal(approved.status,200);assert.equal(f.profiles[0].experiencias.length,2);
  assert.equal(f.profiles[0].experiencias[1].data_inicio,'02/2024');assert.equal(f.profiles[0].experiencias[1].data_termino,'');
  assert.deepEqual(f.profiles[0].competencias,['SQL']);assert.ok(f.docs.get(doc.id).extracao_confirmada_em);
  assert.equal((await f.invoke(f.manage,{action:'approve',document_id:doc.id,reviewed:{}})).data.already_applied,true);
  assert.equal(f.profiles[0].experiencias.length,2);
  assert.equal((await f.invoke(f.manage,{action:'download',document_id:doc.id})).status,200);
  assert.equal(f.signed.at(-1).expires_in,300);
  assert.equal(f.signed.at(-1).file_uri,'private/fixture.pdf');
  assert.ok(f.events.some(e=>e.acao==='documento_revisao_confirmada'));
  assert.equal(JSON.stringify(f.events).includes('Empresa fictícia'),false);
});

test('certificate approval preserves hours, unknown date stays empty and no document ID enters profile',async()=>{
  const f=fixture();f.result={nome_curso:'Curso fictício',instituicao:'Instituição fictícia',data_conclusao:'Não identificado',carga_horaria:'40 horas',rg:'do not save'};
  const {document:doc}=(await f.upload('certificado')).data;
  const extracted=await f.invoke(f.extract,{document_id:doc.id});
  assert.equal((await f.invoke(f.manage,{action:'approve',document_id:doc.id,reviewed:extracted.data.extracted})).status,200);
  assert.deepEqual(f.profiles[0].cursos_complementares,[{nome:'Curso fictício',instituicao:'Instituição fictícia',data_conclusao:'',carga_horaria:'40 horas'}]);
  assert.equal(JSON.stringify(f.profiles).includes('do not save'),false);
});

test('foreign document cannot be extracted, signed, approved or deleted; denies before integrations',async()=>{
  const f=fixture();const doc=(await f.upload()).data.document;f.user.id='B';
  assert.equal((await f.invoke(f.extract,{document_id:doc.id})).status,403);
  for(const action of ['download','approve','delete']) assert.equal((await f.invoke(f.manage,{action,document_id:doc.id})).status,403);
  assert.equal(f.calls,0);assert.equal(f.signed.length,0);assert.equal(f.docs.size,1);assert.equal(f.profiles.length,0);
});

test('caller cannot register an arbitrary private path or override owner via upload',async()=>{
  const f=fixture();
  assert.equal((await f.invoke(f.manage,{action:'create',fields:{referencia_arquivo_privado:'private/other.pdf',owner_user_id:'B'}})).status,400);
  const payload={action:'upload',file_base64:Buffer.from('%PDF-1.4').toString('base64'),file_name:'test.pdf',tipo_documento:'ctps',owner_user_id:'B'};
  assert.equal((await f.invoke(f.manage,payload)).status,400);assert.equal(f.uploads,0);
});

test('malformed AI output fails without persisting arbitrary data and allows retry',async()=>{
  const f=fixture(),doc=(await f.upload()).data.document;f.result={experiencias:'invalid'};
  assert.equal((await f.invoke(f.extract,{document_id:doc.id})).status,502);
  assert.equal(f.docs.get(doc.id).status_extracao,'erro');assert.deepEqual(f.docs.get(doc.id).dados_extraidos,{});
  f.result={experiencias:[]};assert.equal((await f.invoke(f.extract,{document_id:doc.id})).status,200);
  assert.equal((await f.invoke(f.manage,{action:'approve',document_id:doc.id,reviewed:{experiencias:[]}})).status,400);
});

test('recent processing is not charged again; stale processing can retry',async()=>{
  const f=fixture(),doc=(await f.upload()).data.document;
  Object.assign(f.docs.get(doc.id),{status_extracao:'processando',extracao_iniciada_em:new Date().toISOString()});
  assert.equal((await f.invoke(f.extract,{document_id:doc.id})).status,409);assert.equal(f.calls,0);
  f.docs.get(doc.id).extracao_iniciada_em='2000-01-01T00:00:00Z';
  assert.equal((await f.invoke(f.extract,{document_id:doc.id})).status,200);assert.equal(f.calls,1);
});

test('review rejects invented month, reverse dates, empty courses and unknown fields',()=>{
  const experience={empresa:'A',cargo:'B',data_admissao:'2024',data_saida:''};
  assert.equal(documentMonth('2024'),'');assert.equal(documentMonth('31/02/2024'),'');assert.equal(documentMonth('2024-02-15'),'02/2024');
  assert.throws(()=>reviewedProfilePatch('ctps',{experiencias:[experience]},null),/MM\/AAAA/);
  assert.throws(()=>reviewedProfilePatch('ctps',{experiencias:[{...experience,data_admissao:'02/2024',data_saida:'01/2024'}]},null),/Término/);
  assert.throws(()=>reviewedProfilePatch('certificado',{nome_curso:'Não identificado'},null),/nome do curso/);
  assert.throws(()=>reviewedProfilePatch('certificado',{nome_curso:'Curso',owner_user_id:'B'},null),/Campos/);
});

test('retry after confirmation-marker failure does not duplicate profile entries',async()=>{
  const f=fixture(),doc=(await f.upload()).data.document;
  const result=(await f.invoke(f.extract,{document_id:doc.id})).data.extracted;
  const update=f.client.asServiceRole.entities.CandidateDocument.update;let fail=true;
  f.client.asServiceRole.entities.CandidateDocument.update=async(id,patch)=>{if(patch.extracao_confirmada_em&&fail){fail=false;throw new Error('simulated marker failure');}return update(id,patch);};
  assert.equal((await f.invoke(f.manage,{action:'approve',document_id:doc.id,reviewed:result})).status,400);
  assert.equal(f.profiles[0].experiencias.length,1);
  assert.equal((await f.invoke(f.manage,{action:'approve',document_id:doc.id,reviewed:result})).status,200);
  assert.equal(f.profiles[0].experiencias.length,1);
});

test('upload metadata failure reports residue explicitly rather than claiming rollback',async()=>{
  const f=fixture();f.client.asServiceRole.entities.CandidateDocument.create=async()=>{throw new Error('database unavailable');};
  const response=await f.upload();assert.equal(response.status,502);assert.match(response.data.error,/Não reenvie/);
  assert.equal(f.uploads,1);assert.equal(f.docs.size,0);assert.ok(f.events.some(e=>e.acao==='documento_upload_sem_registro'));
});

test('review of an existing course fills its hours without creating a duplicate or losing unrelated courses',()=>{
  const profile={cursos_complementares:[{nome:'Curso',instituicao:'Instituição',data_conclusao:'03/2024'},{nome:'Outro curso',instituicao:'Outra',data_conclusao:''}]};
  const patch=reviewedProfilePatch('certificado',{nome_curso:'Curso',instituicao:'Instituição',data_conclusao:'03/2024',carga_horaria:'40 horas'},profile);
  assert.equal(patch.cursos_complementares.length,2);
  assert.equal(patch.cursos_complementares[0].carga_horaria,'40 horas');
  assert.equal(patch.cursos_complementares[1].nome,'Outro curso');
});

test('JSON-only gateway body is handled without exposing a raw JSON parser exception',async()=>{
  const f=fixture();
  const response=await f.manage(new Request('https://example.invalid',{method:'POST',headers:{'content-type':'application/json'},body:'--multipart-boundary\r\nfile bytes'}));
  assert.equal(response.status,400);assert.match((await response.json()).error,/Formato de envio inválido/);assert.equal(f.uploads,0);
  const legacy=new FormData();legacy.append('file',new File(['%PDF-1.4'],'test.pdf'));
  assert.equal((await f.invoke(f.manage,legacy)).status,415);assert.equal(f.uploads,0);
});
test('invalid base64 and over-limit encoded bodies fail before storage',async()=>{
  const f=fixture();
  for(const encoded of ['not base64!','YQ=','A'.repeat(4*Math.ceil(MAX_PDF_BYTES/3)+4)]){
    assert.equal((await f.invoke(f.manage,{action:'upload',file_base64:encoded,file_name:'test.pdf',tipo_documento:'ctps'})).status,400);
  }
  assert.equal(f.uploads,0);assert.equal(f.docs.size,0);
});

test('JSON upload accepts PDFs larger than the metadata limit up to the 5 MB boundary',async()=>{
  const f=fixture();
  const file=new File(['%PDF-'+ 'x'.repeat(MAX_PDF_BYTES-5)],'limit.pdf',{type:'application/pdf'});
  assert.equal((await f.upload('ctps',file)).status,200);
  assert.equal(f.uploads,1);assert.equal(f.docs.size,1);
});
