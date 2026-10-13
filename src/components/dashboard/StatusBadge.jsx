import React from "react";
import { Badge } from "@/components/ui/badge";

export const statusConfig = {
  ENCONTRADA: { label: "Encontrada", color: "outline" },
  ANALISADA: { label: "Analisada", color: "secondary" },
  CURRICULO_PREPARADO: { label: "Currículo preparado", color: "secondary" },
  AGUARDANDO_APROVACAO: { label: "Aguardando aprovação", color: "outline" },
  APROVADA: { label: "Aprovada", color: "secondary" },
  RECUSADA: { label: "Recusada", color: "destructive" },
  ENVIO_EM_ANDAMENTO: { label: "Envio em andamento", color: "outline" },
  ENVIADA: { label: "Enviada", color: "default" },
  ERRO_ENVIO: { label: "Erro de envio", color: "destructive" },
  ACAO_MANUAL_NECESSARIA: { label: "Ação manual", color: "outline" },
  ENTREVISTA: { label: "Entrevista", color: "default" },
};

export const compatConfig = {
  alto: { label: "Forte", className: "bg-secondary/15 text-secondary" },
  medio: { label: "Média", className: "bg-primary/10 text-primary" },
  baixo: { label: "Baixa", className: "bg-destructive/10 text-destructive" },
};

export function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig.ENCONTRADA;
  return (
    <Badge variant={cfg.color} className="font-normal whitespace-nowrap text-xs">
      {cfg.label}
    </Badge>
  );
}

export function CompatBadge({ nivel, score }) {
  const cfg = compatConfig[nivel];
  if (!cfg) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
      {score != null && <span className="opacity-70">{Math.round(score)}%</span>}
    </span>
  );
}