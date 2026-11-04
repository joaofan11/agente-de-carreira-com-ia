import React, { useEffect, useRef, useState } from "react";
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
import { validatePdf } from "../../base44/shared/documentFiles.js";
import { personalPage } from "@/components/data/personalRecords";
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

const EXTRACTABLE = ["ctps", "certificado"];

export default function Documentos() {
  const { toast } = useToast();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
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
    setLoadError("");
    try {
      const page = await personalPage('documents', { sort: '-created_date', limit: 50 });
      setDocs(page.items);
    } catch (e) {
      setLoadError("Não foi possível carregar seus documentos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const message = (error) => error.response?.data?.error || error.message || "Tente novamente.";

  const handleUpload = async (e) => {
    e.preventDefault();
    if (uploading) return;
    try {
      await validatePdf(file);
    } catch (error) {
      toast({title:"Arquivo inválido",description:message(error),variant:"destructive"});
      return;
    }
    setUploading(true);
    try {
      const result = await base44.functions.invoke('manageCandidateDocument', {
        file, tipo_documento:type, nome_arquivo:title.trim() || file.name,
      });
      if (result.data.audit_recorded === false) toast({title:"Aviso de auditoria",description:"O documento foi salvo, mas o registro de conclusão precisa ser verificado.",variant:"destructive"});
      toast({
        title: "Documento enviado",
        description: "Arquivo recebido. Clique em Extrair para iniciar a análise por IA.",
      });
      setTitle("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      loadDocs();
    } catch (err) {
      toast({ title: "Erro no envio", description: message(err), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleExtract = async (doc) => {
    if (extractingId) return;
    setExtractingId(doc.id);
    try {
      setDocs((items) => items.map((item) => item.id === doc.id ? {...item, status_extracao: 'processando'} : item));
      const res = await base44.functions.invoke('extractDocumentData', { document_id: doc.id });
      const extracted = res.data.extracted;
      setReviewDoc({ ...doc, status_extracao: "concluido", dados_extraidos: extracted });
      loadDocs();
    } catch (err) {
      // Re-read the authoritative status, including requests already running in another tab.
      await loadDocs();
      toast({
        title: "Erro na extração",
        description: message(err),
        variant: "destructive",
      });
    } finally {
      setExtractingId(null);
    }
  };

  const handleOpenReview = (doc) => {
    setReviewDoc(doc);
  };

  const handleApprove = async (reviewed) => {
    if (approving || !reviewDoc) return;
    setApproving(true);
    try {
      const result = await base44.functions.invoke('manageCandidateDocument', {action:'approve',document_id:reviewDoc.id,reviewed});
      toast({title:result.data.already_applied ? "Extração já adicionada anteriormente" : "Informações aprovadas adicionadas ao perfil"});
      if (result.data.audit_recorded === false) toast({title:"Aviso de auditoria",description:"O perfil foi salvo, mas a auditoria de conclusão precisa ser verificada.",variant:"destructive"});
      setReviewDoc(null);
      await loadDocs();
    } catch (err) {
      toast({title:"Erro ao salvar no perfil",description:message(err),variant:"destructive"});
    } finally {
      setApproving(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm("Remover este registro? O arquivo privado não será apagado do armazenamento por esta ação. Para solicitar exclusão do arquivo, contate o canal LGPD.")) return;
    try {
      await base44.functions.invoke('manageCandidateDocument', { action: 'delete', document_id: doc.id });
      setDocs((d) => d.filter((x) => x.id !== doc.id));
      toast({ title: "Registro removido", description:"A remoção não comprova a exclusão do arquivo privado." });
    } catch (err) {
      toast({ title: "Erro ao remover", description: message(err), variant: "destructive" });
    }
  };

  const handleDownload = async (doc) => {
    const preview = window.open('about:blank', '_blank');
    if (preview) preview.opener = null;
    try {
      const result = await base44.functions.invoke('manageCandidateDocument', {action:'download',document_id:doc.id});
      if (preview) preview.location.href = result.data.signed_url;
      else toast({title:"Permita pop-ups para abrir o documento",variant:"destructive"});
    } catch (err) {
      preview?.close();
      toast({title:"Erro ao abrir",description:message(err),variant:"destructive"});
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        title="Documentos"
        description="Envie CTPS e certificados em PDF para extrair dados com IA. Revise o resultado antes de adicionar ao perfil. A CTPS é opcional."
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
                maxLength={250}
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
            PDF legível, sem senha, até 5 MB. A extração por IA está disponível para CTPS e certificados
            e disponibiliza o arquivo ao serviço de processamento. Evite documentos desnecessários.
            Os originais não são anexados às candidaturas.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end"><Button variant="outline" onClick={loadDocs} disabled={loading}>Atualizar lista</Button></div>
      {loadError && <div role="alert" className="rounded-lg border border-destructive p-4 text-sm text-destructive">{loadError}</div>}
      {/* List */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !loadError && docs.length === 0 ? (
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
                  {doc.extracao_confirmada_em && <Badge variant="secondary">Adicionado ao perfil</Badge>}
                  <Badge variant={statusVariant[doc.status_extracao] || "outline"} className="font-normal">
                    {statusLabels[doc.status_extracao] || doc.status_extracao}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {canExtract && doc.status_extracao !== "concluido" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExtract(doc)}
                        disabled={!!extractingId}
                      >
                        {extractingId === doc.id ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1 h-4 w-4" />
                        )}
                        {doc.status_extracao === "erro" ? "Tentar novamente" : "Extrair"}
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