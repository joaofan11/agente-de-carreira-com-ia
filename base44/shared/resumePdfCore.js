// Gera um PDF A4 ATS-friendly a partir do currículo estruturado.
// Formato: uma coluna, texto selecionável, sem gráficos decorativos.
export function buildResumePdf(jsPDF, resume) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 20;
  const cw = pageW - 2 * margin;
  let y = margin;

  const ensureSpace = (needed) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const addText = (text, size, style, indent = 0) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, cw - indent);
    for (const line of lines) {
      ensureSpace(size * 0.4 + 1);
      doc.text(line, margin + indent, y);
      y += size * 0.4 + 1;
    }
  };

  const addSectionTitle = (title) => {
    y += 3;
    ensureSpace(10);
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + cw, y);
    y += 4;
    addText(title.toUpperCase(), 10, "bold");
    y += 1;
  };

  const c = resume.contato || {};

  // Cabeçalho: nome e contato
  addText(c.nome || "", 16, "bold");
  const contatoParts = [c.email, c.telefone, [c.cidade, c.estado].filter(Boolean).join(" - ")].filter(Boolean);
  if (contatoParts.length) addText(contatoParts.join(" | "), 9, "normal");

  if (resume.objetivo_profissional) {
    addSectionTitle("Objetivo Profissional");
    addText(resume.objetivo_profissional, 10, "normal");
  }

  if (resume.resumo) {
    addSectionTitle("Resumo Profissional");
    addText(resume.resumo, 10, "normal");
  }

  if (resume.formacao_academica?.length) {
    addSectionTitle("Formação Acadêmica");
    for (const f of resume.formacao_academica) {
      addText(`${f.curso || ""} — ${f.instituicao || ""}`, 10, "bold");
      if (f.periodo) addText(f.periodo, 9, "normal");
      y += 1.5;
    }
  }

  if (resume.experiencias_profissionais?.length) {
    addSectionTitle("Experiência Profissional");
    for (const e of resume.experiencias_profissionais) {
      addText(`${e.cargo || ""} — ${e.empresa || ""}`, 10, "bold");
      if (e.periodo) addText(e.periodo, 9, "normal");
      if (e.atividades) addText(e.atividades, 9, "normal");
      y += 1.5;
    }
  }

  if (resume.projetos_academicos?.length) {
    addSectionTitle("Projetos Acadêmicos");
    for (const p of resume.projetos_academicos) {
      addText(p.nome || "", 10, "bold");
      if (p.descricao) addText(p.descricao, 9, "normal");
      if (p.tecnologias?.length) addText(`Tecnologias: ${p.tecnologias.join(", ")}`, 9, "normal");
      y += 1.5;
    }
  }

  if (resume.cursos_certificacoes?.length) {
    addSectionTitle("Cursos e Certificações");
    for (const cr of resume.cursos_certificacoes) {
      addText(`${cr.nome || ""}${cr.instituicao ? " — " + cr.instituicao : ""}`, 10, "normal");
      if (cr.data_conclusao) addText(cr.data_conclusao, 9, "normal");
      if (cr.carga_horaria) addText(`Carga horária: ${cr.carga_horaria}`, 9, "normal");
      y += 1;
    }
  }

  const ct = resume.competencias_tecnicas || {};
  const allComp = [...(ct.destacadas || []), ...(ct.demais || [])];
  if (allComp.length) {
    addSectionTitle("Competências Técnicas");
    if (ct.destacadas?.length) addText(ct.destacadas.join(", "), 10, "normal");
    if (ct.demais?.length) {
      if (ct.destacadas?.length) addText("Outras: " + ct.demais.join(", "), 9, "normal");
      else addText(ct.demais.join(", "), 10, "normal");
    }
  }

  if (resume.idiomas?.length) {
    addSectionTitle("Idiomas");
    addText(resume.idiomas.join(", "), 10, "normal");
  }

  return doc.output("blob");
}