import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { generateResumePdf } from "@/lib/resumePdf";
import ResumeView from "@/components/resume/ResumeView";
import OriginalProfile from "@/components/resume/OriginalProfile";
import ResumeEditor from "@/components/resume/ResumeEditor";
import { Sparkles, Loader2, FileText, Download, Pencil, Check, Send, FileDown } from "lucide-react";

// Fluxo de geração de currículo adaptado: gerar → visualizar → editar → aprovar → preparar candidatura.
export default function ResumeGenerator({ job, profile, matchId, onApproved }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [generating, setGenerating] = useState(false);
  const [resume, setResume] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedResumeId, setSavedResumeId] = useState(null);
  const [preparing, setPreparing] = useState(false);

  useEffect(() => {
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [pdfUrl]);

  const handleGenerate = async () => {
    if (!profile) {
      toast({ title: "Preencha seu perfil primeiro", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const res = await base44.functions.invoke("generateResume", {
        job_id: job.id,
        match_id: matchId,
      });
      const generated = res.data.resume;
      setResume(generated);
      const blob = generateResumePdf(generated);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(URL.createObjectURL(blob));
      toast({ title: "Currículo adaptado gerado" });
    } catch (err) {
      toast({ title: "Erro ao gerar currículo", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveEdit = (updated) => {
    setResume(updated);
    const blob = generateResumePdf(updated);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(URL.createObjectURL(blob));
    setEditing(false);
    toast({ title: "Currículo atualizado" });
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `curriculo-${job?.cargo || "vaga"}.pdf`;
    a.click();
  };

  const handleApprove = async () => {
    setSaving(true);
    try {
      const blob = generateResumePdf(resume);
      const file = new File([blob], `curriculo-${job?.cargo || "vaga"}.pdf`, { type: "application/pdf" });
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });

      const existingPage = await base44.entities.ResumeVersion.filter(
        { user_id: user.id, job_id: job.id },
        { limit: 50 }
      );
      const numeroVersao = (existingPage.items?.length || 0) + 1;

      const created = await base44.entities.ResumeVersion.create({
        user_id: user.id,
        job_id: job.id,
        match_id: matchId,
        conteudo_estruturado: resume,
        referencia_pdf_privado: file_uri,
        evidencias_utilizadas: resume.evidencias_utilizadas || [],
        numero_versao: numeroVersao,
        status_revisao: "pronto",
        criado_em: new Date().toISOString(),
      });
      setSavedResumeId(created.id);

      toast({ title: `Versão ${numeroVersao} aprovada e salva` });
      onApproved?.();
    } catch (err) {
      toast({ title: "Erro ao salvar versão", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePrepareApplication = async () => {
    if (!savedResumeId) {
      toast({ title: "Aprove o currículo primeiro", variant: "destructive" });
      return;
    }
    setPreparing(true);
    try {
      await base44.functions.invoke("prepareApplication", {
        job_id: job.id,
        resume_version_id: savedResumeId,
        metodo_envio: "email",
      });
      toast({ title: "Candidatura preparada", description: "Aguardando sua aprovação em Candidaturas." });
      navigate("/candidaturas");
    } catch (err) {
      toast({ title: "Erro ao preparar candidatura", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setPreparing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner da vaga */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Gerar currículo para</p>
            <p className="truncate font-semibold text-foreground">{job.cargo} — {job.empresa}</p>
          </div>
          {!resume && !generating && (
            <Button onClick={handleGenerate} disabled={!profile}>
              <Sparkles className="mr-2 h-4 w-4" /> Gerar com IA
            </Button>
          )}
          {generating && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...
            </Button>
          )}
        </CardContent>
      </Card>

      {!profile && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Preencha seu perfil em "Meu Perfil" antes de gerar um currículo.
        </div>
      )}

      {resume && (
        <>
          <Tabs defaultValue="adaptado">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="adaptado">Adaptado</TabsTrigger>
              <TabsTrigger value="original">Perfil Original</TabsTrigger>
              <TabsTrigger value="pdf">PDF</TabsTrigger>
            </TabsList>

            <TabsContent value="adaptado" className="mt-4">
              <ResumeView resume={resume} />
            </TabsContent>

            <TabsContent value="original" className="mt-4">
              <OriginalProfile profile={profile} />
            </TabsContent>

            <TabsContent value="pdf" className="mt-4">
              {pdfUrl ? (
                <div className="overflow-hidden rounded-lg border">
                  <iframe src={pdfUrl} title="Prévia do PDF" className="h-[600px] w-full" />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando PDF...
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Ações */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" /> Baixar PDF
            </Button>
            <Button onClick={handleApprove} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Aprovar versão
            </Button>
            <Button variant="secondary" onClick={handlePrepareApplication} disabled={!savedResumeId || preparing}>
              {preparing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Preparar candidatura
            </Button>
          </div>

          <ResumeEditor resume={resume} open={editing} onClose={() => setEditing(false)} onSave={handleSaveEdit} />
        </>
      )}
    </div>
  );
}