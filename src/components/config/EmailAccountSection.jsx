import React,{useState,useEffect,useCallback} from 'react';
import {base44} from '@/api/base44Client';
import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
export default function EmailAccountSection({provider}){
 const [status,setStatus]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const load=useCallback(async()=>{try{const r=await base44.functions.invoke('emailConnection',{action:'status',provider});setStatus(r.data);setError('');}catch(e){setError(e.response?.data?.error||e.message);}},[provider]);
 useEffect(()=>{load();},[load]);
 const act=async action=>{if(busy)return;setBusy(true);setError('');try{const r=await base44.functions.invoke('emailConnection',{action,provider});if(action==='connect'){const u=new URL(r.data.url);const expected=provider==='gmail'?'accounts.google.com':'login.microsoftonline.com';if(u.protocol!=='https:'||u.hostname!==expected)throw Error('Endereço de autorização inválido.');window.location.assign(u.href);}else await load();}catch(e){setError(e.response?.data?.error||e.message);}finally{setBusy(false);}};
 return <Card><CardHeader><CardTitle>{provider==='gmail'?'Gmail':'Outlook / Hotmail'}</CardTitle></CardHeader><CardContent className="space-y-3">
 <p className="text-sm">Conecte a conta que enviará seu currículo após sua aprovação. Você autoriza no site do provedor; não solicitamos sua senha.</p>
 <p className="text-sm">{status?.connected?'Conta conectada: '+status.email:status?.configured?'Nenhuma conta conectada.':'Integração aguardando configuração pela equipe Anexa.AI.'}</p>
 {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 <div className="flex gap-2"><Button disabled={busy||!status?.configured} onClick={()=>act('connect')}>{status?.connected?'Reconectar':'Conectar'}</Button>{status?.connected&&<Button variant="outline" disabled={busy} onClick={()=>act('disconnect')}>Desconectar</Button>}<Button variant="outline" disabled={busy} onClick={load}>Atualizar</Button></div>
 <p className="text-xs text-muted-foreground">Desconectar impede novos envios pelo Anexa.AI. Para revogar também a permissão no provedor, remova o acesso nas configurações da sua conta Google ou Microsoft.</p>
 </CardContent></Card>;
}
