import { ownedRecord, assertConsistentOwner } from '../../shared/personalOwnership.ts';
import { claimDelivery, auditCompleted } from '../../shared/applicationAudit.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { GMAIL_CONNECTOR_ID } from '../../shared/gmailConfig.ts';
import {
  buildMimeMessage, mimeToBase64Url, formatEmailBody, formatEmailSubject,
} from '../../shared/gmailMimeBuilder.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { application_id, destinatario } = body;

    // Verifica se o conector Gmail está registrado
    if (!GMAIL_CONNECTOR_ID) {
      return Response.json({
        configured: false,
        error: 'Gmail nao configurado. Registre o workspace connector para Gmail.',
      }, { status: 503 });
    }

    if (!application_id) return Response.json({ error: 'application_id e obrigatorio.' }, { status: 400 });

    // Busca candidatura
    const app = await ownedRecord(base44,'Application',application_id,user.id);
    assertConsistentOwner(app,user.id);
    if (!app) return Response.json({ error: 'Candidatura nao encontrada.' }, { status: 404 });
    if (app.user_id !== user.id) return Response.json({ error: 'Candidatura nao pertence ao usuario.' }, { status: 403 });
    if (app.metodo_envio !== 'gmail') return Response.json({error:'Canal de envio divergente.'},{status:400});
    if (app.status !== 'aprovado') {
      return Response.json({ error: 'Candidatura precisa estar aprovada para envio.' }, { status: 400 });
    }

    // Valida destinatario (nao aceita inventado pela IA — fonte confiavel ou confirmado pelo usuario)
    const recipient = (destinatario || '').trim();
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      return Response.json({ error: 'Destinatario invalido. Confirme o e-mail de recrutamento.' }, { status: 400 });
    }

    // Obtem token OAuth do usuario (app-user connector)
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(GMAIL_CONNECTOR_ID);
      accessToken = conn.accessToken;
    } catch {
      return Response.json({
        configured: true,
        connected: false,
        error: 'Gmail nao conectado. Conecte sua conta Google em Configuracoes.',
      }, { status: 403 });
    }

    // Busca dados necessarios em paralelo
    const [jobRes, resumeRes, profileRes] = await Promise.allSettled([
      base44.entities.Job.get(app.job_id),
      ownedRecord(base44,'ResumeVersion',app.resume_version_id,user.id),
      base44.entities.CandidateProfile.filter({ user_id: user.id }, { limit: 1 }),
    ]);

    const job = jobRes.status === 'fulfilled' ? jobRes.value : null;
    const resume = resumeRes.status === 'fulfilled' ? resumeRes.value : null;
    const profile = profileRes.status === 'fulfilled' && profileRes.value.items ? profileRes.value.items[0] : null;

    if (!resume || !resume.referencia_pdf_privado) {
      return Response.json({ error: 'Curriculo PDF nao encontrado para esta candidatura.' }, { status: 400 });
    }

    // Obtem o PDF do storage privado
    assertConsistentOwner(resume,user.id);
    if(resume.job_id!==app.job_id || resume.status_revisao!=='pronto' || !!resume.is_demo!==!!app.is_demo || !!job?.is_demo!==!!app.is_demo) return Response.json({error:'Currículo ou vaga incompatível com a aprovação.'},{status:400});
    let pdfBase64;
    try {
      const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: resume.referencia_pdf_privado,
      });
      const pdfRes = await fetch(signed_url, { signal: AbortSignal.timeout(30000) });
      if (!pdfRes.ok) throw new Error('Falha ao baixar PDF');
      const pdfBuffer = await pdfRes.arrayBuffer();
      const bytes = new Uint8Array(pdfBuffer);
      // Base64 em chunks para evitar call stack overflow
      let binary = '';
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
      }
      pdfBase64 = btoa(binary);
    } catch (err) {
      return Response.json({ error: 'Erro ao obter PDF: ' + err.message }, { status: 500 });
    }

    // Constroi mensagem MIME
    const senderEmail = user.email || (profile?.email || '');
    const approvedProfile={nome_completo:resume.conteudo_estruturado?.contato?.nome,curso:resume.conteudo_estruturado?.formacao_academica?.[0]?.curso};
    const subject = formatEmailSubject(job, approvedProfile);
    const emailBody = formatEmailBody(approvedProfile, job);
    const pdfFilename = 'Curriculo_' + (profile?.nome_completo || 'Candidato').replace(/\s+/g, '_') + '.pdf';
    const mimeMessage = buildMimeMessage(senderEmail, recipient, subject, emailBody, pdfBase64, pdfFilename);
    const raw = mimeToBase64Url(mimeMessage);

    // Envia via Gmail API
    await claimDelivery(base44,app,user.id,'gmail',recipient);
    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
      signal: AbortSignal.timeout(30000),
    });

    const gmailData = await gmailRes.json();

    if (!gmailRes.ok) {
      await auditCompleted(base44,user.id,'envio_gmail_rejeitado',application_id,'erro');
      // Registra tentativa com erro
      await base44.asServiceRole.entities.Application.update(application_id, {
        erro: 'Gmail API: ' + (gmailData.error?.message || 'erro desconhecido'),
      });
      return Response.json({
        configured: true,
        connected: true,
        success: false,
        error: 'Gmail API rejeitou o envio: ' + (gmailData.error?.message || 'erro'),
      }, { status: 502 });
    }

    // Sucesso — registra message ID e transiciona para enviado
    const messageId = gmailData.id || null;
    const updated = await base44.asServiceRole.entities.Application.update(application_id, {
      status: 'enviado',
      enviado_em: new Date().toISOString(),
      identificador_envio: messageId,
      comprovante: 'gmail_message_id:' + messageId,
      erro: null,
    });

    const auditRecorded = await auditCompleted(base44,user.id,'envio_gmail_aceito',application_id);
    return Response.json({
      audit_recorded: auditRecorded,
      configured: true,
      connected: true,
      success: true,
      message_id: messageId,
      application: updated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}