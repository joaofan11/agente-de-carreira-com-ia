# Relatório — retenção e exclusão de dados (Anexa.AI)

Execução: 2026-11-04, 18:53–18:57 UTC (14:53–14:57 em Manaus). App `6ace8fec4df8507617f77218`.
**Nenhuma alteração de código de produto, dados, configuração, integração ou publicação.** Não publiquei, não rodei deploy, não chamei IA do produto, não enviei e-mail, WhatsApp ou candidatura, não criei registros nem arquivos.

---

## 1. Versões e correspondência

| Item | Valor | Como foi verificado |
|---|---|---|
| Editor | `8116799` — "Update base44 packages", 2026-11-04T18:51:17Z, árvore limpa, branch `main` | `git log`, `git status` |
| GitHub `main` | `8116799`, mesmo horário | API pública de commits |
| App publicado | Publicado em 2026-11-04T13:42:21Z, com `unpublished_changes: true` | Estado da plataforma |
| Correspondência | **Editor = GitHub.** **Publicado ≠ editor**: a publicação é anterior ao commit `8116799`. O último commit antes da publicação é o merge `cfbd770` (13:32:23Z), então é provável que o publicado corresponda a ele — **inferência**, não leitura direta: nenhuma ferramenta disponível informa o commit exato do publicado | Comparação acima |

Observação de contexto: os commits `67d887f` e o merge `cfbd770` ("Fix authentication, WhatsApp identity and audit gaps") corrigiram parte dos achados da homologação anterior. Efeito verificável: `AuditLog` passou de 0 para 5 registros.

## 2. Inventário do que armazena dados pessoais

Contagens agregadas, lidas em 2026-11-04T18:56Z, sem conteúdo pessoal.

| Categoria | Onde | Registros |
|---|---|---|
| Perfil acadêmico/profissional | `CandidateProfile` | 9 |
| Preferências | `JobPreference` | 6 |
| Documentos e dados extraídos | `CandidateDocument` (1 com referência a arquivo privado) | 8 |
| Análises/cache | `JobMatch` | 11 |
| Currículos | `ResumeVersion` | 16 |
| Candidaturas | `Application` | 11 |
| Recibos de candidatura demo | `ReceivedApplication` | 2 |
| Notificações | `Notification` | 5 |
| Integrações/canal | `UserIntegration` | 6 |
| Auditoria | `AuditLog` | 5 |
| Automação | `AutomationRun` | 47 |
| Vagas (sem dado pessoal de titular) | `Job` | 84 |
| Legadas | `Document` 3, `Resume` 3, `StudentProfile` 3 — **nenhuma usada pelo código atual**; 0 arquivos referenciados | 9 |
| Configuração | `AppSetting` | 3 |

## 3. O que existe hoje de retenção e exclusão

**Não existe nenhuma rotina de retenção.** O único workflow é a automação diária de vagas (06:00), sem relação com expurgo. Nenhuma das 25 funções de backend apaga dados por prazo.

Existem exatamente **duas** exclusões de registro, ambas acionadas pelo titular e ambas com verificação de dono:

- `manageCandidateDocument` (ação `delete`) → apaga o registro `CandidateDocument`.
- `saveResumeVersion` (ação `delete`) → apaga o registro `ResumeVersion`, bloqueado quando há candidatura vinculada.

**Nenhuma das duas apaga o arquivo privado** referenciado no registro.

## 4. Quatro coisas diferentes que não podem ser confundidas

| Conceito | O que está comprovado | Fonte |
|---|---|---|
| Exclusão do registro | Comprovada no código (duas rotas acima). Registros excluídos ficam em "Recently deleted" por 30 dias antes da eliminação definitiva | Código do app; documentação da plataforma |
| Exclusão do arquivo privado | **Não existe caminho.** A exclusão do registro que aponta para o arquivo **não apaga o arquivo armazenado**; a documentação não oferece exclusão para envios feitos por `UploadPrivateFile`. A exclusão de mídia existe apenas para a biblioteca de mídia do app, que é outro armazenamento | Documentação da plataforma (gestão de mídia e referência de integrações) |
| Expiração de URL assinada | Comprovada em teste: 200 antes do vencimento, 401 depois, 403 no acesso direto sem assinatura. **Não é apagamento**: expira o link, não o arquivo | Homologação de 04/11 e documentação |
| Cache, logs e backups | Cache de análise (`JobMatch`) é registro, apagável. Logs do painel da plataforma **não podem ser excluídos**; dados de analítica são eliminados após 60 dias. Backups: pela documentação, automáticos nos planos Elite (7 dias) e Business/Enterprise (30 dias) — o workspace está no plano **Builder**, portanto nada confirmado para este caso | Documentação da plataforma; plano do workspace |

Também registrado: **tela vazia, 401, 403 ou URL expirada não provam apagamento físico**. Nenhum desses sinais foi usado aqui como prova de exclusão.

## 5. Documentos produzidos

