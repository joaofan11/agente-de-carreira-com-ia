import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AuditStatusBadge from "./AuditStatusBadge";
import { trello, acoesTrello, plano } from "@/lib/auditReportData";

function List({ title, items }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-foreground">{title}</p>
      <ul className="space-y-1 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-primary">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AuditTrello() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">8. Relatório para atualização do Trello</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[170px]">Prompt</TableHead>
                  <TableHead className="min-w-[110px]">30/10</TableHead>
                  <TableHead className="min-w-[150px]">03/11</TableHead>
                  <TableHead className="min-w-[90px]">Concluir?</TableHead>
                  <TableHead className="min-w-[80px]">Prazo</TableHead>
                  <TableHead className="min-w-[190px]">O que mudou</TableHead>
                  <TableHead className="min-w-[190px]">Checklist validado</TableHead>
                  <TableHead className="min-w-[190px]">Checklist pendente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trello.map((row) => (
                  <TableRow key={row[0]} className="align-top">
                    <TableCell className="font-medium">{row[0]}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row[1]}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row[2]}</TableCell>
                    <TableCell><AuditStatusBadge status={row[6]} /></TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{row[7]}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row[3]}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row[4]}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row[5]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
          <List title="Podem ir para Concluído" items={acoesTrello.concluir} />
          <List title="Permanecem abertos" items={acoesTrello.abertos} />
          <List title="Em revisão" items={acoesTrello.revisar} />
          <List title="Checklists marcáveis com evidência" items={acoesTrello.marcar} />
          <List title="Checklists que precisam de testes" items={acoesTrello.testar} />
          <List title="Cartões corretivos a criar" items={acoesTrello.corretivos} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">9. Cronograma de recuperação</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[80px]">Data</TableHead>
                  <TableHead className="min-w-[160px]">Foco</TableHead>
                  <TableHead className="min-w-[340px]">Ações priorizadas</TableHead>
                  <TableHead className="min-w-[90px]">Equipe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plano.map((row) => (
                  <TableRow key={row[0]} className="align-top">
                    <TableCell className="font-medium">{row[0]}</TableCell>
                    <TableCell>{row[1]}</TableCell>
                    <TableCell className="text-muted-foreground">{row[2]}</TableCell>
                    <TableCell className="text-xs">{row[3]}</TableCell>
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