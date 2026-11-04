# Anexa.AI — comprovação de retenção e exclusão

Plano de teste, não relatório de execução. Versão 0.1 — 04/11/2026. Nenhum teste deste roteiro foi executado por sua elaboração.

## O que comprova funcionamento

É necessário demonstrar que o procedimento real seleciona apenas os dados vencidos, preserva os não vencidos, realiza a exclusão completa no escopo declarado e registra resultados verificáveis. Uma rotina manual é aceitável como procedimento manual testado; não deve ser descrita como automação. Não existe comprovação de expiração automática se a rotina/agendamento ainda não foi implementada.

## Preparação e escopo

- Registrar commit, ambiente, versão da política, horário UTC, executor e aprovação do ensaio. Preferir ambiente isolado com configuração equivalente à publicação; registrar as diferenças e confirmar posteriormente o que for necessário no publicado.
- Usar exclusivamente duas contas comuns fictícias autorizadas, A e B, sem converter usuários reais em teste. Usar administração somente para preparação e verificação independente, nunca como evidência de acesso de usuário comum.
- Gerar ID de lote HOMOLOG-RETENCAO-[data]-[identificador]. Criar somente registros sintéticos do lote, mapeando IDs de proprietário, entidades, arquivos e derivados; não fazer limpeza global.
- Não usar IA, WhatsApp, Gmail/Outlook ou envio a recrutador neste ensaio. Se o fluxo exigir esses serviços para criar derivados, preparar fixtures isoladas e registrar a limitação; testar revogação externa em ensaio separado autorizado.
- Arquivo privado sintético só deve ser criado em ambiente com exclusão confirmada ou com procedimento de suporte autorizado. Se não houver mecanismo, marcar essa etapa BLOQUEADA e não gerar novo resíduo.
- Não alterar relógio de produção, prazos globais ou datas de usuários reais. Para simular vencimento, usar relógio injetável em ambiente de teste ou timestamps de retenção editáveis somente nas fixtures. Comparar com o código real usado pelo procedimento.
- Definir antes do ensaio o instante de vencimento, a regra de igualdade no limite e o intervalo máximo de limpeza. Sem isso não há critério mensurável.

## Matriz executável

| ID | Ação e preparação | Resultado esperado | Evidência mínima |
| --- | --- | --- | --- |
| R01 | Criar três fixtures da mesma categoria: uma vencida, uma exatamente no limite e outra ainda válida | Seleção corresponde à regra aprovada; válido fica fora; limite segue convenção documentada | IDs, timestamps, relógio usado e prévia de seleção |
| R02 | Executar a rotina real de limpeza ou procedimento manual aprovado no lote | Vencido removido no prazo; válido permanece; nenhum dado fora do lote afetado | Resultado por ID e leitura independente após execução |
| R03 | Simular conta inativa e aviso antes da exclusão em ambiente isolado, com entrega externa substituída | Aviso é programado no prazo; exclusão não ocorre durante carência; novo acesso cancela ou recalcula conforme política | Estados e datas de seleção, aviso, carência e reativação; entrega real fica para ensaio autorizado separado |
| R04 | Repetir limpeza e simular falha temporária no ambiente isolado | Repetição segura; falha registrada; pendência permanece visível; nova tentativa completa sem apagar válidos | Execuções, erro sanitizado e resultado da repetição |
| E01 | Abrir pedido fictício TESTE-EXCLUSAO-[ID] para A e verificar identidade | Pedido vinculado somente a A; sem exigir senha/documento original | Protocolo e ID de proprietário, sem dados sensíveis |
| E02 | Antes da exclusão, verificar isolamento A↔B com sessões comuns | A não lê/exclui B; B não lê/exclui A; dados próprios existentes acessíveis | Respostas por sessão e por registro existente, incluindo entidades legadas |
| E03 | Executar procedimento de exclusão de A no lote, incluindo perfil, preferências, documentos, extrações, currículos, análises/cache, candidaturas e notificações aplicáveis | Registros e derivados do escopo removidos; B preservado; exceções justificadas e separadas | Inventário antes/depois por ID; consultas privilegiadas independentes, não apenas tela vazia |
| E04 | Excluir arquivo privado sintético com mecanismo suportado | Arquivo não pode ser recuperado após exclusão; confirmar destino de cópias e cache do fornecedor | Operação de exclusão, teste com URL válida anterior e tentativa de nova URL assinada; prova do fornecedor quando necessária |
| E05 | Desconectar integração fictícia e suspender tarefas do lote, sem envios | Nenhum novo uso da credencial nem reenvio após cancelamento; revogação externa identificada como pendente se não testada | Estados antes/depois e execução bloqueada; nunca guardar token na evidência |
| E06 | Verificar conta, sessões, backups e retenções excepcionais separadamente | Escopo do encerramento de conta explícito; sessões revogadas quando aplicável; prazo de backups confirmado ou pendente | Resultado de autenticação após encerramento, resposta contratual/técnica e justificativas de retenção |
| E07 | Responder ao pedido fictício e conferir B novamente | Resposta corresponde ao que foi feito; não afirma exclusão integral se arquivo/backup estiver pendente | Protocolo encerrado ou parcialmente atendido; B ainda íntegro |

