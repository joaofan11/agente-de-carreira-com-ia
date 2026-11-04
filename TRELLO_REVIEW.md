# Anexa.AI — revisão da exportação do Trello

Atualização: o tratamento posterior dos três cartões atrasados está em `SECURITY_REVIEW.md`. Ele inclui a restrição proposta para `Opportunity`, revisão de privacidade, filtro geográfico, invalidação de cache e atualizações de dependências. As observações abaixo retratam a inspeção inicial.

Referência: 04/11/2026, America/Manaus. Fonte: exportação enviada pelo usuário; não é consulta ao quadro ao vivo. Datas do campo `due` têm precedência sobre datas antigas no texto dos cartões. Nenhum cartão foi alterado.

## Prioridades

| Prioridade | Cartão | Prazo em Manaus | Situação encontrada |
| --- | --- | --- | --- |
| 1 | [02B — Permissões](https://trello.com/c/pPLs5GrI) | 02/11, 18h | Vencido. Document, Resume e StudentProfile já restringem operações por criador no código; Opportunity ainda tem `read: {}`. Não foi comprovado o estado publicado nem o isolamento com duas contas. |
| 1 | [15 — Segurança/LGPD](https://trello.com/c/Mx2vvRjO) | 03/11, 18h | Vencido. Guardas administrativas e auditoria existem; scan, revisão de privacidade e isolamento real pendentes. |
| 2 | [06 — Compatibilidade](https://trello.com/c/bVVdMAmj) | 03/11, 18h | Vencido. Corrigido nesta revisão o teto de 40 pontos técnicos. Quatro testes sintéticos passaram; não comprova score de registros reais ou qualidade da IA. |
| 3 | [04 — Documentos](https://trello.com/c/H2aB3b6D) | 04/11, 18h | Vence hoje. Fluxo existe, mas extração e aprovação completas ainda precisam de homologação com arquivo fictício. |
| 3 | [07 — Currículos](https://trello.com/c/obSOtIXC) | 04/11, 18h | Vence hoje. PDF e recuperação sem IA existem; versões antigas e fluxo integrado ainda precisam de homologação. |

## Próximas entregas e bloqueios

- 05/11, 18h: WhatsApp. Depende de configuração e homologação externa; não ativado nesta revisão.
- 06/11, 18h: dashboard, aprovação, Gmail, automação e kit de apresentação. Gmail depende de cliente OAuth Google próprio. Scheduler exige validação da identidade administrativa e da distinção manual/agendado.
- 08/11, 18h: Outlook, recuperação e demonstração. Não considerar demonstração local como integração homologada.
- Inscrição: o campo due corresponde a 09/11, 23h59 em Manaus. Prazos do edital não foram confirmados em fonte oficial nesta revisão.

## Problemas no próprio quadro

- Checklists dos cartões 08, 09 e 10 contêm letras isoladas (por exemplo, D/a/s/h/b), sem critérios de aceite úteis. Devem ser reconstruídos a partir da descrição antes de marcar conclusão.
- A lista “6. Revalidação pós-01/11” está vazia na exportação.
- Checklists desmarcados não provam ausência de implementação: comparar cada item com código e evidências de homologação.
- O cartão 14 ainda cita “coleta → análise → candidatura”; a implementação atual produz recomendações, e candidatura requer currículo aprovado e decisão do usuário. Atualizar o critério sem reintroduzir criação automática sem consentimento.

## Continuação executada no repositório

- Preservadas as alterações locais anteriores na branch `review/audit-safety-rules`.
- Em `matchScorer.ts`, a fração técnica agora é limitada a 1 antes da ponderação. Antes, duas competências compatíveis para um requisito podiam somar 80 pontos técnicos e elevar indevidamente a classificação.
- Adicionados quatro testes: teto técnico, níveis sintéticos, bloqueios eliminatórios/geográficos e requisitos ausentes.
- Os 14 testes anteriores de orçamento, cache, propriedade, aprovação e reenvio também passaram.
- Após a alteração, `npm run build`, `npm run lint`, `npm run typecheck` e `git diff --check` passaram. Build manteve aviso de bundle grande. Os testes de pontuação importam o TypeScript real; o typecheck do frontend não cobre todo o backend.
- Sem mudanças de RLS nesta revisão: confirmar compatibilidade e dados existentes antes de alterar regras, mantendo como bloqueio de homologação.

## Calendário extraído

| Cartão | Lista | Prazo Manaus | Prazo marcado concluído |
| --- | --- | --- | --- |
| [02B • Corrigir permissões e validar segurança das entidades](https://trello.com/c/pPLs5GrI) | 1. Fundação e segurança | 02/11/2026 18:00 | Não |
| [04 • Upload de CTPS, certificados e extração por IA](https://trello.com/c/H2aB3b6D) | 2. Documentos, vagas e IA | 04/11/2026 18:00 | Não |
| [06 • Inteligência artificial para compatibilidade](https://trello.com/c/bVVdMAmj) | 2. Documentos, vagas e IA | 03/11/2026 18:00 | Não |
| [07 • Gerador de currículo dinâmico](https://trello.com/c/obSOtIXC) | 2. Documentos, vagas e IA | 04/11/2026 18:00 | Não |
| [08 • Dashboard e histórico de candidaturas](https://trello.com/c/zvjZeYqk) | 3. Candidaturas e integrações | 06/11/2026 18:00 | Não |
| [09 • Sistema de aprovação de candidaturas](https://trello.com/c/oVbaes3b) | 3. Candidaturas e integrações | 06/11/2026 18:00 | Não |
| [10 • WhatsApp: alertas e recebimento de aprovação](https://trello.com/c/aPNswwwi) | 3. Candidaturas e integrações | 05/11/2026 18:00 | Não |
| [11 • Gmail OAuth e envio de currículo por e-mail](https://trello.com/c/UtAtzexe) | 3. Candidaturas e integrações | 06/11/2026 18:00 | Não |
| [12 • Outlook e Hotmail com Microsoft Graph](https://trello.com/c/gJpGGcZh) | 3. Candidaturas e integrações | 08/11/2026 18:00 | Não |
| [PLANO DE RECUPERAÇÃO • Homologar MVP até 08/11](https://trello.com/c/edhRWkuz) | 4. Automação, testes e homologação | 08/11/2026 18:00 | Não |
| [14 • Automatizar a busca e o processamento de vagas](https://trello.com/c/ekAUVe4v) | 4. Automação, testes e homologação | 06/11/2026 18:00 | Não |
| [15 • Segurança, LGPD e testes completos](https://trello.com/c/Mx2vvRjO) | 4. Automação, testes e homologação | 03/11/2026 18:00 | Não |
| [16 • Demonstração e preparação para o edital](https://trello.com/c/kVv39Scf) | 4. Automação, testes e homologação | 08/11/2026 18:00 | Não |
| [INSCRIÇÃO • Kit de apresentação do Agente de Carreira com IA](https://trello.com/c/YZpnKIWn) | 5. Edital e apresentações | 06/11/2026 18:00 | Não |
| [Inscrição — Desafio Saul Benchimol](https://trello.com/c/sO0INf26) | 5. Edital e apresentações | 09/11/2026 23:59 | Não |
| [Seleção de semifinalistas](https://trello.com/c/OgI73s0T) | 5. Edital e apresentações | 11/11/2026 23:59 | Não |
| [Pitch on-line — semifinalistas](https://trello.com/c/71yEbE9J) | 5. Edital e apresentações | 13/11/2026 23:59 | Não |
| [Divulgação dos finalistas](https://trello.com/c/zlhLS6pr) | 5. Edital e apresentações | 14/11/2026 23:59 | Não |
| [Feira tecnológica UniNorte](https://trello.com/c/PudhjPGI) | 5. Edital e apresentações | 26/11/2026 23:59 | Não |
| [Evento final Saul Benchimol — confirmar data](https://trello.com/c/4d5f3OcO) | 5. Edital e apresentações | 04/12/2026 23:59 | Não |
| [01 • REVALIDAR autenticação e acessos administrativos](https://trello.com/c/sL4PLkSd) | 6. Revalidação pós-01/11 | 08/11/2026 18:00 | Sim |
| [02 • Estrutura inicial de dados (segurança pendente no 02B)](https://trello.com/c/KZHWRywl) | 7. Concluído e validado | 02/11/2026 18:00 | Sim |
| [03 • Cadastro e perfil profissional](https://trello.com/c/b7DWYmQc) | 7. Concluído e validado | 15/10/2026 23:59 | Sim |
| [05 • Preferências e busca automática de vagas](https://trello.com/c/D14VFrga) | 7. Concluído e validado | 17/10/2026 23:59 | Sim |
| [13 • Submissão direta de candidaturas](https://trello.com/c/R0Sr49qS) | 7. Concluído e validado | 27/10/2026 23:59 | Sim |

Sem deploy, publicação, chamadas reais de IA, uploads, envios ou alteração do Trello. As mudanças de código permanecem locais para revisão.
