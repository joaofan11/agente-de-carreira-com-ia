import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import ExtractionReview from "@/components/documents/ExtractionReview";
import {
  FileText,
  Loader2,
  Upload,
  Trash2,
  FileCheck2,
  FilePlus2,
  Download,
  Sparkles,
  Eye,
} from "lucide-react";

const typeLabels = {
  ctps: "CTPS (Carteira de Trabalho)",
  certificado: "Certificado / Curso",
  cpf: "CPF",
  rg: "RG",
  diploma: "Diploma",
  historico: "Histórico escolar",
  comprovante_residencia: "Comprovante de residência",
  curriculo: "Currículo",
  outro: "Outro",
};

const statusLabels = {
  pendente: "Pendente",
  processando: "Processando",
  concluido: "Concluído",
  erro: "Erro",
};

const statusVariant = {
  pendente: "outline",
  processando: "secondary",
  concluido: "default",
  erro: "destructive",
};

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const EXTRACTABLE = ["ctps", "certificado"];

export default function Documentos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extractingId, setExtractingId] = useState(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("ctps");
  const [file, setFile] = useState(null);
  const [reviewDoc, setReviewDoc] = useState(null);
  const [approving, setApproving] = useState(false);
  const fileRef = useRef(null);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const page = await base44.entities.CandidateDocument.filter(
        {},
        { sort: "-created_date", limit: 50 }
      );
      setDocs(page.items);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const validateFile = (f) => {
    if (!f) return "Selecione um arquivo.";
    const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) return "Apenas arquivos PDF são aceitos.";
    if (f.size > MAX_SIZE) return "O arquivo excede o limite de 5 MB.";
    return null;
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const err = validateFile(file);
    if (err) {
      toast({ title: "Arquivo inválido", description: err, variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.entities.CandidateDocument.create({
        user_id: user.id,
        tipo_documento: type,
        nome_arquivo: title || file.name,
        referencia_arquivo_privado: file_uri,
        status_extracao: "pendente",
        dados_extraidos: {},
        criado_em: new Date().toISOString(),
      });
      toast({
        title: "Documento enviado",
        description: "Arquivo armazenado de forma privada (visível apenas a você).",
      });
      setTitle("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      loadDocs();
    } catch (err) {
      toast({ title: "Erro no envio", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleExtract = async (doc) => {
    setExtractingId(doc.id);
    try {
      await base44.entities.CandidateDocument.update(doc.id, {
        status_extracao: "processando",
      });
      setDocs((d) =>
        d.map((x) => (x.id === doc.id ? { ...x, status_extracao: "processando" } : x))
      );
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: doc.referencia_arquivo_privado,
      });
      const res = await base44.functions.invoke("extractDocumentData", {
        signed_url,
        tipo_documento: doc.tipo_documento,
      });
      const extracted = res.data.extracted;
      await base44.entities.CandidateDocument.update(doc.id, {
        status_extracao: "concluido",
        dados_extraidos: extracted,
      });
      setReviewDoc({ ...doc, status_extracao: "concluido", dados_extraidos: extracted });
      loadDocs();
    } catch (err) {
      await base44.entities.CandidateDocument.update(doc.id, {
        status_extracao: "erro",
      }).catch(() => {});
      setDocs((d) =>
        d.map((x) => (x.id === doc.id ? { ...x, status_extracao: "erro" } : x))
      );
      toast({
        title: "Erro na extração",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setExtractingId(null);
    }
  };

  const handleOpenReview = (doc) => {
    setReviewDoc(doc);
  };

  const handleApprove = async ({ type, items, item }) => {
    setApproving(true);
    try {
      const page = await base44.entities.CandidateProfile.filter({}, { limit: 1 });
      let profile = page.items[0];
      if (!profile) {
        profile = await base44.entities.CandidateProfile.create({
          user_id: user.id,
          nome_completo: user.full_name || "Estudante",
          email: user.email || "",
        });
      }
      if (type === "experiencias") {
        const newExps = items.map((e) => ({
          empresa: e.empresa,
          cargo: e.cargo,
          data_inicio: e.data_admissao,
          data_termino: e.data_saida,
          atividades: "",
          competencias: [],
        }));
        await base44.entities.CandidateProfile.update(profile.id, {
          experiencias: [...(profile.experiencias || []), ...newExps],
        });
      } else if (type === "cursos") {
        const newCurso = {
          nome: item.nome_curso,
          instituicao: item.instituicao,
          data_conclusao: item.data_conclusao,
        };
        await base44.entities.CandidateProfile.update(profile.id, {
          cursos_complementares: [...(profile.cursos_complementares || []), newCurso],
        });
      }
      toast({
        title: "Informações adicionadas ao perfil",
        description: "Revise seu perfil para confirmar os dados.",
      });
      setReviewDoc(null);
    } catch (err) {
      toast({
        title: "Erro ao salvar no perfil",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setApproving(false);
    }
  };

  const handleDelete = async (doc) => {
    try {
      await base44.entities.CandidateDocument.delete(doc.id);
      setDocs((d) => d.filter((x) => x.id !== doc.id));
      toast({ title: "Documento removido" });
    } catch (err) {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    }
  };

  const handleDownload = async (doc) => {
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: doc.referencia_arquivo_privado,
      });
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
        description="Envie CTPS e certificados em PDF para extrair dados com IA. Os arquivos ficam privados e são usados apenas por você."
      />

      {/* Upload */}
      <Card>
        <CardContent className="p-5">
          <form
            onSubmit={handleUpload}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
          >
            <div className="space-y-2">
              <Label htmlFor="doc_title">Título (opcional)</Label>
              <Input
                id="doc_title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: CTPS 2024"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc_file">Arquivo PDF (máx. 5 MB)</Label>
              <Input
                id="doc_file"
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="cursor-pointer"
              />
            </div>
            <Button type="submit" disabled={uploading} className="w-full">
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Enviar
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Apenas PDF. A extração por IA está disponível para CTPS e certificados. Documentos
            originais nunca são enviados a recrutadores.
          </p>
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
            <p className="mt-1 text-sm text-muted-foreground">
              Envie sua CTPS ou certificados para extrair dados com IA.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {docs.map((doc) => {
            const canExtract = EXTRACTABLE.includes(doc.tipo_documento);
            return (
              <Card key={doc.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{doc.nome_arquivo}</p>
                    <p className="text-sm text-muted-foreground">
                      {typeLabels[doc.tipo_documento] || doc.tipo_documento}
                    </p>
                  </div>
                  <Badge variant={statusVariant[doc.status_extracao] || "outline"} className="font-normal">
                    {statusLabels[doc.status_extracao] || doc.status_extracao}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {canExtract && doc.status_extracao !== "concluido" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExtract(doc)}
                        disabled={extractingId === doc.id}
                      >
                        {extractingId === doc.id ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1 h-4 w-4" />
                        )}
                        Extrair
                      </Button>
                    )}
                    {canExtract && doc.status_extracao === "concluido" && (
                      <Button variant="outline" size="sm" onClick={() => handleOpenReview(doc)}>
                        <Eye className="mr-1 h-4 w-4" /> Revisar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(doc)}
                      title="Baixar"
                      aria-label="Baixar documento"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc)}
                      title="Excluir"
                      aria-label="Excluir documento"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ExtractionReview
        open={!!reviewDoc}
        doc={reviewDoc}
        extracted={reviewDoc?.dados_extraidos}
        onApprove={handleApprove}
        onClose={() => setReviewDoc(null)}
        approving={approving}
      />
    </div>
  );
}