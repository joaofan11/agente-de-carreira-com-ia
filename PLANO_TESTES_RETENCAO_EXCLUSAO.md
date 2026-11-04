# Plano de testes — retenção e exclusão

> **Documento de trabalho.** Base: commit `8116799` (editor = main do GitHub). App publicado em 2026-11-04T13:42:21Z, **posterior ao commit** — há alterações não publicadas. Nenhum teste deste plano alterou dados, configurações, relógio ou permissões.

## 1. Objetivo

Verificar o que existe hoje de retenção e exclusão no Anexa.AI, separar o que foi comprovado do que é apenas proposta, e deixar pronto o ensaio que depende de duas contas de teste e de confirmação do fornecedor.

## 2. Ambiente isolado: existe, mas não foi ativado

A plataforma oferece **dados de teste** em banco separado do de produção (o banco de teste começa vazio e não sincroniza com produção), disponível no plano Builder — que é o plano deste workspace. Ativar exige ligar "Test Data" nas configurações do app, o que é **mudança de configuração** e está fora do que foi autorizado nesta etapa.

**Consequência:** nenhum teste foi executado contra banco de dados, produção ou teste. O que foi executado é **simulação de lógica pura, em memória**, descrita abaixo e explicitamente identificada como simulação.

## 3. Rotinas de retenção existentes

| Verificação | Resultado | Evidência |
|---|---|---|
| Workflow de expurgo agendado | **Não existe.** O único workflow é `DailyJobAutomation` (diário, 06:00), que chama `runJobCollection` e `runCandidateProcessing` | `base44/workflows/DailyJobAutomation.jsonc` |
| Função de backend de retenção | **Não existe** entre as 25 funções | `base44/functions/` |
| Exclusão de registro de documento | Existe: `manageCandidateDocument` ação `delete`, com verificação de dono. **Não apaga o arquivo privado** | `base44/functions/manageCandidateDocument/entry.ts:11-15` |
| Exclusão de registro de currículo | Existe: `saveResumeVersion` ação `delete`, com verificação de dono e bloqueio se houver candidatura vinculada. **Não apaga o PDF privado** | `base44/functions/saveResumeVersion/entry.ts:22-28` |
| Exclusão de conta e derivados | **Não existe** | Busca por exclusão no backend: apenas as duas acima |
| Registro de protocolos LGPD | **Não existe** | Nenhuma entidade correspondente |

## 4. Testes executados — simulação de regra (não é rotina implantada)

Arquivo: `tests/retention-simulation.test.mjs`. Implementa as regras **propostas** como função pura, com "agora" injetado; não acessa banco, rede, storage nem relógio do sistema.

- Commit: `8116799` · Ambiente: execução local no editor · Horário: 2026-11-04T18:55:44Z

| ID | Pré-condição (fixture sintética) | Ação | Esperado | Observado | Status |
|---|---|---|---|---|---|
| RET-SIM-01 | Perfil com última atividade exatamente 12 meses antes de "agora" | Selecionar | Não gera aviso (regra estrita) | Nenhum aviso; 1 segundo a mais já entra em aviso | APROVADO |
| RET-SIM-02 | Perfil inativo com aviso enviado há 29 e há 30 dias | Selecionar | 29 dias não exclui; 30 exclui | 29 → nada; 30 → exclusão | APROVADO |
| RET-SIM-03 | Documentos: extração confirmada há 6 e há 8 dias; sem confirmação há 29 e há 31 dias; confirmada ontem com upload de 60 dias | Selecionar | 7 dias e 30 dias como limites; confirmação prevalece sobre upload antigo | Comportamento conforme proposto | APROVADO |
| RET-SIM-04 | Candidaturas encerradas há 11 e 12 meses; candidatura sem data de encerramento | Selecionar | Só a de 12 meses; sem data nunca é selecionada | Conforme proposto | APROVADO |
| RET-SIM-05 | Duas contas com registros vencidos e válidos | Selecionar por conta | Só elegíveis do titular alvo; conta vizinha intacta | Nenhum registro de B selecionado | APROVADO |
| RET-SIM-06 | Mesma base após remoção do que foi selecionado | Repetir seleção | Segunda execução vazia | Conjunto vazio | APROVADO |
| RET-SIM-07 | 4 documentos elegíveis, falha simulada na 3ª operação | Aplicar parcial, depois repetir | Parcial aplicada, retentativa pega só o restante, sem duplicar | Removeu 2, retentativa selecionou 2 restantes, 0 duplicados | APROVADO |
| RET-SIM-08 | Conta A com análise, preferência, documento, duas versões de currículo (uma vinculada a candidatura) e entidades legadas; conta B vizinha | Calcular derivados da conta A | Derivados de A saem; currículo vinculado fica; B intacta | Conforme proposto | APROVADO |

