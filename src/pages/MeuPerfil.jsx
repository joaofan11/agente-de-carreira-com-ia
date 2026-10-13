import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import TagInput from "@/components/TagInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { User, Loader2, Save, GraduationCap, MapPin, Sparkles } from "lucide-react";

const emptyProfile = {
  nome_completo: "",
  email: "",
  telefone_whatsapp: "",
  cidade: "",
  estado: "",
  curso: "",
  instituicao: "",
  semestre: "",
  resumo_profissional: "",
  competencias: [],
  experiencias: [],
  projetos_academicos: [],
  cursos_complementares: [],
  disponibilidade: "",
};

export default function MeuPerfil() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState(null);
  const [form, setForm] = useState(emptyProfile);

  useEffect(() => {
    (async () => {
      try {
        const page = await base44.entities.CandidateProfile.filter({}, { limit: 1 });
        const p = page.items[0];
        if (p) {
          setProfileId(p.id);
          setForm({
            ...emptyProfile,
            ...p,
            competencias: Array.isArray(p.competencias) ? p.competencias : [],
            experiencias: Array.isArray(p.experiencias) ? p.experiencias : [],
            projetos_academicos: Array.isArray(p.projetos_academicos) ? p.projetos_academicos : [],
            cursos_complementares: Array.isArray(p.cursos_complementares) ? p.cursos_complementares : [],
          });
        } else if (user) {
          setForm((f) => ({ ...f, nome_completo: user.full_name || "", email: user.email || "" }));
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setArr = (key) => (vals) => setForm((f) => ({ ...f, [key]: vals }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        user_id: user.id,
        nome_completo: form.nome_completo?.trim() || user?.full_name || "Estudante",
        email: form.email || user?.email || "",
        atualizado_em: new Date().toISOString(),
      };
      if (profileId) {
        await base44.entities.CandidateProfile.update(profileId, payload);
        toast({ title: "Perfil atualizado", description: "Suas informações foram salvas." });
      } else {
        const created = await base44.entities.CandidateProfile.create(payload);
        setProfileId(created.id);
        toast({ title: "Perfil criado", description: "Seu perfil foi salvo com sucesso." });
      }
    } catch (err) {
      toast({ title: "Erro ao salvar", description: err.message || "Tente novamente.", variant: "destructive" });
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
        icon={User}
        title="Meu Perfil"
        description="Seus dados acadêmicos e profissionais. Use apenas informações verdadeiras."
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" /> Dados pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome_completo">Nome completo *</Label>
              <Input id="nome_completo" value={form.nome_completo} onChange={set("nome_completo")} required placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="seu@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone_whatsapp">Telefone / WhatsApp</Label>
              <Input id="telefone_whatsapp" value={form.telefone_whatsapp} onChange={set("telefone_whatsapp")} placeholder="(92) 9xxxx-xxxx" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disponibilidade">Disponibilidade</Label>
              <Input id="disponibilidade" value={form.disponibilidade} onChange={set("disponibilidade")} placeholder="Ex.: Manhã e tarde, 20h/semana" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" value={form.cidade} onChange={set("cidade")} placeholder="Ex.: Manaus" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Input id="estado" value={form.estado} onChange={set("estado")} placeholder="Ex.: AM" />
            </div>
          </CardContent>
        </Card>

        {/* Academic */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-4 w-4 text-primary" /> Formação acadêmica
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="instituicao">Instituição</Label>
              <Input id="instituicao" value={form.instituicao} onChange={set("instituicao")} placeholder="Ex.: UniNorte" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="curso">Curso</Label>
              <Input id="curso" value={form.curso} onChange={set("curso")} placeholder="Ex.: Sistemas de Informação" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semestre">Semestre / Período atual</Label>
              <Input id="semestre" value={form.semestre} onChange={set("semestre")} placeholder="Ex.: 5º período" />
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sobre você</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resumo_profissional">Resumo profissional</Label>
              <Textarea
                id="resumo_profissional"
                value={form.resumo_profissional}
                onChange={set("resumo_profissional")}
                rows={4}
                placeholder="Conte um pouco sobre seus objetivos e experiências reais."
              />
            </div>
          </CardContent>
        </Card>

        {/* Skills & lists */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> Competências e trajetória
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Competências</Label>
              <TagInput values={form.competencias} onChange={setArr("competencias")} placeholder="Ex.: JavaScript, Excel, Comunicação" />
            </div>
            <div className="space-y-2">
              <Label>Experiências</Label>
              <TagInput values={form.experiencias} onChange={setArr("experiencias")} placeholder="Ex.: Iniciação científica em IA (2024)" />
            </div>
            <div className="space-y-2">
              <Label>Projetos acadêmicos</Label>
              <TagInput values={form.projetos_academicos} onChange={setArr("projetos_academicos")} placeholder="Ex.: TCC sobre redes neurais" />
            </div>
            <div className="space-y-2">
              <Label>Cursos complementares</Label>
              <TagInput values={form.cursos_complementares} onChange={setArr("cursos_complementares")} placeholder="Ex.: Curso de Python (40h)" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} size="lg">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {profileId ? "Salvar alterações" : "Criar perfil"}
          </Button>
        </div>
      </form>
    </div>
  );
}