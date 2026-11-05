// Conteúdo da auditoria técnica diferencial do MVP (leitura realizada em 03/11/2026,
// comparada com a auditoria de 30/10/2026). Fontes de evidência: histórico de versões
// do projeto, código-fonte atual, definições de permissão, registros do banco e estado
// da plataforma. Nenhum arquivo, registro ou configuração foi alterado.

export const auditMeta = {
  titulo: "Auditoria Técnica Diferencial",
  subtitulo: "Anexa.AI — MVP para a feira UniNorte",
  data: "03 de novembro de 2026",
  base: "Comparação com a auditoria de 30/10/2026",
  metodo:
    "Procedimento exclusivamente de leitura. Foram cruzadas seis fontes de evidência: o histórico de versões do projeto com data e hora de cada alteração, o código-fonte atual, as definições de permissão das 18 entidades, os registros reais do banco, os registros de execução da automação e o estado da plataforma. Nenhuma candidatura foi executada, nenhuma mensagem foi enviada e nenhuma funcionalidade foi considerada concluída apenas por existir em código. Onde não há histórico suficiente para datar uma alteração, o relatório declara: DATA DA ALTERAÇÃO NÃO VERIFICÁVEL.",
};

export const resumoExecutivo = [
  "Houve trabalho real entre as duas auditorias, mas não em 31/10/2026. O histórico de versões registra 23 alterações em 01/11/2026, entre 11h44 e 13h08 no horário de Manaus, e nenhuma em 31/10. A sessão perdida produziu mudanças substanciais de segurança, automação e fluxo de candidaturas, apenas com data diferente da lembrada.",
  "A natureza do trabalho foi endurecimento, não expansão de funcionalidades. A maior parte das alterações corrige lacunas apontadas em 30/10: proteção das rotas administrativas na própria rota, controle de pausa e de orçamento de IA, proteção contra envio duplicado, cache de análise por impressão digital do conteúdo e vínculo obrigatório de PDF antes de qualquer candidatura.",
  "O que continua igual: as 3 análises reais com score zero, as 8 versões de currículo sem PDF, o registro de auditoria vazio, nenhum secret configurado, nenhum conector OAuth autorizado, nenhuma candidatura real, nenhuma mensagem de WhatsApp, nenhuma verificação de segurança e nenhum teste automatizado.",
  "Ganho concreto e mensurável: 13 vagas reais a mais (63 para 76), 34 registros de execução a mais (11 para 45), coleta automática rodando todos os dias por volta de 06h04 de Manaus sem falhas desde 25/10 e proteção administrativa agora presente na rota.",
  "Risco novo identificado: o processamento automático passou a exigir orçamento mensal de IA configurado e não existe nenhum registro dessa configuração. A automação coleta vagas, mas as execuções de processamento de 02/11 e 03/11 registraram zero tentativas de IA e zero recomendações.",
  "A versão publicada é de 23/10/2026 e está desatualizada em relação ao editor. O que o público acessa hoje não inclui nenhuma melhoria de 01/11.",
  "Veredito: o MVP está apto para demonstração assistida, desde que republicado e com o roteiro ensaiado. Não está apto a candidaturas reais por falta de canal de envio homologado, de trilha de auditoria e de testes entre usuários distintos.",
];

export const plataforma = [
  { label: "Endereço publicado", value: "https://carreira-foco-ia.base44.app" },
  { label: "Última publicação", value: "23/10/2026 — a plataforma confirma alterações no editor ainda não publicadas" },
  { label: "Código do editor", value: "Avançado em relação à versão publicada; inclui 23 alterações de 01/11" },
  { label: "Visibilidade", value: "Pública: o app abre sem exigir login" },
  { label: "Métodos de login", value: "E-mail e senha, Google, Microsoft, Facebook e Apple; MFA desativado" },
  { label: "Domínio próprio", value: "Não conectado" },
  { label: "Secrets configurados", value: "Nenhum" },
  { label: "Conectores autorizados", value: "Nenhum" },
  { label: "Verificação de segurança", value: "Nunca executada" },
  { label: "Verificação de SEO", value: "Nunca executada" },
  { label: "Colaboradores", value: "1, sem convites pendentes" },
];

