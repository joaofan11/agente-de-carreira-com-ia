// Budget covers automatic matching and resume generation, measured in attempted LLM calls, not credits.
export function rows(page) { return Array.isArray(page) ? page : page?.items || []; }
export function budgetKey(now = new Date()) {
  return 'automation_ai_budget:' + now.toISOString().slice(0, 7); // UTC calendar month
}
export async function automationPaused(base44) {
  const settings = rows(await base44.asServiceRole.entities.AppSetting.filter({ key: 'automation_paused' }, { limit: 2 }));
  return settings.some(s => s.value?.paused === true);
}
export async function requireAutomationAdmin(base44) {
  let user;
  try { user = await base44.auth.me(); } catch { /* fail closed */ }
  if (!user || user.role !== 'admin') return null;
  return user;
}
export async function readBudget(base44, now = new Date()) {
  const key = budgetKey(now);
  const settings = rows(await base44.asServiceRole.entities.AppSetting.filter({ key }, { limit: 2 }));
  if (settings.length > 1) throw new Error('Orçamento duplicado. Corrija as configurações antes de executar.');
  const record = settings[0];
  const limit = record?.value?.limit ?? 0;
  const used = record?.value?.used ?? 0;
  if (!Number.isSafeInteger(limit) || limit < 0 || !Number.isSafeInteger(used) || used < 0) throw new Error('Orçamento inválido.');
  return { record, key, month: key.split(':')[1], limit, used, remaining: Math.max(0, limit - used) };
}
export async function reserveAnalysis(base44) {
  if (await automationPaused(base44)) return { allowed: false, reason: 'Automação pausada.' };
  const b = await readBudget(base44);
  if (!b.record || b.used >= b.limit) return { allowed: false, reason: 'Limite mensal de análises atingido ou não configurado.' };
  // Single-record compare-and-swap: concurrent callers cannot reserve the same counter.
  // Any ambiguous result or storage failure stops before invoking the LLM. No refunds.
  const result = await base44.asServiceRole.entities.AppSetting.updateMany(
    { id: b.record.id, key: b.key, 'value.used': b.used, 'value.limit': b.limit },
    { $inc: { 'value.used': 1 } },
  );
  if (result?.updated !== 1) return { allowed: false, reason: 'Orçamento alterado por outra execução. Tente novamente.' };
  // Pause can change during the reservation; never refund a potentially used slot.
  if (await automationPaused(base44)) return { allowed: false, reason: 'Automação pausada.' };
  return { allowed: true };
}

