import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import DemoNotice from "@/components/DemoNotice";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Files, Loader2, Plus, Pencil, Trash2, Sparkles, FileText } from "lucide-react";

const statusLabels = { rascunho: "Rascunho", pronto: "Pronto" };

export default function Curriculos() {
  const { toast } = useToast();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", summary: "", status: "rascunho" });

  const load = async () => {
    setLoading(true);
    try {
      const page = await base44.entities.Resume.filter({}, { sort: "-created_date", limit: 50 });
      setResumes(page.items);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", summary: "", status: "rascunho" });
    setOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({ title: r.title || "", summary: r.summary || "", status: r.status || "rascunho" });
    setOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, last_modified: new Date().toISOString() };
      if (editing) {
        await base44.entities.Resume.update(editing.id, payload);
        toast({ title: "Currículo atualizado" });
      } else {
        await base44.entities.Resume.create(payload);
        toast({ title: "Currículo criado" });
      }
      setOpen(false);
      load();
    } catch (err) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r) => {
    try {
      await base44.entities.Resume.delete(r.id);
      setResumes((x) => x.filter((i) => i.id !== r.id));
      toast({ title: "Currículo removido" });
    } catch (err) {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Files}
        title="Meus Currículos"
        description="Crie e gerencie versões do seu currículo. A adaptação automática com IA será disponibilizada em breve."
        actions={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Novo currículo</Button>}
      />

      <DemoNotice title="Adaptação com IA — recurso demonstrativo" />

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : resumes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FileText className="h-7 w-7" />
            </div>
            <p className="mt-4 font-medium">Nenhum currículo criado</p>
            <p className="mt-1 text-sm text-muted-foreground">Crie seu primeiro currículo para começar a se candidatar.</p>
            <Button className="mt-5" onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Criar currículo</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {resumes.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-foreground">{r.title}</h3>
                    <Badge variant={r.status === "pronto" ? "secondary" : "outline"} className="mt-1.5 font-normal">
                      {statusLabels[r.status] || r.status}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r)} aria-label="Excluir" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                {r.summary && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{r.summary}</p>}
                {r.last_modified && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Atualizado em {new Date(r.last_modified).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar currículo" : "Novo currículo"}</DialogTitle>
            <DialogDescription>Use apenas informações verdadeiras do seu perfil.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="r_title">Título *</Label>
              <Input id="r_title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex.: Currículo para Estágio em TI" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r_summary">Resumo / Objetivo</Label>
              <Textarea id="r_summary" value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} rows={4} placeholder="Resumo profissional e objetivo de carreira." />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="pronto">Pronto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}