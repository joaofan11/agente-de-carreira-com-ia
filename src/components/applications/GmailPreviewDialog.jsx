import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Mail, AlertTriangle, FileText, Send } from "lucide-react";

// GmailPreviewDialog — prévia do destinatário, assunto e corpo antes do envio via Gmail.
export default function GmailPreviewDialog({ app, job, resume, profile, open, onClose, onSent }) {
  const { toast } = useToast();
  const [destinatario, setDestinatario] = useState("");
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState({ subject: "", body: "" });

  useEffect(() => {
    if (job) {
      setDestinatario(app?.destinatario_confirmado || job.email_recrutamento || "");
    }
    if (job && resume) {
      const profile = {nome_completo:resume.conteudo_estruturado?.contato?.nome,curso:resume.conteudo_estruturado?.formacao_academica?.[0]?.curso};
      const cargo = job.cargo || "Vaga";
      const nome = profile.nome_completo || "Candidato(a)";

      setPreview({
        subject: "Candidatura para " + cargo + " - " + nome,
        body:
          "Prezados,\n\n" +
          "Apresento minha candidatura para " + cargo + ". Encaminho meu currículo em anexo para avaliação.\n\n" +
          "Atenciosamente,\n" + nome,
      });
    }
  }, [job, profile, resume]);

  const handleSend = async () => {
    if (!destinatario.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinatario.trim())) {
      toast({ title: "E-mail de destino inválido", description: "Confirme o e-mail do recrutador.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await base44.functions.invoke("sendGmailApplication", {
        application_id: app.id,
        destinatario: destinatario.trim(),
      });
      if (res.data?.success) {
        if(res.data.audit_recorded===false)toast({title:"Envio aceito; auditoria de conclusão pendente",description:"Não repita o envio. Confira a pasta Enviados.",variant:"destructive"});
        else toast({ title: "Candidatura enviada via Gmail", description: "Message ID: " + (res.data.message_id || "") });
        onSent?.(res.data.application);
      } else if (res.data?.configured === false) {
        toast({ title: "Gmail não configurado", description: res.data.error, variant: "destructive" });
      } else if (res.data?.connected === false) {
        toast({ title: "Gmail não conectado", description: res.data.error, variant: "destructive" });
      } else {
        toast({ title: "Falha no envio", description: res.data?.error || "Erro desconhecido.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erro", description: err.response?.data?.error || err.message, variant: "destructive" });
    }
    setSending(false);
  };

  if (!app) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Enviar via Gmail
          </DialogTitle>
          <DialogDescription>Revise o destinatário e o conteúdo antes de enviar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Destinatário (e-mail do recrutador) *</Label>
            <Input
              type="email"
              value={destinatario}
              onChange={(e) => setDestinatario(e.target.value)}
              placeholder="recrutador@empresa.com"
            />
            {!job?.email_recrutamento && (
              <p className="text-xs text-amber-700 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> E-mail não confirmado pela fonte — verifique antes de enviar.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Assunto</Label>
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">{preview.subject}</div>
          </div>

          <div className="space-y-1.5">
            <Label>Corpo do e-mail</Label>
            <Textarea value={preview.body} readOnly rows={7} className="text-sm" />
          </div>

          <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Anexo:</span>
            <Badge variant="outline">Currículo PDF</Badge>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>Cancelar</Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Enviar candidatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
