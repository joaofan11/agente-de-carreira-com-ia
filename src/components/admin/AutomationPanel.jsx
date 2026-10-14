import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Play, Pause, Clock, AlertCircle, RefreshCw, CheckCircle, Search, Cpu } from "lucide-react";

function formatDuration(ms) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Manaus" });
}

function statusBadge(status) {
  const map = {
    em_andamento: { variant: "secondary", label: "Em andamento" },
    concluido: { variant: "default", label: "Concluído" },
    erro: { variant: "destructive", label: "Erro" },
    parcial: { variant: "outline", label: "Parcial" },
  };
  const cfg = map[status] || { variant: "outline", label: status };
  return <Badge variant={cfg.variant} className="font-normal">{cfg.label}</Badge>;
}

function RunSummary({ run, title, icon: Icon }) {
  if (!run) return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Icon className="h-4 w-4 text-primary" /> {title}</CardTitle>
      </CardHeader>
      <CardContent><p className="text-sm text-muted-foreground">Nenhuma execução registrada.</p></CardContent>
    </Card>
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /> {title}</span>
          {statusBadge(run.status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Origem</span><span>{run.origem === "manual" ? "Manual" : "Agendado"}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Início</span><span>{formatDate(run.inicio_em)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Duração</span><span>{formatDuration(run.duracao_ms)}</span></div>
        {run.tipo === "coleta" && (
          <>
            <div className="flex justify-between"><span className="text-muted-foreground">Vagas encontradas</span><span className="font-medium">{run.vagas_encontradas || 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Vagas novas</span><span className="font-medium text-secondary">{run.vagas_novas || 0}</span></div>
          </>
        )}
        {run.tipo === "processamento" && (
          <>
            <div className="flex justify-between"><span className="text-muted-foreground">Análises novas</span><span className="font-medium">{run.analises_realizadas || 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Análises reutilizadas</span><span className="font-medium">{run.analises_reutilizadas || 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Candidaturas criadas</span><span className="font-medium text-secondary">{run.candidaturas_criadas || 0}</span></div>
          </>
        )}
        {run.erros && run.erros.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-destructive mb-1">Erros ({run.erros.length}):</p>
            <ul className="text-xs text-muted-foreground space-y-1 max-h-24 overflow-y-auto">
              {run.erros.slice(0, 5).map((e, i) => <li key={i} className="truncate">{e}</li>)}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AutomationPanel() {
  const { toast } = useToast();
  const [runs, setRuns] = useState({ coleta: null, processamento: null });
  const [recentErrors, setRecentErrors] = useState([]);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [coletaPage, procPage, errorPage, pausePage] = await Promise.all([
        base44.entities.AutomationRun.filter({ tipo: "coleta" }, { sort: "-created_date", limit: 1 }),
        base44.entities.AutomationRun.filter({ tipo: "processamento" }, { sort: "-created_date", limit: 1 }),
        base44.entities.AutomationRun.filter({ status: { $in: ["erro", "parcial"] } }, { sort: "-created_date", limit: 5 }),
        base44.entities.AppSetting.filter({ key: "automation_paused" }, { limit: 1 }),
      ]);
      setRuns({ coleta: coletaPage.items?.[0] || null, processamento: procPage.items?.[0] || null });
      const allErrors = [];
      (errorPage.items || []).forEach(r => {
        (r.erros || []).forEach(e => allErrors.push({ tipo: r.tipo, erro: e, data: r.inicio_em }));
      });
      setRecentErrors(allErrors);
      setPaused(pausePage.items?.[0]?.value?.paused === true);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRun = async (type) => {
    setRunning(type);
    try {
      const fnName = type === "coleta" ? "runJobCollection" : "runCandidateProcessing";
      const res = await base44.functions.invoke(fnName, {});
      const d = res.data || {};
      if (d.skipped) {
        toast({ title: "Execução ignorada", description: d.reason });
      } else if (type === "coleta") {
        toast({ title: "Coleta executada", description: `${d.saved ?? 0} vagas novas de ${d.fetched ?? 0} encontradas.` });
      } else {
        toast({ title: "Processamento executado", description: `${d.analyses_new ?? 0} análises, ${d.applications_created ?? 0} candidaturas criadas.` });
      }
      loadData();
    } catch (err) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setRunning(null);
  };

  const handleTogglePause = async (checked) => {
    setPaused(checked);
    try {
      const existing = await base44.entities.AppSetting.filter({ key: "automation_paused" }, { limit: 1 });
      if (existing.items?.[0]) {
        await base44.entities.AppSetting.update(existing.items[0].id, { value: { paused: checked } });
      } else {
        await base44.entities.AppSetting.create({ key: "automation_paused", value: { paused: checked }, description: "Pausar automação de vagas", category: "sistema" });
      }
      toast({ title: checked ? "Automação pausada" : "Automação ativada" });
    } catch (err) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      setPaused(!checked);
    }
  };

  if (loading) {
    return <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="font-medium text-sm">Processamento automático</p>
            <p className="text-xs text-muted-foreground">Coleta diária às 06:00 (Manaus). Cria candidaturas AGUARDANDO_APROVACAO.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{paused ? "Pausado" : "Ativo"}</span>
            <Switch checked={!paused} onCheckedChange={(v) => handleTogglePause(!v)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <RunSummary run={runs.coleta} title="Última coleta" icon={Search} />
          <Button onClick={() => handleRun("coleta")} disabled={running === "coleta"} className="w-full" variant="outline">
            {running === "coleta" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Buscar vagas agora
          </Button>
        </div>
        <div className="space-y-3">
          <RunSummary run={runs.processamento} title="Último processamento" icon={Cpu} />
          <Button onClick={() => handleRun("processamento")} disabled={running === "processamento"} className="w-full" variant="outline">
            {running === "processamento" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Cpu className="mr-2 h-4 w-4" />}
            Processar candidatos agora
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><AlertCircle className="h-4 w-4 text-destructive" /> Erros recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentErrors.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum erro registrado.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentErrors.map((e, i) => (
                <div key={i} className="rounded-lg border p-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="font-normal text-[10px]">{e.tipo}</Badge>
                    <span className="text-muted-foreground">{formatDate(e.data)}</span>
                  </div>
                  <p className="text-muted-foreground">{e.erro}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
        <Clock className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <strong>Pendências:</strong> WhatsApp e envios bloqueados até configuração do canal e consentimento do usuário.
          Vagas remotas com restrição geográfica são filtradas (remoto não é automaticamente acessível no Brasil).
        </div>
      </div>
    </div>
  );
}