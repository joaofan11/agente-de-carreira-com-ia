import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

// Dialog para edição do currículo adaptado antes da aprovação.
export default function ResumeEditor({ resume, open, onClose, onSave }) {
  const [data, setData] = useState(resume);

  useEffect(() => { setData(resume); }, [resume, open]);

  if (!data) return null;
  const c = data.contato || {};
  const ct = data.competencias_tecnicas || {};

  const update = (path, value) => {
    setData((d) => {
      const next = { ...d };
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]] = { ...obj[keys[i]] };
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const updateListItem = (key, index, field, value) => {
    setData((d) => {
      const next = { ...d };
      next[key] = (d[key] || []).map((item, i) => i === index ? { ...item, [field]: value } : item);
      return next;
    });
  };

  const addListItem = (key, template) => {
    setData((d) => ({ ...d, [key]: [...(d[key] || []), template] }));
  };

  const removeListItem = (key, index) => {
    setData((d) => ({ ...d, [key]: (d[key] || []).filter((_, i) => i !== index) }));
  };

  const updateTagArray = (path, value) => {
    setData((d) => {
      const next = { ...d };
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]] = { ...obj[keys[i]] };
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar currículo</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Contato */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase">Contato</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Nome" value={c.nome || ""} onChange={(e) => update("contato.nome", e.target.value)} />
              <Input placeholder="Email" value={c.email || ""} onChange={(e) => update("contato.email", e.target.value)} />
              <Input placeholder="Telefone" value={c.telefone || ""} onChange={(e) => update("contato.telefone", e.target.value)} />
              <Input placeholder="Cidade" value={c.cidade || ""} onChange={(e) => update("contato.cidade", e.target.value)} />
            </div>
          </div>

          <Field label="Objetivo Profissional" value={data.objetivo_profissional || ""} onChange={(v) => update("objetivo_profissional", v)} multiline />
          <Field label="Resumo Profissional" value={data.resumo || ""} onChange={(v) => update("resumo", v)} multiline />

          {/* Formação */}
          <ListEditor title="Formação Acadêmica" items={data.formacao_academica} itemKey="formacao_academica"
            fields={[["curso", "Curso"], ["instituicao", "Instituição"], ["periodo", "Período"]]}
            onItemChange={updateListItem} onAdd={() => addListItem("formacao_academica", { instituicao: "", curso: "", periodo: "" })} onRemove={removeListItem} />

          {/* Experiências */}
          <ListEditor title="Experiências Profissionais" items={data.experiencias_profissionais} itemKey="experiencias_profissionais"
            fields={[["empresa", "Empresa"], ["cargo", "Cargo"], ["periodo", "Período"]]}
            multilineFields={[["atividades", "Atividades"]]}
            onItemChange={updateListItem} onAdd={() => addListItem("experiencias_profissionais", { empresa: "", cargo: "", periodo: "", atividades: "" })} onRemove={removeListItem} />

          {/* Projetos */}
          <ListEditor title="Projetos Acadêmicos" items={data.projetos_academicos} itemKey="projetos_academicos"
            fields={[["nome", "Nome"]]}
            multilineFields={[["descricao", "Descrição"]]}
            onItemChange={updateListItem} onAdd={() => addListItem("projetos_academicos", { nome: "", descricao: "", tecnologias: [] })} onRemove={removeListItem} />

          {/* Cursos */}
          <ListEditor title="Cursos e Certificações" items={data.cursos_certificacoes} itemKey="cursos_certificacoes"
            fields={[["nome", "Nome"], ["instituicao", "Instituição"], ["data_conclusao", "Data"]]}
            onItemChange={updateListItem} onAdd={() => addListItem("cursos_certificacoes", { nome: "", instituicao: "", data_conclusao: "" })} onRemove={removeListItem} />

          {/* Competências */}
          <TagField label="Competências Destacadas" values={ct.destacadas || []} onChange={(v) => updateTagArray("competencias_tecnicas.destacadas", v)} />
          <TagField label="Outras Competências" values={ct.demais || []} onChange={(v) => updateTagArray("competencias_tecnicas.demais", v)} />
          <TagField label="Idiomas" values={data.idiomas || []} onChange={(v) => update("idiomas", v)} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(data)}>Salvar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, multiline }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase">{label}</Label>
      {multiline ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function ListEditor({ title, items, itemKey, fields, multilineFields = [], onItemChange, onAdd, onRemove }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold uppercase">{title}</Label>
        <Button type="button" variant="ghost" size="sm" onClick={onAdd}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
        </Button>
      </div>
      {(items || []).map((item, i) => (
        <div key={i} className="space-y-2 rounded-md border p-3">
          <div className="flex justify-end">
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemove(itemKey, i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          {fields.map(([f, label]) => (
            <div key={f} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input value={item[f] || ""} onChange={(e) => onItemChange(itemKey, i, f, e.target.value)} />
            </div>
          ))}
          {multilineFields.map(([f, label]) => (
            <div key={f} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Textarea value={item[f] || ""} onChange={(e) => onItemChange(itemKey, i, f, e.target.value)} rows={2} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TagField({ label, values, onChange }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  };
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase">{label}</Label>
      <div className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Digite e pressione Enter" />
        <Button type="button" variant="outline" size="icon" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {values.map((v, i) => (
            <Badge key={i} variant="secondary" className="cursor-pointer font-normal" onClick={() => onChange(values.filter((_, idx) => idx !== i))}>
              {v} ×
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}