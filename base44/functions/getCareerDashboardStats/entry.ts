import { authenticatedUser } from '../../shared/requestAuth.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { ownerQuery } from '../../shared/personalOwnership.ts';
import { allowFields, functionError } from '../../shared/personalValidation.ts';
export default async function(req) {
  try {
    const base44=createClientFromRequest(req), user=await authenticatedUser(base44);
    if(!user)return Response.json({error:'Unauthorized'},{status:401});
    const body=allowFields(await req.json(),['demo']);
    if (body.demo !== undefined && typeof body.demo !== 'boolean') throw new Error('Filtro de demonstração inválido.');
    const query={$and:[ownerQuery(user.id),{is_demo:body.demo===true?true:{$ne:true}}]};
    const clean={$or:[{erro:{$exists:false}},{erro:null},{erro:''}]};
    const [matchAgg,appStatusAgg,cleanStatusAgg,errors,sent]=await Promise.all([
      base44.asServiceRole.entities.JobMatch.aggregate({query,groupBy:'nivel_compatibilidade'}),
      base44.asServiceRole.entities.Application.aggregate({query,groupBy:'status'}),
      base44.asServiceRole.entities.Application.aggregate({query:{$and:[query,clean]},groupBy:'status'}),
      base44.asServiceRole.entities.Application.count({$and:[query,{erro:{$exists:true,$nin:['',null]}}]}),
      base44.asServiceRole.entities.Application.count({$and:[query,clean,{status:{$in:['enviado','em_analise','entrevista']},enviado_em:{$exists:true,$nin:['',null]},identificador_envio:{$exists:true,$nin:['',null]}}]}),
    ]);
    const count=(agg,status)=>agg.rows?.find(row=>row.status===status)?.count||0;
    return Response.json({matchAgg,appStatusAgg,indicators:{totalAnalyzed:(matchAgg.rows||[]).reduce((sum,row)=>sum+row.count,0),strongMatches:matchAgg.rows?.find(row=>row.nivel_compatibilidade==='alto')?.count||0,recused:count(cleanStatusAgg,'recusado'),pendingApproval:count(appStatusAgg,'pendente_aprovacao'),errors,sent}});
  }catch(error){return functionError(error);}
}