export const camadas = [
  {
    camada: "Interface criada",
    situacao: "16 de 16 módulos têm tela. 19 arquivos de página e 17 rotas registradas.",
  },
  {
    camada: "Lógica implementada",
    situacao:
      "16 de 16. O módulo de WhatsApp ganhou controle de pausa e de orçamento, mas segue bloqueado por credencial. O registro de auditoria tem código e nenhum registro gravado.",
  },
  {
    camada: "Integração configurada",
    situacao:
      "2 de 5. Funcionam a API de vagas Jobicy e a camada de IA da plataforma. WhatsApp, Gmail e Outlook estão sem credenciais.",
  },
  {
    camada: "Testado de ponta a ponta",
    situacao:
      "1 de 16 com execução contínua: coleta de vagas, com 21 dias de histórico. O envio ao receptor de demonstração funcionou em 14/10, antes do endurecimento de 01/11, e não foi repetido.",
  },
];

export const funcionais = [
  {
    titulo: "Funcionam de ponta a ponta",
    modulos: ["05 Preferências e busca por API real"],
  },
  {
    titulo: "Funcionam com operação comprovada antes de 01/11, sem re-teste posterior",
    modulos: ["03 Cadastro e perfil", "13 Submissão direta (demo)"],
  },
  {
    titulo: "Funcionam parcialmente",
    modulos: ["06 Compatibilidade", "07 Currículo em PDF", "08 Dashboard", "09 Aprovação e recusa", "14 Automação", "16 Demonstração"],
  },
  {
    titulo: "Somente interface e lógica, bloqueados por credencial",
    modulos: ["10 WhatsApp", "11 Gmail", "12 Outlook"],
  },
  {
    titulo: "Transversais, parciais por dependência",
    modulos: ["01 Estrutura e autenticação", "02 Entidades e permissões", "04 Extração por IA", "15 Segurança e LGPD"],
  },
];

export const comparativo = [
  ["Módulos com interface", "16 de 16", "16 de 16", "Igual"],
  ["Módulos com lógica", "15 de 16", "16 de 16", "Aumentou"],
  ["Entidades", "18", "18 (+4 campos em 2 entidades)", "Igual"],
  ["Funções de backend", "23", "25", "Aumentou"],
  ["Arquivos de página", "18", "19 (17 rotas)", "Aumentou"],
  ["Última publicação", "23/10/2026", "23/10/2026", "Igual"],
  ["Vagas reais", "63", "76", "Aumentou 13"],
  ["Vagas demo", "4", "4", "Igual"],
  ["Análises reais", "3 com score zero", "3 com score zero", "Igual"],
  ["Análises demo", "3", "3 (95, 95, 82)", "Igual"],
  ["Versões de currículo", "11, sendo 3 com PDF", "11, sendo 3 com PDF", "Igual"],
  ["Candidaturas no banco", "2 enviadas ao receptor demo", "11 registros, todas demo", "Aumentou volume"],
  ["Candidaturas reais enviadas", "0", "0", "Igual"],
  ["Execuções de automação", "11 (10 ok, 1 falha)", "45 (44 ok, 1 erro em 24/10)", "Aumentou 34"],
  ["Análises geradas pela automação", "0", "0", "Igual"],
  ["Candidaturas criadas pela automação", "0", "0 por decisão de projeto", "Igual"],
  ["Registro de auditoria", "0 registros", "0 registros", "Igual"],
  ["Secrets configurados", "Nenhum", "Nenhum", "Igual"],
  ["Conectores OAuth", "Nenhum", "Nenhum", "Igual"],
  ["Verificação de segurança", "Nunca executada", "Nunca executada", "Igual"],
  ["Testes automatizados", "Nenhum", "Nenhum arquivo de teste", "Igual"],
  ["Rotas administrativas sem guarda", "1 rota", "0 rotas desprotegidas", "Corrigido"],
  ["Entidades legadas com leitura aberta", "4", "1 (Opportunity, com 0 registros)", "Corrigido em parte"],
];

