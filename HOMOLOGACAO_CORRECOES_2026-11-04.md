# Correções após a homologação do Anexa.AI

Base desta revisão: `2775245`, preservando os relatórios históricos `HOMOLOGACAO_2026-11-04.md` e `MATRIZ_TESTES_2026-11-04.md`, além da atualização do plugin Base44 recebida pela main. O relatório original testou `a0b7611`; seus resultados não foram reescritos.

## Correções propostas

### Sessão ausente

`authenticatedUser` converte rejeições de autenticação 401/403 do SDK em ausência de usuário. As 21 funções que já tinham a guarda `if (!user) return 401` passam a usá-lo antes de qualquer operação de negócio. Falhas de infraestrutura são propagadas, não disfarçadas como logout. As funções administrativas de automação preservam sua guarda administrativa existente.

### Identidade WhatsApp

O webhook deixa de buscar um trecho arbitrário de telefone. A consulta usa o número completo, com âncoras e variantes de apresentação legada; depois compara os dois valores em formato canônico E.164. Resultado ausente, múltiplos perfis, perfil demo ou propriedade conflitante impedem a associação. Nenhuma migração de telefones foi executada e Twilio continua sem ativação.

### Auditoria de ações novas

Perfil e preferências passam a registrar solicitação antes da gravação e conclusão depois dela. Falha na solicitação bloqueia a alteração; falha ao concluir a auditoria não desfaz nem oculta uma gravação já feita: a resposta informa `audit_recorded: false`. `audit_request_id` permite conferir um evento conhecido por ID, sem usar contagem de tabela como prova.

A análise persistida registra solicitação, conclusão/erro e reutilização de cache. `dry_run` continua sem gravações, inclusive de auditoria. Eventos contêm somente identidade, ação, entidade, ID, resultado e horário; não contêm campos do perfil, prompt, telefone ou credenciais.

Não foi criado histórico retroativo. A base vazia observada na rodada anterior não prova falha no caminho atual de candidatura, já que esse caminho não foi executado naquela rodada. A comprovação correta é uma ação nova identificada e seu evento recuperado por ID.

### Cache isolado para homologação

O padrão continua inalterado: `test_profile` implica `dry_run` e não grava nada. O modo adicional exige todos os requisitos abaixo:

- Conta administrativa autenticada.
- `test_profile` fictício e `test_cache_namespace` no formato `HOMOLOG-...`.
- Vaga com `is_demo: true` e `demo_batch_id` exatamente igual ao namespace.
- Ausência de `dry_run: true`, que seria contraditório com persistir cache.

O resultado é salvo exclusivamente como JobMatch de demonstração, do proprietário e lote atuais. O cache real continua excluindo `is_demo: true`. A resposta informa `reused`, `ai_calls`, `audit_recorded` e, em análise nova, o ID do evento de solicitação. `ai_calls` conta invocações desta função à integração, não créditos nem retries internos do provedor.

Exemplo de corpo, substituindo apenas os IDs/lote pelos artefatos fictícios criados na execução:

```json
{
  "job_id": "ID_DA_VAGA_FICTICIA",
  "test_profile": {"nome_completo": "Candidato fictício", "competencias": ["Python"]},
  "test_preferences": {"modalidades": ["remoto"]},
  "test_cache_namespace": "HOMOLOG-CACHE-IDENTIFICADOR"
}
```

Não se deve criar perfil não-demo para habilitar esse teste. O teste remoto deve fazer no máximo duas análises novas (as duas chamadas restantes do limite de cinco da rodada original), sem retries de chamadas ambíguas: primeira análise, repetição idêntica sem IA, alteração de uma competência e nova análise. Remover somente a vaga e JobMatch desse lote após preservar evidência sanitizada; manter os eventos genuínos de auditoria para conferência.

### Dependências

O Quill não tinha uso no código e foi removido com seu wrapper. React Router foi atualizado de 6.30.6 para 7.18.5 para corrigir os avisos de produção; o app usa as APIs de roteamento declarativo preservadas na versão 7. A versão corrigida foi publicada em 27/10 e respeita a janela de sete dias do projeto. Node 24 e React 18 atendem aos requisitos.

## Validação local

- 68 testes passaram, incluindo os handlers reais com dependências injetadas: 401 antes de efeitos, telefone exato/ambíguo, auditoria de perfil/preferências, cache com reuso/invalidação e isolamento por lote, além dos testes anteriores.
- Lint e typecheck passaram.
- Build pela CLI oficial passou com o ID do app injetado, sem deploy.
- `npm audit --omit=dev`: zero vulnerabilidades. Auditoria completa: 8 alertas moderados em ferramentas de desenvolvimento, zero altos/críticos. Esses alertas não foram ocultados.
- A verificação local não equivale a homologação remota do código ainda não publicado.

## Pendências que não foram inventadas

- O responsável respondeu que controlador e contato LGPD estão **pendentes**. Retenção, fornecedores/local de processamento e revisão jurídica continuam em aberto. Nenhum nome, prazo ou contato foi fabricado.
- Isolamento A↔B exige duas contas/sessões comuns de teste. Não serão assumidas as contas reais existentes nem solicitadas senhas em chat.
- A sessão atual dispõe da API oficial de scan pela CLI; a impossibilidade de dispará-lo na sessão anterior é uma limitação daquele acesso, não evidência de que só a tela Security permite a operação.
- Não habilitar WhatsApp, Gmail ou Outlook e não executar uploads/envios para verificar estas correções.

Os vereditos dos cartões só podem ser atualizados com as evidências novas efetivamente executadas. Este documento descreve a revisão de código e o roteiro; não converte os itens bloqueados em aprovados.
