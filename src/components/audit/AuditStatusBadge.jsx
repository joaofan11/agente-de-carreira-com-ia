import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TONE = {
  IMPLEMENTADO: "border-secondary/30 bg-secondary/10 text-secondary",
  "IMPLEMENTADO (DEMO)": "border-secondary/30 bg-secondary/10 text-secondary",
  "IMPLEMENTADO, NÃO HOMOLOGADO": "border-amber-200 bg-amber-50 text-amber-700",
  "CONCLUÍDO E VALIDADO": "border-secondary/30 bg-secondary/10 text-secondary",
  PARCIAL: "border-amber-200 bg-amber-50 text-amber-700",
  BLOQUEADO: "border-destructive/30 bg-destructive/10 text-destructive",
  "NÃO IMPLEMENTADO": "border-destructive/30 bg-destructive/10 text-destructive",
  "NÃO VERIFICÁVEL": "border-border bg-muted text-muted-foreground",
  Funciona: "border-secondary/30 bg-secondary/10 text-secondary",
  Parcial: "border-amber-200 bg-amber-50 text-amber-700",
  SIM: "border-secondary/30 bg-secondary/10 text-secondary",
  NÃO: "border-destructive/30 bg-destructive/10 text-destructive",
  REVISAR: "border-amber-200 bg-amber-50 text-amber-700",
};

export default function AuditStatusBadge({ status, className = "" }) {
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap text-[11px] font-semibold", TONE[status], className)}
    >
      {status}
    </Badge>
  );
}