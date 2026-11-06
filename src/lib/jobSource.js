const labels={gupy:'Gupy',linkedin:'LinkedIn',infojobs:'InfoJobs',jobicy:'Jobicy'};
export function jobSource(job) {
  try {
    const u=new URL(job.url_original);
    if(u.protocol!=='https:' || u.username || u.password || u.port)return {label:job.fonte==='manual'?'Cadastrada':'Fonte não identificada',url:null};
    const host=u.hostname.toLowerCase();
    const portal=Object.entries({gupy:'gupy.io',linkedin:'linkedin.com',infojobs:'infojobs.com.br',jobicy:'jobicy.com'}).find(([,domain])=>host===domain||host.endsWith('.'+domain))?.[0];
    return {label:labels[portal] || 'Site da vaga',url:u.href};
  }catch{return {label:job.fonte==='manual'?'Cadastrada':'Fonte não identificada',url:null};}
}
