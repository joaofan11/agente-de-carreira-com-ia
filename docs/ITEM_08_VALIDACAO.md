# 08 — Dashboard e histórico de candidaturas

Base de revisão: `042134b`. O foco desta alteração é leitura e apresentação; não cria, aprova ou envia candidaturas automaticamente, não executa IA e não altera permissões.

## Correções

- Erros de carregamento aparecem explicitamente com ação Atualizar. No dashboard, falha não é apresentada como gráficos vazios ou indicadores zerados. Em Candidaturas, falha inicial não mostra o estado de sucesso “Nenhuma candidatura ainda”; uma falha de próxima página preserva as linhas já carregadas e informa o erro.
- Percentual de perfil usa o mesmo `calcProgress` de Meu Perfil, incluindo experiências e cursos aprovados. Preenchimento do perfil não é apresentado como chance de contratação.
- Modo demo envia `demo_only` ao servidor, mantendo o filtro de proprietário. A listagem de demo não mistura registros reais. Respostas atrasadas de outro modo são ignoradas; o carregamento e os filtros da tabela são reiniciados na troca. O comportamento legado de `include_demo` em outros fluxos foi preservado.
- Histórico mantém uma linha por candidatura, inclusive múltiplas candidaturas da mesma vaga. Usa `resume_version_id` para a versão realmente vinculada. Versão ausente é informada, nunca substituída silenciosamente pela mais recente. Nova versão ainda não usada pode aparecer como atividade “Currículo preparado”.
- Vagas inativas e currículos antigos são recuperados por ID quando ausentes das páginas iniciais, usando a sessão autenticada; currículos passam também pela RPC com filtro de proprietário, inclusive para administrador. Referência 403/404 fica indisponível; erro de infraestrutura interrompe o carregamento e é informado. Apenas vagas ativas continuam disponíveis para nova candidatura.
- Histórico é ordenado e filtrado por última atividade, não prioritariamente pela data de uma análise antiga. Os métodos Gmail, Outlook, API e link manual têm nomes legíveis. Pontuação aparece como /100, não probabilidade percentual.
- Envio confirmado requer estado pertinente, data válida, identificador e ausência de erro no cálculo da evolução e apresentação. “Enviado” sem confirmação é identificado como tal. Em análise/entrevista podem manter o estado informado com aviso de envio sem comprovação. Currículo aprovado, aprovação pendente e ação manual não significam envio.
- Evolução inclui entrevistas com confirmação, ignora datas inválidas e agrupa por dia no fuso do dispositivo. Indicadores agregados continuam calculados no servidor para toda a conta e modo selecionado; não dependem do tamanho da primeira página. A consulta agregada preserva o critério existente de data/identificador não vazios e ausência de erro; a robustez extra da apresentação não é uma migração de dados legados inválidos.
- Dashboard mostra até 50 registros recentes de cada categoria, com informação de escopo. Evolução é das candidaturas carregadas, não uma série global. Candidaturas oferece Carregar mais para percorrer o histórico por cursor; itens não se duplicam ao anexar páginas.

## Evidências locais

134 testes aprovados na suíte completa, lint, typecheck e build oficial aprovados. Novos testes cobrem: versão exata vinculada; preservação de múltiplas candidaturas; referência indisponível; vaga inativa; modo real/demo; query de proprietário no handler real; envio com e sem comprovante; datas/fuso; falha de rede; paginação; carregamento atrasado; percentual do perfil; filtro de período e aviso no cartão.

Os testes usam banco e chamadas SDK substituídos por doubles locais e controle de hooks para corrida de respostas. Não equivalem a teste A↔B no publicado nem encerram o 02B. Nenhuma fixture remota foi criada para esses testes; nenhum envio, upload ou chamada real de IA foi executado.

## Homologação funcional no preview

1. Recarregar o editor e abrir Dashboard. Usar Atualizar. As análises dos itens 06 e os currículos do 07 devem aparecer no histórico com cargo/empresa. O currículo salvo deve aparecer como preparado, sem aumentar Envios confirmados.
2. Conferir que Conclusão do perfil coincide com Meu Perfil. Testar filtros de empresa, período, status e compatibilidade nos registros recentes carregados.
3. Se desejar validar candidatura pendente, em Meus Currículos escolher a versão aprovada e Usar versão aprovada (envio manual). Essa preparação cria um registro pendente, não envia à empresa. Voltar ao dashboard, atualizar e conferir aprovação pendente e versão vinculada; não é necessário aprovar nem disparar para testar o 08.
4. Abrir Candidaturas e conferir a mesma vaga, versão e estado. Quando houver mais de uma página, Carregar mais deve incluir as anteriores sem repetir as existentes.
5. Alternar Modo demo e Sair do modo demo; os registros reais não devem aparecer no modo demo. Ausência de dados próprios de demo é válida. Conferir que os indicadores reais voltam ao sair.

Não executar disparos reais para produzir evidência de “enviado”. Esses estados são exercitados localmente com fixtures. Envio real será homologado nas integrações correspondentes. Registrar ambiente, commit e capturas sanitizadas. Não tratar evidência de preview como validação no publicado.

## Status

Implementação corrigida e testada localmente; pendente conferência visual na sessão do usuário. Publicação permanece separada.
