import { authenticatedUser } from '../../shared/requestAuth.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { collectJobs } from "../../shared/collectJobs.ts";
import { allowFields, text, functionError } from '../../shared/personalValidation.ts';
export default async function(req) {
  try {
    const base44=createClientFromRequest(req),user=await authenticatedUser(base44);
    if(!user)return Response.json({error:'Unauthorized'},{status:401});
    if(user.role!=='admin')return Response.json({error:'A coleta de vagas exige acesso administrativo.'},{status:403});
    const body=allowFields(await req.json(),['pages','query','location']);
    const query=body.query===undefined?undefined:text(body.query,200).trim();
    const location=body.location===undefined?undefined:text(body.location,150).trim();
    return Response.json(await collectJobs(base44,{query:query||undefined,location:location||undefined,pages:Math.min(Math.max(Number(body.pages)||1,1),3)}));
  }catch(error){return functionError(error);}
}
