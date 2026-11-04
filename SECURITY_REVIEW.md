# Anexa.AI — tratamento dos cartões atrasados

Atualização: a inspeção posterior pela CLI/API do Base44 está em `HOMOLOGACAO_BASE44.md`. Ela confirma as divergências remotas e substitui a observação anterior sobre indisponibilidade de consulta à plataforma. O scan novo continua não executado porque usa IA.

Revisão de código: 04/11/2026. Base Git `b53638f`; alterações locais na branch `review/audit-safety-rules`, ainda sem integração. As regras abaixo não foram aplicadas ao Base44. A exportação do Trello é uma fotografia do quadro, não acesso ao vivo.

## 02B — Permissões das entidades

- `Document`, `Resume` e `StudentProfile` já declaravam leitura e escrita por `created_by_id`; preservadas.
- `Opportunity` tinha `read: {}`. A leitura proposta agora usa as mesmas condições de usuário/admin de `Job`; escrita permanece administrativa. Nenhum consumidor direto dessa entidade legada foi encontrado em `src` ou nas funções nesta revisão.
- Testes verificam as declarações dessas quatro entidades e de `AuditLog`, sem simular o motor de autorização do Base44.
- Os testes compartilhados exercitam rejeição de propriedade forjada e conflito de propriedade legada. Isso não comprova RLS publicado nem isolamento de arquivos.

**Não encerrar o cartão:** falta confirmar as regras no ambiente publicado e executar isolamento entre duas contas com registros fictícios.

## 06 — Compatibilidade

- Mantido o teto de 40 pontos técnicos proposto na etapa anterior; formação, experiências e preferências seguem 25/20/15.
- Removido `remote`/`remoto` da lista de regiões globais. Antes, `Remote - US only` passava como global. Agora regiões são reconhecidas por palavras completas; ausência de localização continua sendo informação insuficiente para provar elegibilidade, não uma garantia.
- A assinatura do cache passou da versão 1 para 2. Resultados antigos não são reutilizados após as alterações do cálculo; a nova análise só ocorre quando solicitada pelo fluxo normal. Não foi feita migração nem chamada de IA.
- Seis testes sintéticos cobrem pesos, teto técnico, níveis, bloqueios geográficos/eliminatórios, requisitos ausentes e invalidação do cache anterior.

**Não encerrar o cartão:** sem chamadas reais de IA, não se pode comprovar a qualidade das evidências nem explicar o score zero de registros reais. É necessário inspecionar uma resposta real anterior, com dados anonimizados, antes de atribuir a causa.

## 15 — Segurança e LGPD

- Revisado o texto de privacidade para identificar o produto como Anexa.AI e diferenciar intenção de controle de proteção homologada.
- Removidas garantias sem evidência: isolamento já comprovado, exclusão em 30 dias e impossibilidade absoluta de acesso operacional. Explicitados o processamento por Base44/IA e o fluxo distinto de extração do documento original.
- Registradas as pendências de identificação do controlador, canal de direitos, retenção, exclusão de arquivos/backups e fornecedores/local de processamento. Não foi declarada conformidade jurídica.
- Data de revisão do texto fixada em 04/11/2026, em vez de mudar automaticamente a cada visita.
- Varredura limitada de 209 arquivos em `src` e `base44`: nenhum padrão de chave privada, token GitHub, chave Google ou identificador AWS encontrado. Não equivale a scan completo de segredos, do histórico Git, do bundle ou da infraestrutura.
- Auditoria npm inicial: 21 pacotes afetados (1 crítico, 6 altos, 12 moderados, 2 baixos). Isso conta pacotes, incluindo transitivos; não demonstra exploração no fluxo do aplicativo.
- Atualizados pelo lockfile, sem alterar os intervalos de `package.json`: DOMPurify 3.4.17, Vite 8.3.5 e dependências transitivas compatíveis. Foi usado `--before=2026-10-28T00:00:00Z` para respeitar a janela de sete dias do projeto; não foi usado `audit fix --force`.
- Auditoria final: **13 pacotes afetados, zero críticos, 1 alto (Zod), 10 moderados e 2 baixos**. O comando continua retornando falha, corretamente. A correção indicada para Zod exige migrar da versão principal 3 para 4; React Router e a cadeia de ESLint também exigem revisão de compatibilidade. As sugestões automáticas incluem downgrades de plugins e não devem ser aceitas sem análise. Não houve migração principal nesta revisão.
- Não há ferramenta de scan de segurança da plataforma disponível nesta sessão. Nenhum teste de intrusão ou operação com dados pessoais foi realizado.

**Não encerrar o cartão:** permanecem o scan da plataforma, alertas de dependências não resolvidos, revisão jurídica/operacional e homologação com duas contas.

## Roteiro de homologação pendente

Executar em ambiente de teste com autorização específica e dados fictícios, depois de revisar e integrar as mudanças pelo fluxo GitHub–Base44. Não executar `base44 deploy`.

1. Registrar a versão efetivamente publicada e as regras ativas, incluindo entidades legadas, pessoais e `AuditLog`.
2. Criar duas contas de teste A/B. Como A, criar registros fictícios pelos fluxos suportados. Como B, tentar leitura por ID, listagem, alteração e exclusão dos registros de A. Esperado: acesso negado ou nenhum registro, sem mudança persistida. Conferir em A.
3. Sem login, tentar listar/ler `Opportunity`. Esperado: acesso negado. Com usuário comum, leitura permitida; criação/alteração/exclusão negadas. Admin mantém gestão.
4. Testar URL privada e URL assinada com B e após expiração conforme o contrato do storage; não registrar URLs assinadas ou tokens no relatório. Verificar as condições reais de compartilhamento dessas URLs.
5. Como usuário comum, verificar que `AuditLog` não pode ser lido ou alterado diretamente; validar evento criado pela função autorizada com dados mínimos.
6. Registrar só conta de teste, ação, resultado esperado/observado, horário e evidência sem dados sensíveis. Descrever falhas sem marcar aprovação parcial como conclusão total.

Os testes A/B e storage podem exigir criação de registros/arquivos fictícios. Não foram executados nesta sessão, que mantém a restrição a uploads e operações reais de plataforma.

## Critério de conclusão

Validação local: 23 testes passaram (6 de compatibilidade/cache, 3 de declarações de RLS e 14 de regras compartilhadas), além de build, lint, typecheck e `git diff --check`. Build mantém aviso de bundle grande. Nenhuma dessas verificações comprova funcionamento integrado ou elimina os alertas restantes de dependências.

Os três cartões permanecem em andamento, com correções locais propostas e bloqueios de homologação explícitos. Nenhuma lista, data ou marcação do Trello foi alterada. Não houve IA real, upload, envio, deploy ou publicação.
