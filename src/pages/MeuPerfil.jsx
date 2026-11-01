import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { User, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import StepIndicator from "@/components/profile/StepIndicator";
import { personalPage, saveProfile } from "@/components/data/personalRecords";
import StepBasicos from "@/components/profile/StepBasicos";
import StepFormacao from "@/components/profile/StepFormacao";
import StepExperiencias from "@/components/profile/StepExperiencias";
import StepProjetos from "@/components/profile/StepProjetos";
import StepCompetencias from "@/components/profile/StepCompetencias";
import StepResumo from "@/components/profile/StepResumo";
import {
  emptyProfile,
  normalizeProfile,
  calcProgress,
} from "@/components/profile/profileHelpers";

const STEPS = [
  { id: "basicos", label: "Dados básicos" },
  { id: "formacao", label: "Formação" },
  { id: "experiencias", label: "Experiências" },
  { id: "projetos", label: "Projetos" },
  { id: "competencias", label: "Competências" },
  { id: "resumo", label: "Resumo" },
];

export default function MeuPerfil() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [step, setStep] = useState(0);
  const [profileId, setProfileId] = useState(null);
  const [form, setForm] = useState(emptyProfile);

  useEffect(() => {
    (async () => {
      try {
        const fixtureId = new URLSearchParams(window.location.search).get('fixture_id');
        const page = await personalPage('profile', {
          limit: 1, sort: '-updated_date',
          ...(fixtureId ? { id: fixtureId, include_demo: true } : {}),
        });
        if (fixtureId && (!page.items?.[0]?.is_demo || user?.role !== 'admin')) {
          throw new Error('Fixture demo própria não encontrada.');
        }
        const p = page.items[0];
        if (p) {
          setProfileId(p.id);
          setForm(normalizeProfile(p));
        } else if (user) {
          setForm((f) => ({
            ...f,
            nome_completo: user.full_name || "",
            email: user.email || "",
          }));
        }
      } catch (e) {
        setLoadError(e.response?.data?.error || e.message);
        toast({ title: 'Não foi possível carregar o perfil', description: e.response?.data?.error || e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setArr = (key) => (vals) => setForm((f) => ({ ...f, [key]: vals }));
  const updateList = (key, idx, patch) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));
  const addToList = (key, obj) => setForm((f) => ({ ...f, [key]: [...f[key], obj] }));
  const removeFromList = (key, idx) =>
    setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== idx) }));

  const progress = useMemo(() => calcProgress(form), [form]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const canAdvance = () => {
    if (step === 0 && !form.nome_completo?.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe seu nome completo para continuar.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const next = () => {
    if (canAdvance()) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
      scrollToTop();
    }
  };
  const back = () => {
    setStep((s) => Math.max(s - 1, 0));
    scrollToTop();
  };

  const handleSave = async () => {
    if (loadError) return;
    if (!form.nome_completo?.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe seu nome completo.",
        variant: "destructive",
      });
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      // Somente campos editáveis; identidade e marcação demo ficam sob controle do servidor.
      const editableFields = {
        nome_completo: form.nome_completo.trim(),
        email: form.email || "",
        telefone_whatsapp: form.telefone_whatsapp || "",
        cidade: form.cidade || "",
        estado: form.estado || "",
        instituicao: form.instituicao || "",
        curso: form.curso || "",
        semestre: form.semestre || "",
        previsao_conclusao: form.previsao_conclusao || "",
        outras_formacoes: form.outras_formacoes || [],
        experiencias: form.experiencias || [],
        projetos_academicos: form.projetos_academicos || [],
        competencias: form.competencias || [],
        idiomas: form.idiomas || [],
        ferramentas: form.ferramentas || [],
        cursos_complementares: form.cursos_complementares || [],
        resumo_profissional: form.resumo_profissional || "",
        disponibilidade: form.disponibilidade || "",
      };
      const saved = await saveProfile(profileId, editableFields);
      setProfileId(saved.id);
      setForm(normalizeProfile(saved));
      toast({ title: 'Perfil salvo', description: 'Suas informações foram salvas.' });
    } catch (err) {
      toast({
        title: "Erro ao salvar",
        description: err.response?.data?.error || err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const stepProps = { form, setField, setArr, updateList, addToList, removeFromList };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={User}
        title="Meu Perfil"
        description="Seus dados acadêmicos e profissionais. Use apenas informações verdadeiras."
      />

      {loadError && <p role="alert" className="text-sm text-destructive">Falha no carregamento: {loadError}. O salvamento está bloqueado para proteger seus dados.</p>}
      {form.is_demo && <p className="rounded-lg border bg-muted p-3 text-sm text-muted-foreground">Fixture de demonstração: {form.demo_batch_id}. Este não é seu perfil real.</p>}
      {!profileId && <p className="text-sm text-muted-foreground">Nenhum perfil real cadastrado. Dados de demonstração não são usados para preencher seu perfil.</p>}
      <StepIndicator
        steps={STEPS}
        current={step}
        onJump={(i) => {
          setStep(i);
          scrollToTop();
        }}
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Etapa {step + 1} de {STEPS.length}
        </span>
        <span>{progress}% completo</span>
      </div>

      {step === 0 && <StepBasicos {...stepProps} />}
      {step === 1 && <StepFormacao {...stepProps} />}
      {step === 2 && <StepExperiencias {...stepProps} />}
      {step === 3 && <StepProjetos {...stepProps} />}
      {step === 4 && <StepCompetencias {...stepProps} />}
      {step === 5 && (
        <StepResumo
          form={form}
          progress={progress}
          onEdit={(i) => setStep(i)}
          onSave={handleSave}
          saving={saving || !!loadError}
        />
      )}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={back}
          disabled={step === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next}>
            Avançar <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}