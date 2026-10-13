import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
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
import { SlidersHorizontal, Loader2, Save, Plus, X } from "lucide-react";

const emptyPref = {
  desired_role: "",
  work_model: "indiferente",
  min_salary: "",
  max_salary: "",
  location: "",
  contract_type: "indiferente",
  areas: [],
  available_hours: "",
  willing_relocate: false,
};

const workModels = { indiferente: "Indiferente", presencial: "Presencial", hibrido: "Híbrido", remoto: "Remoto" };
const contractTypes = { indiferente: "Indiferente", estagio: "Estágio", trainee: "Trainee", clt: "CLT", pj: "PJ" };

export default function PreferenciasVagas() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefId, setPrefId] = useState(null);
  const [form, setForm] = useState(emptyPref);
  const [areaInput, setAreaInput] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const page = await base44.entities.JobPreference.filter({}, { limit: 1 });
        const p = page.items[0];
        if (p) {
          setPrefId(p.id);
          setForm({ ...emptyPref, ...p, areas: Array.isArray(p.areas) ? p.areas : [] });
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const addArea = () => {
    const v = areaInput.trim();
    if (v && !form.areas.includes(v)) setForm((f) => ({ ...f, areas: [...f.areas, v] }));
    setAreaInput("");
  };
  const removeArea = (a) => setForm((f) => ({ ...f, areas: f.areas.filter((x) => x !== a) }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        min_salary: form.min_salary ? Number(form.min_salary) : null,
        max_salary: form.max_salary ? Number(form.max_salary) : null,
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
            <CardTitle className="text-base">Cargo e localização</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="desired_role">Cargo desejado</Label>
              <Input id="desired_role" value={form.desired_role} onChange={set("desired_role")} placeholder="Ex.: Estágio em Desenvolvimento" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localização preferida</Label>
              <Input id="location" value={form.location} onChange={set("location")} placeholder="Ex.: Manaus/AM" />
            </div>
            <div className="space-y-2">
              <Label>Modelo de trabalho</Label>
              <Select value={form.work_model} onValueChange={(v) => setForm((f) => ({ ...f, work_model: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(workModels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de contrato</Label>
              <Select value={form.contract_type} onValueChange={(v) => setForm((f) => ({ ...f, contract_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(contractTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Faixa salarial e disponibilidade</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="min_salary">Salário mínimo (R$)</Label>
              <Input id="min_salary" type="number" min="0" value={form.min_salary} onChange={set("min_salary")} placeholder="Ex.: 1200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_salary">Salário máximo (R$)</Label>
              <Input id="max_salary" type="number" min="0" value={form.max_salary} onChange={set("max_salary")} placeholder="Ex.: 2500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="available_hours">Disponibilidade de horário</Label>
              <Input id="available_hours" value={form.available_hours} onChange={set("available_hours")} placeholder="Ex.: Manhã e tarde" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <Label htmlFor="relocate" className="cursor-pointer">Disposto a mudar de cidade</Label>
                <p className="text-xs text-muted-foreground">Para vagas fora da sua região</p>
              </div>
              <Switch id="relocate" checked={form.willing_relocate} onCheckedChange={(v) => setForm((f) => ({ ...f, willing_relocate: v }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Áreas de interesse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addArea(); } }}
                placeholder="Ex.: Tecnologia, Saúde, Administração"
              />
              <Button type="button" variant="secondary" onClick={addArea}><Plus className="h-4 w-4" /></Button>
            </div>
            {form.areas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.areas.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                    {a}
                    <button type="button" onClick={() => removeArea(a)} aria-label={`Remover ${a}`}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
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