export const alteracoes = [
  ["30/10 14h21", "Relatório de auditoria e exportação em PDF", "Publicação do relatório da auditoria de 30/10", "Registro de versão 5af880e", "Base documental criada", "Alta"],
  ["31/10", "Nenhum arquivo", "Nenhuma alteração de código registrada", "Ausência de registro de versão; apenas 2 execuções automáticas", "Nenhum", "Alta"],
  ["01/11 11h44", "Controles de automação (novo módulo compartilhado)", "Pausa, validação de administrador e orçamento mensal com reserva atômica", "Registro c114126; arquivo novo", "Controle de custo de IA criado", "Alta"],
  ["01/11 11h45", "Função de orçamento da automação (nova)", "Leitura e gravação do teto mensal de tentativas de IA", "Registro 866b5e1", "Painel ganha controle de custo", "Alta"],
  ["01/11 11h45", "Função de coleta de vagas", "Passa a exigir administrador autenticado e a respeitar a pausa em qualquer execução", "Registro 8066e03", "Pausa deixa de ser ignorada", "Alta"],
  ["01/11 11h45", "Função de processamento de candidatos", "Exige administrador, respeita pausa, reserva orçamento e deixa de criar candidaturas", "Registros c84ec2a e 5dfd89e", "Muda a regra de negócio central", "Alta"],
  ["01/11 11h46", "Painel de automação", "Remoção dos botões de execução direta e inclusão do limite mensal", "Registros 8795108 e 5ad12dd", "Interface alinhada à nova regra", "Alta"],
  ["01/11 11h46", "Máquina de estados de candidaturas", "Exige PDF privado, proíbe misturar demo e real e grava auditoria", "Registro 55510ed", "Candidatura só com currículo revisado", "Alta"],
  ["01/11 11h47", "Gerador e lista de currículos", "Fluxo gerar, salvar PDF e só então preparar candidatura; botão de recuperar PDF", "Registros 33f5314 e 5aabcd0", "Fecha a lacuna das versões sem PDF", "Alta"],
  ["01/11 11h48", "Página de oportunidades", "Lista de recomendações e análise delegada ao servidor por impressão digital", "Registro 5cb2e51", "Evita chamadas repetidas à IA", "Alta"],
  ["01/11 12h25", "Workflow diário de vagas", "Descrição muda de criar candidaturas para registrar recomendações", "Registro a4eb68c", "Automação alinhada à nova regra", "Alta"],
  ["01/11 12h25", "Entidades Application e JobMatch", "Três campos de controle de envio e um campo de impressão digital", "Registro e258258", "Base para envio idempotente e cache", "Alta"],
  ["01/11 12h25", "Envio por Gmail, Outlook e submissão direta", "Reivindicação de envio com token único e bloqueio de envio duplicado", "Registro e258258", "Corrige risco de envio em dobro", "Alta"],
  ["01/11 12h25", "Função de análise de compatibilidade", "Só reutiliza análise quando a impressão digital do conteúdo coincide", "Registro e258258", "Corrige reaproveitamento indevido", "Alta"],
  ["01/11 12h25", "Correção de candidatura e de PDF (novas funções)", "Correção de candidatura e anexação de PDF com validação de armazenamento privado", "Registro e258258", "Permite recuperar PDFs sem IA", "Alta"],
  ["01/11 12h25", "Registro de auditoria de candidaturas", "Código de auditoria para candidaturas via serviço", "Registro e258258", "Trilha passa a ter implementação", "Alta"],
  ["01/11 13h00", "Rotas administrativas", "Administração, auditoria e demonstração sob verificação de perfil na rota", "Registro de versão dos arquivos de rota", "Corrige achado de 30/10", "Alta"],
  ["01/11 13h00", "Cerca de 20 arquivos de interface", "Ajustes de compatibilidade e de textos", "Registros c9fa3a6, a9e6312, 730f230 e b9fa06a", "Cosmético e estrutural", "Alta"],
  ["02/11", "Nenhum arquivo", "Nenhuma alteração de código; 3 vagas novas coletadas", "Histórico e registros de execução", "Nenhum", "Alta"],
  ["03/11 15h01", "Arquivo padrão de autenticação com MFA", "Inclusão pela plataforma, não pela equipe", "Registro c4657d4", "Nenhum sobre o MVP", "Alta"],
  ["NÃO VERIFICÁVEL", "Autoria das alterações de 01/11", "Os registros descrevem apenas alteração externa, sem autor individual", "Histórico de versões", "Não é possível atribuir a um integrante", "Baixa"],
];

