import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { finishEmailOAuth } from '../../shared/emailOAuth.ts';
export default async function(req){
 try{
  const url=new URL(req.url),state=url.searchParams.get('state'),code=url.searchParams.get('code');
  if(!state||state.length>200||!code||code.length>10000||url.searchParams.has('error'))throw Error('Autorização cancelada ou inválida.');
  await finishEmailOAuth(createClientFromRequest(req),state,code,secrets);
  return new Response(null,{status:303,headers:{Location:'https://anexa-ai.base44.app/configuracoes','Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
 }catch{return new Response('Não foi possível conectar a conta. Volte ao Anexa.AI e inicie uma nova conexão.',{status:400,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});}
}
