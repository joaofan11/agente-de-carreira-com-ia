import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";

export default function StepBasicos({ form, setField }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4 text-primary" /> Dados básicos
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nome_completo">Nome completo *</Label>
          <Input
            id="nome_completo"
            value={form.nome_completo}
            onChange={(e) => setField("nome_completo", e.target.value)}
            placeholder="Seu nome completo"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="seu@email.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone_whatsapp">WhatsApp com DDD</Label>
          <Input
            id="telefone_whatsapp"
            value={form.telefone_whatsapp}
            onChange={(e) => setField("telefone_whatsapp", e.target.value)}
            placeholder="(92) 9XXXX-XXXX"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            value={form.cidade}
            onChange={(e) => setField("cidade", e.target.value)}
            placeholder="Ex.: Manaus"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estado">Estado</Label>
          <Input
            id="estado"
            value={form.estado}
            onChange={(e) => setField("estado", e.target.value)}
            placeholder="Ex.: AM"
          />
        </div>
      </CardContent>
    </Card>
  );
}