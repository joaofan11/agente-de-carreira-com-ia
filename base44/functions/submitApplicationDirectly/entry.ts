import { claimDelivery, auditCompleted } from '../../shared/applicationAudit.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { bufferToBase64 } from '../../shared/emailContent.ts';
import { ownedRecord, assertConsistentOwner } from '../../shared/personalOwnership.ts';

// Allowlist de endpoints permitidos — impede retransmissão para URLs arbitrárias.
const ALLOWED_ENDPOINTS = ['demo://receive-demo-application'];
const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5MB

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { application_id } = body;

    if (!application_id) return Response.json({ error: 'application_id obrigatorio.' }, { status: 400 });

    let app;
    try {
      app = await ownedRecord(base44, 'Application', application_id, user.id);
    } catch {
      return Response.json({ error: 'Candidatura nao encontrada.' }, { status: 404 });
    }
    if (!app) return Response.json({ error: 'Candidatura nao encontrada.' }, { status: 404 });
    if (app.user_id !== user.id) return Response.json({ error: 'Candidatura nao pertence ao usuario.' }, { status: 403 });
    if (app.status !== 'aprovado') {
      return Response.json({ error: 'Candidatura precisa estar aprovada para envio.' }, { status: 400 });
    }

    // Impedir submissão duplicada
    if (app.status === 'enviado' && app.identificador_envio) {
      return Response.json({ error: 'Candidatura ja foi enviada. Duplicidade impedida.' }, { status: 409 });
    }

    let job;
    try {
      job = await base44.entities.Job.get(app.job_id);
    } catch {
      return Response.json({ error: 'Vaga nao encontrada.' }, { status: 404 });
    }
    if (!job) return Response.json({ error: 'Vaga nao encontrada.' }, { status: 404 });

    // Verifica endpoint permitido — impede retransmissão para URLs arbitrárias
    if (!job.api_endpoint) {
      return Response.json({
        success: false,
        error: 'Vaga sem endpoint de API configurado. Use o link oficial.',
        link_oficial: job.url_original || null,
      }, { status: 400 });
    }

    if (!ALLOWED_ENDPOINTS.includes(job.api_endpoint)) {
      return Response.json({
        success: false,
        error: 'Endpoint nao permitido. Envio bloqueado por segurança.',
      }, { status: 403 });
    }

    // Busca currículo
    let resume;
    try {
      resume = await ownedRecord(base44, 'ResumeVersion', app.resume_version_id, user.id);
      assertConsistentOwner(resume, user.id);
      if (resume.job_id !== app.job_id) throw new Error('Currículo de outra vaga.');
    } catch {
      return Response.json({ error: 'Curriculo PDF nao encontrado.' }, { status: 400 });
    }
    if (!resume || !resume.referencia_pdf_privado) {
      return Response.json({ error: 'Curriculo PDF nao encontrado.' }, { status: 400 });
    }

    // Extrai dados do candidato do currículo aprovado (ResumeVersion.conteudo_estruturado),
    // NÃO do perfil do usuário autenticado — o usuário autenticado é o ator/proprietário,
    // mas a identidade do currículo pode diferir (ex: modo demo com perfil fictício).
    const rc = resume.conteudo_estruturado?.contato || {};
    const fa = resume.conteudo_estruturado?.formacao_academica?.[0] || {};

    // Obtem PDF do storage privado
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: resume.referencia_pdf_privado,
    });
    const pdfRes = await fetch(signed_url, { signal: AbortSignal.timeout(30000) });
    if (!pdfRes.ok) return Response.json({ error: 'Falha ao baixar PDF.' }, { status: 502 });
    const pdfBuffer = await pdfRes.arrayBuffer();

    // Valida tamanho do anexo
    if (pdfBuffer.byteLength > MAX_PDF_SIZE) {
      return Response.json({ error: 'PDF excede tamanho maximo de 5MB.' }, { status: 400 });
    }

    const pdfBase64 = bufferToBase64(pdfBuffer);

    // Dados básicos do candidato extraídos do currículo aprovado — não do auth.me().
    // Fallback apenas para campos não presentes no currículo, nunca para user.full_name/email.
    const candidateData = {
      nome: rc.nome || '',
      email: rc.email || '',
      telefone: rc.telefone || '',
      curso: fa.curso || '',
      instituicao: fa.instituicao || '',
      cidade: rc.cidade || '',
      estado: rc.estado || '',
    };

    const pdfFilename = 'Curriculo_' + (candidateData.nome || 'Candidato').replace(/\s+/g, '_') + '.pdf';

    // Envia para o receptor demo (simula chamada API autenticada)
    if(app.is_demo!==true || job.is_demo!==true || resume.is_demo!==true) return Response.json({error:'O receptor demo aceita somente demonstrações.'},{status:400});
    await claimDelivery(base44,app,user.id,'api_direta');
    const result = await base44.functions.invoke('receiveDemoApplication', {
      job_id: app.job_id,
      application_id: app.id,
      candidate_data: candidateData,
      pdf_base64: pdfBase64,
      pdf_filename: pdfFilename,
      pdf_size: pdfBuffer.byteLength,
      is_demo: job.is_demo !== false,
      demo_batch_id: job.demo_batch_id || 'demo',
    });

    if (result.data?.success) {
      // Sistema destino confirmou aceitação — marca como ENVIADA
      const updated = await base44.asServiceRole.entities.Application.update(application_id, {
        status: 'enviado',
        enviado_em: new Date().toISOString(),
        identificador_envio: result.data.receipt_id,
        comprovante: 'api_direct_receipt:' + result.data.receipt_id,
        erro: null,
      });
      const auditRecorded = await auditCompleted(base44,user.id,'envio_demo_aceito',application_id);
      return Response.json({
        audit_recorded:auditRecorded,
        success: true,
        receipt_id: result.data.receipt_id,
        application: updated,
      });
    } else {
      // Sistema destino rejeitou — NÃO marca como enviado
      await base44.asServiceRole.entities.Application.update(application_id, {
        erro: 'API rejeitou: ' + (result.data?.error || 'erro desconhecido'),
      });
      return Response.json({
        success: false,
        error: result.data?.error || 'Receptor rejeitou a candidatura.',
      });
    }
  } catch (error) {
    // Não expor stack trace — retornar mensagem genérica
    return Response.json({ error: 'Erro interno ao processar envio.' }, { status: 500 });
  }
}