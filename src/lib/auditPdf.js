import { jsPDF } from "jspdf";
import {
  auditMeta,
  resumoExecutivo,
  plataforma,
  camadas,
  funcionais,
  modulos,
  cincoPassos,
  problemas,
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

const STATUS_COLOR = {
  IMPLEMENTADO: GREEN,
  "IMPLEMENTADO (DEMO)": GREEN,
  PARCIAL: AMBER,
  Funciona: GREEN,
  Parcial: AMBER,
  "NÃO IMPLEMENTADO": RED,
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
    doc.text("AGENTE DE CARREIRA COM IA", M, 9);
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
    ensure(16);
    y += 4;
    doc.setFillColor(...GREEN);
    doc.rect(M, y - 3.4, 1.6, 4.8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(text, M + 4.5, y);
    y += 6.5;
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

  const numbered = (items) => {
    items.forEach((item, i) => {
      const title = typeof item === "string" ? null : item.titulo;
      const body = typeof item === "string" ? item : item.texto;
      ensure(14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...NAVY);
      const prefix = `${i + 1}.`;
      doc.text(prefix, M, y);
      if (title) {
        doc.text(title, M + 6, y);
        y += 4.2;
      }
      para(body, 9, INK, 6);
      y += 1.6;
    });
  };

  const table = (headers, widths, rows, statusCol) => {
    const drawHeader = () => {
      doc.setFillColor(...NAVY);
      doc.rect(M, y, CW, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      let x = M + 2;
      headers.forEach((h, i) => {
        doc.text(h, x, y + 5.2);
        x += widths[i];
      });
      y += 8;
    };

    drawHeader();

    rows.forEach((row, ri) => {
      const lines = row.map((cell, i) => {
        doc.setFont("helvetica", i <= 1 ? "bold" : "normal");
        doc.setFontSize(8);
        return doc.splitTextToSize(String(cell), widths[i] - 3);
      });
      const maxLines = Math.max(...lines.map((l) => l.length));
      const rh = maxLines * 3.4 + 3.4;

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
        doc.setFontSize(8);
        if (i === statusCol) doc.setTextColor(...(STATUS_COLOR[cell] || GRAY));
        else doc.setTextColor(...INK);
        lines[i].forEach((line, li) => doc.text(line, x, y + 4.2 + li * 3.4));
        x += widths[i];
      });

      doc.setDrawColor(220, 224, 230);
      doc.setLineWidth(0.2);
      doc.line(M, y + rh, M + CW, y + rh);
      y += rh;
    });

    y += 4;
  };

  // ---- Capa / cabeçalho do relatório ----
  band();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...NAVY);
  doc.text(auditMeta.titulo, M, y + 6);
  y += 13;
  doc.setFontSize(11);
  doc.setTextColor(...GREEN);
  doc.text(auditMeta.subtitulo, M, y);
  y += 5;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.5);
  doc.line(M, y, M + CW, y);
  y += 6;
  para(auditMeta.metodo, 9, GRAY);

  // ---- Resumo executivo ----
  h2("1. Resumo executivo");
  resumoExecutivo.forEach((p) => {
    para(p, 9.5);
    y += 1.6;
  });

  // ---- Estado da plataforma ----
  h2("2. Estado da plataforma");
  plataforma.forEach((item) => labeled(item.label, item.value));

  // ---- Camadas ----
  h2("3. Camadas de maturidade");
  camadas.forEach((item) => labeled(item.camada, item.situacao));

  // ---- Classificação funcional ----
  h2("4. Classificação funcional");
  funcionais.forEach((group) => {
    ensure(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...NAVY);
    doc.text(group.titulo, M, y);
    y += 4;
    para(group.modulos.join("  ·  "), 9, INK, 3);
    y += 1.6;
  });

  // ---- Tabela dos módulos ----
  h2("5. Situação dos 16 módulos");
  table(
    ["#", "Módulo", "Status", "Evidências"],
    [8, 38, 26, 106],
    modulos.map((m) => [m.n, m.nome, m.status, m.evidencias]),
    2
  );

  // ---- Cinco passos obrigatórios ----
  h2("6. Os cinco passos obrigatórios");
  table(
    ["#", "Status", "Elo do fluxo e impedimento"],
    [8, 22, 148],
    cincoPassos.map((p) => [p.n, p.status, `${p.elo}. ${p.impedimento}`]),
    1
  );

  // ---- Achados críticos ----
  h2("7. Achados críticos");
  numbered(problemas);

  // ---- Ordem de correção ----
  h2("8. Ordem de correção recomendada");
  numbered(ordem);

  // ---- Veredito ----
  h2("9. Veredito");
  veredito.forEach((p) => {
    para(p, 9.5);
    y += 1.6;
  });

  // ---- Rodapé em todas as páginas ----
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