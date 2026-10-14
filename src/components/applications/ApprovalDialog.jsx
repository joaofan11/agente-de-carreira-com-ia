import React, { useState } from "react";
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

  const handleApprove = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("approveApplication", {
        application_id: app.id,
      });
      setDone("aprovado");
      toast({ title: "Candidatura aprovada", description: "Você pode enviá-la agora." });
      onAction?.(res.data.application);
    } catch (err) {
      toast({ title: "Erro ao aprovar", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("rejectApplication", {
        application_id: app.id,
        motivo: motivo || undefined,
      });
      setDone("recusado");
      toast({ title: "Candidatura recusada" });
      onAction?.(res.data.application);
    } catch (err) {
      toast({ title: "Erro ao recusar", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
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
          <DialogDescription>Confirme os dados antes de aprovar ou recusar o envio.</DialogDescription>
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

              <div>
                <p className="mb-2 text-sm font-medium">Currículo a ser enviado:</p>
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
                />
              </div>
            )}

            <DialogFooter className="gap-2">
              {!showReject ? (
                <>
                  <Button variant="outline" onClick={() => setShowReject(true)} disabled={loading}>
                    <XCircle className="mr-2 h-4 w-4 text-destructive" /> Recusar
                  </Button>
                  <Button onClick={handleApprove} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Aprovar candidatura
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setShowReject(false)} disabled={loading}>
                    Voltar
                  </Button>
                  <Button variant="destructive" onClick={handleReject} disabled={loading}>
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