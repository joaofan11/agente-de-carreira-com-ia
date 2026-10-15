import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { ownedRecord, ownerQuery, assertConsistentOwner } from '../../shared/personalOwnership.ts';
import { allowFields, boundedObject, texts, text, functionError } from '../../shared/personalValidation.ts';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req), user = await base44.auth.me();
    if (!user) return Response.json({error:'Unauthorized'}, {status:401});
    const body = allowFields(await req.json(), ['action','resume_id','job_id','match_id','conteudo_estruturado','referencia_pdf_privado']);
    if (body.action === 'delete') {
      await ownedRecord(base44,'ResumeVersion',body.resume_id,user.id);
      const linked = await base44.asServiceRole.entities.Application.count({resume_version_id:body.resume_id});
      if (linked) throw new Error('Currículo vinculado a candidatura não pode ser excluído.');
      await base44.asServiceRole.entities.ResumeVersion.delete(body.resume_id);
      return Response.json({deleted:true});
    }
    if (body.action !== 'create') throw new Error('Versões salvas são snapshots imutáveis. Crie uma nova versão.');
    const job = await base44.entities.Job.get(text(body.job_id,200));
    if (!job || job.status !== 'ativa') throw new Error('Vaga inválida ou inativa.');
    const content = boundedObject(body.conteudo_estruturado);
    if (body.match_id) {
      const match = await ownedRecord(base44,'JobMatch',body.match_id,user.id);
      assertConsistentOwner(match,user.id);
      if (match.job_id !== job.id) throw new Error('Análise de outra vaga.');
    }
    const uri = text(body.referencia_pdf_privado,2000);
    if (!uri.startsWith('private/')) throw new Error('PDF deve estar em armazenamento privado.');
    await base44.integrations.Core.CreateFileSignedUrl({file_uri:uri});
    const versions = await base44.asServiceRole.entities.ResumeVersion.aggregate({query:{$and:[ownerQuery(user.id),{job_id:job.id}]},max:'numero_versao'});
    const numero = Number(versions.rows?.[0]?.max_numero_versao || 0) + 1;
    const resume = await base44.asServiceRole.entities.ResumeVersion.create({user_id:user.id,owner_user_id:user.id,job_id:job.id,...(body.match_id?{match_id:body.match_id}:{}),conteudo_estruturado:content,referencia_pdf_privado:uri,evidencias_utilizadas:texts(content.evidencias_utilizadas||[]),numero_versao:numero,status_revisao:'pronto',criado_em:new Date().toISOString(),is_demo:job.is_demo===true,...(job.is_demo?{demo_batch_id:job.demo_batch_id}:{})});
    return Response.json({resume});
  } catch(error) { return functionError(error); }
}