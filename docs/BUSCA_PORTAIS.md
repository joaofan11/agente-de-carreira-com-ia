# Busca de vagas e identificação da fonte

A coleta mantém Jobicy e adiciona SerpApi, engine Google Jobs (`https://serpapi.com/google-jobs-api`). Importa resultados cuja opção de candidatura aponta diretamente a uma vaga em Gupy, LinkedIn ou InfoJobs Brasil. Não é uma integração oficial desses três portais nem um crawler de suas páginas. Google Jobs pode não indexar determinadas vagas; uma consulta pode não trazer nenhum desses portais. Apenas a primeira página da busca de portais é consultada por execução para limitar consumo.

## Ativação no Base44

1. Obter uma chave de API em https://serpapi.com/manage-api-key (conta e cota do responsável pelo projeto; não é necessário fornecer senhas de LinkedIn/Gupy/InfoJobs).
2. No painel do aplicativo Base44, abrir a configuração de segredos das funções/backend (Secrets). Adicionar **SERPAPI_API_KEY** com o valor da chave. Nunca colocar em variável VITE, código, repositório ou chat.
3. No preview, como administrador, abrir Oportunidades. Informar cargo/área e localização, por exemplo “estágio em administração” e “Manaus, Amazonas, Brasil”. Usar Atualizar vagas.
4. Conferir fonte e link original nos cartões e detalhes. Zero resultados é possível; não significa integração validada com os três portais. Registrar consulta, horário e resultados reais antes de homologar.

A ativação e uma consulta real autenticada ainda precisam ser verificadas pelo responsável. O código não cria conta SerpApi, assina planos nem pressupõe uma chave disponível. Não houve busca paga real, coleta remota ou gravação de vagas durante os testes de desenvolvimento. A alteração é sincronizada no editor, sem publicação automática.

## Comportamento e limites

- Ausência de chave ou falha de um provedor aparece como aviso na atualização, preservando a coleta dos demais. Se nenhum provedor puder ser consultado, a operação falha explicitamente.
- Apenas cargo/área e localidade são enviados à SerpApi; nenhum perfil, documento, currículo ou identificador do usuário é enviado. Jobicy mantém sua coleta remota geral, sem aplicar a localidade da consulta de portais.
- Coleta requer administrador. A automação existente compartilha o coletor e registra o estado das fontes; isso não altera sua autenticação ou habilita agendamento.
- Origem exibida deriva do domínio HTTPS, não do título informado pelo provedor. Links suspeitos, redirecionadores, páginas gerais e domínios parecidos são descartados na importação. Sem abrir ou baixar a página da vaga, isso não comprova que o anúncio permanece aberto.
- URLs de origem e identificadores separados por portal permitem deduplicar anúncios repetidos do mesmo portal. O mesmo anúncio publicado em dois portais pode aparecer duas vezes, cada um com seu link.
- São importados títulos reconhecidos como estágio, trainee ou júnior. Não se inventam empresa, conteúdo, requisitos, data ou modalidade. Modalidade ausente aparece “Não informada”; texto resumido/ausente pode limitar a análise de compatibilidade. Não há inferência com IA na coleta.
- Currículos e candidaturas continuam dependendo de revisão e aprovação; coletar uma vaga não envia candidatura.

## Validação local

Testes exercitam identificação dos três domínios, URLs maliciosas, títulos fora do nível de entrada, duplicidade de opções, ausência de chave, erros/cota/respostas inválidas, preservação do Jobicy, falha de todas as fontes e autenticação administrativa do handler real. Banco e transporte são substituídos localmente; não equivalem a homologação do provedor hospedado.
