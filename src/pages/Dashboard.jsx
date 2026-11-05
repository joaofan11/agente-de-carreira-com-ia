import React, { useEffect, useState, useRef } from "react";
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
import { calcProgress } from "@/components/profile/profileHelpers";
import { buildCareerHistory, computeCareerEvolution, hydrateCareerReferences, recordsForMode } from "@/lib/careerHistory";
import { personalPage } from "@/components/data/personalRecords";
import {
  LayoutDashboard, Sparkles, ArrowRight, User, FileText, Briefcase, Files, Send, CheckCircle2, Clock, XCircle, AlertTriangle, Target, Eye,
} from "lucide-react";

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
  const [reload, setReload] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [historyLimited, setHistoryLimited] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const current = ++requestId.current;
    setLoading(true);
    setLoadError("");
    setProfile(null);
    setHistory([]);
    setChartData({statusData:[],compatData:[],evolutionData:[]});
    (async () => {
      try {
        const mode = {include_demo:demoMode,demo_only:demoMode};
        const [profilePage,statsResponse,matchPage,appPage,resumePage] = await Promise.all([
          personalPage('profile',{limit:1,...mode}),
          base44.functions.invoke('getCareerDashboardStats',{demo:demoMode}),
          personalPage('matches',{sort:'-data_analise',limit:50,...mode}),
          personalPage('applications',{sort:'-created_date',limit:50,...mode}),
          personalPage('resumes',{sort:'-created_date',limit:50,...mode}),
        ]);
        const hydrated = await hydrateCareerReferences(base44,{
          matches:recordsForMode(matchPage.items,demoMode),
          resumes:recordsForMode(resumePage.items,demoMode),
          applications:recordsForMode(appPage.items,demoMode),
        });
        if (current !== requestId.current) return;
        const records={...hydrated,resumes:recordsForMode(hydrated.resumes,demoMode),jobs:recordsForMode(hydrated.jobs,demoMode)};
        const {matchAgg,appStatusAgg,indicators:totals}=statsResponse.data;
        setProfile(recordsForMode(profilePage.items,demoMode)[0] || null);
        setIndicators(totals);
        setChartData({
          statusData:(appStatusAgg.rows || []).map(row=>({status:row.status,count:row.count})),
          compatData:(matchAgg.rows || []).map(row=>({nivel_compatibilidade:row.nivel_compatibilidade,count:row.count})),
          evolutionData:computeCareerEvolution(records.applications),
        });
        setHistory(buildCareerHistory(records));
        setHistoryLimited([matchPage,appPage,resumePage].some(page=>page.has_more));
      } catch(error) {
        if (current === requestId.current) setLoadError(error.response?.data?.error || error.message || "Não foi possível carregar o dashboard.");
      } finally {
        if (current === requestId.current) setLoading(false);
      }
    })();
    return () => { requestId.current++; };
  }, [demoMode,reload,user?.id]);

  const completion = profile ? calcProgress(profile) : 0;

  const firstName = (profile?.nome_completo || user?.full_name || user?.email || "Estudante").split(" ")[0];

  const indicatorCards = [
    { icon: Target, label: "Vagas analisadas", value: indicators.totalAnalyzed, color: "primary" },
    { icon: CheckCircle2, label: "Compatibilidade forte", value: indicators.strongMatches, color: "secondary" },
    { icon: XCircle, label: "Recusas registradas", value: indicators.recused, color: "destructive" },
    { icon: Send, label: "Envios confirmados", value: indicators.sent, color: "secondary" },
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
          <div className="flex gap-2">
          <Button
            variant={demoMode ? "default" : "outline"}
            size="sm"
            onClick={() => { setLoading(true);setProfile(null);setDemoMode((d) => !d); }}
          >
            <Eye className="mr-2 h-4 w-4" />
            {demoMode ? "Sair do modo demo" : "Modo demo"}
          </Button>
          <Button variant="outline" onClick={() => setReload(value=>value+1)} disabled={loading}>Atualizar</Button>
          </div>
        }
      />

      {demoMode && (
        <div className="flex items-start gap-2 rounded-lg border border-dashed border-secondary/50 bg-secondary/5 px-3 py-2 text-xs text-muted-foreground">
          <Eye className="h-4 w-4 shrink-0 text-secondary mt-0.5" />
          <span>
            <strong className="text-secondary">Modo demonstração ativo</strong> — exibindo apenas registros de demonstração desta conta. Estes dados não representam atividade real.
          </span>
        </div>
      )}

      {loadError && <div role="alert" className="rounded-lg border border-destructive p-4 text-sm text-destructive">Não foi possível carregar os dados. {loadError} Use Atualizar para tentar novamente.</div>}
      {!loadError && <>
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
                {loading ? "Carregando perfil..." : profile
                  ? completion >= 80
                    ? "Seu perfil está bem preenchido. Revise as informações para manter a análise atualizada."
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
      {!loading && <DashboardCharts
        statusData={chartData.statusData}
        compatData={chartData.compatData}
        evolutionData={chartData.evolutionData}
      />}

      {/* History table */}
      <HistoryTable key={demoMode ? "demo" : "real"} history={history} loading={loading} />
      {!loading && <p className="text-xs text-muted-foreground">Os indicadores consideram todos os seus registros. O histórico e a evolução mostram as atividades recentes carregadas.{historyLimited && <> Há registros anteriores; consulte <Link to="/candidaturas" className="underline">Candidaturas</Link>.</>}</p>}
      </>}

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