## Como interpretar a exclusão

- Registro ausente pela UI não basta: consultar os IDs conhecidos por canal independente autorizado, incluindo derivados e entidades legadas. Distinguir 404 real de 401/403 e de filtro que oculta o registro.
- URL expirada com 401 ou acesso direto com 403 comprova controle de acesso, não destruição do arquivo. Uma URL ainda válida retornar bytes depois da suposta exclusão indica que a indisponibilidade imediata não foi alcançada; investigar cache e o compromisso aprovado.
- Falha de acesso pelo usuário não comprova eliminação física. Para arquivo/storage e backups, combinar resultado técnico com confirmação do fornecedor sobre exclusão e prazo de expurgo. Registrar limitações, incluindo impossibilidade de verificar fisicamente os discos do operador.
- Retenção excepcional precisa de categoria, finalidade, fundamento, acesso restrito e prazo definidos. Não inventar registro de auditoria de ações antigas nem apagar trilhas indiscriminadamente.
- Não reimportar dados excluídos ao restaurar backup: o procedimento de restauração deve reaplicar exclusões ainda pertinentes antes de devolver dados ao uso. Se não houver controle verificável, manter esse critério pendente.

## Modelo de evidência por teste

ID: ______  Resultado: APROVADO / REPROVADO / BLOQUEADO / NÃO EXECUTADO
Commit: ______  Ambiente: ______  Política: ______
Início/fim UTC: ______  Executor: ______
Lote e IDs sintéticos: ______
Pré-condições e estado anterior: ______
Ação executada e mecanismo real utilizado: ______
Resultado observado e leitura independente: ______
Arquivo de evidência sanitizado: ______
Limitação e ação corretiva: ______

Guardar apenas identificadores técnicos e capturas necessárias. Não anexar tokens, URLs assinadas ativas, conteúdo privado ou mensagens pessoais ao Trello.

## Critério para encerrar

Aprovar por categoria somente quando a regra estiver aprovada, aplicada pelo mecanismo real e testada com dados vencidos e válidos, sem atingir B. Encerrar exclusão integral somente após cobrir registros, derivados, arquivos, credenciais/tarefas aplicáveis e condições de backups. Etapa bloqueada não é aprovada. Testes unitários de seleção e idempotência ajudam, mas não substituem evidência do storage e do procedimento publicado.

## Solicitação ao suporte Base44 — texto pronto, não enviado

“Para o app 6ace8fec4df8507617f77218, precisamos validar exclusão granular de arquivos privados de um único titular, sem excluir o projeto. Qual mecanismo suportado remove o arquivo original e suas cópias? Qual o comportamento de URLs assinadas já emitidas e cache? Quais os prazos de expurgo em storage e backups e o tratamento após restauração? Há comprovante ou protocolo de exclusão? Favor distinguir remoção do registro, remoção do arquivo e exclusão da conta.”
