import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ShieldAlert,
  Lightbulb,
} from "lucide-react";

const nivelConfig = {
  alto: { label: "Forte", color: "text-emerald-600", bg: "bg-emerald-50", barClass: "[&>div]:bg-emerald-500", badge: "secondary" },
  medio: { label: "Médio", color: "text-amber-600", bg: "bg-amber-50", barClass: "[&>div]:bg-amber-500", badge: "outline" },
  baixo: { label: "Baixo", color: "text-rose-600", bg: "bg-rose-50", barClass: "[&>div]:bg-rose-500", badge: "destructive" },
};

export default function MatchResult({ result, onReanalyze, reanalyzing }) {
  const navigate = useNavigate();
  if (!result) return null;

  const { match, analysis, score } = result;
  const nivel = nivelConfig[score?.nivel] || nivelConfig.baixo;
  const scoreVal = score?.score ?? match?.score ?? 0;

  return (
    <div className="space-y-4">
      {/* Compatibilidade em destaque */}
      <div className={`flex items-center gap-3 rounded-lg ${nivel.bg} p-4`}>
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Compatibilidade</p>
          <p className={`text-2xl font-bold ${nivel.color}`}>{nivel.label}</p>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold ${nivel.color}`}>{scoreVal}</p>
          <p className="text-xs text-muted-foreground">/ 100</p>
        </div>
      </div>
      <Progress value={scoreVal} className={`h-2 ${nivel.barClass}`} />

      {/* Breakdown da pontuação */}
      {score?.breakdown && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <BreakdownItem label="Competências técnicas" value={score.breakdown.tecnicas} max={40} />
          <BreakdownItem label="Formação acadêmica" value={score.breakdown.formacao} max={25} />
          <BreakdownItem label="Experiências e projetos" value={score.breakdown.experiencia} max={20} />
          <BreakdownItem label="Disponibilidade" value={score.breakdown.preferencias} max={15} />
        </div>
      )}

      {/* Justificativa */}
      {match?.justificativas?.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Lightbulb className="h-4 w-4 text-primary" /> Motivos da compatibilidade
          </p>
          <p className="text-sm text-muted-foreground">{match.justificativas[0]}</p>
        </div>
      )}

      {/* Evidências do perfil */}
      {match?.evidencias?.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Evidências do perfil
          </p>
          <ul className="space-y-1">
            {match.evidencias.map((ev, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                {ev}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Competências compatíveis com evidência */}
      {analysis?.competencias_compativeis?.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-semibold text-foreground">Competências compatíveis</p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.competencias_compativeis.map((c, i) => (
              <Badge key={i} variant="secondary" className="font-normal">
                {c.competencia}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Requisitos não atendidos */}
      {match?.competencias_ausentes?.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <XCircle className="h-4 w-4 text-rose-600" /> Requisitos não atendidos
          </p>
          <div className="flex flex-wrap gap-1.5">
            {match.competencias_ausentes.map((c, i) => (
              <Badge key={i} variant="outline" className="font-normal text-rose-600">
                {c}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Bloqueios eliminatórios */}
      {match?.bloqueios?.length > 0 && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-rose-800">
            <ShieldAlert className="h-4 w-4" /> Bloqueios
          </p>
          <ul className="space-y-1">
            {match.bloqueios.map((b, i) => (
              <li key={i} className="text-sm text-rose-700">{b}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Dados insuficientes */}
      {match?.dados_insuficientes && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">Dados insuficientes</p>
            <p className="mt-0.5 text-sm text-amber-700">{match.dados_insuficientes}</p>
          </div>
        </div>
      )}

      <Separator />

      {/* Ações */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="flex-1" onClick={() => navigate(`/curriculos?job_id=${match?.job_id || ""}&match_id=${match?.id || ""}`)}>
          <FileText className="mr-2 h-4 w-4" /> Preparar currículo
        </Button>
        <Button variant="outline" className="flex-1" onClick={onReanalyze} disabled={reanalyzing}>
          {reanalyzing ? "Reanalisando..." : "Reanalisar"}
        </Button>
      </div>
    </div>
  );
}

function BreakdownItem({ label, value, max }) {
  return (
    <div className="rounded-md border border-border px-2.5 py-1.5">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}/{max}</p>
    </div>
  );
}