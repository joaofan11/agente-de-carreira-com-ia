import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pencil, Save, Loader2 } from "lucide-react";

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  );
}

function ReviewCard({ title, onEdit, children }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="mr-1 h-3 w-3" /> Editar
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function StepResumo({ form, progress, onEdit, onSave, saving }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revisão do perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Percentual de preenchimento</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} />
        </CardContent>
      </Card>

      <ReviewCard title="Dados básicos" onEdit={() => onEdit(0)}>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome" value={form.nome_completo} />
          <Field label="E-mail" value={form.email} />
          <Field label="WhatsApp" value={form.telefone_whatsapp} />
          <Field label="Cidade/Estado" value={[form.cidade, form.estado].filter(Boolean).join("/")} />
        </dl>
      </ReviewCard>

      <ReviewCard title="Formação" onEdit={() => onEdit(1)}>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Field label="Instituição" value={form.instituicao} />
          <Field label="Curso" value={form.curso} />
          <Field label="Semestre" value={form.semestre} />
          <Field label="Previsão de conclusão" value={form.previsao_conclusao} />
          <Field label="Outras formações" value={form.outras_formacoes?.join(", ")} />
        </dl>
      </ReviewCard>

      <ReviewCard title={`Experiências (${form.experiencias?.length || 0})`} onEdit={() => onEdit(2)}>
        <div className="space-y-3">
          {form.experiencias?.length ? (
            form.experiencias.map((e, i) => (
              <div key={i} className="text-sm">
                <p className="font-medium">
                  {e.cargo || "Cargo"} — {e.empresa || "Empresa"}
                </p>
                <p className="text-muted-foreground">
                  {[e.data_inicio, e.data_termino].filter(Boolean).join(" a ")}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma experiência cadastrada.</p>
          )}
        </div>
      </ReviewCard>

      <ReviewCard title={`Projetos (${form.projetos_academicos?.length || 0})`} onEdit={() => onEdit(3)}>
        <div className="space-y-3">
          {form.projetos_academicos?.length ? (
            form.projetos_academicos.map((p, i) => (
              <div key={i} className="text-sm">
                <p className="font-medium">{p.nome || "Projeto"}</p>
                <p className="text-muted-foreground line-clamp-2">{p.descricao}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum projeto cadastrado.</p>
          )}
        </div>
      </ReviewCard>

      <ReviewCard title="Competências e cursos" onEdit={() => onEdit(4)}>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Field label="Competências técnicas" value={form.competencias?.join(", ")} />
          <Field label="Idiomas" value={form.idiomas?.join(", ")} />
          <Field label="Ferramentas" value={form.ferramentas?.join(", ")} />
          <Field
            label="Cursos"
            value={form.cursos_complementares?.map((c) => c.nome).join(", ")}
          />
        </dl>
      </ReviewCard>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo profissional</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line text-sm">{form.resumo_profissional || "—"}</p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="button" onClick={onSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? "Salvando..." : "Salvar perfil"}
        </Button>
      </div>
    </div>
  );
}