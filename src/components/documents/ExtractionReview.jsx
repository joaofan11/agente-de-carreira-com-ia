import React, { useEffect, useState } from "react";
import { documentMonth } from "../../../base44/shared/documentFiles.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, Plus, Trash2 } from "lucide-react";

const ND = "Não identificado";
const isNd = (v) => !v || String(v).trim() === "" || String(v).trim() === ND;
const norm = (v) => (isNd(v) ? "" : String(v));
const dateValue = (v, current = false) => documentMonth(v, current) || (isNd(v) ? "" : String(v));

export default function ExtractionReview({
  open,
  doc,
  extracted,
  onApprove,
  onClose,
  approving,
}) {
  const [data, setData] = useState(extracted);

  useEffect(() => {
    setData(extracted);
  }, [extracted]);

  if (!doc) return null;
  const isCtps = doc.tipo_documento === "ctps";

  const setField = (key, value) => setData((d) => ({ ...d, [key]: value }));

  const handleApprove = () => {
    if (isCtps) {
      const list = Array.isArray(data?.experiencias) ? data.experiencias : [];
      const items = list
        .map((e) => ({
          empresa: norm(e.empresa),
          cargo: norm(e.cargo),
          data_admissao: dateValue(e.data_admissao),
          data_saida: dateValue(e.data_saida, true),
        }))
        .filter((e) => !(isNd(e.empresa) && isNd(e.cargo) && isNd(e.data_admissao) && isNd(e.data_saida)));
      onApprove({ experiencias: items });
    } else {
      onApprove({
        nome_curso: norm(data?.nome_curso),
        instituicao: norm(data?.instituicao),
        data_conclusao: dateValue(data?.data_conclusao),
        carga_horaria: norm(data?.carga_horaria),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !approving) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Revisar informações extraídas</DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            A extração é feita por IA e pode conter erros. Revise cada campo antes de aprovar.
            Campos não identificados aparecem como “Não identificado”. Nenhum dado é enviado ao
            recrutador — isto apenas ajuda a preencher seu perfil.
          </p>
        </div>

        <p className="text-sm text-muted-foreground">Datas no formato MM/AAAA. Se não forem identificadas, deixe em branco. Não invente mês ou ano.</p>
        {doc.extracao_confirmada_em && <p role="status" className="text-sm">Esta extração já foi adicionada ao perfil. Para alterar as informações, acesse Meu Perfil.</p>}
        {isCtps ? (
          <CtpsReview data={data} setData={setData} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome do curso</Label>
              <Input placeholder={ND} value={norm(data?.nome_curso)} onChange={(e) => setField("nome_curso", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Instituição emissora</Label>
              <Input placeholder={ND} value={norm(data?.instituicao)} onChange={(e) => setField("instituicao", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data de conclusão</Label>
              <Input placeholder="MM/AAAA" value={dateValue(data?.data_conclusao)} onChange={(e) => setField("data_conclusao", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Carga horária</Label>
              <Input placeholder={ND} value={norm(data?.carga_horaria)} onChange={(e) => setField("carga_horaria", e.target.value)} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={approving}>
            Cancelar
          </Button>
          <Button onClick={handleApprove} disabled={approving || !!doc.extracao_confirmada_em}>
            {approving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Adicionar informações aprovadas ao meu perfil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CtpsReview({ data, setData }) {
  const list = Array.isArray(data?.experiencias) ? data.experiencias : [];
  const update = (idx, patch) =>
    setData((d) => ({
      ...d,
      experiencias: d.experiencias.map((e, i) => (i === idx ? { ...e, ...patch } : e)),
    }));
  const remove = (idx) =>
    setData((d) => ({ ...d, experiencias: d.experiencias.filter((_, i) => i !== idx) }));
  const add = () =>
    setData((d) => ({
      ...d,
      experiencias: [...(d.experiencias || []), { empresa: ND, cargo: ND, data_admissao: ND, data_saida: ND }],
    }));

  return (
    <div className="space-y-4">
      {list.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma experiência identificada no documento. Você pode adicionar manualmente ou pular.
        </p>
      )}
      {list.map((exp, idx) => (
        <div key={idx} className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Experiência {idx + 1}</span>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)} aria-label="Remover">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Empresa</Label>
              <Input placeholder={ND} value={norm(exp.empresa)} onChange={(e) => update(idx, { empresa: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cargo</Label>
              <Input placeholder={ND} value={norm(exp.cargo)} onChange={(e) => update(idx, { cargo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Data de admissão</Label>
              <Input placeholder="MM/AAAA" value={dateValue(exp.data_admissao)} onChange={(e) => update(idx, { data_admissao: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Data de saída</Label>
              <Input placeholder="MM/AAAA ou Atual" value={dateValue(exp.data_saida, true)} onChange={(e) => update(idx, { data_saida: e.target.value })} />
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-2 h-4 w-4" /> Adicionar experiência
      </Button>
    </div>
  );
}