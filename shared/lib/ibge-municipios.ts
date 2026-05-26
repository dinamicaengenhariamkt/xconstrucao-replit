/**
 * IBGE municipalities loader.
 *
 * Fetches the canonical list of Brazilian municipalities from the IBGE
 * `servicodados` API (no API key required) and caches it in-process for 24h.
 * Used by:
 *   - GET /api/cidades (autocomplete used by /empreiteiro/configuracoes)
 *   - PATCH /api/perfil/empreiteiro (server-side validation of zonaAtuacaoCidades)
 *
 * Graceful degradation: if IBGE is unreachable, callers receive an empty list
 * and should fall back to permissive validation (logged once). We never want a
 * transient IBGE outage to lock users out of saving their profile.
 */
export type Municipio = { nome: string; uf: string; key: string };

let cache: Municipio[] | null = null;
let cacheLoadedAt = 0;
let inflight: Promise<Municipio[]> | null = null;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const IBGE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios";

/**
 * Accent-stripped, lower-cased, trimmed form used for case+accent-insensitive
 * matching. Stable across "São Paulo" / "Sao Paulo" / " são paulo ".
 */
export function normalizeBrazilName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function extractUf(m: any): string {
  return String(
    m?.microrregiao?.mesorregiao?.UF?.sigla ??
      m?.["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla ??
      "",
  ).toUpperCase();
}

async function fetchMunicipios(): Promise<Municipio[]> {
  const r = await fetch(IBGE_URL, {
    headers: { Accept: "application/json" },
    // Long-lived; we cache further in-process.
    next: { revalidate: 24 * 3600 },
  } as any);
  if (!r.ok) throw new Error(`IBGE retornou ${r.status}`);
  const data = (await r.json()) as any[];
  return data
    .map((m) => {
      const nome = String(m?.nome ?? "").trim();
      const uf = extractUf(m);
      return { nome, uf, key: normalizeBrazilName(nome) };
    })
    .filter((m) => m.nome.length > 0 && m.uf.length === 2);
}

export async function loadMunicipios(): Promise<Municipio[]> {
  if (cache && Date.now() - cacheLoadedAt < CACHE_TTL_MS) return cache;
  if (inflight) return inflight;
  inflight = fetchMunicipios()
    .then((rows) => {
      cache = rows;
      cacheLoadedAt = Date.now();
      inflight = null;
      return rows;
    })
    .catch((err) => {
      console.error("[ibge-municipios] falha ao carregar:", err);
      inflight = null;
      return cache ?? [];
    });
  return inflight;
}

/**
 * Returns the canonical IBGE entry matching `name`. If multiple cities share
 * the same accent-stripped name (e.g. "Campinas" exists in SP and MG), prefers
 * the one in `ufHint` when provided, otherwise returns the first match.
 */
export async function findMunicipio(
  name: string,
  ufHint?: string | null,
): Promise<Municipio | null> {
  const list = await loadMunicipios();
  if (list.length === 0) return null;
  const k = normalizeBrazilName(name);
  if (!k) return null;
  const matches = list.filter((m) => m.key === k);
  if (matches.length === 0) return null;
  if (ufHint) {
    const uf = ufHint.toUpperCase();
    const hit = matches.find((m) => m.uf === uf);
    if (hit) return hit;
  }
  return matches[0];
}

export async function searchMunicipios(
  q: string,
  uf?: string | null,
  limit = 20,
): Promise<Municipio[]> {
  const list = await loadMunicipios();
  if (list.length === 0) return [];
  const k = normalizeBrazilName(q);
  const ufU = uf ? uf.toUpperCase() : null;
  const out: Municipio[] = [];
  // Prefer "starts with" before "contains" for nicer autocomplete UX.
  const starts: Municipio[] = [];
  const contains: Municipio[] = [];
  for (const m of list) {
    if (ufU && m.uf !== ufU) continue;
    if (!k) {
      starts.push(m);
      if (starts.length >= limit) break;
      continue;
    }
    if (m.key.startsWith(k)) starts.push(m);
    else if (m.key.includes(k)) contains.push(m);
    if (starts.length >= limit) break;
  }
  out.push(...starts);
  if (out.length < limit) out.push(...contains.slice(0, limit - out.length));
  return out.slice(0, limit);
}