**Limite desta evidência:** prova o comportamento da regra escrita, não a existência de expurgo. Não houve criação, alteração ou exclusão de registros reais.

## 5. Testes de diagnóstico (inspeção estática e leitura autorizada)

- Commit: `8116799` · Ambiente: editor + leitura de estado do app · Horário: 2026-11-04T18:53–18:56Z

| ID | Verificação | Resultado | Status |
|---|---|---|---|
| RET-DIAG-01 | Correspondência editor ↔ GitHub main | Ambos em `8116799`, árvore limpa | APROVADO (comprova correspondência) |
| RET-DIAG-02 | Correspondência com o publicado | Publicado 13:42:21Z, `unpublished_changes: true`; último commit antes da publicação é `cfbd770` (13:32:23Z) e `8116799` é posterior (18:51:17Z). **Publicado ≠ editor**; o commit exato do publicado não é legível por ferramenta | APROVADO (divergência registrada) |
| RET-DIAG-03 | Política de privacidade acessível sem login | Rota `/privacidade` está dentro do bloco protegido por autenticação; o app é público sem login | REPROVADO (transparência) |
| RET-DIAG-04 | Âncora de "confirmação da extração" | `CandidateDocument` não tem campo de confirmação; `status_extracao` só registra estado | REPROVADO (regra não calculável) |
| RET-DIAG-05 | Âncora de "encerramento da candidatura" | `Application` não tem data de encerramento nem estado terminal correspondente | REPROVADO (regra não calculável) |
| RET-DIAG-06 | Âncora de inatividade da conta | Só existe `CandidateProfile.atualizado_em`; não há registro de último acesso disponível ao app | REPROVADO parcial (mede edição, não acesso) |
| RET-DIAG-07 | Documentos com arquivo privado e legados | 1 de 8 `CandidateDocument` com referência privada; `Document` com 0 arquivos | APROVADO (inventário) |
| RET-DIAG-08 | Analítica no código do app | Nenhum evento de analítica próprio no frontend; configurações de rastreio da plataforma não verificadas | NÃO EXECUTADO |

## 6. Testes bloqueados

| ID | Teste | Bloqueio | O que destrava |
|---|---|---|---|
| RET-BLK-01 | Executar expurgo em banco isolado | Não existe rotina a executar; e ativar "Test Data" é mudança de configuração | Aprovar a proposta de implementação (seção 8) e autorizar ativar dados de teste |
| RET-BLK-02 | Exclusão do arquivo privado | A documentação da plataforma não oferece exclusão de arquivos enviados por `UploadPrivateFile`; excluir o registro não apaga o arquivo | Resposta do suporte Base44 (seção 9) |
| RET-BLK-03 | Janela de retenção de backups | Pela documentação, backup automático é oferecido nos planos Elite (7 dias) e Business/Enterprise (30 dias); o workspace está no plano **Builder**. Nada confirmado para este plano | Confirmação do fornecedor |
| RET-BLK-04 | Isolamento no publicado com duas contas comuns | Não tenho credenciais de contas comuns e não posso assumir contas reais | Duas contas fictícias autorizadas |
| RET-BLK-05 | Exclusão de conta completa | Não existe rotina; excluir o projeto para atender titular é vedado | Implementação aprovada |

## 7. Plano para ensaio posterior no ambiente publicado (somente depois de autorizado)

**Pré-requisitos:** duas contas fictícias com papel `user` (A e B), criadas pela equipe com e-mails controlados; lote identificável `LGPD-RET-<AAAA-MM-DD>`; aprovação registrada dos prazos; caminho de limpeza confirmado.

**Regra de segurança do ensaio:** não criar PDF privado enquanto a exclusão de arquivo estiver bloqueada. Se o roteiro exigir documento, usar apenas um PDF sintético de 1 página, sem dado real, e aceitar por escrito o resíduo no storage.

