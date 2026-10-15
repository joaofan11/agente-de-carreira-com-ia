import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import IndicatorCard from "@/components/dashboard/IndicatorCard";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import HistoryTable from "@/components/dashboard/HistoryTable";
import DemoNotice from "@/components/DemoNotice";
import { personalPage } from "@/components/data/personalRecords";
import {
  LayoutDashboard, Sparkles, ArrowRight, User, FileText, Briefcase, Files, Send,
  BarChart3, CheckCircle2, Clock, XCircle, AlertTriangle, Target, Eye,
} from "lucide-react";

function deriveStatus(match, resume, app) {
  if (app) {
    if (app.erro && app.erro.trim()) return "ERRO_ENVIO";
    if (app.status === "recusado") return "RECUSADA";
    if (app.status === "enviado" || app.status === "em_analise") return "ENVIADA";
    if (app.status === "entrevista") return "ENTREVISTA";
    if (app.status === "acao_manual_necessaria") return "ACAO_MANUAL_NECESSARIA";
    if (app.status === "aprovado") return "APROVADA";
    if (app.status === "pendente_aprovacao") return "AGUARDANDO_APROVACAO";
    if (app.status === "rascunho") {
      if (resume) return "CURRICULO_PREPARADO";
      if (match) return "ANALISADA";
      return "ENCONTRADA";
    }
  }
  if (resume) return "CURRICULO_PREPARADO";
  if (match) return "ANALISADA";
  return "ENCONTRADA";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [indicators, setIndicators] = useState({
    totalAnalyzed: 0, strongMatches: 0, recused: 0, sent: 0, pendingApproval: 0, errors: 0,
  });
  const [chartData, setChartData] = useState({ statusData: [], compatData: [], evolutionData: [] });
  const [history, setHistory] = useState([]);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const demoFilter = demoMode ? { is_demo: true } : { is_demo: { $ne: true } };
        const [
          profilePage, statsResponse, matchPage, appPage, resumePage, jobPage,
        ] = await Promise.all([
          personalPage('profile', { limit: 1, include_demo: demoMode }),
          base44.functions.invoke('getCareerDashboardStats', { demo: demoMode }),
          personalPage('matches', { sort: '-data_analise', limit: 50, include_demo: demoMode }),
          personalPage('applications', { sort: '-created_date', limit: 50, include_demo: demoMode }),
          personalPage('resumes', { sort: '-created_date', limit: 50, include_demo: demoMode }),
          base44.entities.Job.filter({}, { limit: 100 }),
        ]);
        const { matchAgg, appStatusAgg } = statsResponse.data;

        setProfile(profilePage.items[0] || null);

        setIndicators(statsResponse.data.indicators);

        // --- Chart data ---
        setChartData({
          statusData: (appStatusAgg.rows || []).map((r) => ({ status: r.status, count: r.count })),
          compatData: (matchAgg.rows || []).map((r) => ({ nivel_compatibilidade: r.nivel_compatibilidade, count: r.count })),
          evolutionData: computeEvolution(appPage.items),
        });

        // --- History table ---
        const jobMap = {};
        jobPage.items.forEach((j) => { jobMap[j.id] = j; });

        const matchMap = {};
        matchPage.items.forEach((m) => {
          if (!matchMap[m.job_id] || new Date(m.data_analise || m.created_date) > new Date(matchMap[m.job_id].data_analise || matchMap[m.job_id].created_date)) {
            matchMap[m.job_id] = m;
          }
        });

        const resumeMap = {};
        resumePage.items.forEach((r) => {
          if (r.job_id) {
            if (!resumeMap[r.job_id] || new Date(r.criado_em || r.created_date) > new Date(resumeMap[r.job_id].criado_em || resumeMap[r.job_id].created_date)) {
              resumeMap[r.job_id] = r;
            }
          }
        });

        const appMap = {};
        appPage.items.forEach((a) => {
          if (a.job_id) {
            if (!appMap[a.job_id] || new Date(a.created_date) > new Date(appMap[a.job_id].created_date)) {
              appMap[a.job_id] = a;
            }
          }
        });

        const allJobIds = new Set([
          ...Object.keys(matchMap), ...Object.keys(resumeMap), ...Object.keys(appMap),
        ]);

        const historyRows = Array.from(allJobIds).map((jobId) => {
          const job = jobMap[jobId];
          const match = matchMap[jobId];
          const resume = resumeMap[jobId];
          const app = appMap[jobId];
          const status = deriveStatus(match, resume, app);
          return {
            jobId,
            empresa: job?.empresa || "—",
            cargo: job?.cargo || "Vaga não encontrada",
            compatibilidade: match ? { score: match.score, nivel: match.nivel_compatibilidade } : null,
            dataAnalise: match?.data_analise || null,
            dataCriacao: app?.criado_em || resume?.criado_em || null,
            status,
            metodoEnvio: app?.metodo_envio || null,
            dataEnvio: app?.enviado_em || null,
            curriculoUtilizado: resume ? `v${resume.numero_versao || 1}` : null,
            identificadorEnvio: app?.identificador_envio || null,
            matchId: match?.id || null,
            urlExterna: job?.url_original || null,
          };
        });

        // Sort by most recent activity
        historyRows.sort((a, b) => {
          const dateA = new Date(a.dataAnalise || a.dataEnvio || a.dataCriacao || 0);
          const dateB = new Date(b.dataAnalise || b.dataEnvio || b.dataCriacao || 0);
          return dateB - dateA;
        });

        setHistory(historyRows);
      } catch (e) {
        // ignore — empty states shown
      } finally {
        setLoading(false);
      }
    })();
  }, [demoMode]);

  const completion = (() => {
    if (!profile) return 0;
    const fields = ["nome_completo", "telefone_whatsapp", "cidade", "estado", "curso", "instituicao", "semestre", "resumo_profissional"];
    const filled = fields.filter((f) => profile[f]).length;
    const skillsOk = Array.isArray(profile.competencias) && profile.competencias.length > 0;
    return Math.round(((filled + (skillsOk ? 1 : 0)) / (fields.length + 1)) * 100);
  })();

  const firstName = (profile?.nome_completo || user?.full_name || user?.email || "Estudante").split(" ")[0];

  const indicatorCards = [
    { icon: Target, label: "Vagas analisadas", value: indicators.totalAnalyzed, color: "primary" },
    { icon: CheckCircle2, label: "Compatibilidade forte", value: indicators.strongMatches, color: "secondary" },
    { icon: XCircle, label: "Vagas recusadas", value: indicators.recused, color: "destructive" },
    { icon: Send, label: "Currículos enviados", value: indicators.sent, color: "secondary" },
    { icon: Clock, label: "Aguardando aprovação", value: indicators.pendingApproval, color: "primary" },
    { icon: AlertTriangle, label: "Erros de envio", value: indicators.errors, color: "destructive" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title={`Olá, ${firstName} 👋`}
        description="Acompanhe suas oportunidades, candidaturas e resultados."
        actions={
          <Button
            variant={demoMode ? "default" : "outline"}
            size="sm"
            onClick={() => setDemoMode((d) => !d)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {demoMode ? "Sair do modo demo" : "Modo demo"}
          </Button>
        }
      />

      {demoMode && (
        <div className="flex items-start gap-2 rounded-lg border border-dashed border-secondary/50 bg-secondary/5 px-3 py-2 text-xs text-muted-foreground">
          <Eye className="h-4 w-4 shrink-0 text-secondary mt-0.5" />
          <span>
            <strong className="text-secondary">Modo demonstração ativo</strong> — exibindo apenas registros fictícios de teste (is_demo=true). Estes dados não representam atividade real.
          </span>
        </div>
      )}

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

      {/* Indicators */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
        {indicatorCards.map((card) => (
          <IndicatorCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            loading={loading}
            color={card.color}
          />
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts
        statusData={chartData.statusData}
        compatData={chartData.compatData}
        evolutionData={chartData.evolutionData}
      />

      {/* History table */}
      <HistoryTable history={history} loading={loading} />

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
    </div>
  );
}

function computeEvolution(apps) {
  const sentApps = apps.filter(
    (a) => (a.status === "enviado" || a.status === "em_analise") && a.enviado_em && !(a.erro && a.erro.trim())
  );
  const byDate = {};
  sentApps.forEach((a) => {
    const iso = new Date(a.enviado_em).toISOString().split("T")[0];
    byDate[iso] = (byDate[iso] || 0) + 1;
  });
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([iso, count]) => ({
      date: new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      count,
    }));
}