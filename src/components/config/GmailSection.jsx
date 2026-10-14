import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { GMAIL_CONNECTOR_ID } from "@/lib/gmailConfig";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, AlertTriangle, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

export default function GmailSection() {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const checkConnection = useCallback(async () => {
    if (!GMAIL_CONNECTOR_ID) {
      setChecking(false);
      return;
    }
    try {
      await base44.functions.invoke("sendGmailApplication", {
        application_id: "check",
        destinatario: "check@example.com",
      });
      setConnected(false);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "";
      if (msg.includes("nao pertence") || msg.includes("aprovada") || msg.includes("Destinatario")) {
        setConnected(true);
      } else {
        setConnected(false);
      }
    }
    setChecking(false);
  }, []);

  useEffect(() => { checkConnection(); }, [checkConnection]);

  const handleConnect = async () => {
    if (!GMAIL_CONNECTOR_ID) {
      toast({
        title: "Gmail não configurado",
        description: "O conector Gmail ainda não foi registrado. Veja as instruções abaixo.",
        variant: "destructive",
      });
      return;
    }
    setConnecting(true);
    try {
      const url = await base44.connectors.connectAppUser(GMAIL_CONNECTOR_ID);
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          checkConnection();
        }
      }, 500);
    } catch (err) {
      toast({ title: "Erro ao conectar", description: err.message, variant: "destructive" });
    }
    setConnecting(false);
  };

  const handleDisconnect = async () => {
    if (!GMAIL_CONNECTOR_ID) return;
    try {
      await base44.connectors.disconnectAppUser(GMAIL_CONNECTOR_ID);
      setConnected(false);
      toast({ title: "Gmail desconectado" });
    } catch (err) {
      toast({ title: "Erro ao desconectar", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-primary" /> Gmail — Envio de Currículo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <p className="text-sm font-medium">Conta Google</p>
            <p className="text-sm text-muted-foreground">
              {connected ? "Conectada" : "Não conectada"}
            </p>
          </div>
          {connected ? (
            <Badge variant="secondary" className="font-normal">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Conectado
            </Badge>
          ) : (
            <Badge variant="outline" className="font-normal text-muted-foreground">
              <XCircle className="mr-1 h-3 w-3" /> Pendente
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          {!connected ? (
            <Button onClick={handleConnect} disabled={connecting || !GMAIL_CONNECTOR_ID} className="flex-1">
              {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Conectar Gmail
            </Button>
          ) : (
            <Button variant="outline" onClick={handleDisconnect} className="flex-1">
              Desconectar
            </Button>
          )}
        </div>

        {!GMAIL_CONNECTOR_ID && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p><strong>Gmail não configurado.</strong> O workspace connector para Gmail precisa ser registrado.</p>
              <p>Escopo mínimo: <code className="text-[11px]">https://www.googleapis.com/auth/gmail.send</code></p>
            </div>
          </div>
        )}

        {GMAIL_CONNECTOR_ID && !connected && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Clique em "Conectar Gmail" para autorizar o envio de candidaturas pela sua conta Google.</span>
          </div>
        )}

        {connected && (
          <div className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Gmail conectado. Candidaturas aprovadas com método "Gmail" serão enviadas pela sua conta.</span>
          </div>
        )}

        <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <p className="font-medium mb-1">Instruções para Google Cloud Console:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Criar projeto no <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink className="h-3 w-3" /></a></li>
            <li>Ativar Gmail API</li>
            <li>Criar credenciais OAuth 2.0 (tipo: Web Application)</li>
            <li>Adicionar redirect URI (fornecida após registrar o connector)</li>
            <li>Configurar tela de consentimento (OAuth consent screen)</li>
            <li>Adicionar contas de teste (test users)</li>
            <li>Registrar o workspace connector no Base44 com Client ID e Client Secret</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}