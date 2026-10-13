import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import DemoNotice from "@/components/DemoNotice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard,
  Send,
  Files,
  Briefcase,
  Sparkles,
  ArrowRight,
  User,
  FileText,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [counts, setCounts] = useState({ applications: 0, resumes: 0, opportunities: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [profilePage, appCount, resumeCount, opCount] = await Promise.all([
          base44.entities.StudentProfile.filter({}, { limit: 1 }),
          base44.entities.Application.count({}),
          base44.entities.Resume.count({}),
          base44.entities.Opportunity.count({ status: "ativa" }),
        ]);
        setProfile(profilePage.items[0] || null);
        setCounts({
          applications: appCount,
          resumes: resumeCount,
          opportunities: opCount,
        });
      } catch (e) {
        // ignore — pages show empty states
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const completion = (() => {
    if (!profile) return 0;
    const fields = ["full_name", "phone", "birth_date", "university", "course", "semester", "bio", "linkedin_url"];
    const filled = fields.filter((f) => profile[f]).length;
    const skillsOk = Array.isArray(profile.skills) && profile.skills.length > 0;
    return Math.round(((filled + (skillsOk ? 1 : 0)) / (fields.length + 1)) * 100);
  })();

  const firstName = (profile?.full_name || user?.full_name || user?.email || "Estudante").split(" ")[0];

  const stats = [
    { label: "Candidaturas", value: counts.applications, icon: Send, to: "/candidaturas" },
    { label: "Currículos", value: counts.resumes, icon: Files, to: "/curriculos" },
    { label: "Oportunidades ativas", value: counts.opportunities, icon: Briefcase, to: "/oportunidades" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title={`Olá, ${firstName} 👋`}
        description="Visão geral da sua jornada profissional."
      />

      {/* Profile completion */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-secondary" />
                <p className="text-sm font-medium text-foreground">Conclusão do perfil</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {profile
                  ? completion >= 80
                    ? "Seu perfil está bem completo! Boas chances nas análises de compatibilidade."
                    : "Quanto mais completo seu perfil, melhores as análises da IA."
                  : "Você ainda não criou seu perfil. Comece agora para usar a plataforma."}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <Progress value={completion} className="h-2 max-w-xs" />
                <span className="text-sm font-semibold text-primary">{completion}%</span>
              </div>
            </div>
            <Button asChild>
              <Link to="/perfil">
                {profile ? "Editar perfil" : "Criar perfil"} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                {loading ? (
                  <div className="mt-1 h-8 w-10 animate-pulse rounded bg-muted" />
                ) : (
                  <p className="text-3xl font-bold text-foreground">{s.value}</p>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <s.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Atalhos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: User, title: "Meu Perfil", desc: "Dados acadêmicos e profissionais", to: "/perfil" },
            { icon: FileText, title: "Documentos", desc: "Gerencie seus arquivos", to: "/documentos" },
            { icon: Briefcase, title: "Oportunidades", desc: "Explore vagas disponíveis", to: "/oportunidades" },
            { icon: Files, title: "Meus Currículos", desc: "Crie e adapte currículos", to: "/curriculos" },
            { icon: Send, title: "Candidaturas", desc: "Acompanhe seus envios", to: "/candidaturas" },
            { icon: Sparkles, title: "Preferências", desc: "Defina o que você busca", to: "/preferencias" },
          ].map((a) => (
            <Link key={a.to} to={a.to}>
              <Card className="h-full transition-all hover:border-secondary/50 hover:shadow-md">
                <CardContent className="flex items-start gap-3 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <a.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{a.title}</p>
                    <p className="text-sm text-muted-foreground">{a.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Demo activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-secondary" /> Atividade recente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DemoNotice />
          <ul className="space-y-2 text-sm">
            {[
              { icon: CheckCircle2, text: "Você se cadastrou na plataforma", time: "hoje" },
              { icon: Sparkles, text: "Exemplo: análise de compatibilidade com vaga de Estágio em TI", time: "—" },
              { icon: Send, text: "Exemplo: candidatura enviada para Vaga Demonstrativa Ltda.", time: "—" },
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
                <item.icon className="h-4 w-4 text-secondary" />
                <span className="flex-1 text-muted-foreground">{item.text}</span>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}