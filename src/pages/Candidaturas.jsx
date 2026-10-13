import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Send, Info } from "lucide-react";
import ApplicationCard from "@/components/applications/ApplicationCard";
import ApprovalDialog from "@/components/applications/ApprovalDialog";
import NewApplicationDialog from "@/components/applications/NewApplicationDialog";

export default function Candidaturas() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [reviewApp, setReviewApp] = useState(null);
  const [dispatchingId, setDispatchingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [appPage, jobPage, resumePage] = await Promise.all([
        base44.entities.Application.filter({ is_demo: { $ne: true } }, { sort: "-created_date", limit: 50 }),
        base44.entities.Job.filter({ status: "ativa" }, { sort: "-created_date", limit: 100 }),
        base44.entities.ResumeVersion.filter({ is_demo: { $ne: true } }, { sort: "-created_date", limit: 100 }),
      ]);
      setApps(appPage.items);
      setJobs(jobPage.items);
      setResumes(resumePage.items);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (location.state?.jobId) {
      setNewOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  const jobMap = {};
  jobs.forEach((j) => { jobMap[j.id] = j; });
  const resumeMap = {};
  resumes.forEach((r) => { resumeMap[r.id] = r; });

  const handleDispatch = async (app) => {
    setDispatchingId(app.id);
    try {
      const res = await base44.functions.invoke("dispatchApprovedApplication", { application_id: app.id });
      const updated = res.data.application;
      setApps((a) => a.map((x) => (x.id === app.id ? updated : x)));
      if (updated.status === "acao_manual_necessaria") {
        toast({
          title: "Ação manual necessária",
          description: updated.motivo_bloqueio || "Provedor não configurado. Acesse o link oficial para se candidatar.",
        });
      } else {
        toast({ title: "Candidatura enviada", description: "Aguardando resposta da empresa." });
      }
    } catch (err) {
      toast({ title: "Erro ao enviar", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setDispatchingId(null);
    }
  };

  const handleDelete = async (app) => {
    try {
      await base44.entities.Application.delete(app.id);
      setApps((a) => a.filter((x) => x.id !== app.id));
    } catch (err) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleAction = (updatedApp) => {
    setApps((a) => a.map((x) => (x.id === updatedApp.id ? updatedApp : x)));
    setReviewApp(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Send}
        title="Candidaturas"
        description="Acompanhe o status de cada candidatura. Nenhuma candidatura é enviada sem sua aprovação."
        actions={<Button onClick={() => setNewOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nova candidatura</Button>}
      />

      <div className="flex items-start gap-2 rounded-lg border border-dashed border-secondary/50 bg-secondary/5 px-3 py-2 text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 text-secondary mt-0.5" />
        <span>
          <strong className="text-secondary">Provedores de envio não configurados</strong> — as candidaturas serão marcadas como "ação manual necessária" até que as integrações de e-mail ou API direta sejam configuradas.
        </span>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : apps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Send className="h-7 w-7" />
            </div>
            <p className="mt-4 font-medium">Nenhuma candidatura ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">Crie uma candidatura a partir das oportunidades ou manualmente.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              job={jobMap[app.job_id]}
              resume={resumeMap[app.resume_version_id]}
              onReview={() => setReviewApp(app)}
              onDispatch={() => handleDispatch(app)}
              onDelete={() => handleDelete(app)}
              dispatching={dispatchingId === app.id}
            />
          ))}
        </div>
      )}

      <NewApplicationDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        jobs={jobs}
        resumes={resumes}
        onCreated={() => load()}
      />

      <ApprovalDialog
        app={reviewApp}
        job={reviewApp ? jobMap[reviewApp.job_id] : null}
        resume={reviewApp ? resumeMap[reviewApp.resume_version_id] : null}
        open={!!reviewApp}
        onClose={() => setReviewApp(null)}
        onAction={handleAction}
      />
    </div>
  );
}