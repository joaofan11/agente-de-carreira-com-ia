import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AuditStatusBadge from "./AuditStatusBadge";
import { modulos } from "@/lib/auditReportData";

export default function AuditModulesTable() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">4. Situação detalhada dos 16 módulos</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="min-w-[190px]">Módulo</TableHead>
                <TableHead className="min-w-[130px]">30/10</TableHead>
                <TableHead className="min-w-[170px]">03/11</TableHead>
                <TableHead className="min-w-[300px]">Evidências e alteração</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modulos.map((m) => (
                <TableRow key={m.n} className="align-top">
                  <TableCell className="font-mono text-xs text-muted-foreground">{m.n}</TableCell>
                  <TableCell className="font-medium">{m.nome}</TableCell>
                  <TableCell><AuditStatusBadge status={m.status30} /></TableCell>
                  <TableCell><AuditStatusBadge status={m.status03} /></TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.evidencias}
                    <span className="mt-1 block font-medium text-foreground">Alteração: {m.mudou}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}