import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { dispatchApprovedApplication } from "../../shared/applicationStateMachine.ts";

// dispatchApprovedApplication — envia candidatura aprovada.
// Entrada: { application_id }
// Segurança: valida identidade, posse, status aprovado, currículo é o mesmo aprovado.
// Impede envio duplicado. NÃO executa envio externo real até provedores configurados.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const app = await dispatchApprovedApplication(base44, user.id, {
      applicationId: body.application_id,
    });

    return Response.json({ application: app });
  } catch (error) {
    const status = error.message.includes("não pertence") || error.message.includes("Unauthorized") ? 403 : 400;
    return Response.json({ error: error.message }, { status });
  }
}