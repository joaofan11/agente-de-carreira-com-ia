import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { readBudget, requireAutomationAdmin } from '../../shared/automationControls.ts';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    if (!await requireAutomationAdmin(base44)) return Response.json({error:'Apenas administradores.'},{status:403});
    const body = await req.json().catch(() => ({}));
    let b = await readBudget(base44);
    if (body.action === 'save') {
      if (!Number.isSafeInteger(body.limit) || body.limit < 0 || body.limit > 10000) return Response.json({error:'Informe um limite inteiro entre 0 e 10000.'},{status:400});
      if (!b.record) {
        await base44.asServiceRole.entities.AppSetting.create({key:b.key,value:{limit:body.limit,used:0},category:'sistema',description:'Tentativas de IA da automação no mês UTC; não representa créditos.'});
      } else {
        const result = await base44.asServiceRole.entities.AppSetting.updateMany({id:b.record.id,'value.limit':b.limit},{$set:{'value.limit':body.limit}});
        if (result?.updated !== 1) throw new Error('Configuração concorrente. Recarregue.');
      }
      b = await readBudget(base44); // Duplicate first-time creations fail closed.
    } else if (body.action && body.action !== 'get') return Response.json({error:'Ação inválida.'},{status:400});
    return Response.json({month:b.month,limit:b.limit,used:b.used,remaining:b.remaining});
  } catch(error) { return Response.json({error:error.message},{status:503}); }
}

