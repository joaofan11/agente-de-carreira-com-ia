import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { ownedRecord, assertConsistentOwner, realProfile } from '../../shared/personalOwnership.ts';
import { validateProfile } from '../../shared/profileFields.ts';
import { allowFields, functionError } from '../../shared/personalValidation.ts';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({error:'Unauthorized'}, {status:401});
    const body = allowFields(await req.json(), ['profile_id','fields']);
    const fields = validateProfile(body.fields);
    const existing = body.profile_id
      ? await ownedRecord(base44, 'CandidateProfile', body.profile_id, user.id)
      : await realProfile(base44, user.id);
    if (existing) {
      assertConsistentOwner(existing, user.id);
      if (existing.is_demo === true) throw new Error('Não é possível editar perfil de demonstração.');
    }
    if (!existing && !fields.nome_completo) throw new Error('Nome completo obrigatório.');
    const patch = { ...fields, atualizado_em: new Date().toISOString() };
    const profile = existing
      ? await base44.asServiceRole.entities.CandidateProfile.update(existing.id, patch)
      : await base44.asServiceRole.entities.CandidateProfile.create({ ...patch, user_id:user.id, owner_user_id:user.id, is_demo:false });
    return Response.json({profile});
  } catch (error) { return functionError(error); }
}