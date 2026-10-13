import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

// Exibe o currículo adaptado em layout limpo e profissional (espelha o PDF).
export default function ResumeView({ resume }) {
  if (!resume) return null;
  const c = resume.contato || {};
  const ct = resume.competencias_tecnicas || {};

  return (
    <div className="space-y-4 rounded-lg border bg-white p-5 text-sm shadow-sm sm:p-8">
      {/* Cabeçalho */}
      <div className="border-b pb-3">
        <h2 className="text-xl font-bold text-foreground">{c.nome}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {[c.email, c.telefone, [c.cidade, c.estado].filter(Boolean).join(" - ")].filter(Boolean).join(" | ")}
        </p>
      </div>

      {resume.objetivo_profissional && (
        <Section title="Objetivo Profissional">
          <p className="text-foreground">{resume.objetivo_profissional}</p>
        </Section>
      )}

      {resume.resumo && (
        <Section title="Resumo Profissional">
          <p className="text-foreground">{resume.resumo}</p>
        </Section>
      )}

      {resume.formacao_academica?.length > 0 && (
        <Section title="Formação Acadêmica">
          {resume.formacao_academica.map((f, i) => (
            <div key={i} className="mb-2">
              <p className="font-semibold text-foreground">{f.curso} — {f.instituicao}</p>
              {f.periodo && <p className="text-xs text-muted-foreground">{f.periodo}</p>}
            </div>
          ))}
        </Section>
      )}

      {resume.experiencias_profissionais?.length > 0 && (
        <Section title="Experiência Profissional">
          {resume.experiencias_profissionais.map((e, i) => (
            <div key={i} className="mb-2">
              <p className="font-semibold text-foreground">{e.cargo} — {e.empresa}</p>
              {e.periodo && <p className="text-xs text-muted-foreground">{e.periodo}</p>}
              {e.atividades && <p className="mt-1 text-foreground">{e.atividades}</p>}
            </div>
          ))}
        </Section>
      )}

      {resume.projetos_academicos?.length > 0 && (
        <Section title="Projetos Acadêmicos">
          {resume.projetos_academicos.map((p, i) => (
            <div key={i} className="mb-2">
              <p className="font-semibold text-foreground">{p.nome}</p>
              {p.descricao && <p className="mt-0.5 text-foreground">{p.descricao}</p>}
              {p.tecnologias?.length > 0 && (
                <p className="mt-0.5 text-xs text-muted-foreground">Tecnologias: {p.tecnologias.join(", ")}</p>
              )}
            </div>
          ))}
        </Section>
      )}

      {resume.cursos_certificacoes?.length > 0 && (
        <Section title="Cursos e Certificações">
          {resume.cursos_certificacoes.map((cr, i) => (
            <div key={i} className="mb-1.5">
              <p className="text-foreground">{cr.nome}{cr.instituicao ? ` — ${cr.instituicao}` : ""}</p>
              {cr.data_conclusao && <p className="text-xs text-muted-foreground">{cr.data_conclusao}</p>}
            </div>
          ))}
        </Section>
      )}

      {(ct.destacadas?.length > 0 || ct.demais?.length > 0) && (
        <Section title="Competências Técnicas">
          {ct.destacadas?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ct.destacadas.map((s, i) => (
                <Badge key={i} variant="secondary" className="font-normal">{s}</Badge>
              ))}
            </div>
          )}
          {ct.demais?.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium">Outras:</span> {ct.demais.join(", ")}
            </p>
          )}
        </Section>
      )}

      {resume.idiomas?.length > 0 && (
        <Section title="Idiomas">
          <p className="text-foreground">{resume.idiomas.join(", ")}</p>
        </Section>
      )}

      {resume.evidencias_utilizadas?.length > 0 && (
        <div className="border-t pt-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Evidências utilizadas
          </p>
          <ul className="space-y-0.5">
            {resume.evidencias_utilizadas.map((ev, i) => (
              <li key={i} className="text-xs text-muted-foreground">• {ev}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="mb-1.5 border-b border-border pb-0.5 text-xs font-bold uppercase tracking-wide text-primary">
        {title}
      </h3>
      {children}
    </div>
  );
}