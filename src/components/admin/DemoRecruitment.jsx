import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Inbox, Building2, Send } from "lucide-react";

const DEMO_ENDPOINT = "demo://receive-demo-application";

// DemoRecruitment — módulo de recrutamento demo para teste de submissão direta por API.
// Empresa fictícia, vagas marcadas is_demo=true, segregadas dos dados reais.
export default function DemoRecruitment() {
  const { toast } = useToast();
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    cargo: "", empresa: "", localizacao: "Manaus/AM",
    descricao: "", requisitos: "",
  });
  const [saving, setSaving] = useState(false);

  const loadReceived = async () => {
    setLoading(true);
    try {
      const page = await base44.entities.ReceivedApplication.filter(
        { is_demo: true },
        { sort: "-created_date", limit: 50 }
      );
      setReceived(page.items);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadReceived(); }, []);

  const handleCreateDemoJob = async (e) => {
    e.preventDefault();
    if (!form.cargo.trim() || !form.empresa.trim()) {
      toast({ title: "Cargo e empresa são obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const batchId = "demo-" + new Date().getTime();
      await base44.entities.Job.create({
        fonte: "manual",
        cargo: form.cargo,
        empresa: form.empresa + " (DEMO)",
        localizacao: form.localizacao,
        modalidade: "remoto",
        nivel: "estagio",
        descricao: form.descricao || "Vaga de demonstração para teste de submissão direta por API.",
        requisitos: form.requisitos ? form.requisitos.split("\n").map((r) => r.trim()).filter(Boolean) : [],
        metodo_candidatura: "plataforma",
        api_endpoint: DEMO_ENDPOINT,
        is_demo: true,
        demo_batch_id: batchId,
        status: "ativa",
      });
      toast({ title: "Vaga demo criada", description: "Endpoint: " + DEMO_ENDPOINT });
      setForm({ cargo: "", empresa: "", localizacao: "Manaus/AM", descricao: "", requisitos: "" });
    } catch (err) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-800">
        <Building2 className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <strong>Módulo de Recrutamento Demo</strong> — empresa fictícia para testar submissão direta por API.
          Vagas demo são marcadas e segregadas dos dados reais. Endpoint: <code className="text-[11px]">{DEMO_ENDPOINT}</code>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-primary" /> Criar vaga demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateDemoJob} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cargo *</Label>
              <Input value={form.cargo} onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))} required placeholder="Estagiário de TI" />
            </div>
            <div className="space-y-2">
              <Label>Empresa fictícia *</Label>
              <Input value={form.empresa} onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value }))} required placeholder="TechDemo Ltda" />
            </div>
            <div className="space-y-2">
              <Label>Localização</Label>
              <Input value={form.localizacao} onChange={(e) => setForm((f) => ({ ...f, localizacao: e.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Requisitos (um por linha)</Label>
              <Textarea value={form.requisitos} onChange={(e) => setForm((f) => ({ ...f, requisitos: e.target.value }))} rows={2} />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <Send className="h-3.5 w-3.5" />
              <span>Esta vaga usará <strong>API direta</strong> com endpoint demo. Candidaturas serão recebidas pelo módulo abaixo.</span>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Criar vaga demo
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Inbox className="h-4 w-4 text-primary" /> Candidaturas recebidas (demo)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-20 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : received.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma candidatura recebida ainda.</p>
          ) : (
            <div className="space-y-2">
              {received.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm">{r.candidate_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{r.candidate_email} · {r.candidate_course || "—"}</p>
                    <p className="text-xs text-muted-foreground">PDF: {r.pdf_filename} ({Math.round((r.pdf_size || 0) / 1024)} KB)</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="font-normal text-xs">{r.receipt_id}</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(r.received_at).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}