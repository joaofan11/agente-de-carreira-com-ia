import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Briefcase, FileText, FileCheck2, Send, CheckCircle2 } from "lucide-react";

function Section({ icon: Icon, title, children }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">{children}</CardContent>
    </Card>
  );
}

export default function DemoScenario({ data, loading }) {
  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const { profile, job, match, resumeOriginal, resumeAdaptado, application, receipt } = data;

  return (
    <div className="space-y-4">
      {/* Passo 1: Perfil */}
      <Section icon={User} title="Passo 1 — Cadastro (demo)">
        {profile ? (
          <>
            <p><strong>{profile.nome_completo}</strong></p>
            <p className="text-muted-foreground">{profile.curso} · {profile.instituicao}</p>
            <p className="text-muted-foreground">{profile.cidade}/{profile.estado} · {profile.semestre}</p>
            <div className="flex flex-wrap gap-1 pt-1">
              {profile.competencias?.map((c) => (
                <Badge key={c} variant="outline" className="text-xs font-normal">{c}</Badge>
              ))}
            </div>
            {profile.projetos_academicos?.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-medium text-muted-foreground">Projetos acadêmicos:</p>
                {profile.projetos_academicos.map((p, i) => (
                  <p key={i} className="text-xs text-muted-foreground">• {p.nome} ({p.tecnologias?.join(", ")})</p>
                ))}
              </div>
            )}
          </>
        ) : <p className="text-muted-foreground">Perfil demo não encontrado.</p>}
      </Section>

      {/* Passo 2: Vaga */}
      <Section icon={Briefcase} title="Passo 2 — Vaga (demo, endpoint próprio)">
        {job ? (
          <>
            <p><strong>{job.cargo}</strong></p>
            <p className="text-muted-foreground">{job.empresa} · {job.localizacao} · {job.modalidade}</p>
            <div className="flex flex-wrap gap-1 pt-1">
              {job.requisitos?.map((r, i) => (
                <Badge key={i} variant="outline" className="text-xs font-normal">{r}</Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground pt-1">Endpoint: <code>{job.api_endpoint}</code></p>
          </>
        ) : <p className="text-muted-foreground">Vaga demo não encontrada.</p>}
      </Section>

      {/* Passo 3: Compatibilidade + Currículo + Aprovação */}
      <Section icon={FileCheck2} title="Passo 3 — Compatibilidade e currículo (demo)">
        {match ? (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/15 text-secondary font-bold">
                {match.score}
              </div>
              <div>
                <Badge variant="secondary">Compatibilidade {match.nivel_compatibilidade?.toUpperCase()}</Badge>
                <p className="text-xs text-muted-foreground mt-1">Pontuação: {match.score}/100</p>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-xs font-medium text-muted-foreground">Competências compatíveis:</p>
              <div className="flex flex-wrap gap-1">
                {match.competencias_compativeis?.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                ))}
              </div>
            </div>
            {match.competencias_ausentes?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Ausentes:</p>
                <div className="flex flex-wrap gap-1">
                  {match.competencias_ausentes?.map((c) => (
                    <Badge key={c} variant="outline" className="text-xs font-normal">{c}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-1">
              <p className="text-xs font-medium text-muted-foreground">Justificativas:</p>
              {match.justificativas?.map((j, i) => (
                <p key={i} className="text-xs text-muted-foreground">• {j}</p>
              ))}
            </div>
          </>
        ) : <p className="text-muted-foreground">Análise demo não encontrada.</p>}
      </Section>

      {/* Currículo original vs adaptado */}
      <Section icon={FileText} title="Currículo original vs adaptado (demo)">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <Badge variant="outline" className="mb-2 text-xs">Original (v{resumeOriginal?.numero_versao})</Badge>
            <p className="text-xs text-muted-foreground">{resumeOriginal?.conteudo_estruturado?.resumo}</p>
            <div className="flex flex-wrap gap-1 pt-1">
              {resumeOriginal?.conteudo_estruturado?.competencias?.map((c) => (
                <Badge key={c} variant="outline" className="text-xs font-normal">{c}</Badge>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-secondary/40 bg-secondary/5 p-3">
            <Badge variant="secondary" className="mb-2 text-xs">Adaptado (v{resumeAdaptado?.numero_versao})</Badge>
            <p className="text-xs">{resumeAdaptado?.conteudo_estruturado?.resumo}</p>
            <div className="flex flex-wrap gap-1 pt-1">
              {resumeAdaptado?.conteudo_estruturado?.competencias_destacadas?.map((c) => (
                <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
              ))}
            </div>
            {resumeAdaptado?.conteudo_estruturado?.adaptacoes?.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-medium text-muted-foreground">Adapções aplicadas:</p>
                {resumeAdaptado.conteudo_estruturado.adaptacoes.map((a, i) => (
                  <p key={i} className="text-xs text-muted-foreground">• {a}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Aprovação */}
      <Section icon={CheckCircle2} title="Autorização (demo — aprovação no site)">
        {application ? (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Aprovado no site</Badge>
              <span className="text-xs text-muted-foreground">alternativa ao WhatsApp (bloqueado)</span>
            </div>
            <p className="text-xs text-muted-foreground">Canal: {application.canal_aprovacao} · Origem: {application.origem_aprovacao}</p>
            <p className="text-xs text-muted-foreground">Código: <code>{application.codigo_aprovacao?.slice(0, 8)}...</code></p>
            <p className="text-xs text-muted-foreground">Aprovado em: {application.aprovado_em ? new Date(application.aprovado_em).toLocaleString("pt-BR") : "—"}</p>
          </>
        ) : <p className="text-muted-foreground">Candidatura demo não encontrada.</p>}
      </Section>

      {/* Passo 4: Envio + Comprovante */}
      <Section icon={Send} title="Passo 4 — Envio e comprovante (demo)">
        {application?.status === "enviado" ? (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Enviado via API direta</Badge>
              <CheckCircle2 className="h-4 w-4 text-secondary" />
            </div>
            <p className="text-xs text-muted-foreground">Método: {application.metodo_envio}</p>
            <p className="text-xs text-muted-foreground">Enviado em: {application.enviado_em ? new Date(application.enviado_em).toLocaleString("pt-BR") : "—"}</p>
            <div className="rounded-lg border border-secondary/40 bg-secondary/5 p-3 mt-2">
              <p className="text-xs font-medium text-secondary">Comprovante do receptor demo</p>
              <p className="text-sm font-mono mt-1">{application.identificador_envio}</p>
              {receipt && (
                <>
                  <p className="text-xs text-muted-foreground mt-2">Receptor: {receipt.candidate_name} · {receipt.candidate_email}</p>
                  <p className="text-xs text-muted-foreground">PDF: {receipt.pdf_filename} ({Math.round((receipt.pdf_size || 0) / 1024)} KB)</p>
                  <p className="text-xs text-muted-foreground">Recebido em: {receipt.received_at ? new Date(receipt.received_at).toLocaleString("pt-BR") : "—"}</p>
                </>
              )}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">Status: {application?.status || "—"}</p>
        )}
      </Section>
    </div>
  );
}