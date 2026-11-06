import React,{useState,useRef} from 'react';
import {base44} from '@/api/base44Client';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import ResumeView from '@/components/resume/ResumeView';
export default function WhatsAppApprovalDialog({app,job,resume,onClose,onRequested}){
 const [recipient,setRecipient]=useState(app.destinatario_confirmado||job?.email_recrutamento||''),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState(false),[logPending,setLogPending]=useState(false);const lock=useRef(false);
 const send=async()=>{if(lock.current||!confirmed)return;lock.current=true;setBusy(true);setError('');try{const result=await base44.functions.invoke('sendWhatsAppAlert',{application_id:app.id,destinatario:recipient.trim()});setLogPending(result.data.notification_recorded===false);setDone(true);onRequested?.();}catch(e){setError(e.response?.data?.error||e.message);}finally{lock.current=false;setBusy(false);}};
 return <Dialog open onOpenChange={o=>{if(!o&&!lock.current)onClose();}}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Aprovar pelo WhatsApp</DialogTitle><DialogDescription>Ao responder APROVAR com o código, você autoriza enviar este currículo ao destinatário abaixo pela conta {app.metodo_envio} conectada. A solicitação ainda não envia o currículo.</DialogDescription></DialogHeader>
 {done?<><p>Solicitação aceita pelo provedor de WhatsApp. Confira o recebimento. Responda à mensagem recebida com APROVAR ou RECUSAR e o código. Acompanhe o resultado em Candidaturas.</p>{logPending&&<p role="alert">Mensagem aceita pelo provedor; registro no histórico pendente. Não repita a solicitação.</p>}<Button onClick={onClose}>Concluir</Button></>:<>
 <p>{job?.cargo} — {job?.empresa} · Currículo v{resume?.numero_versao||1}</p>
 {resume?.conteudo_estruturado?<div className="max-h-60 overflow-auto"><ResumeView resume={resume.conteudo_estruturado}/></div>:<p>Currículo indisponível para revisão.</p>}
 <label className="text-sm">E-mail publicado para candidaturas<Input type="email" value={recipient} onChange={e=>{setRecipient(e.target.value);setConfirmed(false);}} disabled={busy}/></label>
 <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)}/>Conferi o anúncio e confirmo que este endereço recebe candidaturas para esta vaga.</label>
 <p className="text-xs text-muted-foreground">Se a vaga aceita apenas formulário de Gupy, LinkedIn ou InfoJobs, não use um e-mail genérico como substituto. A candidatura nesses portais ainda requer integração autorizada.</p>
 {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 <Button disabled={busy||!confirmed||!recipient.trim()||!resume?.conteudo_estruturado} onClick={send}>{busy?'Solicitando…':'Solicitar aprovação pelo WhatsApp'}</Button></>}
 </DialogContent></Dialog>;
}
