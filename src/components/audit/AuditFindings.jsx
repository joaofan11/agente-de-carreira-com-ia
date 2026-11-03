import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { problemas, ordem, veredito } from "@/lib/auditReportData";

export default function AuditFindings() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Achados críticos ainda abertos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {problemas.map((p, i) => (
            <div key={p.titulo} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-semibold text-destructive">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium">{p.titulo}</p>
                <p className="text-sm text-muted-foreground">{p.texto}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">9.1 Ordem de correção por dependência técnica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ordem.map((item, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <p className="text-muted-foreground">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">10. Conclusão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {veredito.map((p, i) => (
            <p key={i} className="leading-relaxed text-foreground/90">{p}</p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}