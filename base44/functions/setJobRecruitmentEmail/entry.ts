import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { authenticatedUser } from '../../shared/requestAuth.ts';
import { recruitmentEmail } from '../../shared/emailDelivery.ts';
import { allowFields, text, functionError } from '../../shared/personalValidation.ts';
export default async function(req){try{
 const client=createClientFromRequest(req),user=await authenticatedUser(client);if(!user)return Response.json({error:'Unauthorized'},{status:401});if(user.role!=='admin')return Response.json({error:'Revisão administrativa obrigatória.'},{status:403});
 const body=allowFields(await req.json(),['job_id','email','source_url','confirmed']);
 const email=recruitmentEmail(body.email);if(!email||body.confirmed!==true)throw Error('Confirme o e-mail publicado para candidaturas.');
 const url=new URL(text(body.source_url,2000));if(url.protocol!=='https:'||url.username||url.password)throw Error('Informe o anúncio público HTTPS.');
 const job=await client.asServiceRole.entities.Job.get(text(body.job_id,200));if(!job||job.is_demo||job.status!=='ativa')throw Error('Vaga inválida.');
 await client.asServiceRole.entities.AuditLog.create({user_id:user.id,owner_user_id:user.id,acao:'email_candidatura_verificado',entidade:'Job',entidade_id:job.id,resultado:'sucesso',data_evento:new Date().toISOString()});
 await client.asServiceRole.entities.Job.update(job.id,{email_recrutamento:email,email_recrutamento_validado:true,email_fonte_url:url.href,email_verificado_em:new Date().toISOString()});
 return Response.json({verified:true});
}catch(error){return functionError(error);}}
