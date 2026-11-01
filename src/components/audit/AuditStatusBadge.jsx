import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TONE = {
  IMPLEMENTADO: "border-secondary/30 bg-secondary/10 text-secondary",
  "IMPLEMENTADO (DEMO)": "border-secondary/30 bg-secondary/10 text-secondary",
  Funciona: "border-secondary/30 bg-secondary/10 text-secondary",
  PARCIAL: "border-amber-200 bg-amber-50 text-amber-700",
  Parcial: "border-amber-200 bg-amber-50 text-amber-700",
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