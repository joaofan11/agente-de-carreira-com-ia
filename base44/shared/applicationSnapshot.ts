import { ownerQuery } from './personalOwnership.ts';
export function applicationSnapshotQuery(app, userId) {
  const absent = field => ({$or:[{[field]:{$exists:false}},{[field]:null},{[field]:''}]});
  return {id:app.id,job_id:app.job_id,status:app.status,resume_version_id:app.resume_version_id,metodo_envio:app.metodo_envio,
    ...(app.updated_date ? {updated_date:app.updated_date} : {}),
    $and:[ownerQuery(userId),...['envio_token','enviado_em','identificador_envio','comprovante'].map(absent)]};
}
