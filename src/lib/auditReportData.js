// Conteúdo da auditoria técnica do MVP (leitura realizada em 30/10/2026).
export const auditMeta = {
  titulo: "Auditoria Técnica",
  subtitulo: "Agente de Carreira com IA — MVP para a feira UniNorte",
  data: "30 de outubro de 2026",
  metodo:
    "Verificação de 16 módulos cruzando três fontes de evidência: o código-fonte da aplicação, os registros reais do banco de dados e o estado da plataforma. Nenhum arquivo, registro ou configuração foi alterado, criado ou excluído durante o processo.",
};

export const resumoExecutivo = [
  "A conclusão central é que a interface existe em 16 de 16 módulos e a lógica está implementada em 15. Apenas duas integrações externas estão realmente configuradas: a API pública de vagas Jobicy e a camada de inteligência artificial da plataforma.",
  "WhatsApp, Gmail e Outlook estão completos em código e bloqueados por falta de credenciais: nenhum secret foi configurado e nenhum conector foi autorizado.",
  "Um único fluxo está comprovado de ponta a ponta: o modo demonstração, com duas candidaturas enviadas ao receptor demo e comprovantes persistidos no banco.",
  "Nenhum envio real de e-mail ou de WhatsApp jamais ocorreu. Nenhuma candidatura real foi aprovada, enviada ou comprovada.",
];

export const plataforma = [
  { label: "Endereço publicado", value: "https://carreira-foco-ia.base44.app" },
  { label: "Última publicação", value: "23/10/2026 — existem alterações no editor ainda não publicadas" },
  { label: "Visibilidade", value: "Pública: o app abre sem exigir login" },
  { label: "Métodos de login", value: "E-mail e senha, Google, Microsoft, Facebook e Apple" },
  { label: "Domínio próprio", value: "Não conectado" },
  { label: "Secrets configurados", value: "Nenhum" },
  { label: "Conectores autorizados", value: "Nenhum" },
  { label: "Verificação de segurança", value: "Nunca executada" },
  { label: "Verificação de SEO", value: "Nunca executada" },
  { label: "Colaboradores", value: "1" },
];

export const camadas = [
  { camada: "Interface criada", situacao: "16 de 16 módulos têm tela." },
  { camada: "Lógica implementada", situacao: "15 de 16. O registro de auditoria não é gravado e a etapa de processamento automático não produz resultado." },
  { camada: "Integração configurada", situacao: "2 de 5. Funcionam a API de vagas e a camada de IA; WhatsApp, Gmail e Outlook estão sem credenciais." },
  { camada: "Testado de ponta a ponta", situacao: "1 de 16. Somente a submissão direta ao receptor demo." },
];

export const funcionais = [
  {
    titulo: "Funcionam de ponta a ponta",
    modulos: ["01 Estrutura e autenticação", "03 Cadastro e perfil", "05 Preferências e busca", "13 Submissão direta (demo)"],
  },
  {
    titulo: "Funcionam parcialmente",
    modulos: ["08 Dashboard e histórico", "09 Aprovação e recusa", "14 Busca automática"],
  },
  {
    titulo: "Somente interface e lógica, sem operação",
    modulos: ["04 Extração por IA", "07 Currículo em PDF", "10 WhatsApp", "11 Gmail", "12 Outlook"],
  },
  {
    titulo: "Transversais, parciais por dependência",
    modulos: ["02 Entidades e permissões", "06 Análise de compatibilidade", "15 Segurança e LGPD", "16 Demonstração"],
  },
];

