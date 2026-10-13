import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { prepareApplication } from "../../shared/applicationStateMachine.ts";

// prepareApplication — cria candidatura em pendente_aprovacao.
// Entrada: { job_id, resume_version_id, metodo_envio }
// Segurança: valida identidade do usuário, posse do currículo, vaga ativa.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const app = await prepareApplication(base44, user.id, {
      jobId: body.job_id,
      resumeVersionId: body.resume_version_id,
      metodoEnvio: body.metodo_envio,
    });

    return Response.json({ application: app });
  } catch (error) {
    const status = error.message.includes("não pertence") || error.message.includes("Unauthorized") ? 403 : 400;
    return Response.json({ error: error.message }, { status });
  }
}