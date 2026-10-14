import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import WhatsAppSection from "@/components/config/WhatsAppSection";
import GmailSection from "@/components/config/GmailSection";
import OutlookSection from "@/components/config/OutlookSection";
import DefaultEmailAccount from "@/components/config/DefaultEmailAccount";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Settings, Bell, Link2, ShieldCheck, LogOut, User, XCircle, AlertTriangle, FileText,
} from "lucide-react";

const integrations = [
  { name: "API de Vagas (externa)", desc: "Importação de oportunidades", configured: false },
  { name: "IA de Análise de Compatibilidade", desc: "Cálculo de match perfil × vaga", configured: false },
  { name: "Google OAuth", desc: "Login com Google", configured: true },
];

export default function Configuracoes() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notif, setNotif] = useState({ newOpportunities: true, applicationUpdates: true, weeklyDigest: false });
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.CandidateProfile.filter({ user_id: user?.id }, { limit: 1 });
        setProfile(res.items?.[0] || null);
      } catch { /* ignore */ }
    })();
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <PageHeader icon={Settings} title="Configurações" description="Preferências da conta e status das integrações." />

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4 text-primary" /> Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">{user?.full_name || "Estudante"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Badge variant="outline" className="capitalize">{user?.role || "user"}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4 text-primary" /> Notificações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            { key: "newOpportunities", label: "Novas oportunidades", desc: "Avisar quando houver vagas compatíveis" },
            { key: "applicationUpdates", label: "Atualizações de candidaturas", desc: "Mudanças de status das suas candidaturas" },
            { key: "weeklyDigest", label: "Resumo semanal", desc: "E-mail semanal com dicas e novidades" },
          ].map((n) => (
            <div key={n.key} className="flex items-center justify-between border-b border-border py-3 last:border-0">
              <div>
                <Label className="cursor-pointer">{n.label}</Label>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <Switch checked={notif[n.key]} onCheckedChange={(v) => setNotif((s) => ({ ...s, [n.key]: v }))} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Link2 className="h-4 w-4 text-primary" /> Integrações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {integrations.map((i) => (
            <div key={i.name} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">{i.name}</p>
                <p className="text-xs text-muted-foreground">{i.desc}</p>
              </div>
              {i.configured ? (
                <Badge variant="secondary" className="font-normal"><ShieldCheck className="mr-1 h-3 w-3" /> Ativo</Badge>
              ) : (
                <Badge variant="outline" className="font-normal text-muted-foreground"><XCircle className="mr-1 h-3 w-3" /> Indisponível</Badge>
              )}
            </div>
          ))}
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
            <AlertTriangle className="h-4 w-4 shrink-0 text-secondary mt-0.5" />
            <span>As integrações não configuradas aparecem como indisponíveis. Elas serão ativadas pela equipe administrativa conforme o cronograma do projeto.</span>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp — alertas e aprovação */}
      <WhatsAppSection profile={profile} />

      {/* Gmail — envio de currículo por e-mail */}
      <GmailSection />

      {/* Outlook — envio de currículo por e-mail */}
      <OutlookSection />

      {/* Conta padrão de envio */}
      <DefaultEmailAccount />

      {/* Privacy + logout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-primary" /> Privacidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Cada estudante acessa somente seus próprios dados. Seus documentos são privados e não são compartilhados com administradores.
          </p>
          <Button variant="outline" onClick={() => navigate("/privacidade")}>
            <FileText className="mr-2 h-4 w-4" /> Ver Política de Privacidade
          </Button>
          <Button variant="destructive" onClick={() => setConfirmLogout(true)}>
            <LogOut className="mr-2 h-4 w-4" /> Sair da conta
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sair da conta?</DialogTitle>
            <DialogDescription>Você será redirecionado para a página de login.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmLogout(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => logout()}>Sair</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}