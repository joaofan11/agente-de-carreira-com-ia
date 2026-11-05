import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { validateResumeContent } from "../../../base44/shared/resumeContent.js";
import { generateResumePdf } from "@/lib/resumePdf";
import ResumeView from "@/components/resume/ResumeView";
import OriginalProfile from "@/components/resume/OriginalProfile";
import ResumeEditor from "@/components/resume/ResumeEditor";
import { Sparkles, Loader2, Download, Pencil, Check, Send } from "lucide-react";

// Fluxo de geração de currículo adaptado: gerar → visualizar → editar → aprovar → preparar candidatura.
export default function ResumeGenerator({ job, profile, matchId, onApproved }) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [generating, setGenerating] = useState(false);
  const [resume, setResume] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedResumeId, setSavedResumeId] = useState(null);
  const [method, setMethod] = useState('manual');
  const [preparing, setPreparing] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const active = useRef(true);
  const generateLock = useRef(false);
  const saveLock = useRef(false);
  const prepareLock = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const message = error => error.response?.data?.error || error.data?.error || error.message || "Tente novamente.";

  useEffect(() => {
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [pdfUrl]);

  const handleGenerate = async () => {
    if (generateLock.current || saveLock.current) return;
    if (!profile) {
      toast({ title: "Preencha seu perfil primeiro", variant: "destructive" });
      return;
    }
    generateLock.current = true;
    setGenerating(true);
    try {
      const res = await base44.functions.invoke("generateResume", {
        job_id: job.id,
        match_id: matchId,
      });
      if (!active.current) return;
      const generated = validateResumeContent(res.data.resume);
      const blob = generateResumePdf(generated);
      setSavedResumeId(null);
      setWarnings(res.data.warnings || []);
      setResume(generated);
      setPdfUrl(URL.createObjectURL(blob));
      toast({ title: "Currículo adaptado gerado" });
    } catch (err) {
      toast({ title: "Erro ao gerar currículo", description: message(err), variant: "destructive" });
    } finally {
      generateLock.current = false;
      if (active.current) setGenerating(false);
    }
  };

  const handleSaveEdit = (updated) => {
    if (saveLock.current) return;
    try {
      const validated = validateResumeContent(updated);
      const blob = generateResumePdf(validated);
      setSavedResumeId(null);
      setResume(validated);
      setPdfUrl(URL.createObjectURL(blob));
      setEditing(false);
      toast({title:"Currículo atualizado. Revise e aprove a nova versão."});
    } catch (error) {
      toast({title:"Não foi possível atualizar o currículo",description:message(error),variant:"destructive"});
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `curriculo-${job?.cargo || "vaga"}.pdf`;
    a.click();
  };

  const handleApprove = async () => {
    if (saveLock.current || savedResumeId || !resume) return;
    saveLock.current = true;
    setSaving(true);
    try {
      const content = validateResumeContent(resume);
      if (!content.contato.nome) throw new Error("Informe o nome antes de aprovar.");
      const blob = generateResumePdf(content);
      const file = new File([blob], `curriculo-${job?.cargo || "vaga"}.pdf`, { type: "application/pdf" });
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });

      const response = await base44.functions.invoke('saveResumeVersion', {
        action: 'create', job_id: job.id, ...(matchId ? { match_id: matchId } : {}),
        conteudo_estruturado: content, referencia_pdf_privado: file_uri,
      });
      if (!active.current) return;
      const created = response.data.resume;
      const numeroVersao = created.numero_versao;
      setSavedResumeId(created.id);

      toast({ title: `Versão ${numeroVersao} aprovada e salva` });
      onApproved?.();
    } catch (err) {
      toast({ title: "Erro ao salvar versão", description: message(err), variant: "destructive" });
    } finally {
      saveLock.current = false;
      if (active.current) setSaving(false);
    }
  };

  const handlePrepareApplication = async () => {
    if (prepareLock.current) return;
    if (!savedResumeId) {
      toast({ title: "Aprove o currículo primeiro", variant: "destructive" });
      return;
    }
    prepareLock.current = true;
    setPreparing(true);
    try {
      await base44.functions.invoke("prepareApplication", {
        job_id: job.id,
        resume_version_id: savedResumeId,
        metodo_envio: method,
      });
      if (!active.current) return;
      toast({ title: "Candidatura preparada", description: "Aguardando sua aprovação em Candidaturas." });
      navigate("/candidaturas");
    } catch (err) {
      toast({ title: "Erro ao preparar candidatura", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      prepareLock.current = false;
      if (active.current) setPreparing(false);
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
          <p className="rounded-md border p-3 text-sm text-muted-foreground">Revise o currículo antes de aprovar. Confira especialmente o objetivo e o resumo escritos pela IA. Salvar uma versão não envia candidatura.</p>
          {warnings.map((warning,index) => <p key={index} role="status" className="text-sm text-amber-800">{warning}</p>)}
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

          <label className="block text-sm">Canal da candidatura
            <select className="ml-2 rounded border p-2" value={method} onChange={e=>setMethod(e.target.value)}>
              <option value="manual">Link oficial (manual)</option><option value="gmail">Gmail (exige conexão e destinatário confirmado)</option><option value="outlook">Outlook (exige conexão e destinatário confirmado)</option>
              {job.is_demo === true && <option value="api_direta">Receptor de demonstração</option>}
            </select>
          </label>
          {/* Ações */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditing(true)} disabled={saving || preparing}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" /> Baixar PDF
            </Button>
            <Button onClick={handleApprove} disabled={saving || !!savedResumeId || editing}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              {savedResumeId ? "Versão aprovada" : "Aprovar versão"}
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
