import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const integrations = [
  {
    name: "Jobicy (busca de vagas)",
    desc: "API pública de vagas remotas e regionais",
    status: "pronto",
    instruction: null,
  },
  {
    name: "IA — Análise de compatibilidade",
    desc: "InvokeLLM para pontuação e evidências estruturadas",
    status: "pronto",
    instruction: null,
  },
  {
    name: "IA — Geração de currículo",
    desc: "InvokeLLM para adaptação de currículo por vaga",
    status: "pronto",
    instruction: null,
  },
  {
    name: "API direta (receptor demo)",
    desc: "Submissão para endpoint próprio com comprovante real",
    status: "pronto",
    instruction: null,
  },
  {
    name: "WhatsApp Business API (Twilio)",
    desc: "Aprovação de candidaturas via WhatsApp",
    status: "bloqueado",
    instruction: "Requer configuração de segredos Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM) no painel Secrets do Base44.",
  },
  {
    name: "Gmail (envio por e-mail)",
    desc: "OAuth 2.0 do estudante via conector de aplicativo",
    status: "bloqueado",
    instruction: "Requer registro de conector Gmail no Base44 (App User) e configuração no Google Cloud Console com Redirect URI.",
  },
  {
    name: "Outlook (envio por e-mail)",
    desc: "OAuth 2.0 do estudante via conector de aplicativo",
    status: "bloqueado",
    instruction: "Requer registro de conector Outlook no Base44 (App User) e configuração no Microsoft Entra com Redirect URI.",
  },
];

const iconMap = { pronto: CheckCircle2, bloqueado: XCircle, parcial: AlertCircle };
const colorMap = { pronto: "text-secondary", bloqueado: "text-destructive", parcial: "text-amber-500" };

export default function IntegrationStatus() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Estados das integrações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {integrations.map((i) => {
          const Icon = iconMap[i.status];
          return (
            <div key={i.name} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.desc}</p>
                </div>
                <Icon className={`h-5 w-5 shrink-0 ${colorMap[i.status]}`} />
              </div>
              {i.instruction && (
                <p className="mt-2 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
                  <strong>Bloqueado:</strong> {i.instruction}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}