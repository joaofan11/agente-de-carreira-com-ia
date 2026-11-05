import { jsPDF } from "jspdf";
import {
  auditMeta,
  resumoExecutivo,
  plataforma,
  camadas,
  funcionais,
  comparativo,
  alteracoes,
  modulos,
  integracoes,
  seguranca,
  fluxo,
  cincoPassos,
  trello,
  acoesTrello,
  plano,
  notas,
  ordem,
  veredito,
} from "./auditReportData";

const PW = 210;
const PH = 297;
const M = 16;
const CW = PW - 2 * M;

/** @type {[number, number, number]} */
const NAVY = [14, 49, 98];
/** @type {[number, number, number]} */
const GREEN = [22, 120, 73];
/** @type {[number, number, number]} */
const AMBER = [168, 106, 10];
/** @type {[number, number, number]} */
const RED = [178, 40, 40];
/** @type {[number, number, number]} */
const GRAY = [100, 110, 125];
/** @type {[number, number, number]} */
const INK = [38, 44, 52];
/** @type {[number, number, number]} */
const LIGHT = [244, 246, 250];

/** @type {Record<string, [number, number, number]>} */
const STATUS_COLOR = {
  IMPLEMENTADO: GREEN,
  "IMPLEMENTADO (DEMO)": GREEN,
  "IMPLEMENTADO, NÃO HOMOLOGADO": AMBER,
  "CONCLUÍDO E VALIDADO": GREEN,
  "Concluído e validado": GREEN,
  Concluído: GREEN,
  Implementado: GREEN,
  "Concluído demo": GREEN,
  "Implementado, não homologado": AMBER,
  PARCIAL: AMBER,
  Parcial: AMBER,
  BLOQUEADO: RED,
  Bloqueado: RED,
  "NÃO IMPLEMENTADO": RED,
  "NÃO VERIFICÁVEL": GRAY,
  Funciona: GREEN,
  "Funciona com dados reais": GREEN,
  Funcionando: GREEN,
  SIM: GREEN,
  NÃO: RED,
  REVISAR: AMBER,
  "Disponível, sem uso comprovado": AMBER,
  "Bloqueado, erro 503": RED,
  "Funcionou antes de 01/11": AMBER,
  "Manter": GREEN,
};

