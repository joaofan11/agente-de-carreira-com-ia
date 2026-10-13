import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import DemoNotice from "@/components/DemoNotice";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/components/ui/use-toast";
import {
  Send, Loader2, Plus, Trash2, MessageSquare, CheckCircle2, Clock, Lock, FileText, XCircle,
} from "lucide-react";

const statusConfig = {
  rascunho: { label: "Rascunho", color: "outline", icon: FileText },
  pendente_aprovacao: { label: "Aprovação pendente", color: "secondary", icon: Clock },
  aprovado: { label: "Aprovado", color: "secondary", icon: CheckCircle2 },
  enviado: { label: "Enviado", color: "default", icon: Send },
  em_analise: { label: "Em análise", color: "outline", icon: Clock },
  recusado: { label: "Recusado", color: "destructive", icon: XCircle },
  entrevista: { label: "Entrevista", color: "default", icon: CheckCircle2 },
};

const activeStatuses = ["rascunho", "pendente_aprovacao", "aprovado", "enviado", "em_analise", "entrevista"];

export default function Candidaturas() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ jobId: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [appPage, jobPage] = await Promise.all([
        base44.entities.Application.filter({ is_demo: { $ne: true } }, { sort: "-created_date", limit: 50 }),
        base44.entities.Job.filter({ status: "ativa" }, { sort: "-created_date", limit: 100 }),
      ]);
      setApps(appPage.items);
      setJobs(jobPage.items);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (location.state?.jobId) {
      setForm({ jobId: location.state.jobId });
      setOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  const jobMap = {};
  jobs.forEach((j) => { jobMap[j.id] = j; });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.jobId) {
      toast({ title: "Selecione uma vaga", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // Duplicate prevention: block active application for same user+job
      const existing = await base44.entities.Application.filter(
        { job_id: form.jobId, status: { $in: activeStatuses } },
        { limit: 1 }
      );
      if (existing.items.length > 0) {
        toast({ title: "Você já tem uma candidatura ativa para esta vaga.", variant: "destructive" });
        setSaving(false);
        return;
      }
      await base44.entities.Application.create({
        user_id: user.id,
        job_id: form.jobId,
        status: "rascunho",
        criado_em: new Date().toISOString(),
      });
      toast({ title: "Candidatura criada como rascunho" });
      setOpen(false);
      setForm({ jobId: "" });
      load();
    } catch (err) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (app, status, extra = {}) => {
    try {
      const updated = await base44.entities.Application.update(app.id, { status, ...extra });
      setApps((a) => a.map((x) => (x.id === app.id ? updated : x)));
      toast({ title: "Status atualizado" });
    } catch (err) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (app) => {
    try {
      await base44.entities.Application.delete(app.id);
      setApps((a) => a.filter((x) => x.id !== app.id));
    } catch (err) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const requestApproval = (app) => updateStatus(app, "pendente_aprovacao");
  const approve = (app) =>
    updateStatus(app, "aprovado", {
      codigo_aprovacao: crypto.randomUUID(),
      aprovado_em: new Date().toISOString(),
    });
  const send = (app) =>
    updateStatus(app, "enviado", {
      enviado_em: new Date().toISOString(),
      metodo_envio: "whatsapp",
    });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Send}
        title="Candidaturas"
        description="Acompanhe o status de cada candidatura. Nenhuma candidatura é enviada sem sua aprovação."
        actions={<Button onClick={() => { setForm({ jobId: "" }); setOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Nova candidatura</Button>}
      />

      <DemoNotice title="Aprovação por WhatsApp — integração não configurada" />

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : apps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Send className="h-7 w-7" />
            </div>
            <p className="mt-4 font-medium">Nenhuma candidatura ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">Crie uma candidatura a partir das oportunidades ou manualmente.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => {
            const cfg = statusConfig[app.status] || statusConfig.rascunho;
            const Icon = cfg.icon;
            const job = jobMap[app.job_id];
            return (
              <Card key={app.id}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{job?.cargo || "Vaga não encontrada"}</p>
                        <p className="text-sm text-muted-foreground">{job?.empresa || "—"}</p>
                        {app.enviado_em && <p className="text-xs text-muted-foreground">Enviada em {new Date(app.enviado_em).toLocaleDateString("pt-BR")}</p>}
                      </div>
                    </div>
                    <Badge variant={cfg.color} className="font-normal w-fit">{cfg.label}</Badge>
                  </div>

                  {/* Action flow */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                    {app.status === "rascunho" && (
                      <Button size="sm" variant="outline" onClick={() => requestApproval(app)}>
                        <MessageSquare className="mr-1.5 h-4 w-4 text-secondary" /> Solicitar aprovação
                      </Button>
                    )}
                    {app.status === "pendente_aprovacao" && (
                      <Button size="sm" variant="outline" onClick={() => approve(app)}>
                        <CheckCircle2 className="mr-1.5 h-4 w-4 text-secondary" /> Confirmar aprovação
                      </Button>
                    )}
                    {app.status === "aprovado" && (
                      <Button size="sm" onClick={() => send(app)}>
                        <Send className="mr-1.5 h-4 w-4" /> Enviar candidatura
                      </Button>
                    )}
                    {app.status === "enviado" && (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Lock className="h-4 w-4" /> Candidatura enviada — aguardando resposta
                      </span>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(app)} className="ml-auto text-destructive hover:text-destructive">
                      <Trash2 className="mr-1.5 h-4 w-4" /> Remover
                    </Button>
                  </div>

                  {app.status === "pendente_aprovacao" && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      A aprovação real será enviada e confirmada via WhatsApp quando a integração for configurada.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova candidatura</DialogTitle>
            <DialogDescription>A candidatura será criada como rascunho.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Vaga *</Label>
              <Select value={form.jobId} onValueChange={(v) => setForm((f) => ({ ...f, jobId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione uma vaga" /></SelectTrigger>
                <SelectContent>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>{j.cargo} — {j.empresa}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {jobs.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhuma vaga ativa disponível no momento.</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving || !form.jobId}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar rascunho
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}