// Coleta — busca vagas na API pública do Jobicy (sem chave).
// Documentação: https://jobicy.com/jobs-rss-feed — uso livre com crédito à fonte.
// Retorna { jobs, nextCursor, lastUpdate } ou lança erro com HTTP/status claros.

const ENDPOINT = "https://jobicy.com/api/v2/remote-jobs";

export async function fetchJobicyJobs({ count = 200, cursor = null, geo = null, industry = null, tag = null } = {}) {
  const params = new URLSearchParams();
  if (count) params.set("count", String(Math.min(Math.max(count, 1), 200)));
  if (geo) params.set("geo", geo);
  if (industry) params.set("industry", industry);
  if (tag) params.set("tag", tag);
  if (cursor) params.set("cursor", cursor);

  const url = `${ENDPOINT}?${params.toString()}`;

  let res;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) {
    throw new Error(`Não foi possível conectar à API Jobicy: ${e.message}`);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Resposta inválida da API Jobicy (HTTP ${res.status}).`);
  }

  if (!res.ok || data.success === false) {
    const msg = data?.error || `HTTP ${res.status}`;
    throw new Error(`Erro da API Jobicy: ${msg}`);
  }

  return {
    jobs: Array.isArray(data.jobs) ? data.jobs : [],
    nextCursor: data.nextCursor || null,
    lastUpdate: data.lastUpdate || "",
  };
}