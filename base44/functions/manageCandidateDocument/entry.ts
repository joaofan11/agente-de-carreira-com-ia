import { authenticatedUser } from '../../shared/requestAuth.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { ownedRecord, assertConsistentOwner, realProfile } from '../../shared/personalOwnership.ts';
import { allowFields, text, functionError } from '../../shared/personalValidation.ts';
import { DOCUMENT_TYPES, MAX_PDF_BYTES, validatePdf, reviewedProfilePatch } from '../../shared/documentExtraction.ts';
import { recordAuditEvent, recordAuditCompleted } from '../../shared/auditEvents.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req), user = await authenticatedUser(base44);
    if (!user) return Response.json({error:'Unauthorized'}, {status:401});
    if ((req.headers.get('content-type') || '').startsWith('multipart/form-data')) {
      if (Number(req.headers.get('content-length')) > MAX_PDF_BYTES + 100000) throw new Error('O arquivo excede o limite de 5 MB.');
      const form = await req.formData();
      if ([...form.keys()].some(key => !['file','tipo_documento','nome_arquivo'].includes(key)) || [...form.keys()].some(key => form.getAll(key).length !== 1)) throw new Error('Campos de upload inválidos.');
      const file = form.get('file'), type = form.get('tipo_documento');
      if (!DOCUMENT_TYPES.includes(type)) throw new Error('Tipo inválido.');
      await validatePdf(file);
      const name = text(form.get('nome_arquivo') || file.name, 250).trim();
      if (!name) throw new Error('Informe o nome do documento.');
      await recordAuditEvent(base44, user.id, 'documento_upload_solicitado', 'CandidateDocument');
      // Accept bytes, never a client-supplied storage path. The server binds this upload to its owner.
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({file});
      if (typeof file_uri !== 'string' || !/^(?:mp\/)?private\//.test(file_uri)) throw new Error('O armazenamento não retornou referência privada.');
      let document;
      try {
        document = await base44.asServiceRole.entities.CandidateDocument.create({tipo_documento:type,nome_arquivo:name,referencia_arquivo_privado:file_uri,user_id:user.id,owner_user_id:user.id,status_extracao:'pendente',dados_extraidos:{},criado_em:new Date().toISOString(),is_demo:false});
      } catch {
        // No supported private-file deletion API: do not hide a potentially orphaned upload.
        await recordAuditCompleted(base44, user.id, 'documento_upload_sem_registro', 'CandidateDocument', undefined, 'erro');
        return Response.json({error:'O arquivo foi recebido, mas seu registro falhou. Não reenvie agora; solicite verificação ao suporte.'}, {status:502});
      }
      const audit_recorded = await recordAuditCompleted(base44, user.id, 'documento_upload_concluido', 'CandidateDocument', document.id);
      return Response.json({document, audit_recorded});
    }
    const body = allowFields(await req.json(), ['action','document_id','reviewed']);
    if (!['delete','download','approve'].includes(body.action)) throw new Error('Ação inválida. Para enviar, use o formulário de upload de PDF.');
    const doc = await ownedRecord(base44, 'CandidateDocument', body.document_id, user.id);
    assertConsistentOwner(doc, user.id);
    if (doc.is_demo === true) throw new Error('Use um documento próprio, fora da demonstração.');
    if (body.action === 'download') {
      const {signed_url} = await base44.integrations.Core.CreateFileSignedUrl({file_uri:doc.referencia_arquivo_privado, expires_in:300});
      return Response.json({signed_url});
    }
    if (body.action === 'delete') {
      await base44.asServiceRole.entities.CandidateDocument.delete(doc.id);
      return Response.json({deleted:true, private_file_deleted:false});
    }
    if (doc.status_extracao !== 'concluido') throw new Error('Conclua a extração antes de revisar.');
    if (doc.extracao_confirmada_em) return Response.json({already_applied:true});
    const profile = await realProfile(base44, user.id);
    if (profile) assertConsistentOwner(profile, user.id);
    const patch = reviewedProfilePatch(doc.tipo_documento, body.reviewed, profile);
    await recordAuditEvent(base44, user.id, 'documento_revisao_solicitada', 'CandidateDocument', doc.id);
    const fields = {...patch, atualizado_em:new Date().toISOString()};
    const saved = profile
      ? await base44.asServiceRole.entities.CandidateProfile.update(profile.id, fields)
      : await base44.asServiceRole.entities.CandidateProfile.create({...fields,nome_completo:user.full_name || 'Estudante',email:user.email || '',user_id:user.id,owner_user_id:user.id,is_demo:false});
    await base44.asServiceRole.entities.CandidateDocument.update(doc.id, {extracao_confirmada_em:new Date().toISOString(),perfil_destino_id:saved.id});
    const audit_recorded = await recordAuditCompleted(base44, user.id, 'documento_revisao_confirmada', 'CandidateDocument', doc.id);
    return Response.json({approved:true, audit_recorded});
  } catch(error) { return functionError(error); }
}
