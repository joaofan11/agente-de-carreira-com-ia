# Anexa.AI — aprovação WhatsApp e envio pela conta do usuário

## Entrega e limites

Implementação de OAuth individual para Gmail e Outlook, solicitação de decisão pelo Twilio WhatsApp e envio do PDF privado somente após aprovação. O webhook não tem a sessão do navegador; por isso, o envio em segundo plano usa uma concessão OAuth própria do usuário, e não um conector compartilhado da equipe. Os antigos IDs de workspace connector não são usados nesse fluxo.

A busca continua usando Jobicy e Google Jobs/SerpApi para anúncios indexados dos portais. Isso não dá acesso a APIs de candidatura de Gupy, LinkedIn ou InfoJobs. A função de submissão direta existente permanece limitada ao receptor de demonstração; nenhum endpoint real de portal foi inventado ou habilitado. Vagas que só aceitam formulário não são tratadas como enviadas por abrir o link ou por mandar mensagem a um endereço genérico.

Há dois caminhos para solicitar aprovação:

1. Com currículo pronto: criar candidatura pendente com Gmail/Outlook, revisar currículo e destinatário e selecionar Solicitar aprovação pelo WhatsApp.
2. Com preparação automática autorizada: no processamento administrativo/agendado, uma vaga compatível sem bloqueios, com destinatário de candidatura verificado, pode gerar um novo currículo factual, salvar o PDF privado e solicitar a decisão. O envio só ocorre quando o proprietário responde APROVAR com o código válido.

Preparação automática fica desativada por padrão, exige consentimento explícito, telefone e notificações ativos, conta conectada, compatibilidade >=60, orçamento de IA disponível e até uma tentativa por proprietário por dia UTC. A reserva diária e o orçamento não são devolvidos em falha. A ausência dessas condições não deve provocar IA, upload ou mensagem. Registros ativos impedem nova preparação para a mesma vaga pela mitigação existente; a criação continua sem garantia global de unicidade.

## Configuração da equipe — sem colocar chaves no chat ou no GitHub

Cadastrar em Secrets do backend Base44:

| Nome | Uso |
|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | Aplicativo OAuth Google do Anexa.AI |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Segredo confidencial do aplicativo Google |
| `MICROSOFT_OAUTH_CLIENT_ID` | Aplicativo Microsoft Entra do Anexa.AI |
| `MICROSOFT_OAUTH_CLIENT_SECRET` | Segredo confidencial do aplicativo Microsoft |
| `EMAIL_OAUTH_CALLBACK_URL` | URL HTTPS pública exata da função `emailOAuthCallback`, copiada do painel Base44 |
| `EMAIL_TOKEN_ENCRYPTION_KEY` | Segredo aleatório exclusivo, com pelo menos 32 caracteres, gerado e guardado pela equipe |
| `TWILIO_ACCOUNT_SID` | Conta Twilio |
| `TWILIO_AUTH_TOKEN` | Autenticação e verificação das mensagens recebidas |
| `TWILIO_WHATSAPP_FROM` | Remetente no formato `whatsapp:+...` |
| `TWILIO_WEBHOOK_URL` | URL pública exata de `whatsappWebhook`, igual à cadastrada no Twilio |
| `TWILIO_APPROVAL_CONTENT_SID` | Modelo aprovado para solicitação de aprovação fora da janela de atendimento; opcional somente em testes que permitam mensagem livre |
| `AUTOMATION_SIGNING_SECRET` | Segredo aleatório >=32 caracteres para o agendador externo; não é chave de usuário |

A SerpApi continua dependendo de `SERPAPI_API_KEY`. Esse serviço só encontra anúncios; não fornece credenciais de candidatura.

### Google