export const modulos = [
  {
    n: "01",
    nome: "Estrutura, páginas e autenticação",
    status: "IMPLEMENTADO",
    evidencias:
      "18 páginas, layout com menu lateral e drawer, rota protegida e contexto de autenticação; 11 rotas sob proteção. Login por e-mail, Google, Microsoft, Facebook e Apple habilitados na plataforma.",
  },
  {
    n: "02",
    nome: "Entidades e permissões",
    status: "PARCIAL",
    evidencias:
      "18 entidades com criação e atualização restritas ao serviço nas 8 entidades pessoais. Quatro entidades legadas sem uso mantêm permissão de leitura mais aberta que as equivalentes em uso.",
  },
  {
    n: "03",
    nome: "Cadastro e perfil profissional",
    status: "IMPLEMENTADO",
    evidencias:
      "Wizard de 6 etapas, salvamento e recarga pelo backend, validação de propriedade do registro. 2 perfis reais gravados e testados.",
  },
  {
    n: "04",
    nome: "Upload de CTPS/certificados com extração por IA",
    status: "PARCIAL",
    evidencias:
      "Upload privado e tela de revisão da extração existem. Os 4 documentos estão com extração pendente: nenhuma extração concluída foi registrada.",
  },
  {
    n: "05",
    nome: "Preferências e busca por API real",
    status: "IMPLEMENTADO",
    evidencias:
      "Coleta pela API pública Jobicy, sem chave de acesso. 63 vagas reais e 4 de demonstração armazenadas.",
  },
  {
    n: "06",
    nome: "Análise de compatibilidade",
    status: "PARCIAL",
    evidencias:
      "Três análises reais registradas com score 0; as pontuações altas (95, 95 e 82) existem apenas em dados de demonstração.",
  },
  {
    n: "07",
    nome: "Currículo em PDF",
    status: "PARCIAL",
    evidencias:
      "Geração por IA e PDF em A4, coluna única e texto selecionável. 11 versões criadas, apenas 3 com PDF anexado.",
  },
  {
    n: "08",
    nome: "Dashboard e histórico",
    status: "IMPLEMENTADO",
    evidencias:
      "Indicadores, gráficos e histórico de atividade com filtro de registros de demonstração aplicado no servidor.",
  },
  {
    n: "09",
    nome: "Aprovação e recusa",
    status: "IMPLEMENTADO",
    evidencias:
      "Máquina de estados com bloqueio de estados terminais e validação do currículo aprovado. 4 pendentes e 3 recusadas, todas de demonstração.",
  },
  {
    n: "10",
    nome: "WhatsApp (alertas, webhook e aprovação)",
    status: "PARCIAL",
    evidencias:
      "Webhook com validação de assinatura e envio via Twilio implementados. Sem secrets configurados, o envio retorna erro 503.",
  },
  {
    n: "11",
    nome: "Gmail (OAuth e envio)",
    status: "PARCIAL",
    evidencias:
      "Envio, montagem da mensagem e prévia implementados. Identificador do conector vazio: o envio retorna erro 503.",
  },
  {
    n: "12",
    nome: "Outlook e Microsoft Graph",
    status: "PARCIAL",
    evidencias:
      "Envio, montagem da mensagem e prévia implementados. Identificador do conector vazio: o envio retorna erro 503.",
  },
  {
    n: "13",
    nome: "Submissão direta",
    status: "IMPLEMENTADO (DEMO)",
    evidencias:
      "Endpoint em lista de permissão, receptor demo e comprovante persistido. 2 candidaturas enviadas com comprovante real e registro de recebimento.",
  },
  {
    n: "14",
    nome: "Busca automática por automação",
    status: "PARCIAL",
    evidencias:
      "Rotina diária ativa às 06:00 de Manaus; 10 execuções bem-sucedidas e 1 falha por erro HTTP 403 da API. A etapa de processamento nunca gerou análise nem candidatura.",
  },
  {
    n: "15",
    nome: "Segurança, LGPD e testes",
    status: "PARCIAL",
    evidencias:
      "Validação de propriedade e imutabilidade implementadas; política de privacidade em rascunho. Registro de auditoria vazio, nenhum scan de segurança e nenhum teste automatizado.",
  },
  {
    n: "16",
    nome: "Ambiente de demonstração",
    status: "PARCIAL",
    evidencias:
      "Roteiro, cenário de 4 seções e painel de status das integrações prontos; o lote atual tem 1 item por etapa.",
  },
];

