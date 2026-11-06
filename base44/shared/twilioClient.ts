// twilioClient.ts — funções compartilhadas para integração Twilio WhatsApp.
// Usado por sendWhatsAppAlert e whatsappWebhook.

// Normaliza telefone para E.164 sem + (whatsapp:+559999999999 → 559999999999)
export function normalizePhone(phone) {
  if (!phone) return "";
  let p = phone.replace(/whatsapp:/i, "").replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.substring(1);
  return p;
}

// Gera código alfanumérico de 8 caracteres, difícil de adivinhar
export function generateApprovalCode() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => (b % 36).toString(36)).join("").toUpperCase();
}

// Formata a mensagem de alerta de oportunidade
export function formatWhatsAppAlert(job, match, code) {
  const nivel = match?.nivel_compatibilidade || "medio";
  const score = match?.score || 0;
  const nivelLabel = nivel === "alto" ? "Alta" : nivel === "medio" ? "Media" : "Baixa";
  return (
    "Nova oportunidade encontrada!\n\n" +
    "Cargo: " + job.cargo + "\n" +
    "Empresa: " + job.empresa + "\n" +
    "Compatibilidade: " + nivelLabel + " (" + score + "/100)\n\n" +
    "Seu curriculo foi preparado.\n\n" +
    "Para autorizar o envio, responda: APROVAR " + code + "\n" +
    "Para recusar: RECUSAR " + code
  );
}

// Envia mensagem WhatsApp via Twilio API
export async function sendWhatsAppMessage(config, to, body, options = {}) {
  const url = "https://api.twilio.com/2010-04-01/Accounts/" + config.accountSid + "/Messages.json";
  const auth = btoa(config.accountSid + ":" + config.authToken);
  const params = new URLSearchParams();
  params.append("From", config.fromNumber);
  params.append("To", to);
  if(options.variables && config.contentSid){params.append("ContentSid",config.contentSid);params.append("ContentVariables",JSON.stringify(options.variables));}
  else params.append("Body", body);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + auth,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    signal: AbortSignal.timeout(15000),
  });

  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { success: res.ok, data, status: res.status };
}

// Valida assinatura X-Twilio-Signature (HMAC-SHA1 sobre URL + body)
export async function validateTwilioSignature(authToken, body, signature, url) {
  if (!signature || !authToken || !url) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(authToken),
    { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const params=new URLSearchParams(body);
  const keys=[...new Set(params.keys())].sort();
  const canonical=keys.map(key=>[...new Set(params.getAll(key))].sort().map(value=>key+value).join('')).join('');
  const data = encoder.encode(url + canonical);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  if(computed.length!==signature.length)return false;
  let difference=0;for(let i=0;i<computed.length;i++)difference|=computed.charCodeAt(i)^signature.charCodeAt(i);
  return difference===0;
}

// Extrai config Twilio dos segredos
export function getTwilioConfig(secrets) {
  const accountSid = secrets.get("TWILIO_ACCOUNT_SID");
  const authToken = secrets.get("TWILIO_AUTH_TOKEN");
  const fromNumber = secrets.get("TWILIO_WHATSAPP_FROM");
  return {
    accountSid, authToken, fromNumber,
    webhookUrl:secrets.get("TWILIO_WEBHOOK_URL"),
    contentSid:secrets.get("TWILIO_APPROVAL_CONTENT_SID"),
    configured: !!(accountSid && authToken && fromNumber),
  };
}