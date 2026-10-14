import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Send, CheckCircle2, Clock, XCircle, Lock, FileText, Trash2, Eye, AlertTriangle, Loader2, ExternalLink,
} from "lucide-react";

const statusConfig = {
  rascunho: { label: "Rascunho", color: "outline", icon: FileText },
  pendente_aprovacao: { label: "Aprovação pendente", color: "secondary", icon: Clock },
  aprovado: { label: "Aprovado", color: "default", icon: CheckCircle2 },
  acao_manual_necessaria: { label: "Ação manual", color: "secondary", icon: AlertTriangle },
  enviado: { label: "Enviado", color: "default", icon: Send },
  em_analise: { label: "Em análise", color: "outline", icon: Clock },
  recusado: { label: "Recusado", color: "destructive", icon: XCircle },
  entrevista: { label: "Entrevista", color: "default", icon: CheckCircle2 },
};

const metodoLabels = {
  email: "E-mail",
  gmail: "Gmail",
  outlook: "Outlook",
  api_direta: "API direta",
  manual: "Manual",
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ApplicationCard — exibe uma candidatura com status, histórico de decisão e ações.
export default function ApplicationCard({ app, job, resume, onReview, onDispatch, onDelete, dispatching }) {
  const cfg = statusConfig[app.status] || statusConfig.rascunho;
  const Icon = cfg.icon;

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">{job?.cargo || "Vaga não encontrada"}</p>
              <p className="text-sm text-muted-foreground">{job?.empresa || "—"}</p>
              {app.metodo_envio && (
                <p className="mt-0.5 text-xs text-muted-foreground">Envio via {metodoLabels[app.metodo_envio] || app.metodo_envio}</p>
              )}
            </div>
          </div>
          <Badge variant={cfg.color} className="w-fit font-normal">{cfg.label}</Badge>
        </div>

        {/* Histórico da decisão */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
          {app.criado_em && <span>Criada: {formatDate(app.criado_em)}</span>}
          {app.aprovado_em && <span className="text-secondary">Aprovada: {formatDate(app.aprovado_em)}</span>}
          {app.rejeitado_em && <span className="text-destructive">Recusada: {formatDate(app.rejeitado_em)}</span>}
          {app.enviado_em && <span>Enviada: {formatDate(app.enviado_em)}</span>}
        </div>

        {app.motivo_rejeicao && (
          <p className="mt-2 text-xs text-destructive">Motivo: {app.motivo_rejeicao}</p>
        )}

        {app.erro && (
          <p className="mt-2 flex items-center gap-1 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" /> {app.erro}
          </p>
        )}

        {app.motivo_bloqueio && (
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" /> {app.motivo_bloqueio}
          </p>
        )}

        {/* Ações */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {app.status === "pendente_aprovacao" && (
            <Button size="sm" onClick={onReview}>
              <Eye className="mr-1.5 h-4 w-4" /> Revisar e aprovar
            </Button>
          )}
          {app.status === "aprovado" && (
            <Button size="sm" onClick={onDispatch} disabled={dispatching}>
              {dispatching ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
              Enviar candidatura
            </Button>
          )}
          {app.status === "acao_manual_necessaria" && (
            <div className="flex w-full flex-col gap-2">
              {app.link_oficial && (
                <Button size="sm" asChild>
                  <a href={app.link_oficial} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1.5 h-4 w-4" /> Abrir link oficial da vaga
                  </a>
                </Button>
              )}
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4" /> Provedor não configurado — envio manual necessário
              </span>
            </div>
          )}
          {app.status === "enviado" && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" /> Candidatura enviada — aguardando resposta
            </span>
          )}
          {app.status === "recusado" && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4" /> Candidatura recusada — não enviada
            </span>
          )}
          {(app.status === "rascunho" || app.status === "recusado" || app.status === "acao_manual_necessaria") && (
            <Button size="sm" variant="ghost" onClick={onDelete} className="ml-auto text-destructive hover:text-destructive">
              <Trash2 className="mr-1.5 h-4 w-4" /> Remover
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}