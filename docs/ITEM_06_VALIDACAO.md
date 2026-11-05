# 06 — Inteligência artificial para compatibilidade

Base de revisão: `1b6e43e`. Alteração limitada à persistência e apresentação do resultado; não muda prompt, pesos, faixas de classificação, filtro geográfico ou cálculo determinístico.

## Funcionamento

A função `analyzeJobMatch` autentica o titular, busca seu perfil real e preferências e carrega a vaga escolhida. O resumo inclui formação, competências, idiomas, ferramentas, experiências, projetos e cursos, inclusive os aprovados pelo fluxo do item 04. O LLM identifica requisitos, evidências, lacunas e bloqueios. O servidor calcula a nota de 0 a 100, com tetos de 40/25/20/15. Faixas: baixo 0–49, médio 50–79, forte 80–100 sem bloqueios. Bloqueios eliminatórios limitam a nota a 79. Não é probabilidade de contratação.

O cache compara perfil, vaga e preferências. Repetição sem mudança pode reutilizar o resultado sem nova chamada de IA; alterações nos cursos, carga horária ou experiências invalidam a chave. O botão agora se chama “Verificar atualização” para comunicar esse comportamento.

## Correção desta revisão

A resposta reutilizada não carregava o detalhamento por critério, e a tela dependia de uma resposta nova da IA para mostrar competências compatíveis. Agora as novas análises manuais e da automação persistem `pontuacao_detalhada` e `competencias_evidenciadas`. A resposta do cache e a tela usam os dados persistidos. A tela informa reutilização, apresenta evidência de cada competência e avisa que nota não é chance de contratação.

Registros antigos sem esses campos continuam utilizáveis: exibem os nomes já salvos, sem inventar evidências ou detalhamento. A revisão não invalida deliberadamente todo o cache nem força chamadas pagas apenas para preencher campos novos. Não executa nem ativa automação.

## Evidência técnica

- Suíte de pontuação: cenários baixo/médio/forte, tetos 40/25/20/15, bloqueio eliminatório, restrição geográfica e ausência de requisitos.
- Handler real com integrações substituídas: cache conserva nota, classificação, bloqueios, critérios e competências; reutilização sem nova chamada; mudança de entrada gera nova análise; isolamento de titular e modo de teste restrito a administrador.
- Componente real renderizado: detalhes do cache e legado, evidências, lacunas, bloqueios, aviso de auditoria e ausência de promessa de contratação.
- Chave do cache: cursos, carga horária e experiências aprovados no item 04 participam da invalidação.

Resultado desta revisão: 106 testes aprovados na suíte completa, lint, typecheck e build oficial aprovados. Os testes de IA desta revisão usam doubles; nenhuma nova chamada real de IA é necessária para executá-los. As evidências históricas de chamadas reais e cache permanecem em seus relatórios próprios e não foram apresentadas como uma nova execução.

## Homologação pela interface

1. No preview do Base44, abrir Oportunidades, escolher uma vaga e clicar Analisar. Não precisa publicar para testar o rascunho.
2. Conferir nota, classificação, motivos, competências compatíveis e ausentes, evidências e eventuais bloqueios. Comparar a justificativa com o perfil salvo. Nota baixa pode estar correta quando vaga e perfil não combinam.
3. Conferir que curso e experiências importados não são apresentados como qualificações diferentes ou inventadas. Não é obrigatório citar cada item do perfil se ele não for relevante à vaga.
4. Sem alterar perfil, vaga ou preferências, clicar Verificar atualização. Resultado pode ser reutilizado, com aviso e os mesmos detalhes disponíveis para novas análises desta versão.
5. Para verificar invalidação pela interface, alterar uma competência fictícia relevante no perfil e analisar a mesma vaga. Isso pode consumir nova chamada de IA; não exige que a nota mude se a alteração não afetar requisitos.

Registrar ambiente, versão, vaga, resultado e capturas sanitizadas. Não anexar tokens nem conteúdo pessoal desnecessário. Não marcar publicado como homologado com evidência apenas do preview. Não envia candidatura nem currículo ao executar a análise.

## Status

Implementação e testes técnicos em revisão; homologação visual com o perfil recém-preenchido pendente. Critérios já comprovados historicamente não precisam ser repetidos indiscriminadamente. Pendências dos cartões 02B e 15 permanecem separadas.
