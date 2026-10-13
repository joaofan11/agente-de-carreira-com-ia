import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  Sparkles,
  FileText,
  Briefcase,
  Send,
  ShieldCheck,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Perfil acadêmico estruturado",
    desc: "Cadastre formação, habilidades e documentos em um só lugar, com seus dados verdadeiros.",
  },
  {
    icon: Briefcase,
    title: "Oportunidades da região",
    desc: "Vagas de estágio e primeiro emprego focadas em Manaus e região amazônica.",
  },
  {
    icon: Sparkles,
    title: "Análise de compatibilidade com IA",
    desc: "Compare seu perfil às vagas e veja o quanto você se adequa antes de se candidatar.",
  },
  {
    icon: FileText,
    title: "Currículos adaptados",
    desc: "Gere versões do currículo ajustadas a cada vaga, usando apenas dados reais do seu perfil.",
  },
  {
    icon: MessageSquare,
    title: "Aprovação por WhatsApp",
    desc: "Toda candidatura passa pela sua confirmação antes de ser enviada. Você no controle.",
  },
  {
    icon: Send,
    title: "Acompanhamento de candidaturas",
    desc: "Veja o status de cada envio em um painel claro e organizado.",
  },
];

const steps = [
  { n: "01", title: "Crie seu perfil", desc: "Informações acadêmicas e profissionais verdadeiras." },
  { n: "02", title: "Defina preferências", desc: "Área, modelo de trabalho e faixa salarial desejada." },
  { n: "03", title: "Receba análises da IA", desc: "Compatibilidade calculada entre você e cada vaga." },
  { n: "04", title: "Aprove e candidate", desc: "Confirme pelo WhatsApp e acompanhe os resultados." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Agente de Carreira</p>
              <p className="text-[11px] text-secondary font-medium">com Inteligência Artificial</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Criar conta</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
              <Sparkles className="h-3.5 w-3.5" />
              Projeto apresentado na Feira de Tecnologia da UniNorte
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Seu próximo passo profissional,{" "}
              <span className="text-secondary">guiado por IA</span>.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Plataforma para estudantes universitários de Manaus e região amazônica encontrarem
              estágios e o primeiro emprego, com análise de compatibilidade, currículos adaptados
              e aprovação por WhatsApp.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/register">
                  Começar agora <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Já tenho conta</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-secondary" /> 100% dados verdadeiros</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-secondary" /> Sem candidaturas sem sua aprovação</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-secondary" /> Cada um vê só seus dados</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Tudo para sua jornada profissional</h2>
          <p className="mt-3 text-muted-foreground">Recursos pensados para estudantes da região amazônica.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="border-border transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Como funciona</h2>
            <p className="mt-3 text-muted-foreground">Quatro passos simples até a candidatura.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <span className="text-3xl font-bold text-secondary/40">{s.n}</span>
                <h3 className="mt-2 font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
          <ShieldCheck className="mx-auto h-10 w-10 text-secondary" />
          <h2 className="mt-4 text-3xl font-bold">Pronto para começar?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Crie sua conta gratuitamente e deixe a IA ajudar você a encontrar a vaga certa.
          </p>
          <Button size="lg" variant="secondary" className="mt-7" asChild>
            <Link to="/register">Criar minha conta</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2026 Agente de Carreira com IA · UniNorte · Desafio Universitário Saul Benchimol
            </p>
            <p className="text-xs text-muted-foreground">MVP — estrutura visual e navegação</p>
          </div>
        </div>
      </footer>
    </div>
  );
}