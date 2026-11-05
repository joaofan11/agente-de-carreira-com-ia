# 09 — Sistema de aprovação de candidaturas

Base da implementação: `c59dbeb`. Aprovar ou recusar registra uma decisão; não dispara envio.

## Implementação

- Revisão identifica vaga, versão exata do currículo e canal. A interface exige currículo pronto com conteúdo disponível e vaga ativa para aprovar; permite recusar quando uma referência estiver indisponível.
- Backend valida proprietário, estado pendente, currículo pronto com PDF privado, vínculo com a vaga e separação real/demo. A decisão usa atualização condicional pelo estado, versão, canal, proprietário e revisão disponível do registro, sem reserva ou confirmação de envio. Uma decisão concorrente ou alteração durante a revisão resulta em conflito, sem sobrescrever a vencedora.
- Rotas web fixam origem e canal no servidor e rejeitam campos extras. Códigos WhatsApp precisam corresponder e estar válidos para aprovação e recusa; são consumidos pela decisão. Isso não ativa a integração WhatsApp.
- Corrigir currículo/canal revoga aprovação anterior, códigos e metadados da decisão, voltando a pendente. A reserva de envio também compara o currículo e a revisão para bloquear uma solicitação antiga após correção e nova aprovação. O encaminhamento manual não sobrescreve uma correção concorrente nem confirma envio.
- Cliques repetidos são bloqueados durante a solicitação. Trocar de candidatura limpa o resultado e o motivo anteriores; respostas atrasadas são ignoradas. Falha na auditoria de conclusão é informada sem desfazer nem repetir uma decisão já salva.

## Verificação

Suíte completa de 150 testes aprovada, além de lint, typecheck e build oficial. Os novos testes exercitam handlers reais e componentes com banco, transporte e hooks substituídos: aprovação/recusa concorrentes, revisão desatualizada, proprietário e vínculo incorretos, estados enviados ou reservados, expiração e consumo de códigos, correção de currículo, reserva de envio desatualizada, falha de auditoria e cliques repetidos.

Esses testes não comprovam concorrência no banco hospedado nem substituem homologação na sessão do usuário. A mitigação de duplicidade na criação continua não atômica; esta alteração não promete unicidade global de candidaturas. Nenhuma IA, upload, mensagem ou envio real foi executado para esses testes. Publicação permanece separada.

## Homologação no preview

1. Recarregar o editor e abrir Candidaturas. Usar a candidatura pendente criada no item 08, vinculada ao currículo já aprovado no item 07. Abrir Revisar e conferir vaga, currículo e canal manual.
2. Recusar com motivo fictício. Conferir estado Recusado e ausência de envio no histórico e dashboard.
3. Em Meus Currículos, usar novamente a mesma versão aprovada para a mesma vaga, por envio manual. A recusa anterior deve continuar no histórico; a nova candidatura fica pendente. Não é necessário gerar outro currículo ou executar IA.
4. Revisar a nova candidatura e aprovar. Conferir estado Aprovado, data de aprovação e redução das pendências. Envios confirmados deve permanecer inalterado. Não clicar em enviar para homologar este item.
5. Na candidatura aprovada, usar Corrigir currículo/canal, selecionando uma versão própria pronta e canal manual. Deve voltar a Pendente de aprovação e exigir nova revisão, sem enviar.

Registrar ambiente, commit e capturas sanitizadas. Implementação pronta para conferência funcional; não marcar o cartão como homologado apenas pelo resultado dos testes locais.
