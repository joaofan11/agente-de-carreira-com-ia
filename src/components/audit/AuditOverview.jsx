import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resumoExecutivo, plataforma, camadas, funcionais } from "@/lib/auditReportData";

function Block({ title, children }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">{children}</CardContent>
    </Card>
  );
}

export default function AuditOverview() {
  return (
    <div className="space-y-4">
      <Block title="1. Resumo executivo">
        {resumoExecutivo.map((p, i) => (
          <p key={i} className="leading-relaxed text-foreground/90">{p}</p>
        ))}
      </Block>

      <Block title="2. Estado da plataforma">
        <dl className="divide-y divide-border">
          {plataforma.map((item) => (
            <div key={item.label} className="grid gap-0.5 py-2 sm:grid-cols-[220px_1fr] sm:gap-3">
              <dt className="font-medium text-foreground">{item.label}</dt>
              <dd className="text-muted-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      </Block>

      <Block title="3. Camadas de maturidade">
        <dl className="divide-y divide-border">
          {camadas.map((item) => (
            <div key={item.camada} className="grid gap-0.5 py-2 sm:grid-cols-[220px_1fr] sm:gap-3">
              <dt className="font-medium text-foreground">{item.camada}</dt>
              <dd className="text-muted-foreground">{item.situacao}</dd>
            </div>
          ))}
        </dl>
      </Block>

      <Block title="4. Classificação funcional">
        {funcionais.map((group) => (
          <div key={group.titulo} className="space-y-1">
            <p className="font-medium text-foreground">{group.titulo}</p>
            <p className="text-muted-foreground">{group.modulos.join(" · ")}</p>
          </div>
        ))}
      </Block>
    </div>
  );
}