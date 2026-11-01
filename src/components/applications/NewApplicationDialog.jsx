import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// NewApplicationDialog — cria candidatura em pendente_aprovacao.
// Seleciona vaga, currículo e método de envio. Chama prepareApplication.
export default function NewApplicationDialog({ open, onClose, jobs, resumes, onCreated, repairApp = null }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ jobId: "", resumeId: "", metodo: "manual" });

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        if (['gmail','outlook','manual'].includes(me?.conta_padrao_envio)) {
          setForm((f) => ({ ...f, metodo: me.conta_padrao_envio }));
        }
      } catch {}
    })();
  }, []);

  useEffect(()=>{if(open && repairApp)setForm({jobId:repairApp.job_id,resumeId:repairApp.resume_version_id || '',metodo:repairApp.metodo_envio==='email'?'manual':repairApp.metodo_envio || 'manual'});},[open,repairApp]);
  const jobResumes = useMemo(
    () => resumes.filter((r) => r.job_id === form.jobId && r.status_revisao === "pronto" && !!r.referencia_pdf_privado),
    [resumes, form.jobId]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.jobId || !form.resumeId) {
      toast({ title: "Selecione vaga e currículo", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await base44.functions.invoke(repairApp ? "repairApplicationResume" : "prepareApplication", {
        ...(repairApp?{application_id:repairApp.id}:{}),
        job_id: form.jobId,
        resume_version_id: form.resumeId,
        metodo_envio: form.metodo,
      });
      toast({ title: "Candidatura preparada", description: "Aguardando sua aprovação." });
      setForm({ jobId: "", resumeId: "", metodo: "manual" });
      onClose?.();
      onCreated?.(res.data.application);
    } catch (err) {
      toast({ title: "Erro", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{repairApp ? 'Corrigir currículo ou canal' : 'Nova candidatura'}</DialogTitle>
          <DialogDescription>A candidatura será criada aguardando sua aprovação.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Vaga *</Label>
            <Select disabled={!!repairApp} value={form.jobId} onValueChange={(v) => setForm((f) => ({ ...f, jobId: v, resumeId: "" }))}>
              <SelectTrigger><SelectValue placeholder="Selecione uma vaga" /></SelectTrigger>
              <SelectContent>
                {jobs.map((j) => (
                <SelectItem key={j.id} value={j.id}>{j.cargo} — {j.empresa}{j.is_demo ? " (DEMO)" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Currículo *</Label>
            <Select value={form.resumeId} onValueChange={(v) => setForm((f) => ({ ...f, resumeId: v }))} disabled={!form.jobId}>
              <SelectTrigger><SelectValue placeholder={form.jobId ? "Selecione um currículo" : "Selecione uma vaga primeiro"} /></SelectTrigger>
              <SelectContent>
                {jobResumes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>Versão {r.numero_versao}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.jobId && jobResumes.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum currículo pronto para esta vaga. Gere um em "Currículos".</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Método de envio *</Label>
            <Select value={form.metodo} onValueChange={(v) => setForm((f) => ({ ...f, metodo: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gmail">Gmail</SelectItem>
                <SelectItem value="outlook">Outlook / Hotmail</SelectItem>
                <SelectItem value="api_direta">API direta</SelectItem>
                <SelectItem value="manual">Manual (link oficial)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving || !form.jobId || !form.resumeId}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Preparar candidatura
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}