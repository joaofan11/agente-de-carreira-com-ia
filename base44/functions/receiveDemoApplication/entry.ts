import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5MB

// receiveDemoApplication — receptor demo que simula sistema de recrutamento.
// Recebe candidatura por API, salva dados básicos, valida anexo, gera comprovante.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { job_id, application_id, candidate_data, pdf_base64, pdf_filename, pdf_size, is_demo, demo_batch_id } = body;

    // Valida campos obrigatórios
    if (!job_id || !application_id || !candidate_data || !pdf_base64) {
      return Response.json({ success: false, error: 'Dados incompletos.' }, { status: 400 });
    }

    // Valida tipo do anexo (deve ser PDF)
    if (!pdf_filename || !pdf_filename.toLowerCase().endsWith('.pdf')) {
      return Response.json({ success: false, error: 'Anexo deve ser PDF.' }, { status: 400 });
    }

    // Valida tamanho do anexo
    const size = pdf_size || (atob(pdf_base64).length);
    if (size > MAX_PDF_SIZE) {
      return Response.json({ success: false, error: 'PDF excede tamanho maximo de 5MB.' }, { status: 400 });
    }

    // Impedir submissão duplicada — verifica status da candidatura original
    try {
      const app = await base44.entities.Application.get(application_id);
      if (app && app.status === 'enviado') {
        return Response.json({ success: false, error: 'Candidatura ja enviada. Duplicidade impedida.' }, { status: 409 });
      }
    } catch { /* candidatura pode não ser acessível — continua */ }

    // Gera comprovante de recebimento
    const receipt_id = 'REC-' + crypto.randomUUID().substring(0, 8).toUpperCase();
    const received_at = new Date().toISOString();

    // Salva candidatura recebida (dados básicos + metadados do PDF, sem expor documento original)
    await base44.entities.ReceivedApplication.create({
      job_id: job_id,
      application_id: application_id,
      candidate_name: candidate_data.nome || '',
      candidate_email: candidate_data.email || '',
      candidate_phone: candidate_data.telefone || '',
      candidate_course: candidate_data.curso || '',
      candidate_institution: candidate_data.instituicao || '',
      pdf_filename: pdf_filename,
      pdf_size: size,
      receipt_id: receipt_id,
      received_at: received_at,
      status: 'recebida',
      is_demo: is_demo !== false,
      demo_batch_id: demo_batch_id || 'demo',
    });

    return Response.json({
      success: true,
      receipt_id: receipt_id,
      received_at: received_at,
      message: 'Candidatura recebida pelo sistema de recrutamento demo.',
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}