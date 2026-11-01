import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { personalPage } from "@/components/data/personalRecords";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, MessageCircle, Send, AlertTriangle, CheckCircle2, XCircle, Clock, ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function WhatsAppSection({ profile }) {
  const { toast } = useToast();
  const [integration, setIntegration] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [intRes, notifRes] = await Promise.all([
        personalPage('integrations', { provedor: 'whatsapp', limit: 1 }),
        personalPage('notifications', { canal: 'whatsapp', sort: '-criado_em', limit: 10 }),
      ]);
      setIntegration(intRes.items?.[0] || null);
      setNotifications(notifRes.items || []);
      setNotifEnabled(intRes.items?.[0]?.notificacoes_ativas === true);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleTest = async () => {
    if (!profile?.telefone_whatsapp) {
      toast({
        title: "WhatsApp não cadastrado",
        description: "Cadastre seu telefone WhatsApp em Meu Perfil.",
        variant: "destructive",
      });
      return;
    }
    setTesting(true);
    try {
      const res = await base44.functions.invoke("sendWhatsAppAlert", { is_test: true });
      if (res.data?.configured === false) {
        toast({
          title: "WhatsApp não configurado",
          description: "As credenciais Twilio ainda não foram definidas. Configure os segredos TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_WHATSAPP_FROM.",
          variant: "destructive",
        });
      } else if (res.data?.success) {
        toast({
          title: "Mensagem de teste enviada",
          description: "Verifique seu WhatsApp. Use o código recebido para testar APROVAR/RECUSAR.",
        });
        loadData();
      } else {
        toast({
          title: "Falha no envio",
          description: res.data?.error || res.data?.details || "Erro desconhecido.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setTesting(false);
  };

  const handleToggleNotif = async (enabled) => {
    setNotifEnabled(enabled);
    try {
      await base44.functions.invoke('saveWhatsAppPreference', { enabled });
      loadData();
    } catch (error) {
      setNotifEnabled(!enabled);
      toast({ title: 'Erro ao salvar preferência', description: error.response?.data?.error || error.message, variant: 'destructive' });
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return "Não cadastrado";
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 12) {
      return "+" + digits.substring(0, 2) + " " + digits.substring(2, 4) + " " +
        digits.substring(4, 9) + "-" + digits.substring(9);
    }
    return phone;
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-4 w-4 text-secondary" /> WhatsApp — Alertas e Aprovação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status de configuração */}
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Número cadastrado</p>
              <p className="text-sm text-muted-foreground">{formatPhone(profile?.telefone_whatsapp)}</p>
            </div>
            <Badge variant="outline" className="font-normal text-muted-foreground">
              <XCircle className="mr-1 h-3 w-3" /> Não configurado
            </Badge>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <div>
              <Label className="cursor-pointer">Receber alertas via WhatsApp</Label>
              <p className="text-xs text-muted-foreground">Notificações de novas vagas compatíveis</p>
            </div>
            <Switch checked={notifEnabled} onCheckedChange={handleToggleNotif} />
          </div>

          <Button variant="outline" size="sm" onClick={handleTest} disabled={testing || !profile?.telefone_whatsapp} className="w-full">
            {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Enviar mensagem de teste
          </Button>
        </div>

        {/* Aviso de não configurado */}
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <strong>WhatsApp não configurado.</strong> As credenciais Twilio (Account SID, Auth Token e número remetente) precisam ser definidas nos segredos do backend. Após a configuração, ative o Sandbox no Twilio e conecte seu número.
          </span>
        </div>

        {/* Histórico de mensagens */}
        <div>
          <p className="text-sm font-medium mb-2">Histórico de mensagens</p>
          {loading ? (
            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma mensagem ainda.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="flex items-start gap-2 rounded-lg border border-border p-2 text-xs">
                  {n.direcao === "recebida" ? (
                    <ArrowDownLeft className="h-3.5 w-3.5 text-secondary mt-0.5 shrink-0" />
                  ) : (
                    <ArrowUpRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{n.direcao === "recebida" ? "Recebida" : "Enviada"}</span>
                      {n.decisao && n.decisao !== "desconhecido" && (
                        <Badge variant="secondary" className="text-[10px] py-0">{n.decisao}</Badge>
                      )}
                      {n.resultado === "sucesso" ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : n.resultado === "erro" ? (
                        <XCircle className="h-3 w-3 text-destructive" />
                      ) : (
                        <Clock className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-muted-foreground ml-auto">{formatTime(n.criado_em)}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5 line-clamp-2">{n.conteudo || n.erro || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Webhook URL */}
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <p className="font-medium mb-1">URL do Webhook (configurar no Twilio):</p>
          <code className="text-[11px] break-all">/functions/whatsappWebhook</code>
          <p className="mt-1">Use a URL completa do app publicado + este caminho.</p>
        </div>
      </CardContent>
    </Card>
  );
}