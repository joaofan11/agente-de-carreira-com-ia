import React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DemoNotice({ className, title = "Conteúdo demonstrativo" }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-dashed border-secondary/50 bg-secondary/5 px-3 py-2 text-xs text-muted-foreground",
        className
      )}
    >
      <Info className="h-4 w-4 shrink-0 text-secondary mt-0.5" />
      <span>
        <strong className="text-secondary">{title}</strong> — dados fictícios para visualização dos componentes. Serão substituídos por dados reais quando as integrações forem configuradas.
      </span>
    </div>
  );
}