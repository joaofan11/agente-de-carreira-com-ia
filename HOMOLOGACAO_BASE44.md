# Anexa.AI — verificação no Base44

Data: 04/11/2026 (America/Manaus). Aplicativo existente: `6ace8fec4df8507617f77218`.

## Acesso e escopo

- CLI oficial 0.3.1 instalada fora do checkout. Autorização por dispositivo concluída pelo usuário; `whoami` confirmou login.
- Checkout vinculado ao aplicativo existente com `base44 --app-id … link`. O ponteiro `base44/.app.jsonc` é ignorado pelo Git. Nenhum app foi criado.
- Node precisou de `NODE_USE_ENV_PROXY=1` para usar o proxy herdado. TLS e CA do ambiente foram preservados.
- Realizadas somente leituras de metadados, schemas, código do editor, cabeçalhos e disponibilidade pública. Nenhum registro pessoal foi listado.

## Versões e sincronização

| Verificação | Resultado observado |
| --- | --- |
| GitHub conectado | `joaofan11/agente-de-carreira-com-ia`, conexão `active` |
| Commit informado pelo editor | `b53638fabe3f1c61f0f053bb83b9427c5a86c930` |
| Último commit de deploy informado | `12c93fde8afae67a6875f449a48a92705fe6028b` |
| Último deploy informado | `2026-10-23T23:54:05.047000` (23/10, 19h54 em Manaus, interpretando o timestamp do serviço como UTC) |
| URL publicada | `https://carreira-foco-ia.base44.app` |
| GET do HTML público | HTTP 200, elemento raiz React presente; não comprova navegação ou fluxo integrado |
| Branches retornadas | Somente `main`, ativa |
| Ambiente de dados não produtivo | Metadados retornaram `has_non_prod_entities: false` e `dev_environment_enabled: false` |

As alterações locais desta revisão não estão no editor nem na versão de deploy registrada. Leitura de `/code/content` consulta o sandbox do editor, e não o bundle publicado; não confundir as duas versões. Não houve sincronização forçada, push, merge ou publicação.

## 02B — Permissões: não homologado

- A API de schemas confirmou `Document`, `Resume` e `StudentProfile` com regras de criador, iguais ao código local.
- `CandidateProfile`, `CandidateDocument`, `JobMatch` e `AuditLog` também retornaram regras iguais às declarações locais revisadas.
- `Opportunity` ainda retorna `rls.read: {}` no servidor, divergindo da correção local que exige papel `user`/`admin`.
- Um GET sem Authorization em `/api/apps/…/entities/Opportunity/count` respondeu **HTTP 200, count 0**. Isso demonstra acesso anônimo à contagem, não vazamento de conteúdo de registros. Não foram tentadas escritas.
- Não há duas sessões de usuários comuns disponíveis. Assim, não foi testado o acesso cruzado entre contas nem a privacidade de arquivos.

## 06 — Compatibilidade: não homologado

- A leitura do arquivo `base44/shared/matchScorer.ts` do editor confirmou ausência do novo teto técnico e presença de `remote`/`remoto` na lista de regiões globais.
- As correções de pontuação, geografia e cache permanecem locais e não podem ser homologadas como comportamento do app atual.
- Não houve InvokeLLM, geração de currículo, análise de vaga real ou atualização de JobMatch. Os testes sintéticos locais continuam sendo evidência local, não homologação da resposta do provedor.

## 15 — Segurança/LGPD: não homologado

- GET `/security/scan` retornou **`status: none`, `result: null`**. A API não disponibilizou evidência de scan anterior; isso não contradiz eventual auditoria manual ou externa.
- GET `/security/headers` confirmou bloqueio de iframe (`prevent_iframe_embedding: true`, política efetiva `block_all`). A restrição de funcionalidades do navegador está desativada (`restrict_browser_features: false`). Não foram alterados esses controles.
- O contrato oficial de POST `/security/scan` informa que uma análise nova **executa um modelo de linguagem**. Não foi iniciado scan, mantendo a restrição prévia a chamadas reais de IA. Não houve consumo de IA deliberado por esta verificação.
- A revisão de privacidade e as atualizações de dependências ainda estão locais. A auditoria npm local terminou com 13 pacotes afetados (zero críticos, um alto), conforme `SECURITY_REVIEW.md`.

## Limitação de autenticação do app

A autorização de gestão da plataforma funcionou para schemas, código e metadados. Porém GET `/entities/User/me` retornou HTTP 401, e o fluxo oficial `base44 exec` para consultar apenas `auth.me()` respondeu `Not logged in`. Portanto, autorização da plataforma não foi tratada como prova de sessão do usuário final. Não foram extraídas credenciais nem utilizados tokens de outras contas. Nenhuma identidade foi forjada para simular o teste A/B.

Uma nova consulta `whoami` ao final também retornou `Not logged in`. O login funcionou durante as leituras documentadas, mas não há sessão CLI válida confirmada ao término. Não foi presumida a causa da perda da sessão nem solicitado token em chat.

## Próximos passos necessários

1. Revisar o diff local e integrar as correções pelo fluxo GitHub–Base44 previamente acordado. Só depois, obter autorização para publicar uma versão de teste/versão revisada. Não usar `base44 deploy`.
2. Disponibilizar duas sessões de contas de teste comuns em ambiente adequado, mantendo dados fictícios. Executar o roteiro A/B em `SECURITY_REVIEW.md` e registrar resultados por operação.
3. Autorizar explicitamente a exceção para o scan de segurança que usa IA, caso se queira executá-lo; nenhuma autorização foi presumida da solicitação genérica de homologação.
4. Validar análise real e fluxo integrado em etapa autorizada, pois exigem IA e eventualmente registros de teste/arquivos, atualmente restritos.

**Conclusão:** a inspeção remota foi executada, mas os três cartões não podem ser marcados como homologados. Existem divergências concretas de versão e regras, além dos testes de plataforma não executados. Nenhum cartão do Trello foi alterado.