export const modulos = [
  {
    n: "01",
    nome: "Estrutura, páginas e autenticação",
    status30: "IMPLEMENTADO",
    status03: "IMPLEMENTADO, NÃO HOMOLOGADO",
    mudou: "Rotas administrativas passaram a validar perfil na própria rota.",
    evidencias:
      "19 arquivos de página e 17 rotas; administração, auditoria e demonstração sob verificação de perfil. Login por cinco métodos habilitado. Nenhum registro de teste com usuário não administrador.",
  },
  {
    n: "02",
    nome: "Entidades, relacionamentos e permissões",
    status30: "PARCIAL",
    status03: "PARCIAL",
    mudou: "Três das quatro entidades legadas foram restringidas.",
    evidencias:
      "18 entidades; escrita sensível restrita ao serviço nas entidades pessoais. Resume, StudentProfile e Document agora limitadas ao proprietário. Opportunity continua com leitura aberta, mas tem zero registros. Nenhum teste entre usuários distintos foi registrado.",
  },
  {
    n: "03",
    nome: "Cadastro e perfil profissional",
    status30: "IMPLEMENTADO",
    status03: "IMPLEMENTADO, NÃO HOMOLOGADO",
    mudou: "Ajuste no carregamento do perfil real.",
    evidencias:
      "Wizard de 6 etapas, gravação exclusiva pelo backend e payload sem identificador de usuário. 9 perfis gravados, sendo 2 reais e 7 de demonstração. Falta teste de isolamento entre contas.",
  },
  {
    n: "04",
    nome: "Upload de documentos e extração por IA",
    status30: "IMPLEMENTADO",
    status03: "IMPLEMENTADO, NÃO HOMOLOGADO",
    mudou: "Sem alteração de código.",
    evidencias:
      "Upload privado com validação de propriedade e tela de revisão da extração. Os 4 documentos armazenados estão com extração pendente e nenhum possui dados extraídos: nenhuma extração concluída com sucesso.",
  },
  {
    n: "05",
    nome: "Preferências e busca de vagas por API real",
    status30: "IMPLEMENTADO",
    status03: "CONCLUÍDO E VALIDADO",
    mudou: "Mais 13 vagas reais; coleta passou a exigir administrador e a respeitar pausa.",
    evidencias:
      "76 vagas reais e 4 de demonstração, todas ativas; 21 dias de coleta diária sem falha após 24/10. Última coleta recebeu 100 vagas, salvou 8 novas e teve zero duplicadas. Nenhuma das 80 vagas tem e-mail de recrutamento.",
  },
  {
    n: "06",
    nome: "Análise de compatibilidade com IA",
    status30: "PARCIAL",
    status03: "PARCIAL",
    mudou: "Cache por impressão digital e recálculo em vez de reaproveitar análise obsoleta.",
    evidencias:
      "6 análises: 3 demo com 95, 95 e 82; 2 reais com score 0 e 1 real sem score. Nenhum dos 6 registros tem o novo campo de impressão digital, o que prova que o código novo ainda não foi executado. As 3 análises reais com score zero não foram recalculadas.",
  },
  {
    n: "07",
    nome: "Geração de currículo personalizado em PDF",
    status30: "PARCIAL",
    status03: "PARCIAL",
    mudou: "Recuperação de PDF a partir do conteúdo salvo, sem IA.",
    evidencias:
      "11 versões, 3 com PDF e 8 sem arquivo: números idênticos aos de 30/10. A recuperação existe em código e nunca foi executada. A candidatura agora exige PDF privado, o que torna as 8 versões inutilizáveis para envio.",
  },
  {
    n: "08",
    nome: "Dashboard e histórico de candidaturas",
    status30: "IMPLEMENTADO",
    status03: "IMPLEMENTADO, NÃO HOMOLOGADO",
    mudou: "Filtro automático de registros de demonstração e novos textos.",
    evidencias:
      "Indicadores, gráfico de envios e histórico, com contagens no servidor. As 11 candidaturas existentes são de demonstração; o painel real aparece vazio por ausência de dado real, não por defeito.",
  },
  {
    n: "09",
    nome: "Aprovação e recusa de candidaturas",
    status30: "IMPLEMENTADO",
    status03: "PARCIAL",
    mudou: "PDF obrigatório, proibição de misturar demo e real, auditoria e bloqueio após início de envio.",
    evidencias:
      "Estados atuais: 4 pendentes, 3 recusadas, 2 com ação manual necessária e 2 enviadas, todas de demonstração. Depois de 01/11 nenhum registro possui token de envio, ou seja, o fluxo endurecido nunca foi exercitado.",
  },
  {
    n: "10",
    nome: "WhatsApp: alertas e aprovação",
    status30: "PARCIAL",
    status03: "BLOQUEADO",
    mudou: "Ajuste de texto na tela de configurações.",
    evidencias:
      "Webhook e envio implementados; sem secrets o envio retorna erro 503 declarado. Zero mensagens enviadas ou recebidas. Duas integrações de WhatsApp registradas, ambas desconectadas.",
  },
  {
    n: "11",
    nome: "Gmail OAuth e envio de currículo",
    status30: "PARCIAL",
    status03: "BLOQUEADO",
    mudou: "Envio com token único e bloqueio de duplicidade.",
    evidencias:
      "Nenhum conector autorizado e nenhum secret configurado; a função responde 503. Zero envios, zero destinatários confirmados e nenhuma confirmação de entrega.",
  },
  {
    n: "12",
    nome: "Outlook e Microsoft Graph",
    status30: "PARCIAL",
    status03: "BLOQUEADO",
    mudou: "Envio com token único e bloqueio de duplicidade.",
    evidencias:
      "Nenhum conector autorizado e nenhum secret configurado; a função responde 503. Zero envios e nenhuma confirmação de entrega.",
  },
  {
    n: "13",
    nome: "Submissão direta de candidaturas",
    status30: "IMPLEMENTADO (DEMO)",
    status03: "PARCIAL",
    mudou: "Lista de permissão de endpoint, token de envio e correção de candidatura.",
    evidencias:
      "2 recebimentos com comprovante persistido, ambos de demonstração, anteriores a 01/11. O controle de envio por token nunca foi exercitado e não há prova de funcionamento após a mudança.",
  },
  {
    n: "14",
    nome: "Automação da busca e do processamento",
    status30: "PARCIAL",
    status03: "PARCIAL",
    mudou: "Pausa efetiva no servidor, orçamento mensal, recomendações em vez de candidaturas.",
    evidencias:
      "45 execuções, 44 concluídas e 1 erro em 24/10; coleta e processamento diários às 06h04 e 06h05 de Manaus. Processamento de 02/11 e 03/11: 3 candidatos, zero tentativas de IA, zero recomendações. Todas as execuções estão gravadas como manuais, inclusive as agendadas.",
  },
  {
    n: "15",
    nome: "Segurança, LGPD e testes",
    status30: "PARCIAL",
    status03: "PARCIAL",
    mudou: "Rotas protegidas, entidades restringidas e código de auditoria criado.",
    evidencias:
      "Registro de auditoria com zero linhas apesar do código existir; nenhuma verificação de segurança executada; nenhum arquivo de teste no projeto; política de privacidade ainda em rascunho.",
  },
  {
    n: "16",
    nome: "Ambiente de demonstração",
    status30: "PARCIAL",
    status03: "PARCIAL",
    mudou: "Página não alterada desde 30/10.",
    evidencias:
      "Roteiro, cenário e painel de integrações prontos, com dados de demonstração preservados. A versão publicada é de 23/10 e roda código anterior a todas as correções de 01/11.",
  },
];

