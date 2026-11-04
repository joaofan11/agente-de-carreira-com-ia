import React from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, FileText, Eye, Trash2, Bell, Lock, UserCheck } from "lucide-react";

export default function Privacidade() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title="Política de Privacidade"
        description="Como seus dados são coletados, usados e protegidos. Rascunho para revisão do responsável."
      />

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <FileText className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          <strong>Documento em rascunho.</strong> Esta política é um rascunho para revisão do responsável legal.
          Não constitui conformidade jurídica certificada. Antes da publicação, revise com assessoria jurídica.
        </span>
      </div>

      <Card>
        <CardContent className="prose prose-sm max-w-none p-6 space-y-6">
          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><UserCheck className="h-5 w-5 text-primary" /> 1. Finalidade do tratamento</h2>
            <p className="text-sm text-muted-foreground mt-2">
              O Anexa.AI coleta e processa dados pessoais de estudantes universitários da Amazônia
              com as seguintes finalidades:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc pl-5">
              <li><strong>Perfil acadêmico e profissional:</strong> nome, e-mail, telefone, instituição, curso, competências, experiências e projetos — para análise de compatibilidade com vagas e geração de currículos.</li>
              <li><strong>Documentos:</strong> CTPS e certificados em PDF — para extração de dados via IA. Os documentos originais são privados e nunca enviados a recrutadores.</li>
              <li><strong>Preferências de vagas:</strong> cargos, áreas, níveis, localizações e modalidades — para filtrar oportunidades relevantes.</li>
              <li><strong>Candidaturas:</strong> status, método de envio e comprovantes — para acompanhar o processo seletivo.</li>
              <li><strong>Notificações:</strong> alertas de oportunidades e aprovações via WhatsApp (opcional, com consentimento explícito).</li>
            </ul>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Lock className="h-5 w-5 text-primary" /> 2. Coleta mínima e separação de dados</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Seguimos o princípio da coleta mínima. Solicitamos apenas os dados necessários para a finalidade declarada.
              A CTPS é <strong>opcional</strong> — usada apenas para extrair experiências profissionais, nunca obrigatória.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Documentos originais são separados dos dados extraídos:</strong> os PDFs ficam em storage privado
              (acessível apenas ao dono), enquanto os dados extraídos pela IA são revisados pelo usuário antes de
              serem incorporados ao perfil. Os documentos originais nunca são enviados a recrutadores — apenas o
              currículo adaptado (PDF gerado pela plataforma) é anexado às candidaturas.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Eye className="h-5 w-5 text-primary" /> 3. Acesso e isolamento de dados</h2>
            <p className="text-sm text-muted-foreground mt-2">
              As regras de acesso foram projetadas para limitar cada estudante aos próprios registros de perfil,
              documentos, preferências, análises, currículos, candidaturas e notificações. A validação de isolamento
              entre duas contas no ambiente publicado ainda está pendente. Até sua conclusão, use apenas dados fictícios.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              As telas administrativas destinam-se à gestão de vagas, automação, integrações e auditoria.
              Funções de backend usam acesso privilegiado para operações autorizadas; por isso, controles de
              propriedade também são necessários no servidor. O acesso operacional do responsável e dos
              fornecedores deve ser documentado antes do uso com dados reais.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><FileText className="h-5 w-5 text-primary" /> 4. Revisão e atualização</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Você pode revisar e atualizar seus dados a qualquer momento em "Meu Perfil". Dados extraídos de
              documentos pela IA são sempre revisados por você antes de serem incorporados ao perfil — você
              decide quais informações manter.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Trash2 className="h-5 w-5 text-primary" /> 5. Solicitação de exclusão</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Você pode solicitar a exclusão de seus dados a qualquer momento. Para isso, entre em contato com o
              responsável pela plataforma. O procedimento para excluir registros, arquivos e cópias de segurança,
              assim como as retenções legais aplicáveis à auditoria, ainda precisa ser definido e validado.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Bell className="h-5 w-5 text-primary" /> 6. Autorizações de notificações e candidaturas</h2>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Notificações WhatsApp:</strong> opcionais. Você deve consentir explicitamente em "Configurações".
              Podem ser desativadas a qualquer momento. O WhatsApp é usado apenas para alertas e aprovações —
              nunca para enviar currículos a recrutadores.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Candidaturas:</strong> nenhuma candidatura é enviada sem sua aprovação prévia. Cada envio
              requer confirmação explícita (in-app ou via WhatsApp). O conteúdo e destinatário são sempre
              exibidos para revisão antes do envio.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="h-5 w-5 text-primary" /> 7. Controles técnicos em validação</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Os controles abaixo orientam a implementação. Sua efetividade no ambiente publicado e nas
              integrações ainda precisa ser verificada; esta lista não é uma certificação de segurança.
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc pl-5">
              <li>Documentos em storage privado com URLs assinadas de acesso temporário.</li>
              <li>Autenticação obrigatória em todas as funções de backend.</li>
              <li>Validação de assinatura em webhooks (Twilio).</li>
              <li>Allowlist de endpoints para submissão direta por API.</li>
              <li>Validação de destinatários de e-mail e tamanho de anexos.</li>
              <li>Logs sanitizados — códigos de aprovação e conteúdo sensível são mascarados.</li>
              <li>Prevenção de execução duplicada e concorrente em automações.</li>
              <li>Credenciais de integração armazenadas como segredos, nunca no frontend.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Compartilhamento com terceiros</h2>
            <p className="text-sm text-muted-foreground mt-2">
              O Anexa.AI utiliza o Base44 e recursos de processamento de IA. As candidaturas são enviadas
              apenas para as empresas das vagas que você aprova, contendo apenas o currículo adaptado e dados
              básicos de contato. Documentos originais (CTPS, certificados) não devem ser enviados aos recrutadores.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              A análise de compatibilidade e geração de currículos usam serviços de IA que recebem apenas os
              dados estruturados do seu perfil (sem documentos originais).
              A extração de CTPS e certificados é um fluxo distinto: o documento é disponibilizado ao serviço
              de extração de IA. Os fornecedores, locais de processamento e condições desse tratamento
              precisam ser confirmados e informados antes de habilitar documentos reais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">9. Retenção de dados</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Os prazos de retenção, atendimento de exclusão e tratamento de cópias de segurança ainda estão
              em definição pelo responsável. Não há prazo de exclusão homologado nesta versão.
              Os registros de demonstração são identificados para separá-los dos registros reais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">10. Contato</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Para dúvidas, solicitações de acesso, revisão ou exclusão de dados, entre em contato com o
              responsável pela plataforma. A identificação do controlador e um canal de contato para exercer
              direitos previstos na LGPD ainda precisam ser publicados antes da coleta de dados reais.
            </p>
          </section>

          <div className="border-t pt-4 text-xs text-muted-foreground">
            <p>
              <strong>Base legal:</strong> Lei nº 13.709/2018 (LGPD). Esta política é um rascunho técnico e não
              substitui a revisão jurídica formal. Última revisão do texto: 04/11/2026.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}