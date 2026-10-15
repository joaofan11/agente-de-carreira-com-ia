import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { realProfile, ownedRecord, ownerQuery } from '../../shared/personalOwnership.ts';
import {
  getTwilioConfig, sendWhatsAppMessage, generateApprovalCode, formatWhatsAppAlert, normalizePhone,
} from '../../shared/twilioClient.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { application_id, is_test } = body;
    if (Object.keys(body).some(key => !['application_id', 'is_test'].includes(key))) return Response.json({ error: 'Campos não permitidos.' }, { status: 400 });

    // Verifica config Twilio
    const config = getTwilioConfig(secrets);
    if (!config.configured) {
      return Response.json({
        configured: false,
        error: 'WhatsApp nao configurado. Credenciais Twilio ausentes.',
      }, { status: 503 });
    }

    // Busca telefone do perfil
    const profile = await realProfile(base44, user.id);
    if (!profile || !profile.telefone_whatsapp) {
      return Response.json({
        configured: true,
        error: 'Telefone WhatsApp nao cadastrado no perfil. Acesse Meu Perfil para cadastrar.',
      }, { status: 400 });
    }

    // Verifica preferência de notificações
    const prefs = await base44.asServiceRole.entities.JobPreference.filter({ $and: [ownerQuery(user.id), { is_demo: { $ne: true } }] }, { limit: 1 });
    const pref = prefs.items && prefs.items[0];
    if (pref && pref.notificacoes_ativas === false && !is_test) {
      return Response.json({
        configured: true,
        error: 'Notificacoes WhatsApp desativadas nas preferencias.',
      }, { status: 403 });
    }

    // Busca candidatura (não obrigatória em modo teste)
    let application = null;
    let job = null;
    if (!is_test) {
      if (!application_id) return Response.json({ error: 'application_id e obrigatorio.' }, { status: 400 });
      application = await ownedRecord(base44, 'Application', application_id, user.id);
      if (!application) return Response.json({ error: 'Candidatura nao encontrada.' }, { status: 404 });
      if (application.user_id !== user.id) return Response.json({ error: 'Candidatura nao pertence ao usuario.' }, { status: 403 });
      if (application.status !== 'pendente_aprovacao') {
        return Response.json({ error: 'Candidatura nao esta pendente de aprovacao.' }, { status: 400 });
      }
      try { job = await base44.entities.Job.get(application.job_id); } catch { /* vaga removida */ }
    }

    // Gera código e expiração (24h)
    const code = generateApprovalCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Atualiza candidatura com código (se aplicável)
    if (application) {
      await base44.asServiceRole.entities.Application.update(application.id, {
        codigo_aprovacao: code,
        codigo_aprovacao_expira_em: expiresAt,
      });
    }

    // Formata mensagem
    const message = is_test
      ? ("Teste do Agente de Carreira com IA\n\nWhatsApp funcionando!\n\n" +
         "Para testar aprovacao, responda: APROVAR " + code + "\n" +
         "Para recusar: RECUSAR " + code)
      : formatWhatsAppAlert(job, null, code);

    // Envia via Twilio
    const to = "whatsapp:+" + normalizePhone(profile.telefone_whatsapp);
    const result = await sendWhatsAppMessage(config, to, message);

    // Registra notificação
    await base44.asServiceRole.entities.Notification.create({
      user_id: user.id,
      owner_user_id: user.id,
      application_id: application ? application.id : null,
      canal: 'whatsapp',
      direcao: 'enviada',
      destino: to,
      conteudo: message,
      codigo_aprovacao: code,
      status: result.success ? 'enviado' : 'falhou',
      resultado: result.success ? 'sucesso' : 'erro',
      erro: result.success ? null : (result.data?.message || 'Falha no envio'),
      identificador_externo: result.data?.sid || null,
      criado_em: new Date().toISOString(),
      is_demo: !!(is_test || (application && application.is_demo)),
      demo_batch_id: is_test ? 'demo-etapa10-test' : (application ? application.demo_batch_id : null),
    });

    if (!result.success) {
      return Response.json({
        configured: true,
        error: 'Falha ao enviar mensagem WhatsApp.',
        details: result.data?.message,
      }, { status: 502 });
    }

    return Response.json({
      configured: true,
      success: true,
      message: 'Alerta enviado via WhatsApp.',
      codigo_aprovacao: code,
      message_sid: result.data?.sid,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}