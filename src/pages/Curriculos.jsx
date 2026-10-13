import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import ResumeGenerator from "@/components/resume/ResumeGenerator";
import { Files, Loader2, FileText, Download, Trash2 } from "lucide-react";

const statusLabels = { rascunho: "Rascunho", em_revisao: "Em revisão", pronto: "Pronto" };

export default function Curriculos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("job_id");
  const matchId = searchParams.get("match_id");

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [profile, setProfile] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const queries = [
        base44.entities.ResumeVersion.filter({ is_demo: { $ne: true } }, { sort: "-created_date", limit: 50 }),
        base44.entities.CandidateProfile.filter({ user_id: user.id }, { limit: 1 }),
      ];
      if (jobId) queries.push(base44.entities.Job.get(jobId));
      const [resumePage, profilePage, jobData] = await Promise.all(queries);
      setResumes(resumePage.items);
      setProfile(profilePage.items?.[0] || null);
      if (jobData) setJob(jobData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [jobId]);

  const handleDownload = async (r) => {
    if (!r.referencia_pdf_privado) {
      toast({ title: "PDF não disponível", variant: "destructive" });
      return;
    }
    setDownloadingId(r.id);
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: r.referencia_pdf_privado,
      });
      const a = document.createElement("a");
      a.href = signed_url;
      a.download = `curriculo-v${r.numero_versao || 1}.pdf`;
      a.click();
    } catch (err) {
      toast({ title: "Erro ao baixar", description: err.message, variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (r) => {
    try {
      await base44.entities.ResumeVersion.delete(r.id);
      setResumes((x) => x.filter((i) => i.id !== r.id));
      toast({ title: "Versão removida" });
    } catch (err) {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    }
  };

  const jobResumes = jobId ? resumes.filter((r) => r.job_id === jobId) : [];
  const otherResumes = jobId ? resumes.filter((r) => r.job_id !== jobId) : resumes;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Files}
        title="Meus Currículos"
        description="Gere currículos adaptados por IA para cada vaga e gerencie suas versões."
      />

      {/* Gerador (quando vem de uma vaga) */}
      {jobId && job && (
        <ResumeGenerator job={job} profile={profile} matchId={matchId} onApproved={load} />
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Versões da vaga atual */}
          {jobId && jobResumes.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">
                Versões para esta vaga ({jobResumes.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {jobResumes.map((r) => (
                  <ResumeCard key={r.id} resume={r} onDownload={handleDownload} onDelete={handleDelete} downloading={downloadingId === r.id} />
                ))}
              </div>
            </div>
          )}

          {/* Outras versões */}
          {otherResumes.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">
                {jobId ? "Outras versões" : "Todas as versões"} ({otherResumes.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {otherResumes.map((r) => (
                  <ResumeCard key={r.id} resume={r} onDownload={handleDownload} onDelete={handleDelete} downloading={downloadingId === r.id} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {resumes.length === 0 && !jobId && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <FileText className="h-7 w-7" />
                </div>
                <p className="mt-4 font-medium">Nenhum currículo criado</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Analise uma vaga em Oportunidades e clique em "Preparar currículo" para gerar seu primeiro currículo adaptado.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function ResumeCard({ resume, onDownload, onDelete, downloading }) {
  const c = resume.conteudo_estruturado?.contato || {};
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground">
              {c.nome || "Sem nome"}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {resume.conteudo_estruturado?.objetivo_profissional
                ? resume.conteudo_estruturado.objetivo_profissional.slice(0, 80) + "..."
                : "Sem objetivo"}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={resume.status_revisao === "pronto" ? "secondary" : "outline"} className="font-normal">
                {statusLabels[resume.status_revisao] || resume.status_revisao}
              </Badge>
              {resume.numero_versao > 1 && (
                <Badge variant="outline" className="font-normal">v{resume.numero_versao}</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onDownload(resume)} disabled={downloading} aria-label="Baixar PDF">
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(resume)} className="text-destructive hover:text-destructive" aria-label="Excluir">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {resume.criado_em && (
          <p className="mt-3 text-xs text-muted-foreground">
            Criado em {new Date(resume.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}