1. Criar/configurar projeto no Google Cloud, habilitar Gmail API e configurar a tela de consentimento com o nome Anexa.AI e os dados públicos reais do projeto.
2. Criar cliente OAuth de aplicativo Web, com o callback HTTPS exato acima.
3. Permissões: `openid`, `email`, `https://www.googleapis.com/auth/gmail.send`. Não é solicitada leitura da caixa de entrada.
4. Durante o modo de testes, cadastrar as contas de teste autorizadas. Google pode exigir verificação para disponibilização pública dos escopos; concessões de teste podem expirar e exigir reconexão.
5. Salvar ID/segredo no Base44. Não usar chave de API do Google ou senha do Gmail no lugar de OAuth.

### Microsoft

1. Registrar aplicativo no Microsoft Entra, escolhendo suporte a contas pessoais e organizacionais se ambos forem usados.
2. Adicionar plataforma Web e o mesmo callback HTTPS exato. Criar segredo confidencial.
3. Permissões delegadas Microsoft Graph: `User.Read`, `Mail.Send` e `offline_access`. Políticas da organização podem exigir consentimento administrativo.
4. Salvar ID/segredo no Base44. O backend identifica o endereço efetivamente conectado; o e-mail de login do Anexa.AI não é presumido como remetente.

### WhatsApp/Twilio

1. Para teste, habilitar Sandbox e vincular os números de teste conforme instrução do Twilio. Em produção, configurar remetente WhatsApp aprovado e template apropriado.
2. Configurar mensagem recebida para POST na URL exata de `whatsappWebhook`. Guardar a mesma URL em `TWILIO_WEBHOOK_URL`; ela participa da assinatura. Não é aceita URL enviada em cabeçalho pelo chamador.
3. O template de aprovação deve explicar que APROVAR autoriza enviar o currículo ao destinatário indicado e apresentar as variáveis abaixo. Não usar template que esconda ou troque destinatário/versão.

| Variável | Conteúdo |
|---|---|
| `1` | Cargo |
| `2` | Empresa |
| `3` | Versão do currículo |
| `4` | Conta remetente |
| `5` | E-mail do recrutamento |
| `6` | Código para `APROVAR` ou `RECUSAR` |
| `7` | Link de revisão no Anexa.AI |
| `8` | Canal Gmail/Outlook |

O texto deve informar validade de 24 horas, comandos exatos e que não houve envio antes da aprovação. A aceitação da mensagem pela Twilio não comprova recebimento no aparelho. A homologação exige receber e responder de verdade.

## Operação no aplicativo

1. Em Configurações, conectar Gmail ou Outlook no site oficial do provedor. A permissão é individual; não compartilhar senha. Após o callback, voltar a Configurações e conferir o endereço exibido.
2. Em Meu Perfil, cadastrar o WhatsApp com país e DDD. Em Configurações, ativar alertas e realizar teste de conexão. Esse teste não autoriza candidatura.
3. Para vaga com e-mail, conferir o anúncio e o destinatário. O administrador pode registrar a evidência no detalhe da oportunidade: endereço, URL pública do anúncio e confirmação de que aceita currículo por e-mail. A URL registrada é evidência da revisão humana, não uma verificação automática do conteúdo do site.
4. Criar candidatura com currículo pronto e Gmail/Outlook. Selecionar Solicitar aprovação pelo WhatsApp, revisar versão e confirmar destinatário.
5. Responder `APROVAR CODIGO` ou `RECUSAR CODIGO` pelo número vinculado. A aprovação consome o código e dispara o PDF da versão vinculada, usando a conta revisada. Recusa não envia. Código expirado, proprietário ambíguo, currículo alterado e repetição de comando não devem gerar novo envio.
6. Para preparação automática, autorizar explicitamente a opção em Configurações, selecionar provedor e salvar. O processamento passa a considerar vagas elegíveis; ativar a preferência não executa a automação imediatamente.

## Agendamento

O processamento pode ser acionado por administrador no painel existente ou por um agendador confiável usando `scripts/run-anexa-automation.mjs`. O script não foi executado durante o desenvolvimento.

No ambiente seguro do agendador, definir `AUTOMATION_SIGNING_SECRET` igual ao backend e `ANEXA_FUNCTIONS_BASE_URL` como o prefixo HTTPS oficial das funções (copiar do painel e remover o nome final da função). O script assina separadamente coleta e processamento e chama ambos em sequência. Não é aceito `user_id` no corpo como autenticação. Assinatura é vinculada à função, corpo e timestamp de até cinco minutos; TLS e sigilo da chave são necessários, e o emissor deve limitar execução à agenda desejada.

