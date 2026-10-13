import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import DemoNotice from "@/components/DemoNotice";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function Candidaturas() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ opportunity_title: "", company: "" });

  const load = async () => {
    setLoading(true);
    try {
      const page = await base44.entities.Application.filter({}, { sort: "-created_date", limit: 50 });
      setApps(page.items);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Prefill from Oportunidades navigation
    if (location.state?.title) {
      setForm({ opportunity_title: location.state.title, company: location.state.company || "" });
      setOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.opportunity_title.trim()) {
      toast({ title: "Informe a vaga", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Application.create({
        opportunity_title: form.opportunity_title,
        company: form.company,
        status: "rascunho",
        whatsapp_approved: false,
      });
      toast({ title: "Candidatura criada como rascunho" });
      setOpen(false);
      setForm({ opportunity_title: "", company: "" });
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
  const approve = (app) => updateStatus(app, "aprovado", { whatsapp_approved: true });
  const send = (app) => updateStatus(app, "enviado", { applied_date: new Date().toISOString().slice(0, 10) });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Send}
        title="Candidaturas"
        description="Acompanhe o status de cada candidatura. Nenhuma candidatura é enviada sem sua aprovação."
        actions={<Button onClick={() => { setForm({ opportunity_title: "", company: "" }); setOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Nova candidatura</Button>}
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
            return (
              <Card key={app.id}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{app.opportunity_title}</p>
                        <p className="text-sm text-muted-foreground">{app.company || "Empresa não informada"}</p>
                        {app.applied_date && <p className="text-xs text-muted-foreground">Enviada em {new Date(app.applied_date).toLocaleDateString("pt-BR")}</p>}
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
              <Label htmlFor="app_title">Vaga *</Label>
              <Input id="app_title" value={form.opportunity_title} onChange={(e) => setForm((f) => ({ ...f, opportunity_title: e.target.value }))} placeholder="Título da vaga" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app_company">Empresa</Label>
              <Input id="app_company" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Nome da empresa" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
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