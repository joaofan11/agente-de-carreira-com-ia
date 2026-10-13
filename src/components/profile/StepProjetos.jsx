import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import TagInput from "@/components/TagInput";
import { FolderGit2, Plus, Trash2 } from "lucide-react";
import { emptyProjeto } from "./profileHelpers";

export default function StepProjetos({ form, addToList, updateList, removeFromList }) {
  const items = form.projetos_academicos;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderGit2 className="h-4 w-4 text-primary" /> Projetos acadêmicos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Cadastre projetos acadêmicos (TCC, iniciação científica, trabalhos de disciplina). Eles não contam como experiência profissional.
        </p>
        {items.map((proj, idx) => (
          <div key={idx} className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Projeto {idx + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFromList("projetos_academicos", idx)}
                aria-label="Remover projeto"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Nome do projeto</Label>
              <Input
                value={proj.nome}
                onChange={(e) => updateList("projetos_academicos", idx, { nome: e.target.value })}
                placeholder="Ex.: TCC sobre redes neurais"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={proj.descricao}
                onChange={(e) => updateList("projetos_academicos", idx, { descricao: e.target.value })}
                rows={3}
                placeholder="O que era o projeto e seu papel."
              />
            </div>
            <div className="space-y-2">
              <Label>Tecnologias utilizadas</Label>
              <TagInput
                values={proj.tecnologias || []}
                onChange={(vals) => updateList("projetos_academicos", idx, { tecnologias: vals })}
                placeholder="Ex.: Python, TensorFlow"
              />
            </div>
            <div className="space-y-2">
              <Label>Resultados</Label>
              <Textarea
                value={proj.resultados}
                onChange={(e) => updateList("projetos_academicos", idx, { resultados: e.target.value })}
                rows={2}
                placeholder="O que foi alcançado."
              />
            </div>
            <div className="space-y-2">
              <Label>Link do projeto (opcional)</Label>
              <Input
                value={proj.link}
                onChange={(e) => updateList("projetos_academicos", idx, { link: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => addToList("projetos_academicos", emptyProjeto())}
        >
          <Plus className="mr-2 h-4 w-4" /> Adicionar projeto
        </Button>
      </CardContent>
    </Card>
  );
}