import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TagInput from "@/components/TagInput";
import { GraduationCap } from "lucide-react";

export default function StepFormacao({ form, setField, setArr }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="h-4 w-4 text-primary" /> Formação acadêmica
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="instituicao">Instituição</Label>
          <Input
            id="instituicao"
            value={form.instituicao}
            onChange={(e) => setField("instituicao", e.target.value)}
            placeholder="Ex.: Universidade do Estado do Amazonas"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="curso">Curso</Label>
          <Input
            id="curso"
            value={form.curso}
            onChange={(e) => setField("curso", e.target.value)}
            placeholder="Ex.: Sistemas de Informação"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="semestre">Semestre atual</Label>
          <Input
            id="semestre"
            value={form.semestre}
            onChange={(e) => setField("semestre", e.target.value)}
            placeholder="Ex.: 5º período"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="previsao_conclusao">Previsão de conclusão</Label>
          <Input
            id="previsao_conclusao"
            value={form.previsao_conclusao}
            onChange={(e) => setField("previsao_conclusao", e.target.value)}
            placeholder="Ex.: 12/2027"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Outras formações</Label>
          <TagInput
            values={form.outras_formacoes}
            onChange={setArr("outras_formacoes")}
            placeholder="Ex.: Curso técnico em informática"
          />
        </div>
      </CardContent>
    </Card>
  );
}