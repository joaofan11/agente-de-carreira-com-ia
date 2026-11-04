import test from 'node:test';
import assert from 'node:assert/strict';

/*
 * SIMULAÇÃO — NÃO É ROTINA IMPLANTADA.
 *
 * Este arquivo implementa, de forma pura e em memória, as regras de retenção
 * PROPOSTAS em MATRIZ_RETENCAO_E_BASES_LEGAIS.md, apenas para verificar o
 * comportamento das regras (limites exatos, carência, isolamento por conta,
 * repetição, recuperação após falha e tratamento de derivados/legadas).
 *
 * Não acessa banco, rede, storage nem relógio do sistema: "agora" é sempre
 * injetado. Não comprova que exista expurgo no Anexa.AI — não existe.
 */

const DAY = 86400000;
const MESES = { conta: 12, candidatura: 12, logs: 3 };
const CARENCIA_DIAS = 30;
const DOC_DIAS_APOS_EXTRACAO = 7;
const DOC_DIAS_SEM_CONFIRMACAO = 30;

const iso = (d) => new Date(d).toISOString();
const diasAtras = (agora, dias) => new Date(Date.parse(agora) - dias * DAY).toISOString();
const mesesAtras = (agora, meses) => {
  const d = new Date(agora);
  d.setUTCMonth(d.getUTCMonth() - meses);
  return d.toISOString();
};

/** PROPOSTA (simulação) — seleciona o que estaria elegível em `agora`. */
function selecionar(base, agora) {
  const res = { avisar: [], excluirConta: [], documentos: [], candidaturas: [], logs: [] };

  for (const p of base.perfis || []) {
    if (!p.ultima_atividade) continue;
    const inativo = p.ultima_atividade < mesesAtras(agora, MESES.conta);
    if (!inativo) continue;
    if (!p.aviso_enviado_em) res.avisar.push(p.owner);
    else if (p.aviso_enviado_em <= diasAtras(agora, CARENCIA_DIAS)) res.excluirConta.push(p.owner);
  }

  for (const d of base.documentos || []) {
    if (d.extracao_concluida_em) {
      if (d.extracao_concluida_em <= diasAtras(agora, DOC_DIAS_APOS_EXTRACAO)) res.documentos.push(d.id);
    } else if (d.criado_em <= diasAtras(agora, DOC_DIAS_SEM_CONFIRMACAO)) {
      res.documentos.push(d.id);
    }
  }

  for (const c of base.candidaturas || []) {
    if (!c.encerrada_em) continue;
    if (c.encerrada_em <= mesesAtras(agora, MESES.candidatura)) res.candidaturas.push(c.id);
  }

  for (const l of base.logs || []) {
    if (l.data_evento <= diasAtras(agora, MESES.logs * 30)) res.logs.push(l.id);
  }

  return res;
}

/** Derivados e legados que acompanham a exclusão de uma conta. */
function derivadosDoDono(base, owner, candidaturasMantidas) {
  const mesmoDono = (r) => r.owner === owner;
  return {
    analises: (base.analises || []).filter(mesmoDono).map((r) => r.id),
    preferencias: (base.preferencias || []).filter(mesmoDono).map((r) => r.id),
    documentos: (base.documentos || []).filter(mesmoDono).map((r) => r.id),
    // Currículo vinculado a candidatura preservada não pode ser excluído antes dela.
    curriculos: (base.curriculos || [])
      .filter((r) => mesmoDono(r) && !candidaturasMantidas.has(r.id)),
    legadas: {
      Document: (base.legado?.Document || []).filter(mesmoDono).map((r) => r.id),
      Resume: (base.legado?.Resume || []).filter(mesmoDono).map((r) => r.id),
      StudentProfile: (base.legado?.StudentProfile || []).filter(mesmoDono).map((r) => r.id),
    },
  };
}

const AGORA = '2026-11-04T18:00:00.000Z';

test('limite exato de 12 meses de inatividade não gera ação (regra estrita)', () => {
  const base = { perfis: [{ owner: 'A', ultima_atividade: mesesAtras(AGORA, 12) }] };
  const r = selecionar(base, AGORA);
  assert.deepEqual(r.avisar, []);
  assert.deepEqual(r.excluirConta, []);
  // Um segundo a mais de inatividade já entra no aviso.
  const base2 = { perfis: [{ owner: 'A', ultima_atividade: new Date(Date.parse(mesesAtras(AGORA, 12)) - 1000).toISOString() }] };
  assert.deepEqual(selecionar(base2, AGORA).avisar, ['A']);
});

test('carência: 29 dias após o aviso não exclui; 30 dias exclui', () => {
  const perfil = { owner: 'A', ultima_atividade: mesesAtras(AGORA, 13) };
  assert.deepEqual(selecionar({ perfis: [{ ...perfil, aviso_enviado_em: diasAtras(AGORA, 29) }] }, AGORA).excluirConta, []);
  assert.deepEqual(selecionar({ perfis: [{ ...perfil, aviso_enviado_em: diasAtras(AGORA, 30) }] }, AGORA).excluirConta, ['A']);
});

