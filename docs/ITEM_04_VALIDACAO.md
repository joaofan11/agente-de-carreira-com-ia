# 04 — Upload e extração de CTPS e certificados

Data: 04/11/2026. Implementação derivada de `d518eaf`, preservando os relatórios 02B do Base44. Não altera os vereditos do 02B nem do 15.

## Correções implementadas

- Upload por JSON (bytes do PDF codificados em base64) pelo SDK existente para `manageCandidateDocument`, autenticado, com validação no navegador e servidor: extensão, MIME quando informado, tamanho máximo de 5 MB, arquivo não vazio e cabeçalho `%PDF-`. Essa checagem não é parser completo de PDF nem detecção de senha/malware.
- O servidor envia os bytes ao storage privado e grava o proprietário a partir da sessão; não aceita mais cadastrar documento fornecendo um caminho privado arbitrário. O fluxo de abertura recebe `document_id` e verifica propriedade antes de assinar. Isso não comprova nem altera a autorização do endpoint Core de assinatura da plataforma, ainda pendente no 02B.
- Erro de listagem visível e botão para atualizar. Mensagens de erro do backend apresentadas na tela.
- Extração usa InvokeLLM no servidor com o PDF, esquema estruturado e instrução de ignorar comandos no documento. A resposta é reduzida aos campos esperados; campos extras não são gravados. Isso não garante ausência de dados indevidos dentro de campos textuais; a revisão continua necessária.
- O perfil não muda durante a extração. O titular edita e aprova as informações antes da incorporação pelo servidor.
- Datas completas reconhecidas são reduzidas a MM/AAAA. Data não identificada fica vazia no perfil. Ano sem mês não vira uma data inventada e deve ser corrigido ou removido na revisão. Término anterior ao início é rejeitado.
- Carga horária do certificado é preservada no perfil e pode ser editada em Meu Perfil.
- Aprovação grava `extracao_confirmada_em` e `perfil_destino_id`. Repetição após confirmação não adiciona novamente. A mesclagem evita duplicatas por identidade de empresa/cargo/datas ou curso/instituição/data, inclusive após falha entre gravação do perfil e marcação do documento.
- Extração concluída é reutilizada sem nova chamada. Estado recente em processamento recebe 409; estado travado há mais de 10 minutos pode ser tentado novamente. Essa guarda não é trava transacional distribuída: chamadas simultâneas em instâncias distintas e alterações concorrentes de perfil ainda exigem avaliação própria.
- Auditoria mínima de upload e confirmação, sem conteúdo documental. Falha no registro após upload informa possível resíduo, sem alegar rollback físico. Remoção de registro avisa que não apaga arquivo privado.

## Evidência local

`tests/document-extraction-flow.test.mjs` exercita os handlers reais com autenticação, banco e integrações substituídos por doubles em memória. Inclui CTPS, certificado, revisão, preservação do perfil, datas, carga horária, repetição, erro da IA, arquivo inválido, caminho arbitrário, acesso de outro dono e falha parcial.

`tests/document-review.test.mjs` verifica o payload produzido pelo componente real de revisão e a serialização JSON do SDK instalado, preservação de bytes binários e limite de 5 MB.

Resultado: 102 testes aprovados na suíte completa; lint e typecheck aprovados; build oficial Base44 aprovado com o app vinculado. Não foram feitos uploads remotos, chamadas reais de IA, envios ou exclusões de dados para obter essa evidência. Não é uma homologação de OCR/extração real nem de navegação no publicado.

## Teste final pela interface

Executar primeiro no preview/editor sincronizado; testar no publicado somente após publicação deliberada da mesma versão. Anotar versão, ambiente, horário e resultado. Os PDFs abaixo são locais e inteiramente fictícios. Enviá-los ao app cria arquivos privados cuja exclusão definitiva ainda depende do fornecedor; não há limpeza física automática comprovada.