export function generateAuditPdf() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 0;

  const band = () => {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, PW, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Anexa.AI", M, 9);
    doc.setFont("helvetica", "normal");
    doc.text(auditMeta.data, PW - M, 9, { align: "right" });
    y = 24;
  };

  const newPage = () => {
    doc.addPage();
    band();
  };

  const ensure = (h) => {
    if (y + h > PH - 16) newPage();
  };

  const para = (text, size = 9.5, color = INK, indent = 0) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, CW - indent);
    const lh = size * 0.44;
    lines.forEach((line) => {
      ensure(lh + 1);
      doc.text(line, M + indent, y);
      y += lh + 0.5;
    });
  };

  const h2 = (text) => {
    ensure(20);
    y += 4;
    doc.setFillColor(...GREEN);
    doc.rect(M, y - 3.4, 1.6, 4.8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    const lines = doc.splitTextToSize(text, CW - 6);
    lines.forEach((line, idx) => doc.text(line, M + 4.5, y + idx * 5));
    y += 6.5 + (lines.length - 1) * 5;
  };

  const h3 = (text) => {
    ensure(12);
    y += 1.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...NAVY);
    doc.text(text, M, y);
    y += 4.2;
  };

  const labeled = (label, value) => {
    ensure(11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...NAVY);
    doc.text(label, M, y);
    y += 3.6;
    para(value, 9, INK, 3);
    y += 1.4;
  };

  const bullets = (items, bullet = "-") => {
    items.forEach((item) => {
      ensure(10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      doc.text(bullet, M + 1, y);
      para(typeof item === "string" ? item : `${item.titulo}. ${item.texto}`, 9, INK, 5);
      y += 1.2;
    });
  };

  const numbered = (items) => {
    items.forEach((item, i) => {
      ensure(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...NAVY);
      doc.text(`${i + 1}.`, M + 1, y);
      para(String(item), 9, INK, 6);
      y += 1.2;
    });
  };

  const table = (headers, widths, rows, statusCols = [], fontSize = 8) => {
    const drawHeader = () => {
      doc.setFillColor(...NAVY);
      doc.rect(M, y, CW, 7.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      let x = M + 2;
      headers.forEach((h, i) => {
        doc.text(String(h), x, y + 5);
        x += widths[i];
      });
      y += 7.5;
    };

    ensure(18);
    drawHeader();

    rows.forEach((row, ri) => {
      const lines = row.map((cell, i) => {
        doc.setFont("helvetica", i <= 1 ? "bold" : "normal");
        doc.setFontSize(fontSize);
        return doc.splitTextToSize(String(cell), widths[i] - 3);
      });
      const maxLines = Math.max(...lines.map((l) => l.length));
      const lh = fontSize * 0.42;
      const rh = maxLines * lh + 3;

      if (y + rh > PH - 16) {
        newPage();
        drawHeader();
      }

      if (ri % 2 === 1) {
        doc.setFillColor(...LIGHT);
        doc.rect(M, y, CW, rh, "F");
      }

      let x = M + 2;
      row.forEach((cell, i) => {
        doc.setFont("helvetica", i <= 1 ? "bold" : "normal");
        doc.setFontSize(fontSize);
        if (statusCols.includes(i)) doc.setTextColor(...(STATUS_COLOR[cell] || GRAY));
        else doc.setTextColor(...INK);
        lines[i].forEach((line, li) => doc.text(line, x, y + 4 + li * lh));
        x += widths[i];
      });

      doc.setDrawColor(220, 224, 230);
      doc.setLineWidth(0.2);
      doc.line(M, y + rh, M + CW, y + rh);
      y += rh;
    });

    y += 4;
  };

  // ---- Cabeçalho ----
  band();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(...NAVY);
  doc.text(auditMeta.titulo, M, y + 6);
  y += 12;
  doc.setFontSize(10.5);
  doc.setTextColor(...GREEN);
  doc.text(auditMeta.subtitulo, M, y);
  y += 5.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  doc.text(auditMeta.base, M, y);
  y += 3.5;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.5);
  doc.line(M, y, M + CW, y);
  y += 6;
  para(auditMeta.metodo, 8.8, GRAY);

  // ---- 1. Resumo executivo ----
  h2("1. Resumo executivo");
  resumoExecutivo.forEach((p) => {
    para(p, 9.3);
    y += 1.6;
  });

  h3("1.1 Estado da plataforma");
  plataforma.forEach((item) => labeled(item.label, item.value));

  h3("1.2 Camadas de maturidade");
  camadas.forEach((item) => labeled(item.camada, item.situacao));

  h3("1.3 Classificação funcional");
  funcionais.forEach((group) => {
    ensure(11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text(group.titulo, M, y);
    y += 3.8;
    para(group.modulos.join("  ·  "), 8.8, INK, 3);
    y += 1.4;
  });

  // ---- 2. Comparação ----
  h2("2. Comparação entre 30/10/2026 e 03/11/2026");
  table(["Dimensão", "30/10", "03/11", "Variação"], [58, 38, 52, 30], comparativo, [3], 7.8);

  // ---- 3. Alterações comprovadas ----
  h2("3. Alterações comprovadas desde a auditoria anterior");
  table(
    ["Data", "Arquivo / função / entidade", "Alteração", "Evidência", "Impacto", "Confiança"],
    [17, 40, 50, 32, 27, 12],
    alteracoes,
    [5],
    6.9
  );
  h3("3.1 Situação de 31/10/2026 e limites do histórico");
  notas.trinta.forEach((p) => {
    para(p, 8.8);
    y += 1.4;
  });
  y += 1;
  para(notas.recomendacaoTrello, 8.8, NAVY);

  // ---- 4. Módulos ----
  h2("4. Situação detalhada dos 16 módulos");
  table(
    ["#", "Módulo", "30/10", "03/11", "Evidências"],
    [7, 33, 21, 27, 90],
    modulos.map((m) => [m.n, m.nome, m.status30, m.status03, `${m.evidencias} Alteração: ${m.mudou}`]),
    [2, 3],
    7.1
  );

  // ---- 5. Integrações ----
  h2("5. Integrações externas");
  table(
    ["Integração", "Código", "Credencial", "Evidência de funcionamento", "Situação"],
    [36, 14, 20, 66, 42],
    integracoes,
    [4],
    7.3
  );
  y += 1;
  para(
    "Diferenciação exigida entre os três níveis: a API Jobicy tem resposta confirmada e persistência confirmada; o receptor de demonstração tem aceite confirmado com recibo persistido; Gmail, Outlook e WhatsApp não têm sequer resposta de API, portanto não existe nenhuma confirmação de entrega de e-mail ou mensagem nesta aplicação.",
    8.6,
    GRAY
  );

  // ---- 6. Segurança ----
  h2("6. Segurança e LGPD");
  h3("6.1 Corrigido desde 30/10, com evidência");
  bullets(seguranca.corrigido);
  h3("6.2 Ainda aberto, com evidência");
  bullets(seguranca.aberto);

  // ---- 7. Fluxo completo ----
  h2("7. Fluxo completo do MVP");
  table(["Etapa", "Situação", "Evidência"], [38, 36, 104], fluxo, [1], 7.8);
  h3("7.1 Os cinco passos obrigatórios");
  table(
    ["#", "Status", "Elo do fluxo e impedimento"],
    [7, 22, 149],
    cincoPassos.map((p) => [p.n, p.status, `${p.elo}. ${p.impedimento}`]),
    [1],
    7.6
  );
  y += 1;
  para(
    "Versão publicada e código do editor: não correspondem. A publicação é de 23/10/2026 e a plataforma declara alterações pendentes, portanto a demonstração pública roda código anterior a todas as correções de 01/11.",
    8.6,
    NAVY
  );

  // ---- 8. Trello ----
  h2("8. Relatório para atualização do Trello");
  h3("8.1 Status e decisão por cartão");
  table(
    ["Prompt", "Status 30/10", "Status 03/11", "Pode concluir?", "Novo prazo"],
    [48, 34, 40, 30, 26],
    trello.map((r) => [r[0], r[1], r[2], r[6], r[7]]),
    [3],
    7.4
  );
  h3("8.2 Mudanças e checklists por cartão");
  table(
    ["Prompt", "O que mudou", "Checklist validado", "Checklist pendente"],
    [36, 47, 47, 48],
    trello.map((r) => [r[0], r[3], r[4], r[5]]),
    [],
    7
  );

  h3("8.3 Cartões que podem ser movidos para concluído");
  bullets(acoesTrello.concluir);
  h3("8.4 Cartões que precisam permanecer abertos");
  bullets(acoesTrello.abertos);
  h3("8.5 Cartões em revisão, por evidência insuficiente");
  bullets(acoesTrello.revisar);
  h3("8.6 Checklists que podem ser marcados com base em evidências");
  bullets(acoesTrello.marcar);
  h3("8.7 Checklists que ainda precisam de testes");
  bullets(acoesTrello.testar);
  h3("8.8 Cartões corretivos a criar");
  bullets(acoesTrello.corretivos);

  // ---- 9. Plano ----
  h2("9. Cronograma de recuperação");
  table(["Data", "Foco do dia", "Ações priorizadas", "Equipe"], [16, 38, 106, 18], plano, [], 7.6);
  h3("9.1 Ordem de correção por dependência técnica");
  numbered(ordem);
  y += 1;
  para(
    "As dependências que ordenam o plano: PDF antes de aprovação, aprovação antes de envio, credencial antes de qualquer canal externo, orçamento antes de qualquer análise automática e publicação antes da demonstração.",
    8.6,
    GRAY
  );

  // ---- 10. Conclusão ----
  h2("10. Conclusão");
  veredito.forEach((p) => {
    para(p, 9.3);
    y += 1.6;
  });

  // ---- Rodapé ----
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(`${auditMeta.titulo} — ${auditMeta.data}`, M, PH - 8);
    doc.text(`Página ${i} de ${total}`, PW - M, PH - 8, { align: "right" });
  }

  return doc.output("blob");
}