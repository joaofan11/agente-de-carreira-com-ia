import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AuditStatusBadge from "./AuditStatusBadge";
import { cincoPassos } from "@/lib/auditReportData";

export default function AuditFiveSteps() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">7.1 Os cinco passos obrigatórios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {cincoPassos.map((p) => (
          <div key={p.n} className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{p.n}.</span>
              <p className="text-sm font-medium">{p.elo}</p>
              <AuditStatusBadge status={p.status} />
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{p.impedimento}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}