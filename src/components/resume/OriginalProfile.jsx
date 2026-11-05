import React from "react";
import { Badge } from "@/components/ui/badge";

// Exibe os dados originais do perfil do candidato (para comparação com o adaptado).
export default function OriginalProfile({ profile }) {
  if (!profile) {
    return (
      <div className="rounded-lg border bg-white p-6 text-center text-sm text-muted-foreground">
        Nenhum perfil encontrado. Preencha seu perfil em "Meu Perfil".
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border bg-white p-5 text-sm shadow-sm sm:p-8">
      <div className="border-b pb-3">
        <h2 className="text-lg font-bold text-foreground">{profile.nome_completo}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {[profile.email, profile.telefone_whatsapp, [profile.cidade, profile.estado].filter(Boolean).join(" - ")].filter(Boolean).join(" | ")}
        </p>
      </div>

      <Section title="Formação">
        <p className="text-foreground">{profile.curso} — {profile.instituicao}</p>
        {profile.semestre && <p className="text-xs text-muted-foreground">Semestre: {profile.semestre}</p>}
        {profile.previsao_conclusao && <p className="text-xs text-muted-foreground">Previsão: {profile.previsao_conclusao}</p>}
        {profile.outras_formacoes?.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">Outras: {profile.outras_formacoes.join(", ")}</p>
        )}
      </Section>

      {profile.experiencias?.length > 0 && (
        <Section title="Experiências">
          {profile.experiencias.map((e, i) => (
            <div key={i} className="mb-2">
              <p className="font-semibold text-foreground">{e.cargo} — {e.empresa}</p>
              <p className="text-xs text-muted-foreground">{e.data_inicio} — {e.data_termino || "Atual"}</p>
              {e.atividades && <p className="mt-0.5 text-foreground">{e.atividades}</p>}
            </div>
          ))}
        </Section>
      )}

      {profile.projetos_academicos?.length > 0 && (
        <Section title="Projetos Acadêmicos">
          {profile.projetos_academicos.map((p, i) => (
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

      {profile.competencias?.length > 0 && (
        <Section title="Competências">
          <div className="flex flex-wrap gap-1.5">
            {profile.competencias.map((s, i) => (
              <Badge key={i} variant="outline" className="font-normal">{s}</Badge>
            ))}
          </div>
        </Section>
      )}

      {profile.idiomas?.length > 0 && (
        <Section title="Idiomas">
          <p className="text-foreground">{profile.idiomas.join(", ")}</p>
        </Section>
      )}

      {profile.ferramentas?.length > 0 && (
        <Section title="Ferramentas">
          <p className="text-foreground">{profile.ferramentas.join(", ")}</p>
        </Section>
      )}

      {profile.cursos_complementares?.length > 0 && (
        <Section title="Cursos Complementares">
          {profile.cursos_complementares.map((c, i) => (
            <div key={i} className="mb-1">
              <p className="text-foreground">{c.nome}{c.instituicao ? ` — ${c.instituicao}` : ""}</p>
              {c.data_conclusao && <p className="text-xs text-muted-foreground">{c.data_conclusao}</p>}
              {c.carga_horaria && <p className="text-xs text-muted-foreground">Carga horária: {c.carga_horaria}</p>}
            </div>
          ))}
        </Section>
      )}

      {profile.resumo_profissional && (
        <Section title="Resumo Profissional Original">
          <p className="text-foreground">{profile.resumo_profissional}</p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="mb-1.5 border-b border-border pb-0.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}