export const integracoes = [
  ["API de vagas Jobicy", "Sim", "Não exige", "21 dias de coleta; 76 vagas reais; 100 recebidas por dia", "Funcionando"],
  ["IA da plataforma", "Sim", "Nativa", "Zero extrações concluídas; 3 análises antigas com score 0; nenhuma nova", "Disponível, sem uso comprovado"],
  ["WhatsApp / Twilio", "Sim", "Ausente", "Zero mensagens enviadas ou recebidas", "Bloqueado, erro 503"],
  ["Gmail (OAuth)", "Sim", "Ausente", "Zero envios", "Bloqueado, erro 503"],
  ["Outlook (Graph)", "Sim", "Ausente", "Zero envios", "Bloqueado, erro 503"],
  ["Receptor de demonstração", "Sim", "Não exige", "2 comprovantes persistidos em 14/10", "Funcionou antes de 01/11"],
];

export const seguranca = {
  corrigido: [
    "Administração, auditoria e demonstração passaram a validar perfil de administrador na própria rota.",
    "Pausa e orçamento de IA verificados no servidor, com reserva atômica e bloqueio por padrão.",
    "Candidatura só pode ser preparada com PDF em armazenamento privado, versão pronta e vínculo correto à vaga.",
    "Envio protegido contra duplicidade por token único com trava de concorrência.",
    "Resume, StudentProfile e Document deixaram de permitir leitura ampla.",
  ],
  aberto: [
    "Opportunity continua com leitura irrestrita; hoje mitigada apenas por ter zero registros.",
    "Trilha de auditoria vazia apesar do código existente: não é possível demonstrar quem acessou o quê.",
    "Nenhum teste entre usuários distintos; o isolamento é verificável no desenho, não em execução.",
    "Nenhuma verificação de segurança executada na plataforma.",
    "Aplicação publicada aberta sem login para qualquer visitante.",
    "Quatro entidades sem uso permanecem no banco, ampliando a superfície de risco.",
    "Política de privacidade sem revisão jurídica registrada.",
  ],
};