test('documentos: 7 dias após extração confirmada; 30 dias sem confirmação', () => {
  const doc = (extra) => ({ id: 'd1', owner: 'A', criado_em: diasAtras(AGORA, 40), ...extra });
  assert.deepEqual(selecionar({ documentos: [doc({ extracao_concluida_em: diasAtras(AGORA, 6) })] }, AGORA).documentos, []);
  assert.deepEqual(selecionar({ documentos: [doc({ extracao_concluida_em: diasAtras(AGORA, 8) })] }, AGORA).documentos, ['d1']);
  assert.deepEqual(selecionar({ documentos: [doc({ extracao_concluida_em: null, criado_em: diasAtras(AGORA, 29) })] }, AGORA).documentos, []);
  assert.deepEqual(selecionar({ documentos: [doc({ extracao_concluida_em: null, criado_em: diasAtras(AGORA, 31) })] }, AGORA).documentos, ['d1']);
  // Extração recém-confirmada prevalece sobre upload antigo.
  assert.deepEqual(selecionar({ documentos: [doc({ extracao_concluida_em: diasAtras(AGORA, 1), criado_em: diasAtras(AGORA, 60) })] }, AGORA).documentos, []);
});

test('candidaturas: 12 meses após encerramento, e nada sem data de encerramento', () => {
  const c = (encerrada_em) => ({ id: 'c1', owner: 'A', encerrada_em });
  assert.deepEqual(selecionar({ candidaturas: [c(mesesAtras(AGORA, 12))] }, AGORA).candidaturas, ['c1']);
  assert.deepEqual(selecionar({ candidaturas: [c(mesesAtras(AGORA, 11))] }, AGORA).candidaturas, []);
  assert.deepEqual(selecionar({ candidaturas: [c(null)] }, AGORA).candidaturas, []);
});

test('somente elegíveis são selecionados e a outra conta é preservada', () => {
  const base = {
    perfis: [
      { owner: 'A', ultima_atividade: mesesAtras(AGORA, 20), aviso_enviado_em: diasAtras(AGORA, 45) },
      { owner: 'B', ultima_atividade: mesesAtras(AGORA, 20), aviso_enviado_em: diasAtras(AGORA, 45) },
    ],
    documentos: [
      { id: 'docA', owner: 'A', criado_em: diasAtras(AGORA, 90) },
      { id: 'docB', owner: 'B', criado_em: diasAtras(AGORA, 2) },
    ],
  };
  const alvo = selecionar({ perfis: [base.perfis[0]], documentos: [base.documentos[0]] }, AGORA);
  assert.deepEqual(alvo.excluirConta, ['A']);
  assert.deepEqual(alvo.documentos, ['docA']);
  const outro = selecionar({ perfis: [base.perfis[1]], documentos: [base.documentos[1]] }, AGORA);
  assert.deepEqual(outro.documentos, []);
});

test('repetição segura: segunda execução não seleciona o que já foi removido', () => {
  let estado = {
    perfis: [{ owner: 'A', ultima_atividade: mesesAtras(AGORA, 18), aviso_enviado_em: diasAtras(AGORA, 40) }],
    documentos: [{ id: 'docA', owner: 'A', criado_em: diasAtras(AGORA, 90) }],
  };
  const primeira = selecionar(estado, AGORA);
  assert.deepEqual(primeira.excluirConta, ['A']);
  estado = { perfis: [], documentos: [] }; // simula a remoção efetiva
  assert.deepEqual(selecionar(estado, AGORA), { avisar: [], excluirConta: [], documentos: [], candidaturas: [], logs: [] });
});

test('recuperação após falha: parcial aplicada, retentativa pega o restante sem duplicar', () => {
  const alvos = ['doc1', 'doc2', 'doc3', 'doc4'];
  const estado = { documentos: alvos.map((id) => ({ id, owner: 'A', criado_em: diasAtras(AGORA, 90) })) };
  let removidos = [];
  for (const id of selecionar(estado, AGORA).documentos) {
    if (removidos.length === 2) break; // falha na terceira operação
    removidos.push(id);
  }
  assert.deepEqual(removidos, ['doc1', 'doc2']);
  estado.documentos = estado.documentos.filter((d) => !removidos.includes(d.id));
  const retentativa = selecionar(estado, AGORA).documentos;
  assert.deepEqual(retentativa, ['doc3', 'doc4']);
  assert.equal(retentativa.filter((id) => removidos.includes(id)).length, 0);
});

test('derivados acompanham a conta; currículo de candidatura preservada fica', () => {
  const base = {
    analises: [{ id: 'mA', owner: 'A' }, { id: 'mB', owner: 'B' }],
    preferencias: [{ id: 'pA', owner: 'A' }],
    documentos: [{ id: 'docA', owner: 'A' }],
    curriculos: [{ id: 'rvA', owner: 'A' }, { id: 'rvA2', owner: 'A' }],
    legado: { Document: [{ id: 'lA', owner: 'A' }], Resume: [{ id: 'rA', owner: 'A' }], StudentProfile: [{ id: 'sA', owner: 'A' }] },
  };
  const d = derivadosDoDono(base, 'A', new Set(['rvA2']));
  assert.deepEqual(d.analises, ['mA']);
  assert.deepEqual(d.preferencias, ['pA']);
  assert.deepEqual(d.documentos, ['docA']);
  assert.deepEqual(d.curriculos.map((r) => r.id), ['rvA']);
  assert.deepEqual(d.legadas, { Document: ['lA'], Resume: ['rA'], StudentProfile: ['sA'] });
});