| Passo | Ação | Conta | Resultado esperado | Evidência a coletar |
|---|---|---|---|---|
| 1 | Criar perfil, preferência e vaga fictícia marcada com o lote | A | Registros criados, todos com o identificador do lote | Contagem por lote |
| 2 | Criar perfil e preferência equivalentes | B | Registros de B com o mesmo lote | Contagem por lote |
| 3 | A tenta ler registros de B e vice-versa (lista e por ID) | A e B | Nenhum acesso cruzado | Códigos HTTP e resultado, sanitizados |
| 4 | A tenta alterar e excluir registro de B | A | Negado, sem efeito | Códigos HTTP; releitura por B |
| 5 | Simular vencimento **sem alterar timestamps**: usar registro com data antiga criada para o lote (nunca editar data de usuário real) | A | Registro antigo entra na seleção; os demais não | Lista de elegíveis sanitizada |
| 6 | Executar a rotina (quando existir) em modo relatório, sem exclusão | — | Lista exata de elegíveis, nenhum registro removido | Relatório da execução |
| 7 | Executar exclusão | — | Somente elegíveis do lote removidos; registros válidos e de B intactos | Contagens antes/depois |
| 8 | Repetir a execução | — | Nada mais é removido | Relatório vazio |
| 9 | Verificar arquivo privado, URL assinada e backup | — | Registrar o que foi apagado de fato e o que permaneceu | Inventário de resíduos |
| 10 | Limpar o lote | Equipe | Somente registros `LGPD-RET-*` removidos | Contagem zero para o lote |

## 8. Proposta de implementação (para revisão — não implementada)

1. **Função `runRetentionSweep`** (service role), sem parâmetros destrutivos por padrão: `{ modo: 'relatorio' | 'executar', escopo: 'lote' | 'geral', lote_id? }`, processando em lotes de até 50, com registro em `AutomationRun` e trilha em `AuditLog`.
2. **Campos de âncora** a criar: `Application.encerrada_em` (definido na transição para estado terminal), `CandidateDocument.extracao_confirmada_em` (gravado na revisão do titular), `CandidateProfile.ultimo_acesso_em` (atualizado em login/abertura) — sem esses campos, três dos prazos propostos não são calculáveis.
3. **Ordem de exclusão**: candidaturas elegíveis → currículos liberados → documentos e dados extraídos → análises → preferências e perfil. Currículo vinculado a candidatura preservada nunca sai antes dela.
4. **Idempotência e retomada**: seleção determinística por corte, execução em lotes, registro do último item processado, retentativa segura (comprovada na simulação RET-SIM-06/07).
5. **Aviso e carência**: um passo separado (`modo: 'avisar'`) grava `aviso_enviado_em`; exclusão só ocorre após 30 dias.
6. **Arquivos**: a função deve tentar apoiar-se em caminho de exclusão do fornecedor quando existir; até então, marcar o registro como "arquivo pendente de eliminação" em vez de afirmar exclusão.
7. **Workflow** agendado (mensal) chamando o modo relatório, com aprovação manual para o modo executar.
8. **Testes automatizados** equivalentes aos da simulação, rodando em CI sem tocar banco.

## 9. Solicitação ao suporte Base44 (rascunho — não enviada)

> Assunto: exclusão definitiva de arquivos privados e retenção de backups
>
> 1. Existe forma suportada de apagar definitivamente um arquivo enviado por `UploadPrivateFile` (via API, painel ou remoção do app)? Se sim, qual o procedimento e a evidência de conclusão?
> 2. Ao excluir o registro que referencia o arquivo, o arquivo permanece no storage indefinidamente?
> 3. Qual a janela de retenção de backups para o plano **Builder** e se os arquivos privados estão incluídos nesses backups?
> 4. Registros excluídos ficam em "Recently deleted" por 30 dias; é possível forçar a eliminação definitiva antes desse prazo, e como comprovar?
> 5. Existe documentação sobre região de processamento e suboperadores de IA aplicáveis à conta?

## 10. Critérios de saída do cartão 15

- Prazos aprovados pela equipe e revisados pelo jurídico, registrados na matriz.
- Rotina implementada, testada em banco isolado e comprovada com relatório de execução.
- Caminho de exclusão de arquivo privado confirmado pelo fornecedor ou resíduo aceito formalmente.
- Canal LGPD com prazo e registro de protocolo.
- Política publicada e publicamente acessível.
- Isolamento entre duas contas comprovado no publicado com contas fictícias.