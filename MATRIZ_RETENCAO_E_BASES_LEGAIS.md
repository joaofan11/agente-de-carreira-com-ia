# Matriz de retenção e bases legais — minuta para validação

> **MINUTA NÃO APROVADA.** Propostas para avaliação da equipe e revisão jurídica. Nenhum prazo abaixo está implementado nem homologado. Base inspecionada: commit `8116799` (editor = main do GitHub). Contagens de registros lidas em 2026-11-04T18:56Z, apenas agregadas, sem conteúdo pessoal.

## Como ler esta matriz

- **Base legal proposta** é hipótese de trabalho para o jurídico — não é conclusão. Não usei consentimento genérico, não tratei OAuth como base legal e não apliquei o art. 7º a dados potencialmente sensíveis.
- **Âncora técnica** é o campo que permitiria calcular o prazo. Onde está "sem âncora", a regra **não é calculável** hoje, por mais que se aprove o prazo.
- **Status** de aprovação começa todo em PENDENTE; a equipe preenche APROVADO / AJUSTAR / PENDENTE com responsável, justificativa e evidência.

## 1. Dados pessoais e derivados

| ID | Dado | Onde vive | Volume atual | Finalidade | Base legal proposta (a validar) | Prazo proposto | Âncora técnica | Calculável hoje? | Status |
|---|---|---|---|---|---|---|---|---|---|
| RET-01 | Identificação e perfil acadêmico/profissional | `CandidateProfile` | 9 | Prestação do serviço | Art. 7º, V (execução de contrato) — avaliar também legítimo interesse para manutenção da conta | 12 meses de inatividade + aviso + 30 dias de carência | `atualizado_em` (última gravação de perfil). Não há registro de último acesso na entidade nem no usuário disponível ao app | Parcial: mede atividade de edição, não acesso | PENDENTE |
| RET-02 | Preferências de vagas | `JobPreference` | 6 | Prestação do serviço | Idem RET-01 | Idem RET-01 | Sem campo de data próprio; herda a atividade do perfil | Parcial | PENDENTE |
| RET-03 | Documento original em PDF privado | `CandidateDocument.referencia_arquivo_privado` (arquivo em storage privado) | 1 de 8 registros com arquivo | Extração assistida por IA, opcional | Art. 7º, I (consentimento específico e destacado), por ser opcional e envolver envio a serviço de IA. **Se o documento contiver dado sensível → art. 11** | Até 7 dias após a confirmação da extração; 30 dias do upload quando não houver confirmação | Não existe campo de confirmação pelo titular; `status_extracao` registra o estado, não a data da confirmação | Não | PENDENTE |
| RET-04 | Dados extraídos do documento | `CandidateDocument.dados_extraidos` | 8 registros | Revisão e incorporação ao perfil | Vinculada a RET-03 | Junto com RET-03, salvo o que o titular mantiver explicitamente no perfil | Estrutura presente | Sim (registro) / Não (arquivo) | PENDENTE |
| RET-05 | Análise de compatibilidade (inclui cache) | `JobMatch` | 11 | Prestação do serviço | Art. 7º, V | Enquanto necessário ao histórico da conta; exclusão a pedido; acompanha a exclusão da conta | `data_analise`, `cache_fingerprint` | Sim | PENDENTE |
| RET-06 | Currículo gerado (conteúdo + PDF privado) | `ResumeVersion`, arquivo privado | 16 | Prestação do serviço | Art. 7º, V | Enquanto necessário ao histórico; exclusão a pedido; **bloqueada** enquanto vinculada a candidatura | `criado_em`; regra de bloqueio já existente em `saveResumeVersion` | Sim (registro) / Não (arquivo) | PENDENTE |
| RET-07 | Candidatura (status, método, comprovante) | `Application` | 11 | Execução do serviço e comprovação de envio | Art. 7º, V para a gestão; consentimento específico por envio ao recrutador | Até 12 meses após encerramento | **Sem âncora**: `Application` não tem data de encerramento; `status` não inclui estado terminal de encerramento | Não | PENDENTE |
| RET-08 | Recibo de candidatura demonstrativa | `ReceivedApplication` | 2 | Comprovação técnica do fluxo | Art. 7º, II ou VI (registro/defesa) a validar | Junto com a candidatura correspondente | `received_at` | Parcial (sem vínculo de encerramento) | PENDENTE |
| RET-09 | Notificações e alertas | `Notification` | 5 | Alertas e aprovações (opcional) | Art. 7º, I (consentimento revogável) | Manter enquanto o consentimento existir; expurgo junto da conta | `criado_em`; consentimento em `UserIntegration.notificacoes_ativas` | Sim | PENDENTE |
| RET-10 | Vínculo de integração e preferência de canal | `UserIntegration` | 6 | Conectar Gmail/Outlook/WhatsApp | Art. 7º, I para o canal opcional; art. 7º, V para o necessário à candidatura | Impedir novos usos imediatamente após desconexão; remoção da credencial a confirmar | `status_conexao`, `atualizado_em`. O token fica em segredo da plataforma, não na entidade | Parcial: o app não apaga o segredo | PENDENTE |
| RET-11 | Trilha de auditoria | `AuditLog` | 5 | Segurança, prevenção a fraude e defesa | Art. 7º, II (obrigação legal/regulatória) ou VI (exercício regular de direitos) — **a definir** | 90 dias, condicionado à necessidade e a obrigações aplicáveis | `data_evento` | Sim | PENDENTE |
| RET-12 | Execuções de automação | `AutomationRun` | 47 | Operação e diagnóstico | Art. 7º, IX (legítimo interesse) a validar | 90 dias (mesma proposta dos logs) | `inicio_em` | Sim | PENDENTE |
| RET-13 | Entidades legadas | `Document` (3), `Resume` (3), `StudentProfile` (3) | 9 | Nenhuma finalidade ativa: não há uso dessas entidades no código atual | A definir após verificar se há conteúdo pessoal real | Eliminar após validação de conteúdo; nenhum arquivo privado referenciado hoje (`file_uri` vazio nos 3 `Document`) | `created_date` (nativo) | Sim (registros) | PENDENTE |
| RET-14 | Protocolos de atendimento LGPD | Estrutura inexistente | 0 | Comprovar atendimento ao titular | Art. 7º, II / VI | 12 meses após encerramento | Nenhuma — precisa ser criada | Não | PENDENTE |
| RET-15 | Cópias de segurança | Fora do controle do app | — | Continuidade | — | Pendente de confirmação do fornecedor | — | Não | PENDENTE |
| RET-16 | Dados agregados de vagas | `Job` | 84 | Conteúdo do serviço | Não contém dado pessoal de titular | Enquanto a vaga estiver ativa | `data_publicacao`, `status` | Sim | PENDENTE |

