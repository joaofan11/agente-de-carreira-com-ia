// Google Jobs via SerpApi. No direct scraping or user profile is sent to the provider.
const portals = ['gupy','linkedin','infojobs'];
export function portalLink(value) {
  try {
    const u=new URL(value);const h=u.hostname.toLowerCase();
    if(u.protocol!=='https:' || u.username || u.password || u.port)return null;
    const platform=h==='gupy.io'||h.endsWith('.gupy.io') ? 'gupy' : h==='linkedin.com'||h.endsWith('.linkedin.com') ? 'linkedin' : h==='infojobs.com.br'||h.endsWith('.infojobs.com.br') ? 'infojobs' : null;
    if(!platform || (platform==='linkedin' && !/^\/jobs\/view\//.test(u.pathname)) || (platform==='gupy' && !/^\/jobs\//.test(u.pathname)) || (platform==='infojobs' && !/\/vaga-de-/i.test(u.pathname)))return null;
    u.search='';u.hash='';return {platform,url:u.href};
  } catch {return null;}
}
export function normalizePortalJobs(raw) {
  if(!raw || typeof raw.title!=='string' || !raw.title.trim() || !raw.company_name)return [];
  const title=raw.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const nivel=/estagi|intern\b/.test(title)?'estagio':/trainee/.test(title)?'trainee':/junior|\bjr\b|entry.level|associate|graduate/.test(title)?'junior':null;
  if(!nivel)return [];
  const seen=new Set();
  return (Array.isArray(raw.apply_options)?raw.apply_options:[]).flatMap(option=>{
    const link=portalLink(option.link);if(!link || seen.has(link.url))return [];seen.add(link.url);
    return [{source_id:`${link.platform}:${link.url}`,fonte:'api_externa',origem_portal:link.platform,coletado_por:'serpapi_google_jobs',empresa:String(raw.company_name).slice(0,300),cargo:raw.title.slice(0,300),descricao:typeof raw.description==='string'?raw.description.slice(0,30000):'',requisitos:[],localizacao:typeof raw.location==='string'?raw.location:'Não informada',modalidade:raw.detected_extensions?.work_from_home===true?'remoto':'nao_informada',nivel,url_original:link.url,email_recrutamento_validado:false,metodo_candidatura:'link_externo',status:'ativa'}];
  });
}
export async function fetchPortalJobs({query='estágio OR trainee OR júnior',location='Brasil',apiKey,fetcher=fetch}={}) {
  if(!apiKey)return {jobs:[],fetched:0,status:'nao_configurado',message:'Gupy, LinkedIn e InfoJobs: configure SERPAPI_API_KEY nos segredos do Base44.'};
  const params=new URLSearchParams({engine:'google_jobs',q:query,location,gl:'br',hl:'pt',api_key:apiKey});
  let response;
  try {response=await fetcher(`https://serpapi.com/search.json?${params}`,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(20000)});}catch{throw new Error('Falha de conexão com a busca de portais.');}
  if(!response.ok)throw new Error(`Busca de portais indisponível (HTTP ${response.status}). Confira a chave e a cota SerpApi.`);
  let data;try{data=await response.json();}catch{throw new Error('Resposta inválida da busca de portais.');}
  if(data.error)throw new Error('A busca de portais recusou a consulta. Confira configuração e cota SerpApi.');
  if(!Array.isArray(data.jobs_results) && !data.search_information?.jobs_results_state?.includes('Fully empty'))throw new Error('Busca de portais sem resultado verificável.');
  const raw=data.jobs_results || [];
  return {jobs:raw.flatMap(normalizePortalJobs),fetched:raw.length,status:'consultado',portals,message:'Primeira página de vagas indexadas no Google Jobs; cobertura parcial dos portais.'};
}
