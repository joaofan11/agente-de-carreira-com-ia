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

// OutlookPreviewDialog — prévia do destinatário, assunto e corpo antes do envio via Outlook.
export default function OutlookPreviewDialog({ app, job, resume, profile, open, onClose, onSent }) {
  const { toast } = useToast();
  const [destinatario, setDestinatario] = useState("");
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState({ subject: "", body: "" });

  useEffect(() => {
    if (job) {
      setDestinatario(job.email_recrutamento || "");
    }
    if (job && profile) {
      const cargo = job.cargo || "Vaga";
      const nome = profile.nome_completo || "Candidato(a)";
      const curso = profile.curso || "Ensino Superior";
      setPreview({
        subject: "Candidatura para " + cargo + " - " + nome,
        body:
          "Prezados,\n\n" +
          "Gostaria de apresentar minha candidatura a oportunidade de " + cargo + ".\n" +
          "Sou estudante de " + curso + " e tenho interesse em contribuir com a equipe.\n" +
          "Encaminho meu curriculo para avaliacao.\n\n" +
          "Atenciosamente,\n" + nome,
      });
    }
  }, [job, profile]);

  const handleSend = async () => {
    if (!destinatario.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinatario.trim())) {
      toast({ title: "E-mail de destino inválido", description: "Confirme o e-mail do recrutador.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await base44.functions.invoke("sendOutlookApplication", {
        application_id: app.id,
        destinatario: destinatario.trim(),
      });
      if (res.data?.success) {
        toast({ title: "Candidatura enviada via Outlook", description: "HTTP 202 aceito para processamento." });
        onSent?.(res.data.application);
      } else if (res.data?.configured === false) {
        toast({ title: "Outlook não configurado", description: res.data.error, variant: "destructive" });
      } else if (res.data?.connected === false) {
        toast({ title: "Outlook não conectado", description: res.data.error, variant: "destructive" });
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
            <Mail className="h-5 w-5 text-primary" /> Enviar via Outlook
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

          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>HTTP 202 confirma aceitação para processamento, não entrega ao recrutador. Cópia salva em Itens Enviados.</span>
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