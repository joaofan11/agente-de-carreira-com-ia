# Política de Privacidade — minuta para validação

> **MINUTA NÃO APROVADA.** Documento preparado para avaliação da equipe e revisão jurídica. Não constitui política publicada, não certifica conformidade com a LGPD e não deve ser divulgado a titulares antes de aprovação registrada na seção 12.
>
> Versão da minuta: 2026-11-04 · Base de código inspecionada: commit `8116799` (editor e main do GitHub). O app publicado em 2026-11-04T13:42:21Z **não** corresponde a esse commit (há alterações não publicadas).

---

## 1. Controlador e canal de atendimento

**Controlador:** equipe de desenvolvimento do Anexa.AI, operação inicial universitária.

Integrantes identificados para fins de atendimento:
- João Fernandes de Araujo Neto
- Jayne Douranth Moreira
- Adriel Miguel Duarte de Melo
- Joel da Silva de Lima

**Canal para exercício de direitos (LGPD):** anexa.ia.opercao@gmail.com

**Situação do canal:** recebimento, resposta e retorno ao remetente foram confirmados manualmente (protocolo TESTE-LGPD-001). Isso **não** comprova integração automatizada com Gmail ou Outlook, nem prazo de resposta monitorado, nem registro sistemático de solicitações. O registro de protocolos (item 9) ainda não existe no sistema.

**Público-alvo:** maiores de 18 anos, estudantes universitários da região amazônica. Não há previsão de tratamento de dados de crianças ou adolescentes; caso isso ocorra, o tratamento deve ser suspenso e avaliado à parte.

**Encarregado (DPO):** não indicado. A LGPD admite que o controlador exerça a função em alguns cenários, mas a decisão precisa ser tomada e documentada pela equipe. Status: PENDENTE.

---

## 2. Finalidades do tratamento

| # | Finalidade | Dados envolvidos | Status |
|---|---|---|---|
| 1 | Criar e manter a conta e o perfil acadêmico/profissional | nome, e-mail, telefone, cidade/estado, instituição, curso, semestre, previsão de conclusão, formações, experiências, projetos, competências, idiomas, ferramentas, resumo, disponibilidade | Em operação |
| 2 | Registrar preferências de vagas | cargos, áreas, níveis, localizações, modalidades, tipo de contrato, disponibilidade, faixa salarial opcional | Em operação |
| 3 | Extrair dados de documentos enviados pelo titular (opcional) | PDF privado (CTPS, certificados e similares) e dados extraídos por IA | Em operação, dependente de revisão pelo titular |
| 4 | Calcular compatibilidade entre perfil e vaga | dados estruturados do perfil e da vaga | Em operação |
| 5 | Gerar currículo adaptado e versões salvas | dados do perfil e da vaga, PDF gerado | Em operação |
| 6 | Preparar, submeter e acompanhar candidaturas | currículo adaptado, dados básicos de contato, status, comprovante | Em operação, sempre com aprovação prévia por candidatura |
| 7 | Enviar alertas e pedidos de aprovação (opcional) | telefone/e-mail e conteúdo do alerta | Inativo por falta de credenciais; consentimento exigido |
| 8 | Automação diária de coleta de vagas e processamento | dados de vagas; sem perfil de titular em coleta | Em operação |
| 9 | Segurança, auditoria e prevenção a fraude | trilha de auditoria e registros de automação | Em operação parcial |
| 10 | Atender solicitações de titulares | dados de contato e histórico do atendimento | Não implementado |

## 3. Dados tratados e origem

- Fornecidos diretamente pelo titular nos formulários da aplicação.
- Gerados pela plataforma: análises de compatibilidade, versões de currículo, candidaturas, notificações, registros de auditoria e de automação.
- Recebidos de terceiros: dados de vagas (empresas e fontes externas). Não há coleta de dados do titular em redes sociais ou bases públicas.

**Não há coleta de dados sensíveis por desenho.** Documentos opcionais podem, no entanto, conter informação sensível (por exemplo, atestado médico dentro de um PDF, ou dados biométricos em documento de identidade). Por isso a política deve vedar o envio desse tipo de conteúdo e prever o descarte imediato se identificado — ver item 5 e a matriz de bases legais.

## 4. Bases legais

As bases legais por finalidade estão propostas, para revisão jurídica, em `MATRIZ_RETENCAO_E_BASES_LEGAIS.md`. Pontos que a minuta **não** resolve e que a equipe precisa decidir:

- Consentimento não é usado como base genérica para todo o tratamento.
- A autorização de OAuth (Gmail, Outlook) autoriza acesso técnico; **não** substitui base legal nem informa o titular sobre a finalidade.
- Dados sensíveis eventualmente presentes em documentos seguem o art. 11, e não o art. 7º, com hipóteses próprias.

## 5. Retenção e eliminação

Os prazos abaixo são **propostas em avaliação**, não regras em vigor. Não há rotina automática de expurgo implementada.

| Categoria | Proposta em avaliação | Situação técnica |
|---|---|---|
| Conta, perfil, preferências | 12 meses de inatividade, aviso ao titular e carência de 30 dias | Sem rotina; a base só registra a última atualização de perfil (`atualizado_em`), não o último acesso |
| Documentos originais | até 7 dias após confirmação da extração; 30 dias do upload quando não houver confirmação | Sem rotina; não existe registro do momento da confirmação, e não há caminho de exclusão do arquivo privado |
| Análises e currículos | enquanto necessários ao histórico da conta; exclusão a pedido | Exclusão de registro existe; exclusão do PDF privado não existe |
| Candidaturas | até 12 meses após encerramento | Sem rotina e sem data de encerramento no registro |
| Alertas opcionais | interromper novos agendamentos após revogação | Consentimento existe; verificação ponta a ponta pendente |
| Credenciais de integração | impedir uso após desconexão e confirmar remoção | Credencial não é gravada na entidade; remoção do segredo não é executável pelo app |
| Registros de segurança | 90 dias (proposta) | Sem rotina |
| Protocolos de atendimento LGPD | 12 meses após encerramento | Estrutura inexistente |
| Cópias de segurança | pendente de confirmação do fornecedor | Fora do controle do app |

