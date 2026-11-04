import { ownerOf, assertConsistentOwner } from './personalOwnership.ts';

export function canonicalWhatsAppPhone(value) {
  if (typeof value !== 'string') return null;
  const raw = value.trim().replace(/^whatsapp:/i, '').trim();
  if (!/^\+?[\d\s().-]+$/.test(raw)) return null;
  let digits = raw.replace(/\D/g, '');
  if (!raw.startsWith('+') && (digits.length === 10 || digits.length === 11)) digits = '55' + digits;
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  if (digits.startsWith('55') && !/^55[1-9]\d{9,10}$/.test(digits)) return null;
  return '+' + digits;
}

export async function findWhatsAppProfile(base44, from) {
  const canonical = canonicalWhatsAppPhone(from);
  if (!canonical) return null;
  const digits = canonical.slice(1);
  const forms = [digits];
  if (digits.startsWith('55')) forms.push(digits.slice(2));
  // Full-string candidate lookup supports old display formatting. It never searches a substring.
  const variants = forms.map(phone => '\\+?[\\s().-]*' + phone.split('').join('[\\s().-]*') + '[\\s().-]*');
  const pattern = '^\\s*(?:whatsapp:\\s*)?(?:' + variants.join('|') + ')\\s*$';
  const page = await base44.asServiceRole.entities.CandidateProfile.filter(
    { telefone_whatsapp: { $regex: pattern, $options: 'i' }, is_demo: { $ne: true } },
    { limit: 3 },
  );
  const profiles = (Array.isArray(page) ? page : page?.items || [])
    .filter(profile => canonicalWhatsAppPhone(profile.telefone_whatsapp) === canonical);
  if (profiles.length !== 1) return null; // Ambiguous identities fail closed, even for the same owner.
  const profile = profiles[0];
  const userId = ownerOf(profile);
  try { assertConsistentOwner(profile, userId); } catch { return null; }
  return { profile, userId };
}