## 2. Dados que exigem atenção especial

| Situação | Por que importa | O que a equipe precisa decidir |
|---|---|---|
| PDF de CTPS, certificado, RG, CPF, diploma, histórico (RET-03/RET-04) | Podem conter dado sensível (saúde, biometria) e são enviados a um serviço de IA | Vedar categorias sensíveis por contrato de uso, validar o serviço de extração e definir base do art. 11 se houver tratamento sensível. Não presumir art. 7º |
| Comprovante de residência | Pode revelar endereço completo | Confirmar necessidade real; hoje o tipo existe na lista de documentos |
| Telefone para WhatsApp | Canal opcional com consentimento | Garantir que a revogação impeça novos envios de fato (hoje inativo por falta de credenciais) |
| Trilha de auditoria | Pode conter identificadores de titulares | Definir se 90 dias é suficiente e se há retenção mínima por obrigação legal |

## 3. Prazos propostos — resumo para decisão

| Categoria | Proposta | Precisa de decisão da equipe | Precisa de decisão do jurídico | Depende do fornecedor |
|---|---|---|---|---|
| Conta, perfil e preferências | 12 meses de inatividade + aviso + 30 dias | Sim (definir critério de inatividade) | Sim | Não |
| Documentos originais | 7 dias após confirmação / 30 dias sem confirmação | Sim (criar confirmação) | Sim (base legal) | **Sim** (exclusão do arquivo) |
| Análises e currículos | Enquanto necessário + exclusão a pedido | Sim | Sim | **Sim** (PDF privado) |
| Candidaturas | 12 meses após encerramento | Sim (criar data de encerramento) | Sim | Não |
| Alertas | Parar novos agendamentos na revogação | Sim | Não | Não |
| Credenciais de integração | Bloquear uso e remover | Sim | Não | **Sim** (remoção de segredo) |
| Logs de segurança | 90 dias | Sim | Sim | Não |
| Protocolos LGPD | 12 meses após encerramento | Sim (criar estrutura) | Sim | Não |
| Backups | Pendente | Não | Sim | **Sim** |

## 4. O que a LGPD não exige (para evitar decisões por suposição)

- A LGPD não fixa os prazos desta matriz: eles são escolhas de negócio a justificar por finalidade.
- Consentimento não é a base padrão para tudo; usado onde o tratamento é opcional.
- Não há exigência de excluir imediatamente cópias de segurança; exige-se procedimento e informação clara ao titular.
- Retenção de registros de segurança pode se apoiar em obrigação legal ou exercício regular de direitos, mas isso precisa ser avaliado caso a caso.

## 5. Registro de decisões

| ID | Decisão (APROVADO / AJUSTAR / PENDENTE) | Responsável | Justificativa | Evidência | Data |
|---|---|---|---|---|---|
| RET-01 a RET-16 | PENDENTE | Equipe Anexa.AI | Nenhum prazo aprovado até o momento | Esta matriz; `RELATORIO_RETENCAO_EXCLUSAO_2026-11-04.md` | — |

*Nenhuma aprovação foi registrada em nome da equipe.*