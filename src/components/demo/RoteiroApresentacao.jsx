import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Cpu, Lightbulb, Rocket, Heart, TrendingUp, Calendar, Presentation } from "lucide-react";

const roteiro = [
  { label: "Problema", text: "Estudantes amazônicos têm dificuldade em encontrar estágio/primeiro emprego, preparar currículo e acompanhar seleção." },
  { label: "Público", text: "Estudantes universitários da Amazônia — inicialmente Engenharia da Computação da UniNorte, Manaus/AM." },
  { label: "Solução", text: "Plataforma com IA que conecta oportunidades locais/remotas, analisa compatibilidade e personaliza currículos." },
  { label: "Demonstração", text: "Cinco passos: cadastro, busca de vagas, compatibilidade + currículo + aprovação, envio, dashboard." },
  { label: "Tecnologias", text: "Base44 (backend, auth, RLS), React + Tailwind, IA (InvokeLLM), Jobicy API, jsPDF, OAuth 2.0." },
  { label: "Diferenciais", text: "IA central na análise e adaptação; aprovação obrigatória antes do envio; comprovante real; dados isolados por RLS." },
  { label: "Impacto", text: "Inclusão de estudantes amazônicos no mercado de tecnologia; vagas locais e remotas; expansível a outras instituições." },
  { label: "Próximos passos", text: "Configurar integrações reais (Gmail, Outlook, WhatsApp); ampliar base de vagas; validar com estudantes reais." },
];

const prazos = [
  { label: "MVP concluído", data: "31/10/2026", note: "Planejamento a confirmar com organizadores" },
  { label: "Inscrição no edital", data: "até 09/11/2026", note: "Planejamento a confirmar com organizadores" },
  { label: "Possível semifinal", data: "13/11/2026", note: "A confirmar — não é garantia de agenda" },
  { label: "Feira/entrega final", data: "26/11/2026", note: "A confirmar — não é garantia de agenda" },
];

const criterios = [
  { icon: MapPin, label: "Relevância Amazônia", text: "Problema local, público amazônico, vagas regionais" },
  { icon: Cpu, label: "Uso de IA", text: "Análise de compatibilidade e geração de currículo personalizado" },
  { icon: Lightbulb, label: "Originalidade", text: "Aprovação obrigatória + comprovante real + isolamento de dados" },
  { icon: Rocket, label: "Viabilidade", text: "MVP funcional com fluxo end-to-end demonstrado" },
  { icon: Heart, label: "Impacto social", text: "Inclusão de estudantes sub-representados no mercado de TI" },
  { icon: TrendingUp, label: "Impacto econômico", text: "Conexão com oportunidades locais e remotas, expansível" },
];

export default function RoteiroApresentacao() {
  return (
    <div className="space-y-4">
      {/* Roteiro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Presentation className="h-4 w-4 text-primary" />
            Roteiro de apresentação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {roteiro.map((r) => (
            <div key={r.label} className="flex gap-3">
              <Badge variant="outline" className="shrink-0 text-xs font-medium">{r.label}</Badge>
              <p className="text-sm text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Critérios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Critérios do edital</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {criterios.map((c) => (
            <div key={c.label} className="rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <c.icon className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">{c.label}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{c.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Prazos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-primary" />
            Prazos do planejamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {prazos.map((p) => (
            <div key={p.label} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-xs text-amber-600">{p.note}</p>
              </div>
              <Badge variant="outline" className="text-xs">{p.data}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}