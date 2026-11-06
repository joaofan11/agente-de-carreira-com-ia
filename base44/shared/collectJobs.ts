import { fetchJobicyJobs } from './jobicyClient.ts';
import { normalizeJobicyJob, filterEntryLevel } from './jobNormalizer.ts';
import { fetchPortalJobs } from './portalJobs.ts';
import { saveNewJobs } from './jobStorage.ts';
export async function collectJobs(base44,{query,location,pages=1}={}) {
  const jobs=[],sources=[];let fetched=0;
  try {
    let cursor=null;
    for(let p=0;p<pages;p++){
      const page=await fetchJobicyJobs({count:200,cursor});fetched+=page.jobs.length;
      jobs.push(...filterEntryLevel(page.jobs.map(normalizeJobicyJob).filter(Boolean)));
      cursor=page.nextCursor;if(!cursor)break;
    }
    sources.push({source:'Jobicy',status:'consultado'});
  }catch{sources.push({source:'Jobicy',status:'erro',message:'Não foi possível consultar Jobicy.'});}
  try {
    const result=await fetchPortalJobs({query,location,apiKey:Deno.env.get('SERPAPI_API_KEY')});
    jobs.push(...result.jobs);fetched+=result.fetched;
    sources.push({source:'Gupy / LinkedIn / InfoJobs (via Google Jobs)',status:result.status,message:result.message});
  }catch(error){sources.push({source:'Gupy / LinkedIn / InfoJobs (via Google Jobs)',status:'erro',message:error.message});}
  if(!sources.some(s=>s.status==='consultado'))throw new Error('Nenhuma fonte pôde ser consultada. Confira a configuração das APIs.');
  const result=await saveNewJobs(base44,jobs);
  return {...result,fetched,entryLevel:jobs.length,sources,fonte:sources.filter(s=>s.status==='consultado').map(s=>s.source).join(', '),warnings:sources.filter(s=>s.status!=='consultado').map(s=>s.message),fetchedAt:new Date().toISOString()};
}
