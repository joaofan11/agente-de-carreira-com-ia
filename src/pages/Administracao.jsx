import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import DemoNotice from "@/components/DemoNotice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  ShieldCheck, Loader2, Plus, Trash2, Users, Briefcase, Link2, Lock, Settings,
} from "lucide-react";

const modalidadeLabels = { presencial: "Presencial", hibrido: "Híbrido", remoto: "Remoto" };
const nivelLabels = { estagio: "Estágio", trainee: "Trainee", junior: "Júnior", pleno: "Pleno" };
const metodoLabels = { email: "E-mail", link_externo: "Link externo", plataforma: "Plataforma" };

const emptyForm = {
  cargo: "", empresa: "", localizacao: "Manaus/AM", modalidade: "presencial",
  nivel: "estagio", descricao: "", requisitos: "", data_publicacao: "",
  metodo_candidatura: "email", email_recrutamento_validado: false,
};

export default function Administracao() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [userCount, setUserCount] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const page = await base44.entities.Job.filter({}, { sort: "-created_date", limit: 50 });
      setJobs(page.items);
    } catch (e) {
      // ignore
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadJobs();
    base44.entities.User.list({ limit: 1 }).then((page) => {
      setUserCount(Array.isArray(page) ? page.length : (page.items?.length || 0));
    }).catch(() => {});
  }, [isAdmin]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!form.cargo.trim() || !form.empresa.trim()) {
      toast({ title: "Cargo e empresa são obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Job.create({
        fonte: "manual",
        cargo: form.cargo,
        empresa: form.empresa,
        localizacao: form.localizacao,
        modalidade: form.modalidade,
        nivel: form.nivel,
        descricao: form.descricao,
        requisitos: form.requisitos ? form.requisitos.split("\n").map((r) => r.trim()).filter(Boolean) : [],
        data_publicacao: form.data_publicacao || undefined,
        metodo_candidatura: form.metodo_candidatura,
        email_recrutamento_validado: form.email_recrutamento_validado,
        status: "ativa",
      });
      toast({ title: "Vaga cadastrada" });
      setForm(emptyForm);
      loadJobs();
    } catch (err) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJob = async (job) => {
    try {
      await base44.entities.Job.delete(job.id);
      setJobs((j) => j.filter((x) => x.id !== job.id));
      toast({ title: "Vaga removida" });
    } catch (err) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader icon={ShieldCheck} title="Administração" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Lock className="h-7 w-7" />
            </div>
            <p className="mt-4 font-medium">Acesso restrito</p>
            <p className="mt-1 text-sm text-muted-foreground">Esta área é disponível apenas para administradores.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title="Administração"
        description="Gestão técnica da plataforma. Administradores não acessam documentos pessoais dos estudantes."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Vagas cadastradas</p>
              <p className="text-2xl font-bold">{jobs.length}</p>
            </div>
            <Briefcase className="h-8 w-8 text-secondary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Usuários (estimado)</p>
              <p className="text-2xl font-bold">{userCount}</p>
            </div>
            <Users className="h-8 w-8 text-secondary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Integrações ativas</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <Link2 className="h-8 w-8 text-secondary" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="opportunities">
        <TabsList>
          <TabsTrigger value="opportunities"><Briefcase className="mr-1.5 h-4 w-4" /> Vagas</TabsTrigger>
          <TabsTrigger value="integrations"><Link2 className="mr-1.5 h-4 w-4" /> Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4 text-primary" /> Cadastrar vaga</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateJob} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="op_cargo">Cargo *</Label>
                  <Input id="op_cargo" value={form.cargo} onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="op_empresa">Empresa *</Label>
                  <Input id="op_empresa" value={form.empresa} onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="op_location">Localização</Label>
                  <Input id="op_location" value={form.localizacao} onChange={(e) => setForm((f) => ({ ...f, localizacao: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Modalidade</Label>
                    <Select value={form.modalidade} onValueChange={(v) => setForm((f) => ({ ...f, modalidade: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(modalidadeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nível</Label>
                    <Select value={form.nivel} onValueChange={(v) => setForm((f) => ({ ...f, nivel: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(nivelLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="op_date">Data de publicação</Label>
                  <Input id="op_date" type="date" value={form.data_publicacao} onChange={(e) => setForm((f) => ({ ...f, data_publicacao: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Método de candidatura</Label>
                  <Select value={form.metodo_candidatura} onValueChange={(v) => setForm((f) => ({ ...f, metodo_candidatura: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(metodoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="op_desc">Descrição</Label>
                  <Textarea id="op_desc" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={3} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="op_req">Requisitos (um por linha)</Label>
                  <Textarea id="op_req" value={form.requisitos} onChange={(e) => setForm((f) => ({ ...f, requisitos: e.target.value }))} rows={3} placeholder="Conhecimento em X&#10;Git básico" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 sm:col-span-2">
                  <div>
                    <Label htmlFor="op_email_valid" className="cursor-pointer">E-mail de recrutamento validado</Label>
                    <p className="text-xs text-muted-foreground">Confirma que o e-mail da vaga foi verificado</p>
                  </div>
                  <Switch id="op_email_valid" checked={form.email_recrutamento_validado} onCheckedChange={(v) => setForm((f) => ({ ...f, email_recrutamento_validado: v }))} />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Cadastrar vaga
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div>
            <h3 className="mb-3 font-semibold">Vagas cadastradas</h3>
            {loadingJobs ? (
              <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : jobs.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhuma vaga cadastrada.</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <Card key={job.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{job.cargo}</p>
                        <p className="text-sm text-muted-foreground">{job.empresa} · {job.localizacao}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-normal">{nivelLabels[job.nivel] || job.nivel}</Badge>
                        <Badge variant="outline" className="font-normal">{modalidadeLabels[job.modalidade] || job.modalidade}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteJob(job)} className="text-destructive hover:text-destructive" aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <DemoNotice title="Configuração de integrações — não implementada no MVP" />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Settings className="h-4 w-4 text-primary" /> Integrações disponíveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "WhatsApp Business API", desc: "Para aprovação de candidaturas", status: "Indisponível" },
                { name: "API de Vagas", desc: "Importação automática de oportunidades", status: "Indisponível" },
                { name: "IA de Compatibilidade", desc: "Análise de match perfil × vaga", status: "Indisponível" },
              ].map((i) => (
                <div key={i.name} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{i.desc}</p>
                  </div>
                  <Badge variant="outline" className="font-normal text-muted-foreground">{i.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}