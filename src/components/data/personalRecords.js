import { base44 } from '@/api/base44Client';
export async function personalPage(kind, options = {}) {
  const response = await base44.functions.invoke('listPersonalRecords', { kind, ...options });
  return response.data;
}
export async function saveProfile(profileId, fields) {
  const response = await base44.functions.invoke('saveCandidateProfile', { ...(profileId ? {profile_id:profileId}:{}), fields });
  return response.data.profile;
}