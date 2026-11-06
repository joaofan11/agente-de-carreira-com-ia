// Run in a trusted scheduler. Never embed this signing secret in the browser.
import {createHmac} from 'node:crypto';
const key=process.env.AUTOMATION_SIGNING_SECRET,base=process.env.ANEXA_FUNCTIONS_BASE_URL;
if(!key||key.length<32||!base)throw Error('Configure AUTOMATION_SIGNING_SECRET e ANEXA_FUNCTIONS_BASE_URL no agendador.');
const url=new URL(base);
if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!['anexa-ai.base44.app','app.base44.com','base44.app'].includes(url.hostname))throw Error('Use a URL HTTPS oficial das funções do aplicativo.');
for(const name of ['runJobCollection','runCandidateProcessing']){
 const timestamp=String(Date.now()),body='{}';
 const signature=createHmac('sha256',key).update(timestamp+'\n'+name+'\n'+body).digest('hex');
 const response=await fetch(base.replace(/\/$/,'')+'/'+name,{method:'POST',headers:{'Content-Type':'application/json','X-Anexa-Timestamp':timestamp,'X-Anexa-Signature':signature},body,signal:AbortSignal.timeout(240000)});
 if(!response.ok)throw Error(name+' não concluído: HTTP '+response.status+'. Confira a execução no painel.');
 const result=await response.json();console.log(JSON.stringify({function:name,success:result.success,skipped:result.skipped,run_id:result.run_id}));
}
