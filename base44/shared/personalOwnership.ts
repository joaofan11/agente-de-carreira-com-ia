// Legacy service-created rows were never client-editable. Their server-assigned user_id
// remains a valid fallback; client-created rows never gain access through user_id.
export function ownerOf(record) {
  if (record?.owner_user_id) return record.owner_user_id;
  const creator = record?.created_by_id;
  return typeof creator === 'string' && creator.startsWith('service_') ? record.user_id : creator;
}
export function assertOwner(record, userId) {
  if (!userId || !record || ownerOf(record) !== userId) {
    const error = new Error('Registro não pertence ao usuário.'); error.status = 403; throw error;
  }
}
export function ownerQuery(userId) {
  return { $or: [
    { owner_user_id: userId },
    { $and: [{ owner_user_id: { $exists: false } }, { created_by_id: userId }] },
    { $and: [{ owner_user_id: { $exists: false } }, { created_by_id: { $regex: '^service_' } }, { user_id: userId }] },
  ] };
}
export async function ownedRecord(base44, name, id, userId) {
  const record = await base44.asServiceRole.entities[name].get(id);
  assertOwner(record, userId);
  return record;
}
export function assertConsistentOwner(record, userId) {
  assertOwner(record, userId);
  if (record.user_id && record.user_id !== userId) {
    const error = new Error('Propriedade legada conflitante; revisão necessária.'); error.status = 409; throw error;
  }
}
export async function realProfile(base44, userId) {
  const page = await base44.asServiceRole.entities.CandidateProfile.filter(
    { $and: [ownerQuery(userId), { is_demo: { $ne: true } }] }, { sort: '-updated_date', limit: 1 });
  return page.items?.[0] || null;
}