export const cincoPassos = [
  {
    n: "1",
    elo: "Perfil do estudante",
    status: "Funciona",
    impedimento:
      "Cadastro e edição operam, mas com perfil real incompleto as análises resultam em score 0 e a fórmula de conclusão difere entre o Dashboard e o editor de perfil.",
  },
  {
    n: "2",
    elo: "Vaga e compatibilidade",
    status: "Parcial",
    impedimento:
      "A coleta funciona, porém nenhuma das 63 vagas reais tem e-mail de recrutamento e apenas 3 vagas de demonstração têm endpoint. Nenhuma análise real gerou score alto.",
  },
  {
    n: "3",
    elo: "Currículo adaptado",
    status: "Parcial",
    impedimento:
      "8 das 11 versões não têm PDF e, sem PDF, não podem ser enviadas por e-mail nem por API.",
  },
  {
    n: "4",
    elo: "Aprovação",
    status: "Parcial",
    impedimento:
      "Lógica e bloqueios corretos, mas nunca exercitados com candidatura real; o registro de auditoria está vazio.",
  },
  {
    n: "5",
    elo: "Envio com comprovante",
    status: "Parcial",
    impedimento:
      "E-mail e WhatsApp retornam erro 503 por falta de credenciais; a API direta aceita apenas o endpoint de demonstração e recusa vaga real com erro 400.",
  },
];

export const problemas = [
  {
    titulo: "A pausa da automação não funciona",
    texto:
      "Em execução agendada a identificação do usuário retorna um perfil, a execução é tratada como manual e o bloco que consulta a configuração de pausa é ignorado. Isso também explica por que as execuções agendadas ficaram gravadas com origem manual.",
  },
  {
    titulo: "A segunda etapa da automação é inerte",
    texto:
      "Em todas as execuções registradas, zero análises realizadas e zero candidaturas criadas. A rotina coleta vagas, mas não avança.",
  },
  {
    titulo: "A configuração de pausa nunca foi gravada",
    texto:
      "A tabela de configurações da aplicação está vazia, portanto o interruptor de pausa nunca chegou a ser persistido.",
  },
  {
    titulo: "Nenhuma vaga real tem e-mail de recrutamento",
    texto:
      "Zero das 63 vagas coletadas possuem e-mail de recrutamento, o que inviabiliza o canal de envio por e-mail mesmo com o Gmail conectado.",
  },
  {
    titulo: "A maioria das versões de currículo não tem PDF",
    texto:
      "Oito das onze versões não possuem arquivo PDF, e o envio exige PDF: essas versões não podem ser despachadas.",
  },
  {
    titulo: "Entidades legadas ativas com permissão mais aberta",
    texto:
      "Quatro entidades antigas continuam existindo sem uso, entre elas uma com leitura aberta a qualquer usuário autenticado. Aumentam a superfície de risco e confundem o modelo de dados.",
  },
  {
    titulo: "Rotas administrativas sem guarda na própria rota",
    texto:
      "As rotas de administração e de demonstração não verificam o papel do usuário na rota: a proteção ocorre apenas dentro do componente, sem defesa em profundidade.",
  },
  {
    titulo: "Publicação e verificações pendentes",
    texto:
      "Existem alterações não publicadas desde 23/10/2026, nenhuma verificação de segurança foi executada e o registro de auditoria tem zero registros gravados.",
  },
];

export const ordem = [
  "Configuração externa: secrets do Twilio, conectores Gmail e Outlook, endereços de retorno e webhook. Desbloqueia os módulos 10, 11 e 12.",
  "Correção da automação: distinguir execução agendada de manual e fazer a etapa de processamento realmente produzir resultado.",
  "Dados de vaga: incluir e-mail de recrutamento e endpoint nas vagas reais e ampliar a lista de permissão.",
  "PDF em toda versão de currículo gerada.",
  "Concluir a extração de um documento real de ponta a ponta.",
  "Validar a cadeia completa com um perfil real, até o envio com comprovante.",
  "Segurança e LGPD: executar o scan, revisar as entidades legadas, gravar o registro de auditoria e testar o isolamento com duas contas.",
  "Publicar as alterações pendentes.",
];

export const veredito = [
  "Apto para demonstração de ponta a ponta: sim, mas somente no modo demonstração. O caminho perfil fictício, vaga demo, compatibilidade, currículo, aprovação e envio ao receptor demo já produziu duas candidaturas com comprovante persistido. É o único fluxo comprovadamente completo.",
  "Apto para candidatura real: não. E-mail e WhatsApp retornam erro 503, as vagas reais não têm e-mail de recrutamento nem endpoint e a maioria das versões de currículo não tem PDF. Também não existe prova de envio real a terceiros.",
  "Ressalva para a apresentação: o lote de demonstração está no mínimo necessário, com um item por etapa, e a versão 1 do currículo demo não possui PDF. Se o roteiro tentar enviar a versão original, a operação falha.",
];