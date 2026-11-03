import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Download, FileSearch, Loader2 } from "lucide-react";
import { generateAuditPdf } from "@/lib/auditPdf";
import { auditMeta } from "@/lib/auditReportData";
import AuditOverview from "@/components/audit/AuditOverview";
import AuditChanges from "@/components/audit/AuditChanges";
import AuditModulesTable from "@/components/audit/AuditModulesTable";
import AuditIntegration from "@/components/audit/AuditIntegration";
import AuditFiveSteps from "@/components/audit/AuditFiveSteps";
import AuditTrello from "@/components/audit/AuditTrello";
import AuditFindings from "@/components/audit/AuditFindings";

export default function RelatorioAuditoria() {
  const [generating, setGenerating] = useState(false);

  const handleDownload = () => {
    setGenerating(true);
    try {
      const blob = generateAuditPdf();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "auditoria-tecnica-diferencial-03-11-2026.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileSearch}
        title="Relatório da Auditoria Técnica"
        description={`${auditMeta.subtitulo} · leitura de ${auditMeta.data}`}
        actions={
          <Button onClick={handleDownload} disabled={generating}>
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Baixar PDF
          </Button>
        }
      />

      <p className="rounded border p-3 text-sm text-muted-foreground">
        Retrato de {auditMeta.data}, comparado com a auditoria de 30/10/2026. O PDF traz as dez
        seções completas, incluindo a tabela de alterações com data e evidência e o relatório de
        atualização do Trello.
      </p>
      <AuditOverview />
      <AuditChanges />
      <AuditModulesTable />
      <AuditIntegration />
      <AuditFiveSteps />
      <AuditTrello />
      <AuditFindings />
    </div>
  );
}