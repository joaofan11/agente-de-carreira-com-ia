import test from 'node:test';
import assert from 'node:assert/strict';
import { computeScore, checkGeographicBlock } from '../base44/shared/matchScorer.ts';
import { matchFingerprint } from '../base44/shared/matchCache.ts';
import { PROFILE_FIELDS } from '../base44/shared/profileFields.ts';

// Synthetic responses only. No LLM or platform calls.
const job = { modalidade: 'presencial', localizacao: 'Manaus, Brasil' };
const pref = { modalidades: ['presencial'], localizacoes: ['Manaus'], disponibilidade: 'imediata' };
const analysis = {
  requisitos_identificados: ['JavaScript'],
  competencias_compativeis: [{ competencia: 'JavaScript', evidencia: 'Projeto acadêmico' }],
  competencias_ausentes: [], evidencias_perfil: ['Projeto acadêmico'], bloqueios: [],
  justificativa: 'Dados fictícios', dados_insuficientes: '', formacao_nivel: 1, experiencia_nivel: 1,
};

test('technical score cannot exceed 40 when provider returns extra matches', () => {
  const result = computeScore({ ...analysis, competencias_compativeis: [...analysis.competencias_compativeis, ...analysis.competencias_compativeis], formacao_nivel: 0, experiencia_nivel: 0 }, job, null);
  assert.equal(result.breakdown.tecnicas, 40);
  assert.equal(result.score, 40);
  assert.equal(result.nivel, 'baixo');
});
test('synthetic low, medium and strong scores preserve the 40/25/20/15 weights', () => {
  const low = computeScore({ ...analysis, competencias_compativeis: [], formacao_nivel: 0, experiencia_nivel: 0 }, job, null);
  const medium = computeScore({ ...analysis, experiencia_nivel: 0, formacao_nivel: 0.5 }, job, null);
  const strong = computeScore(analysis, job, pref);
  assert.equal(low.score, 0);
  assert.equal(low.nivel, 'baixo');
  assert.equal(medium.score, 53);
  assert.equal(medium.nivel, 'medio');
  assert.equal(strong.score, 100);
  assert.equal(strong.nivel, 'alto');
  assert.deepEqual(strong.breakdown, { tecnicas: 40, formacao: 25, experiencia: 20, preferencias: 15 });
});
test('eliminatory and geographic restrictions prevent strong classification', () => {
  for (const result of [
    computeScore({ ...analysis, bloqueios: ['Requisito obrigatório não atendido'] }, job, pref),
    computeScore(analysis, { modalidade: 'remoto', localizacao: 'Germany' }, { ...pref, modalidades: ['remoto'], localizacoes: ['Germany'] }),
  ]) {
    assert.equal(result.score, 79);
    assert.equal(result.nivel, 'medio');
    assert.ok(result.hasBloqueios);
  }
});
test('missing requirements do not fabricate technical points', () => {
  const result = computeScore({ ...analysis, requisitos_identificados: [] }, job, pref);
  assert.equal(result.breakdown.tecnicas, 0);
  assert.equal(result.score, 60);
});
test('remote wording alone cannot override an explicit regional restriction', () => {
  for (const localizacao of ['Remote - US only', 'Remoto — Europa', 'US (remote)', 'Notglobal region']) {
    assert.ok(checkGeographicBlock({ modalidade: 'remoto', localizacao }));
  }
  for (const localizacao of ['Brasil', 'LATAM', 'Worldwide', 'Global', 'Latin America']) {
    assert.equal(checkGeographicBlock({ modalidade: 'remoto', localizacao }), null);
  }
});
test('new scoring rules invalidate version-one fingerprints', async () => {
  // Reconstruct the previous format to verify existing cached scores become stale.
  const pick = (v, keys) => Object.fromEntries(keys.map(k => [k, v?.[k] ?? null]));
  const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])])) : value ?? null;
  const profile = { nome_completo: 'Teste', competencias: ['JavaScript'] };
  const oldInput = { version: 1, profile: pick(profile, PROFILE_FIELDS), job: pick(job, ['id','empresa','cargo','nivel','modalidade','localizacao','descricao','requisitos','status','is_demo']), preferences: pick(pref, ['niveis','modalidades','localizacoes','disponibilidade','regiao_amazonia','cargos_interesse']) };
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(stable(oldInput))));
  const oldFingerprint = Buffer.from(digest).toString('hex');
  assert.notEqual(await matchFingerprint(profile, job, pref), oldFingerprint);
});
