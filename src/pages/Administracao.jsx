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

const workModels = { presencial: "Presencial", hibrido: "Híbrido", remoto: "Remoto" };
const contractTypes = { estagio: "Estágio", trainee: "Trainee", clt: "CLT", pj: "PJ" };

export default function Administracao() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const [ops, setOps] = useState([]);
  const [loadingOps, setLoadingOps] = useState(true);
  const [userCount, setUserCount] = useState(0);
  const [form, setForm] = useState({
    title: "", company: "", location: "Manaus/AM", work_model: "presencial",
    contract_type: "estagio", salary_min: "", salary_max: "", description: "", requirements: "",
  });
  const [saving, setSaving] = useState(false);

  const loadOps = async () => {
    setLoadingOps(true);
    try {
      const page = await base44.entities.Opportunity.filter({}, { sort: "-created_date", limit: 50 });
      setOps(page.items);
    } catch (e) {
      // ignore
    } finally {
      setLoadingOps(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadOps();
    base44.entities.User.list({ limit: 1 }).then((page) => {
      // User list returns array; approximate count from items length (demo)
      setUserCount(Array.isArray(page) ? page.length : (page.items?.length || 0));
    }).catch(() => {});
  }, [isAdmin]);

  const handleCreateOp = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim()) {
      toast({ title: "Título e empresa são obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Opportunity.create({
        title: form.title,
        company: form.company,
        location: form.location,
        work_model: form.work_model,
        contract_type: form.contract_type,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        description: form.description,
        requirements: form.requirements ? form.requirements.split("\n").map((r) => r.trim()).filter(Boolean) : [],
        status: "ativa",
        source: "manual",
      });
      toast({ title: "Vaga cadastrada" });
      setForm({ title: "", company: "", location: "Manaus/AM", work_model: "presencial", contract_type: "estagio", salary_min: "", salary_max: "", description: "", requirements: "" });
      loadOps();
    } catch (err) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOp = async (op) => {
    try {
      await base44.entities.Opportunity.delete(op.id);
      setOps((o) => o.filter((x) => x.id !== op.id));
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
              <p className="text-2xl font-bold">{ops.length}</p>
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
          <TabsTrigger value="opportunities"><Briefcase className="mr-1.5 h-4 w-4" /> Oportunidades</TabsTrigger>
          <TabsTrigger value="integrations"><Link2 className="mr-1.5 h-4 w-4" /> Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4 text-primary" /> Cadastrar vaga</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOp} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="op_title">Título *</Label>
                  <Input id="op_title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="op_company">Empresa *</Label>
                  <Input id="op_company" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="op_location">Localização</Label>
                  <Input id="op_location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Select value={form.work_model} onValueChange={(v) => setForm((f) => ({ ...f, work_model: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(workModels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Contrato</Label>
                    <Select value={form.contract_type} onValueChange={(v) => setForm((f) => ({ ...f, contract_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(contractTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="op_salary">Faixa salarial (mín - máx)</Label>
                  <div className="flex gap-2">
                    <Input id="op_salary" type="number" placeholder="Mínimo" value={form.salary_min} onChange={(e) => setForm((f) => ({ ...f, salary_min: e.target.value }))} />
                    <Input type="number" placeholder="Máximo" value={form.salary_max} onChange={(e) => setForm((f) => ({ ...f, salary_max: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="op_desc">Descrição</Label>
                  <Textarea id="op_desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="op_req">Requisitos (um por linha)</Label>
                  <Textarea id="op_req" value={form.requirements} onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))} rows={3} placeholder="Conhecimento em X&#10;Git básico" />
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
            {loadingOps ? (
              <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : ops.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhuma vaga cadastrada.</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {ops.map((op) => (
                  <Card key={op.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{op.title}</p>
                        <p className="text-sm text-muted-foreground">{op.company} · {op.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-normal">{contractTypes[op.contract_type]}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteOp(op)} className="text-destructive hover:text-destructive" aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>
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