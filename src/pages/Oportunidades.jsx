import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import JobCard from "@/components/opportunities/JobCard";
import MatchResult from "@/components/opportunities/MatchResult";
import { personalPage } from "@/components/data/personalRecords";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Briefcase,
  Loader2,
  Search,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Info,
} from "lucide-react";

const nivelLabels = { estagio: "Estágio", trainee: "Trainee", junior: "Júnior", pleno: "Pleno" };
const modalidadeLabels = { presencial: "Presencial", hibrido: "Híbrido", remoto: "Remoto" };

function formatDate(d) {
  if (!d) return "—";
  const parts = String(d).slice(0, 10).split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    const dt = new Date(iso);
    return dt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function Oportunidades() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationError, setRecommendationError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState("");
  const [modalidade, setModalidade] = useState("todas");
  const [nivel, setNivel] = useState("todos");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [detailJob, setDetailJob] = useState(null);
  const [analyzeJob, setAnalyzeJob] = useState(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState(null);
  const [analyzeError, setAnalyzeError] = useState(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const query = { status: "ativa", is_demo: { $ne: true } };
      if (modalidade !== "todas") query.modalidade = modalidade;
      if (nivel !== "todos") query.nivel = nivel;
      if (search.trim()) {
        const rx = { $regex: search.trim(), $options: "i" };
        query.$or = [{ cargo: rx }, { empresa: rx }, { descricao: rx }];
      }
      const page = await base44.entities.Job.filter(query, { sort: "-created_date", limit: 50 });
      setJobs(page.items);
      if (page.items.length > 0) {
        setUpdatedAt(page.items[0].created_date);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, modalidade, nivel]);

  useEffect(() => {
    const t = setTimeout(loadJobs, 300);
    return () => clearTimeout(t);
  }, [loadJobs]);

  useEffect(() => {
    let active = true;
    personalPage('matches', {sort:'-data_analise',limit:50}).then(async page => {
      const matches = (page.items || []).filter(m => m.is_demo !== true && m.score >= 60 && !(m.bloqueios || []).length);
      const entries = await Promise.all(matches.map(async match => {
        try { const job = await base44.entities.Job.get(match.job_id); return job?.status === 'ativa' && job.is_demo !== true ? {match,job} : null; }
        catch { return null; }
      }));
      if (active) setRecommendations(entries.filter(Boolean));
    }).catch(error => { if(active) setRecommendationError(error.message); });
    return () => { active = false; };
  }, []);

  const handleRefresh = async () => {
    setSearching(true);
    setApiError(null);
    try {
      const res = await base44.functions.invoke("searchJobs", { pages: 2 });
      const data = res.data;
      if (data.error) throw new Error(data.error);
      setUpdatedAt(data.fetchedAt);
      toast({
        title: "Vagas atualizadas",
        description: `${data.saved} nova(s), ${data.duplicates} já existente(s). Fonte: ${data.fonte}.`,
      });
      loadJobs();
    } catch (err) {
      setApiError(err.message || "Falha ao consultar a API de vagas.");
      toast({
        title: "Falha na atualização",
        description: "Não foi possível consultar a API. As vagas anteriores continuam disponíveis.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const entryLevelCount = jobs.filter((j) => ["estagio", "trainee", "junior"].includes(j.nivel)).length;

  const handleAnalyze = async (job) => {
    setAnalyzeJob(job);
    setAnalyzeLoading(true);
    setAnalyzeError(null);
    setAnalyzeResult(null);
    try {
      // Server validates the fingerprint before deciding whether AI is needed.
      const res = await base44.functions.invoke("analyzeJobMatch", { job_id: job.id });
      const data = res.data;
      if (data.error) throw new Error(data.error);
      setAnalyzeResult(data);
    } catch (err) {
      setAnalyzeError(err.message || "Falha ao analisar compatibilidade.");
    } finally {
      setAnalyzeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Briefcase}
        title="Oportunidades"
        description="Vagas de estágio e primeiro emprego coletadas automaticamente da API pública do Jobicy."
        actions={
          <Button onClick={handleRefresh} disabled={searching}>
            {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Atualizar vagas
          </Button>
        }
      />

      {recommendationError && <p role="alert" className="text-sm text-destructive">Não foi possível carregar recomendações: {recommendationError}</p>}
      {recommendations.length > 0 && <Card><CardContent className="space-y-3 p-4">
        <h2 className="font-semibold">Recomendações para você</h2>
        <p className="text-sm text-muted-foreground">Compatibilidades já analisadas. Nenhuma candidatura foi enviada. Revise o currículo antes de preparar a candidatura.</p>
        {recommendations.map(({match,job}) => <div key={match.id} className="flex items-center justify-between gap-3 border-t pt-3">
          <div><p className="font-medium">{job.cargo} — {job.empresa}</p><p className="text-sm text-muted-foreground">Compatibilidade: {match.score}/100</p></div>
          <Button variant="outline" onClick={() => handleAnalyze(job)}>Revisar recomendação</Button>
        </div>)}
      </CardContent></Card>}
      {/* Filters */}
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cargo, empresa ou palavra-chave"
              className="pl-9"
            />
          </div>
          <Select value={modalidade} onValueChange={setModalidade}>
            <SelectTrigger>
              <SelectValue placeholder="Modalidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as modalidades</SelectItem>
              <SelectItem value="remoto">Remoto</SelectItem>
              <SelectItem value="hibrido">Híbrido</SelectItem>
              <SelectItem value="presencial">Presencial</SelectItem>
            </SelectContent>
          </Select>
          <Select value={nivel} onValueChange={setNivel}>
            <SelectTrigger>
              <SelectValue placeholder="Nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os níveis</SelectItem>
              <SelectItem value="estagio">Estágio</SelectItem>
              <SelectItem value="trainee">Trainee</SelectItem>
              <SelectItem value="junior">Júnior</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Status line */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          {loading ? "Carregando..." : `${jobs.length} vaga(s)`}
          {jobs.length > 0 && ` · ${entryLevelCount} de nível de entrada`}
        </span>
        {updatedAt && (
          <span className="flex items-center gap-1">
            <Info className="h-3.5 w-3.5" /> Atualizado em: {formatDateTime(updatedAt)}
          </span>
        )}
      </div>

      {apiError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Não foi possível atualizar agora.</p>
            <p className="mt-0.5">{apiError} As vagas já obtidas continuam disponíveis acima.</p>
          </div>
        </div>
      )}

      {/* Jobs grid */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Search className="h-7 w-7" />
            </div>
            <p className="mt-4 font-medium">Nenhuma vaga encontrada</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Clique em “Atualizar vagas” para buscar oportunidades recentes. A API Jobicy prioriza
              vagas remotas; nem sempre há vagas de estágio no momento, e isso é exibido como
              limitação real, sem inventar posições.
            </p>
            <Button className="mt-4" onClick={handleRefresh} disabled={searching}>
              {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Atualizar agora
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onDetails={setDetailJob} onAnalyze={handleAnalyze} />
          ))}
        </div>
      )}

      {/* Details dialog */}
      <Dialog open={!!detailJob} onOpenChange={(o) => !o && setDetailJob(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detailJob?.cargo}</DialogTitle>
            <DialogDescription>{detailJob?.empresa}</DialogDescription>
          </DialogHeader>
          {detailJob && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="font-normal">{nivelLabels[detailJob.nivel] || detailJob.nivel}</Badge>
                <Badge variant="outline" className="font-normal">{modalidadeLabels[detailJob.modalidade] || detailJob.modalidade}</Badge>
                {detailJob.localizacao && <Badge variant="outline" className="font-normal">{detailJob.localizacao}</Badge>}
              </div>
              {detailJob.requisitos?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {detailJob.requisitos.map((r, i) => (
                    <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{r}</span>
                  ))}
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Descrição</p>
                <p className="mt-1.5 whitespace-pre-line text-sm text-foreground">{detailJob.descricao || "Sem descrição disponível."}</p>
              </div>
              <div className="flex items-center justify-between border-t pt-3 text-sm">
                <span className="text-muted-foreground">Publicada em: {formatDate(detailJob.data_publicacao)}</span>
                {detailJob.url_original && (
                  <a href={detailJob.url_original} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    Ver no site original <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setDetailJob(null)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Analyze dialog — análise real de compatibilidade por IA */}
      <Dialog open={!!analyzeJob} onOpenChange={(o) => !o && setAnalyzeJob(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-secondary" /> Análise de compatibilidade
            </DialogTitle>
            <DialogDescription>{analyzeJob?.cargo} — {analyzeJob?.empresa}</DialogDescription>
          </DialogHeader>
          {analyzeLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">
                Analisando compatibilidade com seu perfil...
              </p>
            </div>
          ) : analyzeError ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{analyzeError}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAnalyzeJob(null)}>Fechar</Button>
                <Button onClick={() => handleAnalyze(analyzeJob, true)}>Tentar novamente</Button>
              </div>
            </div>
          ) : analyzeResult ? (
            <>
              <MatchResult
                result={analyzeResult}
                onReanalyze={() => handleAnalyze(analyzeJob, true)}
                reanalyzing={analyzeLoading}
              />
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setAnalyzeJob(null)}>Fechar</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}