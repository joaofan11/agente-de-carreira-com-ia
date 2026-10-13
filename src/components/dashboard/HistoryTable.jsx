import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge, statusConfig } from "@/components/dashboard/StatusBadge";
import { CompatBadge } from "@/components/dashboard/StatusBadge";
import { Search, Filter, Eye, FileText, ExternalLink, Inbox } from "lucide-react";

const metodoLabels = {
  whatsapp: "WhatsApp",
  email: "E-mail",
  link_externo: "Link externo",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "—";
  }
}

function getActionLink(row) {
  if (row.status === "ANALISADA" && row.matchId) {
    return { to: `/curriculos?job_id=${row.jobId}&match_id=${row.matchId}`, label: "Preparar currículo", icon: FileText };
  }
  if (row.status === "ENCONTRADA") {
    return { to: "/oportunidades", label: "Ver vaga", icon: Eye };
  }
  if (row.status === "CURRICULO_PREPARADO") {
    return { to: `/curriculos?job_id=${row.jobId}`, label: "Ver currículo", icon: FileText };
  }
  if (row.status === "ACAO_MANUAL_NECESSARIA" && row.urlExterna) {
    return { to: row.urlExterna, label: "Abrir link", icon: ExternalLink, external: true };
  }
  return { to: "/candidaturas", label: "Ver candidatura", icon: Eye };
}

export default function HistoryTable({ history, loading }) {
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [compatFilter, setCompatFilter] = useState("all");

  const filtered = useMemo(() => {
    return history.filter((row) => {
      // Period filter
      if (periodFrom || periodTo) {
        const rowDate = row.dataAnalise || row.dataEnvio || row.dataCriacao;
        if (!rowDate) return false;
        const d = new Date(rowDate);
        if (periodFrom && d < new Date(periodFrom + "T00:00:00")) return false;
        if (periodTo && d > new Date(periodTo + "T23:59:59")) return false;
      }
      // Empresa filter
      if (empresa) {
        if (!row.empresa.toLowerCase().includes(empresa.toLowerCase())) return false;
      }
      // Status filter
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      // Compatibilidade filter
      if (compatFilter !== "all") {
        if (!row.compatibilidade || row.compatibilidade.nivel !== compatFilter) return false;
      }
      return true;
    });
  }, [history, periodFrom, periodTo, empresa, statusFilter, compatFilter]);

  const hasFilters = periodFrom || periodTo || empresa || statusFilter !== "all" || compatFilter !== "all";

  const clearFilters = () => {
    setPeriodFrom("");
    setPeriodTo("");
    setEmpresa("");
    setStatusFilter("all");
    setCompatFilter("all");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-4 w-4 text-secondary" /> Histórico de candidaturas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">De</label>
            <Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Até</label>
            <Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Empresa</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                placeholder="Buscar..."
                className="h-8 pl-7 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Compatibilidade</label>
            <Select value={compatFilter} onValueChange={setCompatFilter}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="alto">Forte</SelectItem>
                <SelectItem value="medio">Média</SelectItem>
                <SelectItem value="baixo">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            Limpar filtros
          </Button>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Inbox className="h-6 w-6" />
            </div>
            <p className="mt-3 font-medium text-sm">
              {hasFilters ? "Nenhum resultado para os filtros aplicados" : "Nenhuma atividade ainda"}
            </p>
            {!hasFilters && (
              <p className="mt-1 text-xs text-muted-foreground">
                Analise oportunidades e prepare candidaturas para vê-las aqui.
              </p>
            )}
            {!hasFilters && (
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to="/oportunidades">Ver oportunidades</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="whitespace-nowrap px-3 py-2 font-medium text-muted-foreground">Empresa</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium text-muted-foreground">Cargo</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium text-muted-foreground">Compat.</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium text-muted-foreground">Data análise</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium text-muted-foreground">Status</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium text-muted-foreground">Método</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium text-muted-foreground">Envio</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium text-muted-foreground">Currículo</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium text-muted-foreground">Confirmação</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const action = getActionLink(row);
                  return (
                    <tr key={row.jobId} className="border-t border-border hover:bg-muted/30">
                      <td className="px-3 py-2.5 font-medium">{row.empresa}</td>
                      <td className="px-3 py-2.5">{row.cargo}</td>
                      <td className="px-3 py-2.5">
                        {row.compatibilidade ? (
                          <CompatBadge nivel={row.compatibilidade.nivel} score={row.compatibilidade.score} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{formatDate(row.dataAnalise)}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={row.status} /></td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                        {row.metodoEnvio ? metodoLabels[row.metodoEnvio] || row.metodoEnvio : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{formatDate(row.dataEnvio)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                        {row.curriculoUtilizado || "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.identificadorEnvio ? (
                          <span className="max-w-[120px] truncate inline-block text-xs text-muted-foreground" title={row.identificadorEnvio}>
                            {row.identificadorEnvio}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {action.external ? (
                          <a href={action.to} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              <action.icon className="mr-1 h-3.5 w-3.5" /> {action.label}
                            </Button>
                          </a>
                        ) : (
                          <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                            <Link to={action.to}>
                              <action.icon className="mr-1 h-3.5 w-3.5" /> {action.label}
                            </Link>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Result count */}
        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "registro" : "registros"}
            {hasFilters && ` (de ${history.length} total)`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}