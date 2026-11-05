import { authenticatedUser } from '../../shared/requestAuth.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { approveApplication } from '../../shared/applicationStateMachine.ts';
import { allowFields, text, functionError } from '../../shared/personalValidation.ts';
export default async function(req) {
  try {
    const base44=createClientFromRequest(req),user=await authenticatedUser(base44);
    if(!user)return Response.json({error:'Unauthorized'},{status:401});
    const body=allowFields(await req.json(),['application_id','resume_version_id','metodo_envio','expected_updated_date']);
    const id=text(body.application_id,200);
    if(!id.trim())throw new Error('Informe a candidatura.');
    text(body.resume_version_id,200);text(body.metodo_envio,50);
    const {audit_recorded,...application}=await approveApplication(base44,user.id,{
      applicationId:id,canal:'in_app',origem:'web',
      expectedResumeVersionId:body.resume_version_id,expectedMethod:body.metodo_envio,
      expectedUpdatedDate:body.expected_updated_date === undefined ? undefined : text(body.expected_updated_date,200),

    });
    return Response.json({application,audit_recorded});
  } catch(error) { return functionError(error); }
}
