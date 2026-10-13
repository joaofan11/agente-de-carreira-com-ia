import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  FileText,
  Loader2,
  Upload,
  Trash2,
  FileCheck2,
  FilePlus2,
  Download,
} from "lucide-react";

const typeLabels = {
  cpf: "CPF",
  rg: "RG",
  diploma: "Diploma",
  historico: "Histórico escolar",
  comprovante_residencia: "Comprovante de residência",
  curriculo: "Currículo",
  outro: "Outro",
};

function formatSize(bytes) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${units[i]}`;
}

export default function Documentos() {
  const { toast } = useToast();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("outro");
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const page = await base44.entities.Document.filter({}, { sort: "-created_date", limit: 50 });
      setDocs(page.items);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocs(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast({ title: "Selecione um arquivo", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.entities.Document.create({
        title: title || file.name,
        type,
        file_uri,
        file_name: file.name,
        mime_type: file.type,
        size: file.size,
        status: "pendente",
      });
      toast({ title: "Documento enviado", description: "Arquivo armazenado de forma privada." });
      setTitle("");
      setType("outro");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      loadDocs();
    } catch (err) {
      toast({ title: "Erro no envio", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc) => {
    try {
      await base44.entities.Document.delete(doc.id);
      setDocs((d) => d.filter((x) => x.id !== doc.id));
      toast({ title: "Documento removido" });
    } catch (err) {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    }
  };

  const handleDownload = async (doc) => {
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file_uri });
      window.open(signed_url, "_blank");
    } catch (err) {
      toast({ title: "Erro ao abrir", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        title="Documentos"
        description="Envie e organize seus documentos. Os arquivos são armazenados de forma privada e visíveis apenas a você."
      />

      {/* Upload */}
      <Card>
        <CardContent className="p-5">
          <form onSubmit={handleUpload} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="doc_title">Título</Label>
              <Input id="doc_title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: CPF digitalizado" />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc_file">Arquivo</Label>
              <Input
                id="doc_file"
                ref={fileRef}
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="cursor-pointer"
              />
            </div>
            <Button type="submit" disabled={uploading} className="w-full">
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Enviar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : docs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FilePlus2 className="h-7 w-7" />
            </div>
            <p className="mt-4 font-medium">Nenhum documento enviado</p>
            <p className="mt-1 text-sm text-muted-foreground">Use o formulário acima para enviar seu primeiro arquivo.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {docs.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{doc.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {typeLabels[doc.type] || doc.type} · {doc.file_name} · {formatSize(doc.size)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)} title="Baixar" aria-label="Baixar documento">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(doc)} title="Excluir" aria-label="Excluir documento" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}