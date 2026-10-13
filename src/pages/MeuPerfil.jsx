import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { User, Loader2, Save, Plus, X, GraduationCap, Link2 } from "lucide-react";

const emptyProfile = {
  full_name: "",
  email: "",
  phone: "",
  birth_date: "",
  university: "",
  course: "",
  semester: "",
  graduation_year: "",
  bio: "",
  skills: [],
  areas_interest: [],
  linkedin_url: "",
  github_url: "",
  portfolio_url: "",
};

export default function MeuPerfil() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState(null);
  const [form, setForm] = useState(emptyProfile);
  const [skillInput, setSkillInput] = useState("");
  const [areaInput, setAreaInput] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const page = await base44.entities.StudentProfile.filter({}, { limit: 1 });
        const p = page.items[0];
        if (p) {
          setProfileId(p.id);
          setForm({
            ...emptyProfile,
            ...p,
            skills: Array.isArray(p.skills) ? p.skills : [],
            areas_interest: Array.isArray(p.areas_interest) ? p.areas_interest : [],
          });
        } else if (user) {
          setForm((f) => ({ ...f, full_name: user.full_name || "", email: user.email || "" }));
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const addSkill = () => {
    const v = skillInput.trim();
    if (v && !form.skills.includes(v)) {
      setForm((f) => ({ ...f, skills: [...f.skills, v] }));
    }
    setSkillInput("");
  };
  const removeSkill = (s) => setForm((f) => ({ ...f, skills: f.skills.filter((x) => x !== s) }));

  const addArea = () => {
    const v = areaInput.trim();
    if (v && !form.areas_interest.includes(v)) {
      setForm((f) => ({ ...f, areas_interest: [...f.areas_interest, v] }));
    }
    setAreaInput("");
  };
  const removeArea = (a) => setForm((f) => ({ ...f, areas_interest: f.areas_interest.filter((x) => x !== a) }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        full_name: form.full_name?.trim() || user?.full_name || "Estudante",
        email: form.email || user?.email || "",
      };
      if (profileId) {
        await base44.entities.StudentProfile.update(profileId, payload);
        toast({ title: "Perfil atualizado", description: "Suas informações foram salvas." });
      } else {
        const created = await base44.entities.StudentProfile.create(payload);
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
              <Label htmlFor="full_name">Nome completo *</Label>
              <Input id="full_name" value={form.full_name} onChange={set("full_name")} required placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="seu@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input id="phone" value={form.phone} onChange={set("phone")} placeholder="(92) 9xxxx-xxxx" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de nascimento</Label>
              <Input id="birth_date" type="date" value={form.birth_date} onChange={set("birth_date")} />
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
              <Label htmlFor="university">Instituição</Label>
              <Input id="university" value={form.university} onChange={set("university")} placeholder="Ex.: UniNorte" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course">Curso</Label>
              <Input id="course" value={form.course} onChange={set("course")} placeholder="Ex.: Sistemas de Informação" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semestre / Período atual</Label>
              <Input id="semester" value={form.semester} onChange={set("semester")} placeholder="Ex.: 5º período" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="graduation_year">Ano previsto de formatura</Label>
              <Input id="graduation_year" value={form.graduation_year} onChange={set("graduation_year")} placeholder="Ex.: 2027" />
            </div>
          </CardContent>
        </Card>

        {/* Bio + skills */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sobre você</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Resumo profissional</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={set("bio")}
                rows={4}
                placeholder="Conte um pouco sobre seus objetivos e experiências reais."
              />
            </div>
            <div className="space-y-2">
              <Label>Habilidades</Label>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                  placeholder="Digite uma habilidade e pressione Enter"
                />
                <Button type="button" variant="secondary" onClick={addSkill}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {form.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {form.skills.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-3 py-1 text-sm text-secondary">
                      {s}
                      <button type="button" onClick={() => removeSkill(s)} aria-label={`Remover ${s}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Áreas de interesse</Label>
              <div className="flex gap-2">
                <Input
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addArea(); } }}
                  placeholder="Ex.: Desenvolvimento, Marketing, Dados"
                />
                <Button type="button" variant="secondary" onClick={addArea}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {form.areas_interest.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {form.areas_interest.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                      {a}
                      <button type="button" onClick={() => removeArea(a)} aria-label={`Remover ${a}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4 text-primary" /> Presença online
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn</Label>
              <Input id="linkedin_url" value={form.linkedin_url} onChange={set("linkedin_url")} placeholder="linkedin.com/in/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github_url">GitHub</Label>
              <Input id="github_url" value={form.github_url} onChange={set("github_url")} placeholder="github.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio_url">Portfólio</Label>
              <Input id="portfolio_url" value={form.portfolio_url} onChange={set("portfolio_url")} placeholder="seusite.com" />
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