Configurar o agendador para o horário escolhido pela equipe, por exemplo 06h em America/Manaus. O workflow nativo antigo não ganha autenticação por existir no repositório: sua execução anônima continua rejeitada. É necessário configurar o emissor autenticado/assinado ou usar o painel administrativo. Nenhum cron remoto foi ativado ou modificado nesta entrega.

Antes de ativar, conferir a pausa global e o orçamento mensal de IA do painel. O limite existente passa a contar também tentativas de geração automática de currículo, não apenas análise de compatibilidade. Cada coleta com SerpApi configurada pode consumir uma pesquisa; a deduplicação de vagas não é cache de consultas nem limite mensal da SerpApi. Controlar a frequência/cota do provedor.

## Proteções e resultados

- Tokens de atualização são criptografados com AES-GCM e contexto de proprietário/provedor. Chaves ficam em Secrets; entidades de conta e estado OAuth não podem ser lidas pelo usuário nem por administrador pelo SDK comum. Nenhum token é retornado à interface.
- OAuth usa estado aleatório, hash no banco, validade de dez minutos, consumo condicional e PKCE. Repetir callback não reutiliza autorização. Estados expirados devem ser removidos na manutenção; contas desconectadas têm o token limpo. Rotacionar a chave de criptografia exige planejamento/reconexão das contas existentes.
- Desconectar impede novos envios pela conta. Revogação no Google/Microsoft é feita nas configurações do próprio provedor. Solicitações de exclusão de titular também precisam incluir EmailAccount, EmailOAuthState e AutoApplicationPreference; esta entrega não declara encerrada a homologação de retenção/LGPD.
- Aprovação vincula currículo, destinatário e conta remetente. Correção de currículo/canal limpa esses vínculos e exige nova aprovação.
- A reserva de envio é condicional e preservada em timeout/resultado ambíguo. Não se repete automaticamente uma operação que pode ter sido aceita externamente. Conferir Enviados antes de recuperação manual.
- Gmail exige identificador real da resposta. Outlook exige HTTP 202 e registra protocolo interno explícito; não inventa ID do provedor. Nenhum desses resultados comprova leitura ou entrega ao recrutador.
- Se a auditoria ou o histórico falharem depois de uma operação aceita, isso é sinalizado sem repetir o efeito já realizado.

## Homologação real pendente

Configurar credenciais e URLs, disponibilizar as funções públicas de callback/webhook na versão autorizada e usar duas contas de teste controladas: uma remetente conectada e uma destinatária da equipe, numa vaga sintética de teste autorizada sem usar `is_demo` no fluxo real. Nunca usar recrutador real na primeira homologação.

Validar recebimento WhatsApp, APROVAR com envio único/PDF correto, recebimento na caixa de teste, RECUSAR sem envio, repetição do código, expiração, reconexão de conta, correção de currículo e desconexão. Registrar ambiente/commit, horários e identificador do provedor sem publicar tokens ou documentos pessoais. Nenhum envio real, upload remoto, IA real ou candidatura em portal foi realizado pelo agente durante o desenvolvimento. Nenhuma publicação foi executada.

## Evidência de desenvolvimento

180 testes aprovados em 25 arquivos, lint e build aprovados. Typecheck mantém exatamente os 39 erros preexistentes dos templates MFA e dependências, comparados com a base anterior; nenhum erro novo. Os testes novos cobrem OAuth/PKCE/criptografia por proprietário, estado expirado/repetido, envio dos dois provedores com PDF privado, destinatário/conta divergentes, timeout sem confirmação, assinatura do WhatsApp, aprovação/recusa/repetição, solicitação com consentimento, falha de histórico após aceite, interface e preparação automática sem ultrapassar consentimento/orçamento/limite diário. Banco, rede, IA e upload são substituídos por doubles locais.
