// gmailMimeBuilder.ts — constrói mensagem MIME RFC 2822 com anexo PDF para Gmail API.

// Codifica subject com RFC 2047 B-encoding se houver caracteres não-ASCII.
function encodeSubject(subject) {
  if (/^[\x20-\x7E]*$/.test(subject)) return subject;
  const b64 = btoa(unescape(encodeURIComponent(subject)));
  return "=?UTF-8?B?" + b64 + "?=";
}

// Constrói mensagem MIME multipart/mixed com corpo texto + anexo PDF.
export function buildMimeMessage(from, to, subject, body, pdfBase64, pdfFilename) {
  const boundary = "boundary_" + crypto.randomUUID().replace(/-/g, "");
  const lines = [
    "From: " + from,
    "To: " + to,
    "Subject: " + encodeSubject(subject),
    "MIME-Version: 1.0",
    "Content-Type: multipart/mixed; boundary=\"" + boundary + "\"",
    "",
    "--" + boundary,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
    "",
    "--" + boundary,
    "Content-Type: application/pdf; name=\"" + pdfFilename + "\"",
    "Content-Transfer-Encoding: base64",
    "Content-Disposition: attachment; filename=\"" + pdfFilename + "\"",
    "",
    pdfBase64,
    "",
    "--" + boundary + "--",
    "",
  ];
  return lines.join("\r\n");
}

// Codifica string MIME para base64URL (exigido pela Gmail API).
export function mimeToBase64Url(mimeMessage) {
  const b64 = btoa(unescape(encodeURIComponent(mimeMessage)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Re-exporta funções compartilhadas de conteúdo de e-mail (Gmail e Outlook usam emailContent.ts).
export { formatEmailBody, formatEmailSubject } from './emailContent.ts';