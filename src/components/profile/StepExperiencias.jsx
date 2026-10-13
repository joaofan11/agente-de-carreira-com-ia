import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import TagInput from "@/components/TagInput";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { emptyExperiencia } from "./profileHelpers";

export default function StepExperiencias({ form, addToList, updateList, removeFromList }) {
  const items = form.experiencias;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Briefcase className="h-4 w-4 text-primary" /> Experiências profissionais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Sem experiência ainda? Sem problema. Você pode pular esta etapa — projetos acadêmicos serão cadastrados na próxima.
          </p>
        )}
        {items.map((exp, idx) => (
          <div key={idx} className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Experiência {idx + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFromList("experiencias", idx)}
                aria-label="Remover experiência"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Input
                  value={exp.empresa}
                  onChange={(e) => updateList("experiencias", idx, { empresa: e.target.value })}
                  placeholder="Ex.: Empresa X"
                />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input
                  value={exp.cargo}
                  onChange={(e) => updateList("experiencias", idx, { cargo: e.target.value })}
                  placeholder="Ex.: Estagiário de TI"
                />
              </div>
              <div className="space-y-2">
                <Label>Data de início</Label>
                <Input
                  value={exp.data_inicio}
                  onChange={(e) => updateList("experiencias", idx, { data_inicio: e.target.value })}
                  placeholder="MM/AAAA"
                />
              </div>
              <div className="space-y-2">
                <Label>Data de término</Label>
                <Input
                  value={exp.data_termino}
                  onChange={(e) => updateList("experiencias", idx, { data_termino: e.target.value })}
                  placeholder="MM/AAAA ou 'atual'"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Atividades realizadas</Label>
              <Textarea
                value={exp.atividades}
                onChange={(e) => updateList("experiencias", idx, { atividades: e.target.value })}
                rows={3}
                placeholder="Descreva suas atividades reais."
              />
            </div>
            <div className="space-y-2">
              <Label>Competências utilizadas</Label>
              <TagInput
                values={exp.competencias || []}
                onChange={(vals) => updateList("experiencias", idx, { competencias: vals })}
                placeholder="Ex.: Python, Atendimento"
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => addToList("experiencias", emptyExperiencia())}
        >
          <Plus className="mr-2 h-4 w-4" /> Adicionar experiência
        </Button>
      </CardContent>
    </Card>
  );
}