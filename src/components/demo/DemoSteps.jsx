import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, User, Search, FileCheck, Send, LayoutDashboard } from "lucide-react";

const steps = [
  {
    num: 1,
    icon: User,
    title: "Cadastro profissional",
    desc: "Perfil acadêmico com competências, projetos e formação. CTPS e certificados em PDF opcionais (stored privately).",
    link: "/perfil",
    linkLabel: "Meu Perfil",
    status: "pronto",
  },
  {
    num: 2,
    icon: Search,
    title: "Busca automática de vagas",
    desc: "Coleta de oportunidades reais (Jobicy) e demo, filtradas por preferências do estudante.",
    link: "/oportunidades",
    linkLabel: "Oportunidades",
    status: "pronto",
  },
  {
    num: 3,
    icon: FileCheck,
    title: "Compatibilidade e currículo",
    desc: "Análise IA: Baixo/Médio/Forte. Currículo personalizado por vaga. Aprovação via WhatsApp (bloqueado) ou no site (alternativa disponível).",
    link: "/oportunidades",
    linkLabel: "Ver análise",
    status: "parcial",
  },
  {
    num: 4,
    icon: Send,
    title: "Envio da candidatura",
    desc: "Por e-mail (Gmail/Outlook OAuth — bloqueado) ou API direta quando disponível (demo funcional).",
    link: "/candidaturas",
    linkLabel: "Candidaturas",
    status: "parcial",
  },
  {
    num: 5,
    icon: LayoutDashboard,
    title: "Dashboard",
    desc: "Indicadores: vagas analisadas, recusadas, currículos enviados. Modo demo isola dados fictícios.",
    link: "/dashboard",
    linkLabel: "Dashboard",
    status: "pronto",
  },
];

const statusVariant = { pronto: "secondary", parcial: "outline", bloqueado: "destructive" };
const statusLabel = { pronto: "Pronto", parcial: "Parcial", bloqueado: "Bloqueado" };

export default function DemoSteps() {
  return (
    <div className="space-y-3">
      {steps.map((s) => (
        <Card key={s.num}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm">
                    <span className="text-muted-foreground">Passo {s.num} · </span>
                    {s.title}
                  </p>
                  <Badge variant={statusVariant[s.status]} className="text-xs">
                    {statusLabel[s.status]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
                <Link
                  to={s.link}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {s.linkLabel} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}