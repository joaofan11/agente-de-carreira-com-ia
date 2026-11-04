import { authenticatedUser } from '../../shared/requestAuth.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { ownerQuery } from '../../shared/personalOwnership.ts';
import { allowFields, functionError, text } from '../../shared/personalValidation.ts';
const KINDS = {profile:'CandidateProfile',documents:'CandidateDocument',resumes:'ResumeVersion',matches:'JobMatch',preferences:'JobPreference',notifications:'Notification',integrations:'UserIntegration',applications:'Application'};
const SORTS = ['created_date','-created_date','-updated_date','-data_analise','numero_versao','-criado_em'];
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req), user = await authenticatedUser(base44);
    if (!user) return Response.json({error:'Unauthorized'}, {status:401});
    const body = allowFields(await req.json(), ['kind','id','job_id','demo_batch_id','include_demo','cursor','limit','sort','canal','provedor']);
    const name = KINDS[body.kind];
    if (!name) throw new Error('Lista inválida.');
    const filters = [ownerQuery(user.id)];
    for (const key of ['id','job_id','demo_batch_id','canal','provedor']) if (body[key]) filters.push({[key]:text(body[key],200)});
    if (body.include_demo !== true && !body.demo_batch_id) filters.push({is_demo:{$ne:true}});
    if (body.demo_batch_id) filters.push({is_demo:true});
    const page = await base44.asServiceRole.entities[name].filter({$and:filters}, {
      sort:SORTS.includes(body.sort)?body.sort:'-created_date', limit:Math.max(1,Math.min(Number(body.limit)||50,50)), ...(body.cursor?{cursor:text(body.cursor,2000)}:{}),
    });
    if (body.kind === 'integrations') page.items = page.items.map(({referencia_credencial_segura,...record})=>record);
    return Response.json(page);
  } catch(error) { return functionError(error); }
}