| Arquivo | Natureza | Situação |
|---|---|---|
| `POLITICA_PRIVACIDADE_PARA_VALIDACAO.md` | Minuta completa da política, com controlador, integrantes e canal LGPD informados | **Minuta não aprovada** |
| `MATRIZ_RETENCAO_E_BASES_LEGAIS.md` | Bases legais propostas por finalidade, prazos propostos, âncoras técnicas, status de aprovação | **Minuta não aprovada** |
| `PLANO_TESTES_RETENCAO_EXCLUSAO.md` | Plano de testes, resultados executados, bloqueios, roteiro para o publicado, rascunho de pedido ao suporte, proposta de implementação | Documento de trabalho |
| `tests/retention-simulation.test.mjs` | Teste automatizado da **regra proposta**, em memória | 8 de 8 aprovados |
| `RELATORIO_RETENCAO_EXCLUSAO_2026-11-04.md` | Este relatório | — |

Evidências anteriores preservadas sem alteração: `HOMOLOGACAO_2026-11-04.md` e `MATRIZ_TESTES_2026-11-04.md` (commit `17c7475`).

## 6. Comprovado vs. proposta vs. bloqueado

**Comprovado por evidência:**
- Editor e GitHub no mesmo commit; publicado defasado, com a publicação anterior ao commit atual.
- Inexistência de rotina de retenção e de exclusão de conta.
- Duas exclusões de registro com verificação de dono; nenhuma apaga arquivo.
- Incapacidade documentada de apagar arquivo enviado por `UploadPrivateFile`.
- Expiração de URL assinada funcionando (já homologado).
- Comportamento das regras propostas nos limites exatos, na carência, no isolamento por conta, na repetição, na retomada após falha e no tratamento de derivados e legadas — **por simulação em memória**.
- Política atual não acessível sem login (rota protegida, app público).

**Apenas proposta:**
- Todos os prazos (12 meses, 30 dias, 7 dias, 90 dias, 12 meses de protocolo).
- Todas as bases legais por finalidade.
- Os campos de âncora sugeridos e a função de expurgo descrita na seção 8 do plano de testes.

**Bloqueado:**
- Exercício real de expurgo em banco isolado (não há rotina, e ativar dados de teste é mudança de configuração).
- Exclusão de arquivo privado (capacidade inexistente na plataforma).
- Janela de backups no plano Builder.
- Isolamento com duas contas comuns no publicado.

## 7. Lacunas que impedem cumprir os prazos propostos, mesmo se aprovados

1. **Inatividade da conta**: só existe `atualizado_em` do perfil; não há registro de último acesso ao app. Aprovar 12 meses sem definir o critério de inatividade deixa a regra sem base.
2. **Documentos**: não existe o momento da confirmação da extração pelo titular. Os 7 dias propostos não têm âncora.
3. **Candidaturas**: `Application` não tem data de encerramento nem estado terminal. Os 12 meses propostos não são calculáveis.
4. **Arquivos**: nenhum prazo de documento ou currículo é cumprível enquanto não houver exclusão do arquivo privado.
5. **Protocolos LGPD**: estrutura inexistente.
6. **Política**: publicada apenas para usuários logados; e o texto ainda descreve controlador e canal como pendentes.

## 8. Decisões que dependem da equipe

1. Aprovar, ajustar ou manter pendentes os prazos da matriz, com responsável e justificativa registrados (nada foi aprovado em nome da equipe).
2. Definir o critério de inatividade (última edição de perfil, último acesso, ou ambos) e autorizar o campo de último acesso.
3. Encaminhar as bases legais ao jurídico; decidir sobre documentos potencialmente sensíveis (art. 11) e sobre o serviço de extração.
4. Decidir se a política passa a ser pública sem login antes da coleta de dados reais.
5. Autorizar a implementação da rotina de expurgo descrita no plano (nada foi implementado).
6. Definir o encarregado de dados e o prazo de resposta a titulares no canal LGPD.

## 9. Dependências do fornecedor

- Exclusão definitiva de arquivos privados e comprovação.
- Janela de retenção de backups no plano Builder e se os arquivos privados entram nesses backups.
- Eliminação definitiva antecipada de registros em "Recently deleted".
- Locais de processamento e suboperadores de IA.
- Rascunho de pedido pronto em `PLANO_TESTES_RETENCAO_EXCLUSAO.md`, **não enviado**.

## 10. Próximo passo concreto para concluir o cartão 15

Ordem mínima, cada passo com evidência própria:

1. Equipe aprova ou ajusta os prazos e o critério de inatividade (matriz, seção 5) — sem isso, implementar é chutar.
2. Aprovar a criação dos três campos de âncora (`Application.encerrada_em`, `CandidateDocument.extracao_confirmada_em`, `CandidateProfile.ultimo_acesso_em`).
3. Aprovar e implementar `runRetentionSweep` em modo relatório, com workflow mensal e execução destrutiva só após aprovação manual.
4. Ativar dados de teste com autorização, replicar os testes RET-SIM em banco isolado e comprovar expurgo real de registros.
5. Enviar o pedido ao suporte sobre arquivos privados e backups; sem resposta, registrar o resíduo formalmente na política e não prometer exclusão total.
6. Atualizar o texto da política com os dados de controlador e canal e torná-lo acessível sem login.
7. Só então executar o ensaio no publicado com as duas contas fictícias (roteiro na seção 7 do plano de testes).

**Nenhuma conformidade com a LGPD é declarada. Nenhuma exclusão integral é declarada.**