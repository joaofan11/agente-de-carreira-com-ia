import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { alteracoes, notas, comparativo } from "@/lib/auditReportData";

const TONE = {
  Alta: "border-secondary/30 bg-secondary/10 text-secondary",
  Baixa: "border-border bg-muted text-muted-foreground",
};

export default function AuditChanges() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">2. Comparação entre 30/10 e 03/11</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Dimensão</TableHead>
                  <TableHead className="min-w-[150px]">30/10</TableHead>
                  <TableHead className="min-w-[180px]">03/11</TableHead>
                  <TableHead className="min-w-[120px]">Variação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparativo.map((row) => (
                  <TableRow key={row[0]} className="align-top">
                    <TableCell className="font-medium">{row[0]}</TableCell>
                    <TableCell className="text-muted-foreground">{row[1]}</TableCell>
                    <TableCell className="text-muted-foreground">{row[2]}</TableCell>
                    <TableCell className="text-xs font-medium">{row[3]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">3. Alterações comprovadas desde a auditoria anterior</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-0 pb-2">
          <div className="space-y-2 px-6">
            {notas.trinta.map((p, i) => (
              <p key={i} className="text-sm text-muted-foreground">{p}</p>
            ))}
            <p className="text-sm font-medium text-primary">{notas.recomendacaoTrello}</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[90px]">Data</TableHead>
                  <TableHead className="min-w-[190px]">Arquivo / função / entidade</TableHead>
                  <TableHead className="min-w-[240px]">Alteração</TableHead>
                  <TableHead className="min-w-[200px]">Evidência</TableHead>
                  <TableHead className="min-w-[150px]">Impacto</TableHead>
                  <TableHead className="min-w-[90px]">Confiança</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alteracoes.map((row, i) => (
                  <TableRow key={i} className="align-top">
                    <TableCell className="font-mono text-xs">{row[0]}</TableCell>
                    <TableCell className="font-medium">{row[1]}</TableCell>
                    <TableCell className="text-muted-foreground">{row[2]}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row[3]}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row[4]}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[11px] ${TONE[row[5]] || ""}`}>{row[5]}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}