1. Em Documentos, selecionar CTPS e enviar [04-ctps-ficticia.pdf](fixtures/04-ctps-ficticia.pdf). Clicar Extrair. Esperado: duas experiências — Oficina Ficticia Aurora / Assistente administrativo / 02/2024 / Atual e Laboratorio Ficticio Rio / Estagiario de tecnologia / 02/2020 / 08/2021. Antes da aprovação, o perfil não deve mudar.
2. Revisar um campo, aprovar e conferir Meu Perfil. As experiências preexistentes devem permanecer. Reabrir a revisão não pode permitir adicionar a mesma extração novamente.
3. Selecionar Certificado e enviar [04-certificado-ficticio.pdf](fixtures/04-certificado-ficticio.pdf). Esperado: Introducao a Analise de Dados; Instituto Ficticio Horizonte; 03/2024; 40 horas. Aprovar e verificar os quatro campos no perfil.
4. Atualizar a página e confirmar persistência. Não confundir voltar à lista com sucesso do salvamento.
5. Testar arquivo vazio, arquivo de outro tipo renomeado e arquivo acima de 5 MB; devem ser recusados antes do upload. PDF com senha ou ilegível pode falhar na extração; deve apresentar erro e permitir nova tentativa.

O ensaio real exige chamadas de IA e upload por ação do titular; não foi executado automaticamente nesta alteração. Para encerramento do item 04, anexar capturas sanitizadas do upload, revisão e perfil persistido, registrando eventuais divergências da IA. Documentos escaneados e arquivos com senha não foram homologados.

## Texto para o cartão

Implementação do fluxo upload → extração → revisão → perfil corrigida e testada localmente. Código integrado por GitHub e sincronizado ao editor após validação. Pendente teste funcional no ambiente Base44 com os dois PDFs fictícios; ainda não declarar extração real homologada. Pendências de isolamento completo e eliminação física seguem nos cartões 02B/15.


## Correção após teste no preview

O teste manual do titular encontrou `No number after minus sign in JSON at position 1` durante o envio multipart. Esse erro é compatível com um corpo iniciado por boundary multipart sendo interpretado como JSON. Os logs consultados não forneceram a pilha dessa execução; não foi atribuída a uma camada específica como fato confirmado.

O frontend agora envia JSON com bytes em base64 e o backend reconstrói e valida o File antes do storage. Não aceita referência de arquivo arbitrária, não faz fallback automático que possa duplicar upload e não muda a etapa de extração por IA. Metadados seguem limitados a 60 KB, enquanto o campo codificado tem limite próprio equivalente a um PDF de 5 MB. Clientes antigos recebem orientação para atualizar quando a requisição chega como multipart.

Regressões acrescentadas: gateway que interpreta apenas JSON; corpo multipart indevidamente rotulado como JSON sem exposição do erro bruto; base64 inválido/acima do limite; PDF no limite exato de 5 MB; preservação de bytes binários pelo SDK. Testes locais não comprovam o upload completo no serviço remoto. O ensaio final pela interface permanece necessário.


## Correção de direcionamento de funções no editor

O titular encontrou `Campos não permitidos: tipo_documento, nome_arquivo, file_name, file_type, file_base64`. Uma sondagem autenticada com PDF inválido reproduziu exatamente esse erro no destino `prod`; com `preview`, o mesmo payload alcançou a validação nova e retornou `O arquivo não contém um cabeçalho PDF válido.`. As duas chamadas foram rejeitadas antes de upload, auditoria de upload ou IA.

O bootstrap do SDK usava apenas `VITE_BASE44_FUNCTIONS_VERSION`, permitindo que uma UI de rascunho chamasse a função publicada. Agora o cliente seleciona `preview` quando o navegador informa que está incorporado no editor oficial `https://app.base44.com`, via origem do referrer ou ancestorOrigins. Fora desse contexto, mantém a configuração explícita preview/prod e usa prod por padrão. Não lê parâmetros de URL nem localStorage para mudar versão, servidor, app ou credenciais. Isso escolhe a versão do código, não um banco de teste: o ambiente de dados continua sujeito à configuração existente.

Seis regressões adicionais cobrem editor com build prod, referrer suprimido com origem ancestral, site independente, origem falsa, configuração explícita e o header enviado pelo método invoke do SDK real. A sondagem remota diferencia versões; não comprova upload completo. Depois de sincronizar, recarregar o preview para criar o cliente com a seleção correta.
