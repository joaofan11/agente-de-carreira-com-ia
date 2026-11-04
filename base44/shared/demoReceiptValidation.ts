import { assertConsistentOwner } from './personalOwnership.ts';

const MAX_PDF_SIZE = 5 * 1024 * 1024;
function reject(message, status = 400) {
  const error = new Error(message); error.status = status; throw error;
}

// Called before privileged writes. The request cannot supply ownership or candidate identity.
export async function validateDemoReceipt(base44, user, body) {
  if (!user || user.role !== 'admin') reject('Receptor de demonstração restrito a administradores.', 403);
  if (!body?.application_id || !body.job_id) reject('Candidatura e vaga obrigatórias.');
  const entities = base44.asServiceRole.entities;
  const app = await entities.Application.get(body.application_id);
  assertConsistentOwner(app, user.id);
  if (app.status !== 'aprovado' || app.metodo_envio !== 'api_direta' || !app.envio_token) reject('Envio não autorizado ou não reservado.', 409);
  if (app.job_id !== body.job_id || app.is_demo !== true || body.is_demo === false) reject('Apenas candidaturas de demonstração são aceitas.');
  const job = await entities.Job.get(app.job_id);
  const resume = await entities.ResumeVersion.get(app.resume_version_id);
  assertConsistentOwner(resume, user.id);
  if (!job || job.is_demo !== true || job.api_endpoint !== 'demo://receive-demo-application' || resume.is_demo !== true || resume.job_id !== job.id || resume.status_revisao !== 'pronto') reject('Vaga ou currículo incompatível com a demonstração.');
  if (!/^(?:mp\/)?private\//.test(resume.referencia_pdf_privado || '')) reject('Currículo sem PDF privado.');
  if (typeof body.pdf_filename !== 'string' || !body.pdf_filename.toLowerCase().endsWith('.pdf')) reject('Anexo deve ser PDF.');
  if (typeof body.pdf_base64 !== 'string' || body.pdf_base64.length > 4 * Math.ceil(MAX_PDF_SIZE / 3)) reject('PDF excede o limite ou está ausente.');
  let pdf;
  try { pdf = atob(body.pdf_base64); } catch { reject('PDF codificado inválido.'); }
  if (!pdf.startsWith('%PDF-') || pdf.length > MAX_PDF_SIZE) reject('Conteúdo PDF inválido ou acima do limite.');
  const previous = await entities.ReceivedApplication.filter({ application_id: app.id }, { limit: 1 });
  if ((Array.isArray(previous) ? previous : previous.items || []).length) reject('Candidatura já recebida.', 409);
  const contact = resume.conteudo_estruturado?.contato || {};
  const education = resume.conteudo_estruturado?.formacao_academica?.[0] || {};
  return { app, job, size: pdf.length, candidate: {
    nome: contact.nome || '', email: contact.email || '', telefone: contact.telefone || '',
    curso: education.curso || '', instituicao: education.instituicao || '',
  } };
}
