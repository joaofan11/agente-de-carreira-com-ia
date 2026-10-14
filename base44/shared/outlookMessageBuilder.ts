// outlookMessageBuilder.ts — constrói mensagem JSON para Microsoft Graph API sendMail.
// Graph API usa formato JSON (não MIME bruto como Gmail).

export function buildGraphMessage(to, subject, body, pdfBase64, pdfFilename) {
  return {
    message: {
      subject: subject,
      body: {
        contentType: "Text",
        content: body,
      },
      toRecipients: [
        { emailAddress: { address: to } },
      ],
      attachments: [
        {
          "@odata.type": "#microsoft.graph.fileAttachment",
          name: pdfFilename,
          contentType: "application/pdf",
          contentBytes: pdfBase64,
        },
      ],
    },
    saveToSentItems: true,
  };
}