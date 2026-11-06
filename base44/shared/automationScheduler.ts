import { requireAutomationAdmin } from './automationControls.ts';
export async function automationActor(client,req,secrets,functionName){
 const user=await requireAutomationAdmin(client);if(user)return {...user,origin:'manual'};
 const key=secrets.get('AUTOMATION_SIGNING_SECRET'),timestamp=req.headers.get('X-Anexa-Timestamp'),signature=req.headers.get('X-Anexa-Signature');
 if(typeof key!=='string'||key.length<32||!/^\d{13}$/.test(timestamp||'')||Math.abs(Date.now()-Number(timestamp))>300000||!/^\w{64}$/.test(signature||''))return null;
 const body=await req.clone().text();if(body.length>2000)return null;
 const cryptoKey=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signed=new Uint8Array(await crypto.subtle.sign('HMAC',cryptoKey,new TextEncoder().encode(timestamp+'\n'+functionName+'\n'+body)));
 const actual=Array.from(signed,b=>b.toString(16).padStart(2,'0')).join('');let diff=0;for(let i=0;i<actual.length;i++)diff|=actual.charCodeAt(i)^signature.charCodeAt(i);
 return diff===0?{id:'signed_scheduler',role:'admin',origin:'agendado'}:null;
}