export const fluxo = [
  ["1. Cadastro", "Funciona", "Cinco métodos de login habilitados; 2 perfis reais gravados"],
  ["2. Busca de vaga", "Funciona com dados reais", "76 vagas reais, coleta diária e sem duplicidade"],
  ["3. Compatibilidade", "Parcial", "3 análises reais com score 0 e nenhuma análise nova"],
  ["4. Currículo em PDF", "Parcial", "3 de 11 versões com PDF; 8 sem arquivo"],
  ["5. Aprovação", "Parcial", "Regras endurecidas em 01/11 e nunca executadas depois"],
  ["6. Envio de demonstração", "Parcial", "2 comprovantes de 14/10; nenhum envio após 01/11"],
  ["7. Dashboard", "Parcial", "11 candidaturas, todas de demonstração"],
];

export const cincoPassos = [
  {
    n: "1",
    elo: "Perfil do estudante",
    status: "Funciona",
    impedimento:
      "Cadastro e edição operam com gravação exclusiva pelo backend. Com perfil real incompleto, as análises continuam resultando em score 0.",
  },
  {
    n: "2",
    elo: "Vaga e compatibilidade",
    status: "Parcial",
    impedimento:
      "A coleta funciona, mas nenhuma das 80 vagas tem e-mail de recrutamento e nenhuma análise real produziu score diferente de zero após a auditoria.",
  },
  {
    n: "3",
    elo: "Currículo adaptado",
    status: "Parcial",
    impedimento:
      "8 das 11 versões não têm PDF e a candidatura passou a exigir PDF privado: essas versões estão inutilizáveis para envio até a recuperação ser executada.",
  },
  {
    n: "4",
    elo: "Aprovação",
    status: "Parcial",
    impedimento:
      "Lógica correta e mais rígida, mas nunca exercitada após 01/11; nenhuma candidatura possui token de envio e a trilha de auditoria está vazia.",
  },
  {
    n: "5",
    elo: "Envio com comprovante",
    status: "Parcial",
    impedimento:
      "E-mail e WhatsApp retornam 503 por falta de credencial. A submissão direta tem prova apenas anterior a 01/11, no receptor de demonstração.",
  },
];

export const problemas = [
  {
    titulo: "O score zero não foi corrigido",
    texto:
      "As 3 análises reais continuam com score 0 e uma delas sem score. Nenhum registro recebeu a nova impressão digital de conteúdo, o que mostra que o código alterado em 01/11 nunca rodou. O problema, portanto, foi endurecido, não resolvido.",
  },
  {
    titulo: "A automação coleta, mas não analisa",
    texto:
      "Em 21 dias de execução, zero análises e zero recomendações úteis. O processamento de 02/11 e 03/11 registrou 3 candidatos e nenhuma tentativa de IA: as preferências reais não produzem vagas compatíveis ou o orçamento não está configurado.",
  },
  {
    titulo: "O orçamento de IA nunca foi configurado",
    texto:
      "A nova regra exige teto mensal de tentativas e não existe nenhum registro de configuração no banco. Pela regra implementada, toda nova análise automática permanece bloqueada até um administrador definir o limite.",
  },
  {
    titulo: "A pausa existe no código e não tem prova de funcionamento",
    texto:
      "A pausa passou a ser verificada dentro das funções, mas a tabela de configurações está vazia: nenhuma pausa jamais foi persistida. A eficácia prática do interruptor segue sem comprovação.",
  },
  {
    titulo: "Execuções agendadas gravadas como manuais",
    texto:
      "As funções fixam a origem manual por decisão de segurança. As 45 execuções, inclusive as agendadas das 06h04, aparecem como manuais, o que impede separar operação automática de operação humana no histórico.",
  },
  {
    titulo: "Nenhuma vaga real tem e-mail de recrutamento",
    texto:
      "Zero das 80 vagas possuem e-mail de recrutamento, o que inviabiliza o canal de envio por e-mail mesmo depois de o Gmail ser conectado.",
  },
  {
    titulo: "Oito versões de currículo continuam sem PDF",
    texto:
      "Com a regra nova, candidatura exige PDF privado. As 8 versões sem arquivo não podem ser enviadas até a recuperação ser executada, e a recuperação nunca foi executada.",
  },
  {
    titulo: "Trilha de auditoria vazia",
    texto:
      "O código de auditoria foi criado em 01/11 e o banco continua com zero registros. Sem trilha, a LGPD não pode ser demonstrada por evidência.",
  },
  {
    titulo: "Versão publicada desatualizada",
    texto:
      "A publicação é de 23/10 e não contém nenhuma correção de 01/11. O público e a banca, se acessarem o link, verão código anterior a todas as melhorias descritas neste relatório.",
  },
];

