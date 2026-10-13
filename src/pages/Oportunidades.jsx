import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import DemoNotice from "@/components/DemoNotice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Briefcase, Loader2, MapPin, Building2, Sparkles, Send, Search } from "lucide-react";

const workModels = { presencial: "Presencial", hibrido: "Híbrido", remoto: "Remoto" };
const contractTypes = { estagio: "Estágio", trainee: "Trainee", clt: "CLT", pj: "PJ" };

const demoOpportunities = [
  {
    id: "demo-1",
    title: "Estágio em Desenvolvimento Web",
    company: "Tech Amazônia Ltda.",
    location: "Manaus/AM",
    work_model: "hibrido",
    contract_type: "estagio",
    salary_min: 1500,
    salary_max: 2200,
    requirements: ["Conhecimento em HTML/CSS/JS", "Git básico", "Cursando Sistemas de Informação"],
    source: "manual",
    _demo: true,
  },
  {
    id: "demo-2",
    title: "Estágio em Marketing Digital",
    company: "Agência Rio Negro",
    location: "Manaus/AM",
    work_model: "presencial",
    contract_type: "estagio",
    salary_min: 1200,
    salary_max: 1800,
    requirements: ["Redes sociais", "Canva", "Boa comunicação"],
    source: "manual",
    _demo: true,
  },
  {
    id: "demo-3",
    title: "Jovem Aprendiz Administrativo",
    company: "Comércio Comercial S/A",
    location: "Manaus/AM",
    work_model: "presencial",
    contract_type: "estagio",
    salary_min: 1000,
    salary_max: 1400,
    requirements: ["Pacote Office", "Organização", "Ensino médio completo"],
    source: "manual",
    _demo: true,
  },
];

function OpportunityCard({ op, onAnalyze, onApply }) {
  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground">{op.title}</h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> {op.company}
            </p>
          </div>
          {op._demo && <Badge variant="outline" className="text-secondary border-secondary/50">Demonstrativo</Badge>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="font-normal">{contractTypes[op.contract_type] || op.contract_type}</Badge>
          <Badge variant="outline" className="font-normal">{workModels[op.work_model] || op.work_model}</Badge>
          <Badge variant="outline" className="font-normal"><MapPin className="mr-1 h-3 w-3" />{op.location}</Badge>
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          {(op.salary_min || op.salary_max)
            ? `R$ ${op.salary_min || "—"} — ${op.salary_max || "—"}`
            : "Salário a combinar"}
        </div>
        {op.requirements?.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Requisitos</p>
            <ul className="mt-1.5 space-y-1">
              {op.requirements.slice(0, 3).map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-secondary" /> {r}
              </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-auto flex gap-2 pt-4">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onAnalyze(op)}>
            <Sparkles className="mr-1.5 h-4 w-4 text-secondary" /> Analisar
          </Button>
          <Button size="sm" className="flex-1" onClick={() => onApply(op)}>
            <Send className="mr-1.5 h-4 w-4" /> Candidatar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Oportunidades() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [realOps, setRealOps] = useState([]);
  const [analyzing, setAnalyzing] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const page = await base44.entities.Opportunity.filter({ status: "ativa" }, { sort: "-created_date", limit: 50 });
        setRealOps(page.items);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAnalyze = (op) => setAnalyzing({ op, score: null });

  // Demo match score calculation (demonstrative only)
  useEffect(() => {
    if (analyzing && analyzing.score === null) {
      const t = setTimeout(() => {
        setAnalyzing({ op: analyzing.op, score: Math.floor(60 + Math.random() * 35) });
      }, 900);
      return () => clearTimeout(t);
    }
  }, [analyzing]);

  const handleApply = (op) => {
    if (op._demo) {
      setAnalyzing(null);
      navigate("/candidaturas");
    } else {
      navigate("/candidaturas", { state: { opportunityId: op.id, title: op.title, company: op.company } });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Briefcase}
        title="Oportunidades"
        description="Vagas de estágio e primeiro emprego na região amazônica."
      />

      <DemoNotice title="Análise de IA demonstrativa" />

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {realOps.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold">Vagas disponíveis</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {realOps.map((op) => (
                  <OpportunityCard key={op.id} op={op} onAnalyze={handleAnalyze} onApply={handleApply} />
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-1 text-lg font-semibold">Exemplos de vagas</h2>
            <p className="mb-3 text-sm text-muted-foreground">Vagas fictícias para demonstrar a interface.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {demoOpportunities.map((op) => (
                <OpportunityCard key={op.id} op={op} onAnalyze={handleAnalyze} onApply={handleApply} />
              ))}
            </div>
          </div>

          {realOps.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Search className="h-7 w-7" />
                </div>
                <p className="mt-4 font-medium">Nenhuma vaga real cadastrada ainda</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Quando o administrador cadastrar vagas ou a integração com APIs externas for configurada, elas aparecerão aqui.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Analysis dialog (demonstrative) */}
      <Dialog open={!!analyzing} onOpenChange={(o) => !o && setAnalyzing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-secondary" /> Análise de compatibilidade
            </DialogTitle>
            <DialogDescription>
              {analyzing?.op && `${analyzing.op.title} — ${analyzing.op.company}`}
            </DialogDescription>
          </DialogHeader>
          {analyzing?.score === null ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Analisando seu perfil com a vaga...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <DemoNotice title="Resultado demonstrativo" />
              <div className="text-center">
                <p className="text-5xl font-bold text-secondary">{analyzing?.score}%</p>
                <p className="mt-1 text-sm text-muted-foreground">de compatibilidade</p>
              </div>
              <div>
                <Progress value={analyzing?.score} className="h-2" />
              </div>
              <p className="text-sm text-muted-foreground">
                Esta análise é ilustrativa. A análise real será calculada pela IA quando a integração estiver configurada,
                comparando seu perfil e preferências aos requisitos da vaga.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAnalyzing(null)}>Fechar</Button>
                <Button onClick={() => analyzing && handleApply(analyzing.op)}>
                  <Send className="mr-2 h-4 w-4" /> Candidatar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}