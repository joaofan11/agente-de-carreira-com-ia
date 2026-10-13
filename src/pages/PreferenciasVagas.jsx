import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import TagInput from "@/components/TagInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { SlidersHorizontal, Loader2, Save, Bell, MapPin } from "lucide-react";

const emptyPref = {
  cargos_interesse: [],
  areas_interesse: [],
  niveis: [],
  localizacoes: [],
  modalidades: [],
  tipos_contrato: [],
  disponibilidade: "",
  salario_minimo_opcional: "",
  regiao_amazonia: false,
  notificacoes_ativas: true,
};

const nivelOptions = [
  { value: "estagio", label: "Estágio" },
  { value: "trainee", label: "Trainee" },
  { value: "junior", label: "Júnior" },
  { value: "pleno", label: "Pleno" },
];

const disponibilidadeOptions = [
  { value: "imediata", label: "Imediata" },
  { value: "ate_30_dias", label: "Em até 30 dias" },
  { value: "ate_60_dias", label: "Em até 60 dias" },
  { value: "flexivel", label: "Flexível" },
];

const modalidadeOptions = [
  { value: "presencial", label: "Presencial" },
  { value: "hibrido", label: "Híbrido" },
  { value: "remoto", label: "Remoto" },
  { value: "indiferente", label: "Indiferente" },
];

const contratoOptions = [
  { value: "estagio", label: "Estágio" },
  { value: "trainee", label: "Trainee" },
  { value: "clt", label: "CLT" },
  { value: "pj", label: "PJ" },
  { value: "indiferente", label: "Indiferente" },
];

function MultiToggle({ options, selected, onChange }) {
  const toggle = (v) => {
    if (selected.includes(v)) onChange(selected.filter((x) => x !== v));
    else onChange([...selected, v]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => toggle(o.value)}
          className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
            selected.includes(o.value)
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-accent"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function PreferenciasVagas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefId, setPrefId] = useState(null);
  const [form, setForm] = useState(emptyPref);

  useEffect(() => {
    (async () => {
      try {
        const page = await base44.entities.JobPreference.filter({}, { limit: 1 });
        const p = page.items[0];
        if (p) {
          setPrefId(p.id);
          setForm({
            ...emptyPref,
            ...p,
            cargos_interesse: Array.isArray(p.cargos_interesse) ? p.cargos_interesse : [],
            areas_interesse: Array.isArray(p.areas_interesse) ? p.areas_interesse : [],
            niveis: Array.isArray(p.niveis) ? p.niveis : [],
            localizacoes: Array.isArray(p.localizacoes) ? p.localizacoes : [],
            modalidades: Array.isArray(p.modalidades) ? p.modalidades : [],
            tipos_contrato: Array.isArray(p.tipos_contrato) ? p.tipos_contrato : [],
            disponibilidade: p.disponibilidade || "",
            notificacoes_ativas: p.notificacoes_ativas !== false,
            salario_minimo_opcional: p.salario_minimo_opcional ?? "",
            regiao_amazonia: p.regiao_amazonia === true,
          });
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setArr = (key) => (vals) => setForm((f) => ({ ...f, [key]: vals }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        user_id: user.id,
        salario_minimo_opcional: form.salario_minimo_opcional ? Number(form.salario_minimo_opcional) : null,
      };
      if (prefId) {
        await base44.entities.JobPreference.update(prefId, payload);
        toast({ title: "Preferências atualizadas" });
      } else {
        const created = await base44.entities.JobPreference.create(payload);
        setPrefId(created.id);
        toast({ title: "Preferências salvas" });
      }
    } catch (err) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={SlidersHorizontal}
        title="Preferências de Vagas"
        description="Defina o que você busca. A IA usa esses critérios nas análises de compatibilidade."
      />

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cargos e áreas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Cargos de interesse</Label>
              <TagInput values={form.cargos_interesse} onChange={setArr("cargos_interesse")} placeholder="Ex.: Estágio em Desenvolvimento, Analista de Dados" />
            </div>
            <div className="space-y-2">
              <Label>Áreas de interesse</Label>
              <TagInput values={form.areas_interesse} onChange={setArr("areas_interesse")} placeholder="Ex.: Tecnologia, Saúde, Administração" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nível e disponibilidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Nível desejado</Label>
              <MultiToggle options={nivelOptions} selected={form.niveis} onChange={setArr("niveis")} />
              <p className="text-xs text-muted-foreground">Estágio e júnior são priorizados na busca automática.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="disp">Disponibilidade para começar</Label>
              <Select value={form.disponibilidade || "_none"} onValueChange={(v) => setForm((f) => ({ ...f, disponibilidade: v === "_none" ? "" : v }))}>
                <SelectTrigger id="disp">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Não informado</SelectItem>
                  {disponibilidadeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Localização e modalidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Localizações desejadas</Label>
              <TagInput values={form.localizacoes} onChange={setArr("localizacoes")} placeholder="Ex.: Manaus/AM, Remoto" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <Label htmlFor="amazonia" className="flex items-center gap-2 cursor-pointer">
                  <MapPin className="h-4 w-4 text-primary" /> Preferir vagas da região amazônica
                </Label>
                <p className="text-xs text-muted-foreground">Priorizar Manaus/AM e demais localidades indicadas acima</p>
              </div>
              <Switch id="amazonia" checked={form.regiao_amazonia} onCheckedChange={(v) => setForm((f) => ({ ...f, regiao_amazonia: v }))} />
            </div>
            <div className="space-y-2">
              <Label>Modalidades de trabalho</Label>
              <MultiToggle options={modalidadeOptions} selected={form.modalidades} onChange={setArr("modalidades")} />
            </div>
            <div className="space-y-2">
              <Label>Tipos de contrato</Label>
              <MultiToggle options={contratoOptions} selected={form.tipos_contrato} onChange={setArr("tipos_contrato")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Salário e notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="salario_minimo">Salário mínimo opcional (R$)</Label>
              <Input id="salario_minimo" type="number" min="0" value={form.salario_minimo_opcional} onChange={(e) => setForm((f) => ({ ...f, salario_minimo_opcional: e.target.value }))} placeholder="Ex.: 1200" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <Label htmlFor="notif" className="flex items-center gap-2 cursor-pointer">
                  <Bell className="h-4 w-4 text-primary" /> Notificações ativas
                </Label>
                <p className="text-xs text-muted-foreground">Receber avisos de vagas compatíveis e atualizações</p>
              </div>
              <Switch id="notif" checked={form.notificacoes_ativas} onCheckedChange={(v) => setForm((f) => ({ ...f, notificacoes_ativas: v }))} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {prefId ? "Salvar alterações" : "Salvar preferências"}
          </Button>
        </div>
      </form>
    </div>
  );
}