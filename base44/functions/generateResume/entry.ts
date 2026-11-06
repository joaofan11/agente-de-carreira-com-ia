import { authenticatedUser } from '../../shared/requestAuth.ts';
import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { realProfile, ownedRecord, ownerQuery, assertConsistentOwner } from '../../shared/personalOwnership.ts';

import { allowFields, functionError } from '../../shared/personalValidation.ts';
import { buildPrompt, RESUME_SCHEMA } from '../../shared/resumeGeneration.ts';
import { groundResumeDraft } from '../../shared/resumeGrounding.ts';

// generateResume — gera um currículo personalizado para uma vaga usando IA.
// Entradas: CandidateProfile, Job, JobMatch (opcional).
// Saída: JSON estruturado do currículo com evidências originais.
// Regras: usa apenas fatos reais do perfil, nunca inventa informações.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await authenticatedUser(base44);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = allowFields(await req.json(), ['job_id','match_id','test_profile']);
    const jobId = body.job_id;
    if (!jobId) return Response.json({ error: "job_id é obrigatório" }, { status: 400 });

    const useTestProfile = !!body.test_profile;
    if (useTestProfile && user.role !== "admin") {
      return Response.json({ error: "Apenas administradores podem usar perfis de teste." }, { status: 403 });
    }

    // 1. Obter perfil estruturado
    let profile;
    if (useTestProfile) {
      profile = body.test_profile;
    } else {
      profile = await realProfile(base44, user.id);
    }
    if (!profile) {
      return Response.json(
        { error: "Perfil incompleto. Preencha seu perfil antes de gerar um currículo." },
        { status: 400 }
      );
    }

    if (!useTestProfile) assertConsistentOwner(profile, user.id);

    // 2. Obter requisitos da vaga
    const job = await base44.entities.Job.get(jobId);
    if (!job) return Response.json({ error: "Vaga não encontrada." }, { status: 404 });

    if (job.status !== 'ativa') return Response.json({error:'A vaga não está ativa. Escolha outra oportunidade.'}, {status:400});

    // 3. Obter análise de compatibilidade (opcional — para destacar competências relevantes)
    let match = null;
    if (body.match_id) {
      match = await ownedRecord(base44, 'JobMatch', body.match_id, user.id);
      assertConsistentOwner(match, user.id);
      if (match.job_id !== jobId) return Response.json({ error: 'Análise de outra vaga.' }, { status: 400 });
    } else if (!useTestProfile) {
      const matchPage = await base44.asServiceRole.entities.JobMatch.filter(
        { $and: [ownerQuery(user.id), { job_id: jobId, is_demo: { $ne: true } }] }, { limit: 1 }
      );
      match = matchPage.items?.[0] || null;
      if (match) assertConsistentOwner(match, user.id);
    }

    // 4. Utilizar IA para organizar e reescrever o conteúdo
    const prompt = buildPrompt(profile, job, match);
    const generated = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: RESUME_SCHEMA,
    });

    let draft;
    try { draft = groundResumeDraft(generated, profile); }
    catch { return Response.json({error:'A IA retornou conteúdo inconsistente com o perfil. Confira seus dados e tente novamente.'}, {status:502}); }
    return Response.json({ ...draft, job });
  } catch (error) {
    return functionError(error);
  }
}
