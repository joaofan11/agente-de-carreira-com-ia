import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { integracoes, seguranca, fluxo } from "@/lib/auditReportData";

export default function AuditIntegration() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">5. Integrações externas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-0 pb-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[170px]">Integração</TableHead>
                  <TableHead className="min-w-[80px]">Código</TableHead>
                  <TableHead className="min-w-[110px]">Credencial</TableHead>
                  <TableHead className="min-w-[260px]">Evidência de funcionamento</TableHead>
                  <TableHead className="min-w-[170px]">Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integracoes.map((row) => (
                  <TableRow key={row[0]} className="align-top">
                    <TableCell className="font-medium">{row[0]}</TableCell>
                    <TableCell className="text-muted-foreground">{row[1]}</TableCell>
                    <TableCell className="text-muted-foreground">{row[2]}</TableCell>
                    <TableCell className="text-muted-foreground">{row[3]}</TableCell>
                    <TableCell className="text-xs font-medium">{row[4]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="px-6 text-sm text-muted-foreground">
            Resposta de API, aceite do provedor e confirmação de entrega são níveis distintos: a
            API de vagas tem resposta e persistência confirmadas; o receptor de demonstração tem
            aceite confirmado com recibo; Gmail, Outlook e WhatsApp não têm sequer resposta de API.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">6. Segurança e LGPD</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-secondary">
              <CheckCircle2 className="h-4 w-4" /> Corrigido desde 30/10
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {seguranca.corrigido.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-secondary">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" /> Ainda aberto
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {seguranca.aberto.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-destructive">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">7. Fluxo completo do MVP</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Etapa</TableHead>
                  <TableHead className="min-w-[170px]">Situação</TableHead>
                  <TableHead className="min-w-[320px]">Evidência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fluxo.map((row) => (
                  <TableRow key={row[0]} className="align-top">
                    <TableCell className="font-medium">{row[0]}</TableCell>
                    <TableCell className="text-xs font-medium">{row[1]}</TableCell>
                    <TableCell className="text-muted-foreground">{row[2]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="px-6 pt-3 text-sm text-muted-foreground">
            Versão publicada e código do editor não correspondem: a publicação é de 23/10/2026 e a
            plataforma declara alterações pendentes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}