**Exclusão de registro não é exclusão de arquivo.** Remover o registro que aponta para um PDF privado não apaga o arquivo armazenado; a documentação da plataforma não oferece forma de apagar arquivos enviados por `UploadPrivateFile`. O pedido de exclusão de titular que envolva documentos, portanto, depende de apoio do fornecedor — registrado como BLOQUEADO em `RELATORIO_RETENCAO_EXCLUSAO_2026-11-04.md`.

## 6. Compartilhamento

| Destinatário | O que é compartilhado | Observação |
|---|---|---|
| Base44 (plataforma de hospedagem, banco e armazenamento) | todos os dados armazenados | Contratos, região de processamento e janela de backup precisam ser confirmados pelo fornecedor |
| Serviços de IA usados pela plataforma | dados estruturados do perfil, descrição da vaga e, no fluxo de extração, o PDF do documento | Locais de processamento não documentados. **Não** habilitar documentos reais antes de confirmar |
| Empresas das vagas aprovadas | currículo adaptado e dados básicos de contato | Envio somente com aprovação prévia por candidatura; documentos originais nunca |
| Serviços de e-mail/WhatsApp | conteúdo do alerta ou da candidatura | Integrações inativas por falta de credenciais |

Nenhuma venda de dados, nenhum uso para publicidade e nenhum perfilamento comportamental fora da compatibilidade com vagas.

## 7. Direitos do titular

O titular pode solicitar confirmação de tratamento, acesso, correção, anonimização, bloqueio, eliminação, portabilidade, informação sobre compartilhamento e revogação de consentimento, pelo canal do item 1.

Hoje, o que já é possível ao titular:

- Revisar e corrigir dados em "Meu Perfil".
- Excluir versões de currículo não vinculadas a candidatura.
- Excluir registros de documentos enviados (o arquivo privado permanece — ver item 5).
- Revogar a autorização de WhatsApp nas configurações.

O que ainda depende de procedimento manual definido: eliminação completa da conta e dos derivados, eliminação de arquivos privados, acesso consolidado a todos os registros e registro de protocolo com prazo de resposta.

## 8. Segurança

Controles descritos como em validação na versão anterior; evidências da homologação de 04/11/2026: acesso autenticado obrigatório nas funções de backend amostradas, negação de escrita anônima nas entidades testadas, arquivos privados acessíveis apenas por URL assinada temporária e expiração efetiva confirmada. Pendências conhecidas: um achado crítico de segredo Twilio não configurado (sem valor exposto), 25 funções de backend chamáveis publicamente com revisão individual pendente, e vinculação de remetente por telefone parcial no webhook de WhatsApp.

Nenhuma certificação de segurança é declarada.

## 9. Registro de solicitações (protocolos)

Proposta: criar um registro mínimo de solicitações de titulares (protocolo, data, tipo, prazo, resultado), retido por 12 meses após o encerramento. Não existe hoje.

## 10. Política publicada e acessibilidade

A política dentro do app está em rascunho e **não é acessível sem login**: a rota `/privacidade` está atrás da autenticação, enquanto a aplicação é pública. Antes de coletar dados reais, a política precisa estar publicamente legível. Não alterei esse comportamento nesta etapa (mudança de UI/produto exige decisão da equipe).

## 11. Alterações desta minuta

- Substituiu as expressões genéricas de controlador e contato pelos dados fornecidos pela equipe.
- Incorporou as propostas de retenção em avaliação, sempre marcadas como proposta.
- Explicitou as diferenças entre exclusão de registro, exclusão de arquivo, expiração de URL e backup.
- Registrou as pendências técnicas que impedem prometer exclusão completa.

## 12. Bloco de aprovação (preencher pela equipe — não registrar aprovação em nome dela)

| Item | Decisão (APROVADO / AJUSTAR / PENDENTE) | Responsável | Justificativa | Evidência |
|---|---|---|---|---|
| Identificação do controlador e integrantes | PENDENTE | Equipe Anexa.AI | Dados fornecidos; falta confirmação formal de responsabilidades | Mensagem da equipe, 04/11/2026 |
| Canal LGPD por e-mail | PENDENTE | Equipe Anexa.AI | Canal existe e foi testado manualmente (TESTE-LGPD-001); falta definir prazo e registro | Protocolo TESTE-LGPD-001 |
| Indicação de encarregado | PENDENTE | Equipe Anexa.AI | Decisão não tomada | — |
| Bases legais por finalidade | PENDENTE | Equipe + jurídico | Propostas na matriz; nenhuma validada | `MATRIZ_RETENCAO_E_BASES_LEGAIS.md` |
| Prazos de retenção | PENDENTE | Equipe + jurídico | Propostas na matriz; nenhuma implementada | `MATRIZ_RETENCAO_E_BASES_LEGAIS.md` |
| Publicação acessível sem login | PENDENTE | Equipe de produto | Rota atrás de autenticação | `src/App.jsx` (commit `8116799`) |
| Retenção de backups | PENDENTE | Fornecedor Base44 | Sem confirmação contratual | Consulta a registrar com o suporte |
| Revisão jurídica integral | PENDENTE | Jurídico | Minuta não revisada | — |