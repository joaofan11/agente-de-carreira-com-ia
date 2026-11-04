# Revisão das proteções e da auditoria

Base: `b53638fabe3f1c61f0f053bb83b9427c5a86c930`, confirmado como `main` do GitHub nesta revisão.
Checkpoint comparado: `b9fa06a0ffae69cb52b6b7d3d9942437402999de`.
Branch local: `review/audit-safety-rules`. Sem push, merge ou deploy.

## Alterações propostas

- Remover a segunda chave `Funcionando` de `src/lib/auditPdf.js`. As duas entradas tinham o mesmo valor `GREEN`; o resultado visual foi preservado. A duplicação foi introduzida em `b53638f`, depois do checkpoint.
- Adicionar testes locais das regras compartilhadas, usando exclusivamente dados e clientes em memória.

## Correções anteriores encontradas

Os arquivos de regras/backend permanecem idênticos ao checkpoint. As alterações posteriores atingem 13 arquivos de auditoria, autenticação e Dashboard; foram preservadas.

| Área | Evidência no código atual | Limite da revisão |
| --- | --- | --- |
| Pausa e orçamento | `automationControls.ts`, `manageAutomationBudget`, `runCandidateProcessing`: pausa antes da reserva e depois, mês UTC, contador reservado antes do LLM, alteração do limite sem zerar consumo, ausência de orçamento bloqueia | `updateMany` e concorrência reais ainda precisam de homologação |
| Recomendações | `runCandidateProcessing` salva análises e conta recomendações; não cria candidaturas | Não houve execução automática real |
| Currículo e aprovação | `applicationStateMachine.ts` exige proprietário, status pronto e PDF privado; `ResumeGenerator` limpa `savedResumeId` ao editar | Fluxo completo de UI e armazenamento não executado |
| Canal e destinatário | Interface oferece manual/Gmail/Outlook; manual é padrão; despacho exige destinatário e retorna a confirmação do provedor | Canal legado `email` continua reconhecido no backend, sem provedor funcional; nenhuma ativação de e-mail verificada |
| Cache | `matchCache.ts` assina perfil/preferências/vaga; `analyzeJobMatch` e processamento comparam assinatura no servidor | Testes locais verificam a assinatura; não exercitam o handler inteiro nem a persistência |
| Auditoria e reenvio | `claimDelivery` faz reserva condicional antes do envio Gmail/Outlook e mantém token após erro; `auditCompleted` tolera falha após conclusão | Modelo em memória verifica contrato esperado, não atomicidade real da plataforma |
| Recuperação | `Curriculos` oferece recuperação sem IA; `saveResumeVersion` anexa apenas PDF ausente; `repairApplicationResume` bloqueia envio iniciado e retorna para nova aprovação | Não houve PDF novo, upload ou migração de dados |
| Rotas | `AdminRoute` protege administração, demonstração e auditoria | Não houve teste com duas contas |
| Histórico | Relatório atual contém atualizações posteriores ao checkpoint | Não foi restaurado o relatório antigo nem realizado novo scan de segurança |

## Validação local

- `npm run build`: passou; aviso de bundle acima de 500 kB. Sem vínculo Base44, comprova compilação, não funcionamento integrado.
- `npm run lint`: passou.
- `npm run typecheck`: passou após remover a duplicação.
- `node tests/safety-rules.test.mjs`: 14 testes passaram, zero falhas ou skips. Use este comando para ver a contagem individual neste ambiente: `node --test` apresentou apenas o arquivo como um teste agregado.
- Verificação sintática de todos os arquivos TypeScript do backend com `typescript.transpileModule`: sem executar handlers ou importar o SDK remoto. Não equivale a checagem de tipos ou homologação do backend.
- `git diff --check`: passou.

Os testes cobrem limite/ausência/pausa de orçamento, disputa simulada pelo último slot, resposta de armazenamento ambígua, mês UTC, invalidação de cache, propriedade forjada/legada conflitante, aprovação e PDF privado, mistura demo/real, candidatura sem aprovação, destinatário, confirmação simulada de envio, reserva concorrente e falha de auditoria. O log de falha de auditoria é intencional no cenário que simula indisponibilidade.

## Pendências da plataforma

Continuam pendentes: isolamento entre duas contas; execução agendada e identidade administrativa do scheduler (o handler exige admin e registra origem manual); atomicidade real de reservas; pausa e orçamento no banco; extração de documentos e fluxo completo de currículo; OAuth próprio do Google e envio controlado; homologação WhatsApp/Outlook; segurança, privacidade e ensaio da demonstração.

Não foram feitas chamadas reais de IA, uploads, envios, autenticação de CLI, deploy ou publicação. A sincronização GitHub–Base44 foi preservada. Revisar o diff antes de integrar; as alterações permanecem locais e sem commit.
