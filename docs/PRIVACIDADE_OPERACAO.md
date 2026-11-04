# Privacidade — operação e pendências

Revisão: 04/11/2026. Documento operacional em revisão; não é declaração de conformidade nem aprovação dos prazos de retenção.

## Responsáveis informados

Controlador informado: equipe de desenvolvimento do Anexa.AI, em operação inicial universitária. Integrantes responsáveis: João Fernandes de Araujo Neto, Jayne Douranth Moreira, Adriel Miguel Duarte de Melo e Joel da Silva de Lima. A universidade não foi indicada como controladora. Esta indicação não equivale à designação formal de encarregado.

Canal público: **anexa.ia.opercao@gmail.com** (grafia fornecida pelo responsável). Público inicial: maiores de 18 anos. O aviso de idade no cadastro não verifica idade. Não acrescentar coleta de identidade ou data de nascimento sem avaliar necessidade.

## Inventário inicial de tratamento

Inventário baseado nas entidades do repositório; a existência de uma entidade ou integração não comprova uso em produção. Prazos concretos por categoria, bases legais e operadores efetivos ainda precisam ser aprovados e registrados pela equipe.

| Registros/fluxo | Dados e finalidade | Acesso/compartilhamento a verificar | Exclusão e retenção |
| --- | --- | --- | --- |
| User | Identificação, e-mail e autenticação para conta | Base44; equipe somente quando necessário à operação | Procedimento de conta depende da plataforma; não copiar credenciais |
| CandidateProfile, JobPreference | Formação, experiências, competências, contato e preferências para serviço de carreira | Titular; backend autorizado; dados estruturados usados na análise por IA | Localizar por proprietário; prazo pendente |
| CandidateDocument | Metadados, originais e extrações de documentos opcionais | Storage privado e serviço de extração; não enviar originais a recrutadores | Excluir registro não comprova exclusão do arquivo; mecanismo de exclusão privada pendente |
| JobMatch, ResumeVersion | Compatibilidade, explicações e currículos gerados | Titular e processamento de IA; currículo ao destinatário aprovado | Incluir derivados e cache no escopo; prazo pendente |
| Application, ReceivedApplication | Candidaturas, destinatário, estado e recibos, inclusive demonstração | Apenas destinatário aprovado e operadores do envio efetivamente ativados | Considerar cópias no destinatário; não prometer apagamento externo automático |
| Notification, UserIntegration | Alertas, preferências e vínculos de integração | Fornecedores de WhatsApp/e-mail somente quando ativados e autorizados | Revogar integração e cancelar tarefas pendentes; não registrar tokens no protocolo |
| AuditLog, AutomationRun | Rastreabilidade mínima de ações e execuções | Operação autorizada; evitar conteúdo documental e segredos | Justificar retenção excepcional; não presumir obrigação legal genérica |
| Document, Resume, StudentProfile (legadas) | Documentos, currículos e perfil de fluxos anteriores | Confirmar uso, propriedade e isolamento entre contas | Incluir na busca; não considerar ausência nas telas como ausência de dados |
| Job, Opportunity, AppSetting | Vagas e configuração | Verificar se há contatos pessoais ou valores sensíveis | Remover dados pessoais desnecessários; não apagar configuração global por solicitação individual |

Hipóteses para avaliação, sem aprovação automática: execução de serviço solicitado; consentimento específico para alertas opcionais; necessidade e balanceamento para segurança. A autorização OAuth e a aprovação de uma candidatura não substituem a definição da base legal de cada tratamento. Não aplicar consentimento genérico a todas as operações.

## Atendimento aos direitos

