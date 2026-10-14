// outlookConfig.ts — configuração do conector Outlook (app-user).
// TODO: Após registrar o workspace connector para Outlook (register_workspace_connector
//   com integration_type="outlook" e scopes Mail.Send + offline_access),
//   substitua OUTLOOK_CONNECTOR_ID pelo ID retornado.
export const OUTLOOK_CONNECTOR_ID = "";
export const OUTLOOK_SCOPES = ["Mail.Send", "offline_access"];