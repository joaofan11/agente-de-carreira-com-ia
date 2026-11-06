import React,{useState,useEffect} from 'react';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
export default function RecruitmentEmailSetup({job}){
 const [admin,setAdmin]=useState(false),[email,setEmail]=useState(job.email_recrutamento||''),[url,setUrl]=useState(job.email_fonte_url||job.url_original||''),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{base44.auth.me().then(user=>setAdmin(user.role==='admin')).catch(()=>{});},[]);
 if(!admin)return null;
 const save=async()=>{setBusy(true);setMessage('');try{await base44.functions.invoke('setJobRecruitmentEmail',{job_id:job.id,email,source_url:url,confirmed});setMessage('Destino verificado salvo. Atualize a listagem.');}catch(e){setMessage(e.response?.data?.error||e.message);}finally{setBusy(false);}};
 return <div className="space-y-2 border-t pt-3"><p className="text-sm font-medium">Revisão administrativa do destino de candidatura</p><label className="text-sm">E-mail publicado no anúncio<Input value={email} type="email" onChange={e=>{setEmail(e.target.value);setConfirmed(false);}}/></label><label className="text-sm">URL do anúncio que informa esse e-mail<Input value={url} onChange={e=>{setUrl(e.target.value);setConfirmed(false);}}/></label><label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>Conferi que o anúncio aceita currículo por este e-mail. Não estou substituindo um formulário obrigatório.</label><Button disabled={!confirmed||busy} onClick={save}>Salvar destino verificado</Button>{message&&<p role="status" className="text-sm">{message}</p>}</div>;
}