1. Receber no canal público, registrar protocolo, data, tipo de direito e responsável interno pelo atendimento. A equipe deve escolher quem acompanha diariamente a caixa; os quatro nomes não comprovam essa escala.
2. Confirmar recebimento e verificar identidade de forma proporcional, preferindo a sessão autenticada ou o e-mail já associado à conta. Nunca pedir senha, token, CTPS ou cópia integral de documento por e-mail.
3. Delimitar o pedido: confirmação, acesso, correção, informação sobre compartilhamento, exclusão, oposição ou revogação aplicável. Informar os prazos legais pertinentes ao caso; não há prazo operacional único homologado neste projeto.
4. Identificar o proprietário por ID estável e levantar registros, derivados, integrações, arquivos e entidades legadas. Não usar correspondência parcial de telefone nem executar limpeza global. Não expor dados de outra pessoa numa exportação.
5. Executar somente ações autorizadas e documentar IDs e resultado, sem copiar conteúdo sensível ao protocolo. Para exclusão, verificar registros e arquivos separadamente. Interromper tarefas futuras e avaliar revogação das integrações.
6. Se não houver exclusão de arquivo privado disponível, abrir solicitação ao suporte Base44 pelo operador autorizado e manter o item pendente. Não apagar a conta inteira do projeto para atender um único titular. Ausência de metadado ou URL expirada não comprova apagamento físico.
7. Registrar separadamente retenções justificadas, backups, destinatários externos e limitações do fornecedor. Explicar ao titular o que foi realizado, o que permanece e por qual motivo. Não declarar exclusão integral sem evidência.
8. Encerrar com evidências mínimas e acesso restrito. Aplicar prazo de retenção do próprio protocolo após decisão da equipe; não manter indefinidamente por padrão.

Modelo de recebimento: “Recebemos sua solicitação sobre dados pessoais do Anexa.AI, protocolo [ID]. Para identificar a conta, informe somente o e-mail cadastrado e o tipo de solicitação. Não envie senha, tokens ou documentos originais. Após a verificação necessária, informaremos o escopo, os prazos aplicáveis e eventuais limitações.”

## Fornecedor e diligência pendente

Fontes oficiais consultadas em 04/11/2026:

- Base44/Wix — termos: https://base44.com/about-us/legal/terms-of-service
- Política: https://base44.com/about-us/legal/privacy-policy
- Acordo de tratamento: https://base44.com/about-us/legal/dpa
- Lista de suboperadores: https://base44.com/about-us/legal/dpa/exhibitc

O DPA diferencia cliente controlador e fornecedor operador no escopo do tratamento contratado. A lista geral de suboperadores não comprova quais processam dados deste aplicativo. A previsão de exclusão da conta e de backups em intervalos não especificados não comprova exclusão granular de um arquivo de um titular. Não há região de processamento deste app confirmada neste levantamento.

Solicitação preparada para o suporte (não enviada): “Para o app 6ace8fec4df8507617f77218, precisamos confirmar: como excluir definitivamente arquivos privados de um único usuário; prazos de remoção de arquivos e backups; suboperadores e regiões efetivamente usados por storage, autenticação e IA; condições do DPA aplicáveis à conta e mecanismos de transferência internacional pertinentes à operação brasileira. Favor distinguir exclusão de registro, de arquivo e de conta do projeto.”

## Evidências necessárias para encerrar o item 15

- Responsáveis e canal: preenchidos no texto. Recebimento, resposta e retorno ao remetente confirmados pelo responsável com capturas, protocolo TESTE-LGPD-001. A escala de atendimento e a integração automatizada com Gmail/Outlook não são comprovadas por esse ensaio.
- Política pública antes do cadastro: implementada; teste local de acesso sem autenticação. Não confundir com teste de navegação no app publicado.
- Aprovação e implementação dos prazos de retenção por categoria; bases legais e compartilhamentos efetivos registrados. Ainda pendentes.
- Ensaio de pedido com conta fictícia autorizada: acesso, correção e exclusão, inclusive arquivo privado e derivados. Não realizado nesta alteração.
- Isolamento entre duas contas comuns e entidades legadas no ambiente publicado: continua pendente; não usar credenciais de usuários reais.
- Scan oficial atualizado e correlação com a versão publicada; não reutilizar o resultado anterior como evidência de nova execução.

**Conclusão:** a identificação e o canal deixaram de estar em branco. O cartão 15 permanece pendente de homologação integral. Não foram enviados e-mails, feitos uploads, chamadas de IA ou exclusões de dados nesta alteração.


## Documentos de revisão

- [Política proposta e ficha de validação](POLITICA_PRIVACIDADE_PARA_VALIDACAO.md).
- [Roteiro de testes de retenção e exclusão](ROTEIRO_TESTE_RETENCAO_EXCLUSAO.md).

As propostas não alteram automaticamente a política publicada nem implementam limpeza no sistema.
