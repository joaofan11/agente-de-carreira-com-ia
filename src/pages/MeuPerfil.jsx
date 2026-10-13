import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { User, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import StepIndicator from "@/components/profile/StepIndicator";
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
  const [step, setStep] = useState(0);
  const [profileId, setProfileId] = useState(null);
  const [form, setForm] = useState(emptyProfile);

  useEffect(() => {
    (async () => {
      try {
        const page = await base44.entities.CandidateProfile.filter({}, { limit: 1 });
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
        // ignore
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
      const payload = {
        ...form,
        user_id: user.id,
        nome_completo: form.nome_completo.trim(),
        email: form.email || user?.email || "",
        atualizado_em: new Date().toISOString(),
      };
      if (profileId) {
        await base44.entities.CandidateProfile.update(profileId, payload);
        toast({ title: "Perfil atualizado", description: "Suas informações foram salvas." });
      } else {
        const created = await base44.entities.CandidateProfile.create(payload);
        setProfileId(created.id);
        toast({ title: "Perfil criado", description: "Seu perfil foi salvo com sucesso." });
      }
    } catch (err) {
      toast({
        title: "Erro ao salvar",
        description: err.message || "Tente novamente.",
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
          saving={saving}
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