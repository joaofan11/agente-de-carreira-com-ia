const sentStatuses = ['enviado','em_analise','entrevista'];
const validTime = value => { const time = value ? Date.parse(value) : NaN; return Number.isFinite(time) ? time : 0; };
const hasText = value => typeof value === 'string' && !!value.trim();
export function confirmedSend(app) {
  return !!app && sentStatuses.includes(app.status) && validTime(app.enviado_em) > 0 && hasText(app.identificador_envio) && !hasText(app.erro);
}
export function deriveCareerStatus(match, resume, app) {
  if (app) {
    if (app.status === 'cancelada_duplicada') return 'CANCELADA_DUPLICADA';
    if (hasText(app.erro)) return 'ERRO_ENVIO';
    if (app.status === 'recusado') return 'RECUSADA';
    if (sentStatuses.includes(app.status)) {
      if (app.status === 'entrevista') return 'ENTREVISTA';
      if (app.status === 'em_analise') return 'EM_ANALISE';
      return confirmedSend(app) ? 'ENVIADA' : 'ENVIO_SEM_CONFIRMACAO';
    }
    if (app.envio_token && !app.enviado_em) return 'ENVIO_EM_ANDAMENTO';
    if (app.status === 'acao_manual_necessaria') return 'ACAO_MANUAL_NECESSARIA';
    if (app.status === 'aprovado') return 'APROVADA';
    if (app.status === 'pendente_aprovacao') return 'AGUARDANDO_APROVACAO';
  }
  return resume ? 'CURRICULO_PREPARADO' : match ? 'ANALISADA' : 'ENCONTRADA';
}
const newest = record => Math.max(...['updated_date','data_analise','enviado_em','rejeitado_em','aprovado_em','criado_em','created_date'].map(key => validTime(record?.[key])),0);
export function buildCareerHistory({matches = [],resumes = [],applications = [],jobs = []}) {
  const index = rows => Object.fromEntries(rows.filter(row=>row?.id).map(row=>[row.id,row]));
  const byJob = (rows, newer = (a,b) => newest(a) > newest(b)) => {
    const result = {};
    for (const row of rows) if (row.job_id && (!result[row.job_id] || newer(row,result[row.job_id]))) result[row.job_id]=row;
    return result;
  };
  const jobMap=index(jobs),resumeIds=index(resumes),matchIds=index(matches),latestMatch=byJob(matches),latestResume=byJob(resumes,(a,b)=>Number(a.numero_versao || 1) > Number(b.numero_versao || 1) || (Number(a.numero_versao || 1) === Number(b.numero_versao || 1) && newest(a) > newest(b)));
  const makeRow = (jobId,app) => {
    const job=jobMap[jobId];
    const resume=app ? resumeIds[app.resume_version_id] : latestResume[jobId];
    const match=(resume?.match_id && matchIds[resume.match_id]) || latestMatch[jobId];
    const activity = app ? newest(app) : Math.max(newest(resume),newest(match));
    return {
      id:app ? 'application:'+app.id : 'activity:'+jobId, applicationId:app?.id || null,jobId,
      empresa:job?.empresa || '—',cargo:job?.cargo || 'Vaga indisponível',
      compatibilidade:match ? {score:match.score,nivel:match.nivel_compatibilidade} : null,
      dataAnalise:match?.data_analise || null,dataCriacao:app?.criado_em || app?.created_date || resume?.criado_em || resume?.created_date || null,
      dataAtividade:activity ? new Date(activity).toISOString() : null,
      status:deriveCareerStatus(match,resume,app),envioSemConfirmacao:!!app && sentStatuses.includes(app.status) && !confirmedSend(app),metodoEnvio:app?.metodo_envio || null,
      dataEnvio:confirmedSend(app) ? app.enviado_em : null,
      curriculoUtilizado:resume ? 'v'+(resume.numero_versao || 1) : app?.resume_version_id ? 'Versão indisponível' : null,
      identificadorEnvio:confirmedSend(app) ? app.identificador_envio : null,
      matchId:match?.id || null,urlExterna:job?.url_original || null,
    };
  };
  const result=applications.filter(app=>app.job_id).map(app=>makeRow(app.job_id,app));
  const jobIds=new Set([...Object.keys(latestMatch),...Object.keys(latestResume)]);
  for(const jobId of jobIds) {
    const ownApps=applications.filter(app=>app.job_id===jobId);
    if (!ownApps.length || (latestResume[jobId] && !ownApps.some(app=>app.resume_version_id===latestResume[jobId].id))) result.push(makeRow(jobId,null));
  }
  return result.sort((a,b)=>validTime(b.dataAtividade)-validTime(a.dataAtividade));
}
export function computeCareerEvolution(apps, timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const byDate={};
  const formatter=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'});
  for(const app of apps.filter(confirmedSend)) {
    const parts=Object.fromEntries(formatter.formatToParts(new Date(app.enviado_em)).map(part=>[part.type,part.value]));
    const iso=parts.year+'-'+parts.month+'-'+parts.day;
    byDate[iso]=(byDate[iso] || 0)+1;
  }
  return Object.entries(byDate).sort(([a],[b])=>a.localeCompare(b)).map(([iso,count])=>({date:iso.slice(8,10)+'/'+iso.slice(5,7),count}));
}
export async function hydrateCareerReferences(client, records) {
  const resumes=[...(records.resumes || [])],jobs=[...(records.jobs || [])];
  const load = async (entity,id) => {
    try { return await client.entities[entity].get(id); }
    catch(error) { const status=error.status || error.response?.status; if(status===403 || status===404)return null;throw error; }
  };
  const missingResumes=[...new Set((records.applications || []).map(app=>app.resume_version_id).filter(id=>id && !resumes.some(row=>row.id===id)))];
  for(let start=0;start<missingResumes.length;start+=10) resumes.push(...(await Promise.all(missingResumes.slice(start,start+10).map(id=>load('ResumeVersion',id)))).filter(Boolean));
  const jobIds=[...new Set([...(records.matches || []),...resumes,...(records.applications || [])].map(row=>row.job_id).filter(id=>id && !jobs.some(row=>row.id===id)))];
  for(let start=0;start<jobIds.length;start+=10) jobs.push(...(await Promise.all(jobIds.slice(start,start+10).map(id=>load('Job',id)))).filter(Boolean));
  return {...records,resumes,jobs};
}
export function recordsForMode(rows, demo) { return rows.filter(row => demo ? row.is_demo === true : row.is_demo !== true); }
