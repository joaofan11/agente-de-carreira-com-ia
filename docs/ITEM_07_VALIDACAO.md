# 07 — Currículo personalizado por vaga

Base de revisão: `9d6856a`. Fluxo: Oportunidades → análise → Preparar currículo → Gerar com IA → revisão/edição → PDF → Aprovar versão. Aprovar salva um snapshot; não prepara nem envia candidatura automaticamente.

## Correções

- A vaga ativa e a análise selecionada são verificadas no servidor; análise de outro titular ou outra vaga é rejeitada. O perfil real pertence à sessão autenticada. Perfis de teste continuam restritos a administrador.
- Contato e fatos estruturados são conferidos com o perfil aprovado: formação, empresa/cargo, datas, atividades, projetos, tecnologias, curso e carga horária. O texto original de atividades e descrição de projetos é mantido, em vez de aceitar atividades inventadas a partir do cargo. Projetos permanecem na seção acadêmica.
- Nomes equivalentes em acentuação/caixa podem corresponder; itens sem correspondência única são rejeitados. Competências e idiomas sem correspondência nas listas estruturadas do perfil são omitidos com aviso. Sinônimos não reconhecidos podem exigir ajuste manual no perfil.
- A IA ainda organiza a seleção e redige objetivo/resumo. Esses textos livres exigem revisão humana; a checagem estrutural não comprova automaticamente todas as afirmações narrativas. Não há promessa de ausência absoluta de alucinações.
- Carga horária aparece no original, na revisão, no editor e no PDF.
- Troca de vaga/análise cria outra instância do gerador. Respostas atrasadas de carregamento e geração não substituem o contexto atual. As URLs locais do PDF são liberadas ao substituir o documento ou sair.
- Geração e aprovação têm guarda contra cliques simultâneos na mesma tela. Após aprovação, o botão fica desabilitado. Editar o conteúdo exige nova aprovação e permite nova versão. Isso não é uma trava transacional entre abas; a numeração por máximo existente continua sujeita a concorrência entre sessões.
- Conteúdo estruturado é validado antes do PDF/upload e no backend antes de salvar. Campos desconhecidos, incluindo campos de documento pessoal, são rejeitados; isso não detecta todos os dados pessoais que alguém inserir em texto livre.
- Snapshot permanece ligado à vaga e à análise e não admite edição in-place. Exclusão de registro/arquivo, autorização global de assinatura Core e testes cruzados completos continuam nos cartões 02B/15.

## Evidência técnica

117 testes aprovados, lint, typecheck e build oficial aprovados. Casos novos exercitam os handlers reais com banco, storage e IA substituídos localmente: restauração de fatos, rejeição de itens inventados, vínculo vaga/análise/titular, resposta inválida, snapshot aprovado, PDF e paginação. Testes do componente usam doubles de hooks para controlar concorrência e respostas atrasadas; não equivalem a navegação real no browser.

O carregador de módulos dos testes foi corrigido para terminar a inicialização antes de devolver o export default, pois o schema do gerador é declarado depois do handler. A suíte completa foi reexecutada.

[PDF fictício de referência](fixtures/07-curriculo-ficticio.pdf): gerado localmente a partir de fixtures, não por chamada real de IA. Um leitor independente (`pypdf`) extraiu nome, curso, 40 horas e datas corretamente. O teste com currículo longo gerou múltiplas páginas e preservou a seção final. Não há validação de todos os softwares ATS ou de todos os caracteres Unicode/fontes.

Nenhuma chamada real de IA, upload remoto, envio ou candidatura foi executada nesta revisão. As integrações reais e a navegação ainda precisam do ensaio abaixo.

## Ensaio no preview

1. Recarregar o editor do Base44. Em Oportunidades, analisar ou abrir a análise da vaga escolhida e clicar Preparar currículo. Conferir cargo e empresa no cabeçalho.
2. Clicar Gerar com IA. Conferir nome/contato, experiências, datas, curso, conclusão e carga horária contra Meu Perfil. Objetivo e resumo não podem atribuir qualificações ausentes. Uma compatibilidade baixa não é autorização para inventar competências.
3. Abrir Perfil Original e PDF; baixar o PDF e conferir legibilidade e conteúdo. Editar um trecho, salvar alterações e verificar que o PDF foi atualizado.
4. Clicar Aprovar versão uma vez. Esperado: versão pronta em Meus Currículos, ligada à vaga; botão Versão aprovada desabilitado. Aprovar não envia candidatura.
5. Recarregar e baixar a versão salva para conferir persistência. Edição posterior deve gerar nova versão aprovada, sem alterar a anterior.
6. Abrir outra vaga: o rascunho anterior não deve aparecer como currículo da nova vaga.

Esse ensaio envolve uma chamada real de IA por geração e upload privado ao aprovar, por ação do titular. O arquivo privado não tem exclusão física comprovada nesta etapa. Registrar capturas sanitizadas, ambiente e versão; não marcar publicado como homologado usando apenas evidência do preview.

## Status

Implementação corrigida e verificada localmente; pendente homologação funcional no preview com o perfil e a vaga escolhida. Sem publicação nesta etapa.
