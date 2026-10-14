import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";

// DefaultEmailAccount — seleciona a conta padrão (Gmail ou Outlook) para envio de candidaturas.
export default function DefaultEmailAccount() {
  const [defaultAccount, setDefaultAccount] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setDefaultAccount(me?.conta_padrao_envio || "");
      } catch {}
      setLoading(false);
    })();
  }, []);

  const handleChange = async (value) => {
    setDefaultAccount(value);
    setSaving(true);
    try {
      await base44.auth.updateMe({ conta_padrao_envio: value });
    } catch {}
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-primary" /> Conta padrão de envio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>Selecione a conta padrão para envio de candidaturas</Label>
          <Select value={defaultAccount} onValueChange={handleChange} disabled={loading || saving}>
            <SelectTrigger>
              {saving ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</span> : <SelectValue placeholder="Selecione..." />}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gmail">Gmail</SelectItem>
              <SelectItem value="outlook">Outlook / Hotmail</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {defaultAccount && !saving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-secondary" />
            <span>Conta padrão: {defaultAccount === "gmail" ? "Gmail" : "Outlook / Hotmail"}</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          A conta padrão é pré-selecionada ao criar novas candidaturas. Você pode alterar o método em cada candidatura individualmente.
        </p>
      </CardContent>
    </Card>
  );
}