export const ordem = [
  "Configurar o orçamento mensal de IA e provar com uma análise real que o score deixa de ser zero.",
  "Republicar a aplicação para que a versão pública corresponda ao código do editor.",
  "Recuperar o PDF das 8 versões de currículo e chegar a 11 de 11 com arquivo.",
  "Configurar as credenciais externas: Twilio, Gmail e Outlook, com endereço de retorno e webhook.",
  "Preencher e-mail de recrutamento nas vagas reais e ampliar a lista de permissão de endpoint.",
  "Executar uma aprovação e um envio de demonstração completos após o endurecimento de 01/11.",
  "Executar a verificação de segurança, fechar Opportunity, remover entidades sem uso e popular a auditoria.",
  "Testar o isolamento entre duas contas reais e concluir uma extração de documento.",
];

export const trello = [
  ["01 Estrutura e autenticação", "Implementado", "Implementado, não homologado", "Guarda de perfil nas rotas administrativas", "Estrutura, rotas e login habilitado", "Teste com duas contas", "REVISAR", "08/11"],
  ["02 Banco e permissões", "Parcial", "Parcial", "3 de 4 entidades legadas fechadas", "Escrita sensível restrita ao backend", "Fechar Opportunity; teste entre usuários", "NÃO", "04/11"],
  ["03 Perfil profissional", "Implementado", "Implementado, não homologado", "Gravação via backend", "Wizard de 6 etapas e 2 perfis reais", "Teste de isolamento", "REVISAR", "08/11"],
  ["04 Documentos e extração", "Implementado", "Implementado, não homologado", "Sem mudança", "Upload privado", "Extração concluída: zero sucessos", "NÃO", "04/11"],
  ["05 Busca de vagas", "Concluído", "Concluído e validado", "Mais 13 vagas reais", "Coleta, deduplicação e persistência", "Filtros da interface; e-mail de recrutamento", "SIM", "Manter"],
  ["06 Compatibilidade IA", "Parcial", "Parcial", "Cache por impressão digital", "Cálculo determinístico", "Score zero não revalidado", "NÃO", "03/11"],
  ["07 Currículo em PDF", "Parcial", "Parcial", "Recuperação de PDF sem IA", "Geração e download", "8 versões sem PDF; recuperação não testada", "NÃO", "04/11"],
  ["08 Dashboard", "Implementado", "Implementado, não homologado", "Filtro de registros demo", "Métricas e histórico", "Validação com dado real", "REVISAR", "08/11"],
  ["09 Aprovação e recusa", "Implementado", "Parcial", "PDF obrigatório e auditoria", "Regras de estado", "Teste após a mudança", "NÃO", "06/11"],
  ["10 WhatsApp", "Bloqueado", "Bloqueado", "Nada além de texto", "Código e resposta 503 honesta", "Twilio, secrets e webhook", "NÃO", "05/11"],
  ["11 Gmail", "Bloqueado", "Bloqueado", "Envio idempotente", "Código de envio", "Conector OAuth e envio de teste", "NÃO", "06/11"],
  ["12 Outlook", "Bloqueado", "Bloqueado", "Envio idempotente", "Código de envio", "Conector OAuth", "NÃO", "06/11"],
  ["13 Submissão direta", "Concluído demo", "Parcial", "Token de envio", "2 comprovantes anteriores", "Um envio demo novo", "REVISAR", "06/11"],
  ["14 Automação", "Parcial", "Parcial", "Pausa, orçamento e recomendações", "Coleta diária comprovada", "Orçamento, zero análises, origem manual", "NÃO", "06/11"],
  ["15 Segurança e LGPD", "Parcial", "Parcial", "Rotas, permissões e código de auditoria", "3 entidades fechadas", "Verificação, testes e trilha populada", "NÃO", "03/11"],
  ["16 Demonstração", "Parcial", "Parcial", "Página inalterada", "Dados demo íntegros", "Republicar e ensaiar o roteiro", "NÃO", "08/11"],
];

