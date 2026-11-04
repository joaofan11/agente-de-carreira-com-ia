import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { validateDemoReceipt } from '../../shared/demoReceiptValidation.ts';

// Demo only. Ownership failures stop before any privileged write.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ success: false, error: 'Receptor de demonstração restrito a administradores.' }, { status: 403 });
    const body = await req.json();
    const { app, job, candidate, size } = await validateDemoReceipt(base44, user, body);
    const receipt_id = 'DEMO-' + crypto.randomUUID();
    const received_at = new Date().toISOString();
    await base44.asServiceRole.entities.ReceivedApplication.create({
      job_id: job.id, application_id: app.id,
      candidate_name: candidate.nome, candidate_email: candidate.email,
      candidate_phone: candidate.telefone, candidate_course: candidate.curso,
      candidate_institution: candidate.instituicao,
      pdf_filename: body.pdf_filename, pdf_size: size,
      receipt_id, received_at, status: 'recebida', is_demo: true,
      demo_batch_id: job.demo_batch_id || 'demo',
    });
    return Response.json({ success: true, receipt_id, received_at, message: 'Candidatura de demonstração recebida.' });
  } catch (error) {
    const status = error.status || 400;
    return Response.json({ success: false, error: status === 403 ? 'Acesso negado.' : error.message }, { status });
  }
}
