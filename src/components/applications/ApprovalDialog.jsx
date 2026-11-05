import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import ResumeView from "@/components/resume/ResumeView";
import { CheckCircle2, XCircle, Loader2, Send, ShieldCheck } from "lucide-react";

const metodoLabels = {
  email: "E-mail",
  gmail: "Gmail",
  outlook: "Outlook",
  api_direta: "API direta",
  manual: "Manual",
};

// ApprovalDialog — tela de revisão final antes de aprovar ou recusar.
// Mostra vaga, currículo e método de envio. Registra decisão via backend.
export default function ApprovalDialog({ app, job, resume, open, onClose, onAction }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [done, setDone] = useState(null);
  const busy = useRef(false);
  const context = useRef(0);
  useEffect(() => {
    context.current++;
    busy.current=false;
    setDone(null);setShowReject(false);setMotivo("");setLoading(false);
    return () => { context.current++; };
  }, [app?.id,open]);
  const snapshot = () => ({application_id:app.id,resume_version_id:app.resume_version_id || '',metodo_envio:app.metodo_envio || '',...(app.updated_date ? {expected_updated_date:app.updated_date} : {})});
  const canDecide = app?.status === 'pendente_aprovacao' && !app?.envio_token && !app?.enviado_em;
  const canApprove = canDecide && resume?.id === app?.resume_version_id && resume?.status_revisao === 'pronto' && !!resume?.referencia_pdf_privado && !!resume?.conteudo_estruturado?.contato?.nome && job?.id === app?.job_id && job?.status === 'ativa';
  const message = error => error.response?.data?.error || error.data?.error || error.message;
  const reportAudit = data => { if (data.audit_recorded === false) toast({title:"Decisão salva; auditoria de conclusão pendente",description:"A decisão foi registrada. Não repita a ação; atualize a lista.",variant:"destructive"}); };

  const handleApprove = async () => {
    if (busy.current || !canApprove) return;
    const current=context.current;busy.current=true;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("approveApplication", snapshot());
      if(current!==context.current)return;
      setDone("aprovado");
      if(res.data.audit_recorded===false)reportAudit(res.data);
      else toast({ title: "Candidatura aprovada", description: "Decisão registrada. O envio é uma ação separada." });
      onAction?.(res.data.application);
    } catch (err) {
      if(current!==context.current)return;
      toast({ title: "Erro ao aprovar", description: message(err), variant: "destructive" });
    } finally {
      if(current===context.current){busy.current=false;setLoading(false);}
    }
  };

  const handleReject = async () => {
    if(busy.current || !canDecide)return;
    const current=context.current;busy.current=true;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("rejectApplication", {
        ...snapshot(),
        motivo: motivo.trim() || undefined,
      });
      if(current!==context.current)return;
      setDone("recusado");
      if(res.data.audit_recorded===false)reportAudit(res.data);
      else toast({ title: "Candidatura recusada" });
      onAction?.(res.data.application);
    } catch (err) {
      if(current!==context.current)return;
      toast({ title: "Erro ao recusar", description: message(err), variant: "destructive" });
    } finally {
      if(current===context.current){busy.current=false;setLoading(false);}
    }
  };

  const handleClose = () => {
    if(busy.current)return;
    setDone(null);
    setShowReject(false);
    setMotivo("");
    onClose?.();
  };

  if (!app) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisar candidatura</DialogTitle>
          <DialogDescription>Confira vaga, currículo e canal. Aprovar registra sua decisão; o envio ocorre em uma ação separada.</DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center py-8 text-center">
            {done === "aprovado" ? (
              <>
                <CheckCircle2 className="h-12 w-12 text-secondary" />
                <p className="mt-4 font-medium">Candidatura aprovada!</p>
                <p className="mt-1 text-sm text-muted-foreground">Agora você pode enviar a candidatura.</p>
              </>
            ) : (
              <>
                <XCircle className="h-12 w-12 text-destructive" />
                <p className="mt-4 font-medium">Candidatura recusada</p>
                <p className="mt-1 text-sm text-muted-foreground">O currículo não será enviado.</p>
              </>
            )}
            <Button className="mt-6" onClick={handleClose}>Concluir</Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Vaga</p>
                <p className="font-medium">{job?.cargo || "Vaga não encontrada"}</p>
                <p className="text-sm text-muted-foreground">{job?.empresa || "—"}</p>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Send className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Envio via:</span>
                <Badge variant="outline">{metodoLabels[app.metodo_envio] || app.metodo_envio}</Badge>
              </div>

              {!canDecide && <p role="alert" className="text-sm text-amber-800">Esta candidatura não está disponível para decisão. Atualize a lista.</p>}
              {canDecide && !canApprove && <p role="alert" className="text-sm text-amber-800">Vaga ou currículo indisponível para aprovação. Confira o vínculo e a versão aprovada; você ainda pode recusar.</p>}
              <div>
                <p className="mb-2 text-sm font-medium">Currículo a ser enviado{resume ? ` — v${resume.numero_versao || 1}` : ''}:</p>
                <div className="max-h-[300px] overflow-y-auto rounded-lg border bg-muted/30 p-4">
                  {resume?.conteudo_estruturado ? (
                    <ResumeView resume={resume.conteudo_estruturado} />
                  ) : (
                    <p className="text-sm text-muted-foreground">Currículo não encontrado.</p>
                  )}
                </div>
              </div>
            </div>

            {showReject && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Motivo da recusa (opcional)</label>
                <Textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex: Vaga não corresponde mais ao meu perfil..."
                  rows={2}
                  maxLength={1000}
                />
              </div>
            )}

            <DialogFooter className="gap-2">
              {!showReject ? (
                <>
                  <Button variant="outline" onClick={() => setShowReject(true)} disabled={loading || !canDecide}>
                    <XCircle className="mr-2 h-4 w-4 text-destructive" /> Recusar
                  </Button>
                  <Button onClick={handleApprove} disabled={loading || !canApprove}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Aprovar candidatura
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setShowReject(false)} disabled={loading}>
                    Voltar
                  </Button>
                  <Button variant="destructive" onClick={handleReject} disabled={loading || !canDecide}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                    Confirmar recusa
                  </Button>
                </>
              )}
            </DialogFooter>

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              A candidatura só será enviada após sua aprovação explícita.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}