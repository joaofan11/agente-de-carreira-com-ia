import { PROFILE_FIELDS } from './profileFields.ts';
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
  return value ?? null;
}
export async function matchFingerprint(profile, job, pref) {
  const pick=(v,keys)=>Object.fromEntries(keys.map(k=>[k,v?.[k] ?? null]));
  const input={version:1,profile:pick(profile,PROFILE_FIELDS),job:pick(job,['id','empresa','cargo','nivel','modalidade','localizacao','descricao','requisitos','status','is_demo']),preferences:pick(pref,['niveis','modalidades','localizacoes','disponibilidade','regiao_amazonia','cargos_interesse'])};
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(stable(input))));
  return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
