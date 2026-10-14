import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import {
  getTwilioConfig, validateTwilioSignature, normalizePhone, sendWhatsAppMessage, formatWhatsAppAlert,
} from '../../shared/twilioClient.ts';
import {
  approveApplication, rejectApplication, dispatchApprovedApplication,
} from '../../shared/applicationStateMachine.ts';

function twiml(msg) {
  const body = msg ? "<Response><Message>" + msg + "</Message></Response>" : "<Response></Response>";
  return new Response(body, { headers: { 'Content-Type': 'text/xml' } });
}

// Sanitiza conteúdo de mensagem para log — remove códigos de aprovação e dados sensíveis
function sanitizeLog(text) {
  if (!text) return '';
  return String(text).substring(0, 50).replace(/APROVAR\s+\S+/gi, 'APROVAR [CODIGO]').replace(/RECUSAR\s+\S+/gi, 'RECUSAR [CODIGO]');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const rawBody = await req.text();

    // Verifica config Twilio
    const config = getTwilioConfig(secrets);
    if (!config.configured) {
      return Response.json({ error: 'WhatsApp nao configurado.' }, { status: 503 });
    }

    // Valida assinatura Twilio
    const signature = req.headers.get('X-Twilio-Signature') || '';
    const appUrl = req.headers.get('X-Base44-App-Url') || '';
    const webhookUrl = appUrl ? appUrl + '/functions/whatsappWebhook' : req.url;
    const isValid = await validateTwilioSignature(config.authToken, rawBody, signature, webhookUrl);
    if (!isValid) {
      return Response.json({ error: 'Assinatura Twilio invalida.' }, { status: 403 });
    }

    // Parse form data
    const params = new URLSearchParams(rawBody);
    const from = params.get('From') || '';
    const messageBody = params.get('Body') || '';
    const messageSid = params.get('MessageSid') || '';
    const phone = normalizePhone(from);
    const text = messageBody.trim().toUpperCase();

    // Busca usuário pelo telefone (service role — webhook sem auth de usuário)
    const profiles = await base44.asServiceRole.entities.CandidateProfile.filter(
      { telefone_whatsapp: { $regex: phone, $options: 'i' } },
      { limit: 1 }
    );
    const profile = profiles.items && profiles.items[0];

    // Telefone não vinculado a nenhum usuário — rejeita
    if (!profile) {
      await base44.asServiceRole.entities.Notification.create({
        canal: 'whatsapp',
        direcao: 'recebida',
        remetente: from,
        conteudo: sanitizeLog(messageBody),
        decisao: 'desconhecido',
        resultado: 'ignorado',
        erro: 'Telefone nao vinculado a nenhum usuario.',
        identificador_externo: messageSid,
        criado_em: new Date().toISOString(),
      });
      return twiml('Telefone nao vinculado a nenhuma conta. Cadastre seu WhatsApp no Agente de Carreira.');
    }

    const userId = profile.user_id;

    // Comando BUSCAR — reenvia alertas pendentes
    if (text === 'BUSCAR') {
      const apps = await base44.asServiceRole.entities.Application.filter(
        { user_id: userId, status: 'pendente_aprovacao', codigo_aprovacao: { $exists: true, $ne: null } },
        { limit: 5, sort: '-criado_em' }
      );

      if (!apps.items || apps.items.length === 0) {
        const msg = 'Nenhuma candidatura pendente de aprovacao no momento.';
        await sendWhatsAppMessage(config, from, msg);
        await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          canal: 'whatsapp',
          direcao: 'enviada',
          destino: from,
          conteudo: msg,
          decisao: 'buscar',
          resultado: 'sucesso',
          identificador_externo: messageSid,
          criado_em: new Date().toISOString(),
        });
      } else {
        for (const app of apps.items) {
          let job = null;
          try { job = await base44.asServiceRole.entities.Job.get(app.job_id); } catch {}
          const message = formatWhatsAppAlert(job, null, app.codigo_aprovacao);
          await sendWhatsAppMessage(config, from, message);
          await base44.asServiceRole.entities.Notification.create({
            user_id: userId,
            application_id: app.id,
            canal: 'whatsapp',
            direcao: 'enviada',
            destino: from,
            conteudo: message,
            codigo_aprovacao: app.codigo_aprovacao,
            status: 'enviado',
            resultado: 'sucesso',
            identificador_externo: messageSid,
            criado_em: new Date().toISOString(),
          });
        }
      }

      await base44.asServiceRole.entities.Notification.create({
        user_id: userId,
        canal: 'whatsapp',
        direcao: 'recebida',
        remetente: from,
        conteudo: sanitizeLog(messageBody),
        decisao: 'buscar',
        resultado: 'sucesso',
        identificador_externo: messageSid,
        criado_em: new Date().toISOString(),
      });
      return twiml();
    }

    // Comando APROVAR [CODIGO]
    if (text.startsWith('APROVAR ')) {
      const code = text.substring(8).trim();
      const apps = await base44.asServiceRole.entities.Application.filter(
        { codigo_aprovacao: code, status: 'pendente_aprovacao' },
        { limit: 1 }
      );
      const app = apps.items && apps.items[0];

      if (!app) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          canal: 'whatsapp',
          direcao: 'recebida',
          remetente: from,
          conteudo: sanitizeLog(messageBody),
          codigo_aprovacao: code,
          decisao: 'aprovar',
          resultado: 'erro',
          erro: 'Codigo invalido ou candidatura ja processada.',
          identificador_externo: messageSid,
          criado_em: new Date().toISOString(),
        });
        return twiml('Codigo invalido ou candidatura ja processada.');
      }

      // Rejeita candidatura de outro usuário
      if (app.user_id !== userId) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          canal: 'whatsapp',
          direcao: 'recebida',
          remetente: from,
          conteudo: sanitizeLog(messageBody),
          codigo_aprovacao: code,
          decisao: 'aprovar',
          resultado: 'erro',
          erro: 'Candidatura nao pertence a este usuario.',
          identificador_externo: messageSid,
          criado_em: new Date().toISOString(),
        });
        return twiml('Candidatura nao pertence a este usuario.');
      }

      // Rejeita código expirado
      if (app.codigo_aprovacao_expira_em) {
        const expiresAt = new Date(app.codigo_aprovacao_expira_em);
        if (expiresAt < new Date()) {
          await base44.asServiceRole.entities.Notification.create({
            user_id: userId,
            application_id: app.id,
            canal: 'whatsapp',
            direcao: 'recebida',
            remetente: from,
            conteudo: sanitizeLog(messageBody),
            codigo_aprovacao: code,
            decisao: 'aprovar',
            resultado: 'erro',
            erro: 'Codigo de aprovacao expirado.',
            identificador_externo: messageSid,
            criado_em: new Date().toISOString(),
          });
          return twiml('Codigo de aprovacao expirado.');
        }
      }

      // Aprova e despacha
      try {
        await approveApplication(base44.asServiceRole, userId, {
          applicationId: app.id,
          canal: 'whatsapp',
          origem: 'whatsapp_webhook',
        });

        const dispatched = await dispatchApprovedApplication(base44.asServiceRole, userId, {
          applicationId: app.id,
        });

        const statusMsg = dispatched.status === 'acao_manual_necessaria'
          ? ('Candidatura aprovada! Status: acao manual necessaria. ' + (dispatched.motivo_bloqueio || ''))
          : 'Candidatura aprovada e enviada!';
        await sendWhatsAppMessage(config, from, statusMsg);

        await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          application_id: app.id,
          canal: 'whatsapp',
          direcao: 'recebida',
          remetente: from,
          conteudo: sanitizeLog(messageBody),
          codigo_aprovacao: code,
          decisao: 'aprovar',
          resultado: 'sucesso',
          identificador_externo: messageSid,
          criado_em: new Date().toISOString(),
        });
        return twiml();
      } catch (err) {
        await sendWhatsAppMessage(config, from, 'Erro ao aprovar: ' + err.message);
        await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          application_id: app.id,
          canal: 'whatsapp',
          direcao: 'recebida',
          remetente: from,
          conteudo: sanitizeLog(messageBody),
          codigo_aprovacao: code,
          decisao: 'aprovar',
          resultado: 'erro',
          erro: err.message,
          identificador_externo: messageSid,
          criado_em: new Date().toISOString(),
        });
        return twiml();
      }
    }

    // Comando RECUSAR [CODIGO]
    if (text.startsWith('RECUSAR ')) {
      const code = text.substring(8).trim();
      const apps = await base44.asServiceRole.entities.Application.filter(
        { codigo_aprovacao: code, status: 'pendente_aprovacao' },
        { limit: 1 }
      );
      const app = apps.items && apps.items[0];

      if (!app) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          canal: 'whatsapp',
          direcao: 'recebida',
          remetente: from,
          conteudo: sanitizeLog(messageBody),
          codigo_aprovacao: code,
          decisao: 'recusar',
          resultado: 'erro',
          erro: 'Codigo invalido ou candidatura ja processada.',
          identificador_externo: messageSid,
          criado_em: new Date().toISOString(),
        });
        return twiml('Codigo invalido ou candidatura ja processada.');
      }

      if (app.user_id !== userId) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          canal: 'whatsapp',
          direcao: 'recebida',
          remetente: from,
          conteudo: sanitizeLog(messageBody),
          codigo_aprovacao: code,
          decisao: 'recusar',
          resultado: 'erro',
          erro: 'Candidatura nao pertence a este usuario.',
          identificador_externo: messageSid,
          criado_em: new Date().toISOString(),
        });
        return twiml('Candidatura nao pertence a este usuario.');
      }

      try {
        await rejectApplication(base44.asServiceRole, userId, {
          applicationId: app.id,
          motivo: 'Recusado via WhatsApp',
          canal: 'whatsapp',
          origem: 'whatsapp_webhook',
        });
        await sendWhatsAppMessage(config, from, 'Candidatura recusada com sucesso.');
        await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          application_id: app.id,
          canal: 'whatsapp',
          direcao: 'recebida',
          remetente: from,
          conteudo: sanitizeLog(messageBody),
          codigo_aprovacao: code,
          decisao: 'recusar',
          resultado: 'sucesso',
          identificador_externo: messageSid,
          criado_em: new Date().toISOString(),
        });
        return twiml();
      } catch (err) {
        await sendWhatsAppMessage(config, from, 'Erro ao recusar: ' + err.message);
        await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          application_id: app.id,
          canal: 'whatsapp',
          direcao: 'recebida',
          remetente: from,
          conteudo: sanitizeLog(messageBody),
          codigo_aprovacao: code,
          decisao: 'recusar',
          resultado: 'erro',
          erro: err.message,
          identificador_externo: messageSid,
          criado_em: new Date().toISOString(),
        });
        return twiml();
      }
    }

    // Comando não reconhecido
    await sendWhatsAppMessage(config, from,
      'Comando nao reconhecido. Use:\nBUSCAR - ver candidaturas pendentes\nAPROVAR [CODIGO] - aprovar\nRECUSAR [CODIGO] - recusar');
    await base44.asServiceRole.entities.Notification.create({
      user_id: userId,
      canal: 'whatsapp',
      direcao: 'recebida',
      remetente: from,
      conteudo: messageBody,
      decisao: 'desconhecido',
      resultado: 'ignorado',
      identificador_externo: messageSid,
      criado_em: new Date().toISOString(),
    });
    return twiml();
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}