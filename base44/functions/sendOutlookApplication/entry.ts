import { authenticatedUser } from '../../shared/requestAuth.ts';
import { ownedRecord, assertConsistentOwner } from '../../shared/personalOwnership.ts';
import { claimDelivery, auditCompleted } from '../../shared/applicationAudit.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { OUTLOOK_CONNECTOR_ID } from '../../shared/outlookConfig.ts';
import { buildGraphMessage } from '../../shared/outlookMessageBuilder.ts';
import { formatEmailBody, formatEmailSubject, bufferToBase64, validateEmail } from '../../shared/emailContent.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await authenticatedUser(base44);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { application_id, destinatario } = body;

    if (!OUTLOOK_CONNECTOR_ID) {
      return Response.json({
        configured: false,
        error: 'Outlook nao configurado. Registre o workspace connector para Outlook.',
      }, { status: 503 });
    }

    if (!application_id) return Response.json({ error: 'application_id e obrigatorio.' }, { status: 400 });

    const app = await ownedRecord(base44,'Application',application_id,user.id);
    assertConsistentOwner(app,user.id);
    if (!app) return Response.json({ error: 'Candidatura nao encontrada.' }, { status: 404 });
    if (app.user_id !== user.id) return Response.json({ error: 'Candidatura nao pertence ao usuario.' }, { status: 403 });
    if (app.metodo_envio !== 'outlook') return Response.json({error:'Canal de envio divergente.'},{status:400});
    if (app.status !== 'aprovado') {
      return Response.json({ error: 'Candidatura precisa estar aprovada para envio.' }, { status: 400 });
    }

    const recipient = (destinatario || '').trim();
    if (!recipient || !validateEmail(recipient)) {
      return Response.json({ error: 'Destinatario invalido. Confirme o e-mail de recrutamento.' }, { status: 400 });
    }

    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(OUTLOOK_CONNECTOR_ID);
      accessToken = conn.accessToken;
    } catch {
      return Response.json({
        configured: true,
        connected: false,
        error: 'Outlook nao conectado. Conecte sua conta Microsoft em Configuracoes.',
      }, { status: 403 });
    }

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
      pdfBase64 = bufferToBase64(pdfBuffer);
    } catch (err) {
      return Response.json({ error: 'Erro ao obter PDF: ' + err.message }, { status: 500 });
    }

    const approvedProfile={nome_completo:resume.conteudo_estruturado?.contato?.nome,curso:resume.conteudo_estruturado?.formacao_academica?.[0]?.curso};
    const subject = formatEmailSubject(job, approvedProfile);
    const emailBody = formatEmailBody(approvedProfile, job);
    const pdfFilename = 'Curriculo_' + (profile?.nome_completo || 'Candidato').replace(/\s+/g, '_') + '.pdf';
    const graphMessage = buildGraphMessage(recipient, subject, emailBody, pdfBase64, pdfFilename);

    // Envia via Microsoft Graph API
    await claimDelivery(base44,app,user.id,'outlook',recipient);
    const graphRes = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphMessage),
      signal: AbortSignal.timeout(30000),
    });

    // Graph API retorna 202 Accepted sem body — NAO comprova entrega ao recrutador
    if (!graphRes.ok) {
      await auditCompleted(base44,user.id,'envio_outlook_rejeitado',application_id,'erro');
      let errorMsg = 'erro desconhecido';
      try {
        const text = await graphRes.text();
        if (text) {
          const errData = JSON.parse(text);
          errorMsg = errData.error?.message || errorMsg;
        }
      } catch {}
      await base44.asServiceRole.entities.Application.update(application_id, {
        erro: 'Graph API: ' + errorMsg,
      });
      return Response.json({
        configured: true,
        connected: true,
        success: false,
        error: 'Microsoft Graph rejeitou o envio: ' + errorMsg,
      }, { status: 502 });
    }

    // 202 Accepted — aceito para processamento, NÃO comprova entrega ao recrutador.
    // O protocolo é interno e único, nunca inventa ID de mensagem do provedor.
    const timestamp = new Date().toISOString();
    const protocolo = 'OUT-' + crypto.randomUUID().substring(0, 12).toUpperCase();
    const updated = await base44.asServiceRole.entities.Application.update(application_id, {
      status: 'enviado',
      enviado_em: timestamp,
      identificador_envio: protocolo,
      comprovante: 'outlook_sendmail_202_' + protocolo,
      erro: null,
    });

    const auditRecorded = await auditCompleted(base44,user.id,'envio_outlook_aceito',application_id);
    return Response.json({
      audit_recorded: auditRecorded,
      configured: true,
      connected: true,
      success: true,
      message_id: protocolo,
      message: 'Aceito para processamento (HTTP 202). Não comprova entrega ao recrutador.',
      application: updated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}