import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import DemoNotice from "@/components/DemoNotice";
import DemoSteps from "@/components/demo/DemoSteps";
import IntegrationStatus from "@/components/demo/IntegrationStatus";
import DemoScenario from "@/components/demo/DemoScenario";
import { personalPage } from "@/components/data/personalRecords";
import RoteiroApresentacao from "@/components/demo/RoteiroApresentacao";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Presentation, Sparkles } from "lucide-react";

const DEMO_BATCH = "demo-etapa17-edital";

export default function Demonstracao() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const filter = { is_demo: true, demo_batch_id: DEMO_BATCH };
        const [profilePage, jobPage, matchPage, resumePage, appPage, receiptPage] = await Promise.all([
          personalPage('profile', { demo_batch_id: DEMO_BATCH, limit: 1 }),
          base44.entities.Job.filter(filter, { limit: 1 }),
          personalPage('matches', { demo_batch_id: DEMO_BATCH, sort: '-data_analise', limit: 1 }),
          personalPage('resumes', { demo_batch_id: DEMO_BATCH, sort: 'numero_versao', limit: 10 }),
          personalPage('applications', { demo_batch_id: DEMO_BATCH, sort: '-created_date', limit: 1 }),
          base44.entities.ReceivedApplication.filter(filter, { sort: "-created_date", limit: 1 }),
        ]);

        const resumes = resumePage.items || [];
        const original = resumes.find((r) => r.numero_versao === 1);
        const adaptado = resumes.find((r) => r.numero_versao === 2);

        setData({
          profile: profilePage.items?.[0],
          job: jobPage.items?.[0],
          match: matchPage.items?.[0],
          resumeOriginal: original,
          resumeAdaptado: adaptado,
          application: appPage.items?.[0],
          receipt: receiptPage.items?.[0],
        });
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader icon={Presentation} title="Demonstração do MVP" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Lock className="h-7 w-7" />
            </div>
            <p className="mt-4 font-medium">Acesso restrito</p>
            <p className="mt-1 text-sm text-muted-foreground">Esta área é disponível apenas para administradores.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Presentation}
        title="Demonstração do MVP"
        description="Desafio Universitário Saul Benchimol 2026 — Edição IA · Estudantes de Engenharia da Computação, UniNorte, Manaus/AM"
      />

      <DemoNotice
        title="Dados fictícios isolados"
        message="Esta demonstração usa um lote demo segregado (is_demo=true). O perfil, vaga, análise, currículos e comprovante são fictícios. Oportunidades reais (Jobicy) permanecem separadas. Nenhuma métrica de impacto real é apresentada."
      />

      {/* Cinco passos */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          Fluxo dos cinco passos
        </h2>
        <DemoSteps />
      </div>

      {/* Estados das integrações */}
      <IntegrationStatus />

      {/* Cenário demo */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Cenário demo — fluxo end-to-end</h2>
        <DemoScenario data={data} loading={loading} />
      </div>

      {/* Roteiro + critérios + prazos */}
      <RoteiroApresentacao />
    </div>
  );
}