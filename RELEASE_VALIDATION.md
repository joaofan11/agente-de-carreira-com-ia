# Anexa.AI — validação para integração e publicação

Data: 04/11/2026. Os demais relatórios deste repositório são registros das etapas anteriores, não certificados de homologação atual.

## Integração

- PR #1 integrado à main: `664d4f350381b07f533e695ab5ba5fa07766016a`, preservando a atualização dos pacotes Base44 em `05df33d`.
- Base44 confirmou `synced: true`, dois commits recebidos e o mesmo hash `664d4f3`.
- Publicação deve usar o código sincronizado do servidor. Não executar `base44 deploy`, que enviaria a árvore local por outro caminho.

## Achados do scan de plataforma

O scan terminou com `status: up_to_date` em 04/11/2026 às 12:12 UTC sobre a versão sincronizada. Encontrou:

1. `searchJobs`: usuário comum podia consumir Jobicy e gravar catálogo via service role. Corrigido para exigir admin antes de rede/escrita.
2. `receiveDemoApplication`: falha de leitura de candidatura era ignorada e o receptor criava registros privilegiados a partir de IDs arbitrários. Corrigido com guarda administrativa, propriedade consistente, candidatura aprovada com envio reservado, vínculo de vaga/currículo demo e dados de candidato derivados do currículo aprovado. O tamanho é calculado do anexo real, que precisa ter cabeçalho PDF; `pdf_size` fornecido pelo cliente não autoriza o conteúdo.
3. Alerta alto em Zod. Atualizado para `^4.6.7`, sem imports diretos no app e com release de 12/10/2026, respeitando os sete dias do projeto. Checks foram repetidos. Bibliotecas externas podem manter suas próprias versões; não foi alterado o SDK remoto.
4. Alerta classificado como segredo crítico em `twilioClient.ts`: a descrição refere-se aos nomes TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_WHATSAPP_FROM não cadastrados, e não a valores de credenciais embutidos. Não foram inventados valores nem ignorado o achado. Um teste confirma integração desconfigurada e rejeição de assinatura sem token. WhatsApp continua sem homologação e não deve ser apresentado como ativo.

O receptor demo continua usando a reserva do despacho para o caminho normal. A consulta de recibo existente é uma defesa contra repetição, não uma prova de unicidade atômica de duas chamadas diretas concorrentes ao receptor. Essa limitação não foi declarada como resolvida.

## Evidências locais da revisão dos achados

- 32 testes passaram: 14 de orçamento/propriedade/aprovação/reenvio, 6 de compatibilidade/cache, 3 de declarações de RLS e 9 dos achados do scan.
- Build, lint e typecheck passaram. O build mantém aviso de bundle grande.
- Auditoria npm: 12 pacotes afetados, **zero altos e zero críticos**, 10 moderados e 2 baixos. `npm audit` continua retornando falha; não equivale a uma auditoria limpa.
- Nenhuma chamada de IA de negócio, upload, envio ou criação de registros reais foi feita.

## Teste de navegador na plataforma

Execução `6aeb20c355a703e29c9f692a`, usuário temporário comum, dados de teste, commit `664d4f3`:

- O agente relatou Dashboard, Oportunidades e Currículos visíveis sem erro aparente.
- O teste terminou **failed / failure_reason: platform / goal_accomplished: false**, zero créditos cobrados. A prévia ficou em “Preview is starting up” e houve falhas de captura.
- Privacidade e bloqueio das rotas administrativas não foram confirmados. O agente não usou os caminhos literais esperados; a execução não deve ser usada como prova de autorização correta.
- Não houve criação/alteração de registros no teste. Não foi executado teste de isolamento entre duas contas.

## Estado de homologação

Correções revisadas e testadas localmente não encerram automaticamente os cartões 02B, 06 e 15. Ainda é necessário conferir versão publicada, repetir o scan sobre a revisão final, validar rotas e isolamento real e completar os dados operacionais/jurídicos do rascunho de privacidade. Resultados posteriores de publicação devem registrar o hash realmente servido e o resultado observado, sem converter teste incompleto em aprovado.
