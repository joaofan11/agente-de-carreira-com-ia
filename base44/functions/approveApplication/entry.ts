import { authenticatedUser } from '../../shared/requestAuth.ts';
import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { approveApplication } from "../../shared/applicationStateMachine.ts";

// approveApplication — aprova candidatura pendente.
// Entrada: { application_id, canal?, origem? }
// Segurança: valida identidade, posse, status pendente, currículo e método de envio.
// Impede aprovação duplicada. Registra data, canal e origem.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await authenticatedUser(base44);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const app = await approveApplication(base44, user.id, {
      applicationId: body.application_id,
      canal: body.canal || "in_app",
      origem: body.origem || "web",
    });

    return Response.json({ application: app });
  } catch (error) {
    const status = error.message.includes("não pertence") || error.message.includes("Unauthorized") ? 403 : 400;
    return Response.json({ error: error.message }, { status });
  }
}