import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { ownedRecord, assertConsistentOwner } from '../../shared/personalOwnership.ts';
import { allowFields, text, functionError } from '../../shared/personalValidation.ts';
const TYPES = ['ctps','certificado','cpf','rg','diploma','historico','comprovante_residencia','curriculo','outro'];
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req), user = await base44.auth.me();
    if (!user) return Response.json({error:'Unauthorized'}, {status:401});
    const body = allowFields(await req.json(), ['action','document_id','fields']);
    if (body.action === 'delete') {
      await ownedRecord(base44, 'CandidateDocument', body.document_id, user.id);
      await base44.asServiceRole.entities.CandidateDocument.delete(body.document_id);
      return Response.json({deleted:true});
    }
    if (body.action !== 'create') throw new Error('Ação inválida. Extrações só são alteradas pelo processamento do servidor.');
    const fields = allowFields(body.fields, ['tipo_documento','nome_arquivo','referencia_arquivo_privado']);
    if (!TYPES.includes(fields.tipo_documento)) throw new Error('Tipo inválido.');
    text(fields.nome_arquivo,250); text(fields.referencia_arquivo_privado,2000);
    if (!fields.nome_arquivo.trim() || !fields.referencia_arquivo_privado.startsWith('private/')) throw new Error('Referência privada inválida.');
    // User-scoped signing proves this session can access the already uploaded file.
    await base44.integrations.Core.CreateFileSignedUrl({file_uri:fields.referencia_arquivo_privado});
    const document = await base44.asServiceRole.entities.CandidateDocument.create({...fields,user_id:user.id,owner_user_id:user.id,status_extracao:'pendente',dados_extraidos:{},criado_em:new Date().toISOString(),is_demo:false});
    return Response.json({document});
  } catch(error) { return functionError(error); }
}