export const acoesTrello = {
  concluir: ["05 Preferências e busca de vagas por API real, único cartão com evidência contínua de funcionamento."],
  abertos: [
    "02 Banco e permissões",
    "06 Compatibilidade com IA",
    "07 Currículo em PDF",
    "09 Aprovação e recusa",
    "10 WhatsApp",
    "11 Gmail",
    "12 Outlook",
    "14 Automação",
    "15 Segurança e LGPD",
    "16 Demonstração",
  ],
  revisar: ["01 Estrutura e autenticação", "03 Perfil", "08 Dashboard", "13 Submissão direta"],
  marcar: [
    "Rotas administrativas com validação de perfil na própria rota.",
    "Pausa verificada no servidor em qualquer execução.",
    "Orçamento mensal de IA com reserva atômica e bloqueio por padrão.",
    "Currículo com PDF privado obrigatório para candidatura.",
    "Cache de análise por impressão digital do conteúdo.",
    "76 vagas reais coletadas com deduplicação.",
    "Resume, StudentProfile e Document com leitura restrita.",
  ],
  testar: [
    "Score real diferente de zero.",
    "Recuperação de PDF nas 8 versões antigas.",
    "Aprovação completa após 01/11.",
    "Envio de demonstração com o novo token.",
    "Pausa persistida e efetiva.",
    "Orçamento mensal configurado e consumido.",
    "Isolamento entre dois usuários reais.",
    "Extração de documento concluída.",
  ],
  corretivos: [
    "Publicar a versão atual do editor.",
    "Fechar ou remover Opportunity e as entidades legadas sem uso.",
    "Configurar o orçamento mensal de IA.",
    "Popular a trilha de auditoria e comprovar a gravação.",
    "Registrar a origem real da execução, agendada ou manual.",
    "Preencher e-mail de recrutamento nas vagas reais.",
    "Executar a verificação de segurança da plataforma.",
  ],
};

export const plano = [
  ["03/11", "Segurança e compatibilidade", "Configurar orçamento e provar uma análise real; fechar Opportunity; executar verificação de segurança; popular a auditoria.", "4 pessoas"],
  ["04/11", "Documentos e PDFs", "Recuperar as 8 versões sem PDF até 11 de 11; concluir uma extração de documento; testar isolamento entre duas contas.", "4 pessoas"],
  ["05/11", "WhatsApp", "Criar conta Twilio, configurar secrets e número autorizado; testar envio e webhook; habilitar aprovação por código.", "2 pessoas"],
  ["06/11", "Gmail, automação e inscrição", "Configurar OAuth do Gmail e enviar ao próprio e-mail; ensaiar a automação com tentativas de IA maiores que zero; revisar o material do edital.", "4 pessoas"],
  ["08/11", "Homologação e demonstração", "Republicar a aplicação e ensaiar o roteiro completo e cronometrado, com plano alternativo em dados de demonstração.", "4 pessoas"],
  ["09/11", "Prazo interno conservador", "Reserva para imprevistos na inscrição do edital. Nenhuma tarefa nova.", "Equipe"],
];

export const notas = {
  trinta: [
    "Nenhuma alteração de código foi registrada em 31/10/2026. O histórico salta do relatório de auditoria, em 30/10 às 14h21 UTC, para um bloco de 23 alterações em 01/11, entre 11h44 e 13h08 no horário de Manaus. No dia 31/10 houve apenas execução automática, sem edição.",
    "DATA DA ALTERAÇÃO NÃO VERIFICÁVEL: não é possível afirmar que o trabalho de sábado foi gravado com data de domingo. O que se pode afirmar é que o sistema registra as mudanças em 01/11 e que não existe registro algum em 31/10. A divergência provavelmente vem do relógio da ferramenta externa, mas isso é hipótese, não evidência.",
    "Limitações do histórico: os 23 registros de 01/11 têm a mesma descrição genérica, sem autor individual, portanto a autoria não é atribuível. Não há histórico de publicação detalhado nem histórico por registro.",
  ],
  recomendacaoTrello:
    "Para o Trello, o correto é registrar os cartões de segurança e automação como concluídos em 01/11, e não em 31/10. A data de 31/10 não corresponde a nenhuma alteração registrada pela plataforma.",
};

export const veredito = [
  "Apto para demonstração: sim, com ressalvas operacionais. O fluxo existe de ponta a ponta e a coleta de vagas reais é o ponto mais sólido, com 21 dias de histórico. Porém a versão publicada é de 23/10 e precisa ser republicada, três elos do fluxo não têm execução recente comprovada e o score zero é o ponto mais frágil de uma apresentação sobre avaliação de aderência por IA.",
  "Apto para candidaturas reais: não. Nenhum canal de envio está homologado, nenhuma vaga tem e-mail de recrutamento, nenhuma candidatura real jamais foi enviada, a trilha de auditoria está vazia, não há teste entre usuários distintos e a verificação de segurança nunca foi executada.",
  "Recomendação final: um ensaio completo e cronometrado em 08/11, depois da republicação, com roteiro alternativo integralmente em dados de demonstração caso alguma integração falhe.",
];