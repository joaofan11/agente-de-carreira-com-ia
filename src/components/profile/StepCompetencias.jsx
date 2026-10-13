import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import TagInput from "@/components/TagInput";
import { Sparkles, Plus, Trash2 } from "lucide-react";
import { emptyCurso } from "./profileHelpers";

export default function StepCompetencias({ form, setArr, addToList, updateList, removeFromList }) {
  const cursos = form.cursos_complementares;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" /> Competências e cursos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Competências técnicas</Label>
          <TagInput
            values={form.competencias}
            onChange={setArr("competencias")}
            placeholder="Ex.: JavaScript, Excel, SQL"
          />
        </div>
        <div className="space-y-2">
          <Label>Idiomas</Label>
          <TagInput
            values={form.idiomas}
            onChange={setArr("idiomas")}
            placeholder="Ex.: Português (nativo), Inglês (intermediário)"
          />
        </div>
        <div className="space-y-2">
          <Label>Ferramentas</Label>
          <TagInput
            values={form.ferramentas}
            onChange={setArr("ferramentas")}
            placeholder="Ex.: Git, Figma, VS Code"
          />
        </div>
        <div className="space-y-3">
          <Label>Cursos e certificados</Label>
          {cursos.map((c, idx) => (
            <div
              key={idx}
              className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] items-end rounded-lg border p-3"
            >
              <div className="space-y-2">
                <Label className="text-xs">Nome</Label>
                <Input
                  value={c.nome}
                  onChange={(e) => updateList("cursos_complementares", idx, { nome: e.target.value })}
                  placeholder="Ex.: Curso de Python"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Instituição</Label>
                <Input
                  value={c.instituicao}
                  onChange={(e) => updateList("cursos_complementares", idx, { instituicao: e.target.value })}
                  placeholder="Ex.: Coursera"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Conclusão</Label>
                <Input
                  value={c.data_conclusao}
                  onChange={(e) => updateList("cursos_complementares", idx, { data_conclusao: e.target.value })}
                  placeholder="MM/AAAA"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFromList("cursos_complementares", idx)}
                aria-label="Remover curso"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => addToList("cursos_complementares", emptyCurso())}
          >
            <Plus className="mr-2 h-4 w-4" /> Adicionar curso
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}