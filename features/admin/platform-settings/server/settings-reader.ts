// Leitor server-side das configurações da plataforma (J26).
//
// Propósito: dar aos pontos de consumo (proxy/modo manutenção, gating de módulos,
// senha mínima, footer) acesso às settings sem que cada um faça query crua.
//
// Restrições deliberadas:
// - Módulo MÍNIMO: importa apenas `db` + schema. NÃO importa audit/auth-utils
//   (o proxy o consome e não pode puxar bundle pesado).
// - Cache em memória com TTL curto (process-local). Reativo o bastante (≤30s) e
//   barato. A invalidação explícita no PATCH de configurações zera o cache do
//   processo que atendeu a escrita; os demais workers expiram pelo TTL.
// - FAIL-OPEN: se a query falhar, retorna o último valor conhecido (ou os
//   defaults). Em particular, um erro de DB NUNCA liga o modo manutenção —
//   evita derrubar o site por um glitch transitório.
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { platformSettings } from "@shared/db/schema";

export type PlatformSettings = Record<string, Record<string, unknown>>;

// Espelha os defaults de app/api/admin/configuracoes/route.ts (fonte de escrita).
// Mantidos aqui para o reader funcionar mesmo sem nenhuma linha persistida.
const DEFAULTS: PlatformSettings = {
  geral: {
    nome: "XConstrução",
    descricao: "Plataforma de gestão de obras e conexão entre contratantes e empreiteiras.",
    email: "suporte@xconstrucao.com.br",
    cnpj: "12.345.678/0001-99",
    timezone: "America/Sao_Paulo",
    idioma: "pt-BR",
  },
  plataforma: {
    anuncios: true,
    faq: true,
    empreiteiras: true,
    clienteLogin: true,
    manutencao: false,
    relatorios: false,
    xgestao: true,
    marketplaceVisivel: true,
  },
  seguranca: {
    timeout: "30",
    maxTentativas: "5",
    senhaMinima: "8",
    doisFatoresAdmins: false,
    doisFatoresTodos: false,
  },
  integracoes: {},
  notificacoes: {},
  // J28 — modo de re-consentimento (avisar | bloquear).
  legal: {
    reconsentModo: "avisar",
  },
  // J47 — comissão da plataforma no split de pagamento de obra (percentual).
  marketplace: {
    percentualPlataforma: "10",
  },
};

const TTL_MS = 30_000;

interface Cache {
  value: PlatformSettings;
  expiresAt: number;
}
let cache: Cache | null = null;

function mergeWithDefaults(rows: Array<{ chave: string; valor: unknown }>): PlatformSettings {
  const out: PlatformSettings = {};
  for (const k of Object.keys(DEFAULTS)) out[k] = { ...DEFAULTS[k] };
  for (const row of rows) {
    out[row.chave] = {
      ...(DEFAULTS[row.chave] ?? {}),
      ...((row.valor as Record<string, unknown>) ?? {}),
    };
  }
  return out;
}

async function loadAll(): Promise<PlatformSettings> {
  const rows = await db
    .select({ chave: platformSettings.chave, valor: platformSettings.valor })
    .from(platformSettings);
  return mergeWithDefaults(rows);
}

/** Retorna todas as settings (com defaults aplicados), cacheadas. Fail-open. */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;
  try {
    const value = await loadAll();
    cache = { value, expiresAt: Date.now() + TTL_MS };
    return value;
  } catch {
    // Fail-open: usa o último valor conhecido ou os defaults. Nunca propaga erro.
    return cache?.value ?? structuredCloneDefaults();
  }
}

function structuredCloneDefaults(): PlatformSettings {
  const out: PlatformSettings = {};
  for (const k of Object.keys(DEFAULTS)) out[k] = { ...DEFAULTS[k] };
  return out;
}

/** Retorna um grupo de settings (ex.: "plataforma", "seguranca"). */
export async function getPlatformSetting(chave: string): Promise<Record<string, unknown>> {
  return (await getPlatformSettings())[chave] ?? {};
}

/** True quando o modo manutenção está ativo. Fail-open → false em caso de erro. */
export async function isManutencaoAtiva(): Promise<boolean> {
  const plataforma = await getPlatformSetting("plataforma");
  return plataforma?.manutencao === true;
}

/**
 * Tamanho mínimo de senha configurado (J26 — `seguranca.senhaMinima`), com piso 8.
 * Settings só REFORÇAM o baseline; nunca reduzem. Fail-open → 8.
 */
export async function getSenhaMinima(): Promise<number> {
  const seguranca = await getPlatformSetting("seguranca");
  const raw = Number(seguranca.senhaMinima);
  return Number.isFinite(raw) ? Math.max(8, raw) : 8;
}

/**
 * J47 — Percentual de comissão da plataforma no split de obra
 * (`marketplace.percentualPlataforma`). Faixa válida 0–100; fail-open → 10.
 * O valor é congelado (snapshot) em `pagamentos_split.percentual_plataforma`
 * no momento do checkout — mudar depois não altera cobranças já iniciadas.
 */
export async function getPercentualPlataforma(): Promise<number> {
  const mkt = await getPlatformSetting("marketplace");
  const raw = Number(mkt.percentualPlataforma);
  return Number.isFinite(raw) && raw >= 0 && raw <= 100 ? raw : 10;
}

/**
 * Lê o valor CRU de uma chave dentro de um grupo, direto da tabela (sem o merge com
 * DEFAULTS). Necessário para distinguir "não configurado" de "igual ao default" —
 * caso contrário os DEFAULTS mascarariam a ausência de config e aplicariam o valor
 * por omissão. Fail-open → undefined (= não configurado). Não usa cache (chamadas
 * raras, em auth) para sempre refletir a realidade da tabela.
 */
async function getRawSetting(grupo: string, chave: string): Promise<unknown> {
  try {
    const [row] = await db
      .select({ valor: platformSettings.valor })
      .from(platformSettings)
      .where(eq(platformSettings.chave, grupo));
    const valor = (row?.valor as Record<string, unknown> | null) ?? null;
    return valor ? valor[chave] : undefined;
  } catch {
    return undefined;
  }
}

/**
 * J30 — Máximo de tentativas de login (`seguranca.maxTentativas`), com piso 3 para
 * não trancar o fluxo legítimo. Só sobrepõe o `fallback` (limite histórico) quando o
 * admin SETOU explicitamente o valor — default não-setado mantém o fallback.
 */
export async function getMaxTentativasLogin(fallback: number): Promise<number> {
  const raw = Number(await getRawSetting("seguranca", "maxTentativas"));
  if (!Number.isFinite(raw) || raw <= 0) return fallback;
  return Math.max(3, raw);
}

/**
 * J30 — Timeout de sessão por inatividade em MINUTOS (`seguranca.timeout`).
 * Retorna `null` quando NÃO foi explicitamente configurado → mantém o comportamento
 * atual (7/30 dias) e NÃO encurta a sessão de ninguém por omissão. Piso de 5 min.
 */
export async function getSessionTimeoutMinutes(): Promise<number | null> {
  const rawVal = await getRawSetting("seguranca", "timeout");
  // String vazia ("Padrão do sistema" na UI) ou ausência = sem override.
  if (rawVal === undefined || rawVal === null || rawVal === "") return null;
  const raw = Number(rawVal);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  return Math.max(5, raw);
}

/**
 * J30 — Bloqueio de cadastro/login por perfil. `plataforma.empreiteiras` e
 * `plataforma.clienteLogin` (default true = liberado). Fail-open → liberado.
 */
export async function isPerfilHabilitado(role: "contratante" | "empreiteiro"): Promise<boolean> {
  const plataforma = await getPlatformSetting("plataforma");
  if (role === "empreiteiro") return plataforma?.empreiteiras !== false;
  return plataforma?.clienteLogin !== false;
}

/** J30 — Gate de relatórios exportáveis (`plataforma.relatorios`, default false). */
export async function isRelatoriosHabilitado(): Promise<boolean> {
  const plataforma = await getPlatformSetting("plataforma");
  return plataforma?.relatorios === true;
}

/** XG05 — controla somente a visibilidade pública do marketplace. Fail-open → visível. */
export function resolveMarketplaceVisivel(
  plataforma: Record<string, unknown>,
  runtime: { nodeEnv?: string; override?: string } = {
    nodeEnv: process.env.NODE_ENV,
    override: process.env.MARKETPLACE_PUBLIC_VISIBILITY,
  },
): boolean {
  const override = runtime.override?.trim().toLowerCase();
  if (runtime.nodeEnv === "production" && override === "false") return false;
  if (runtime.nodeEnv === "production" && override === "true") return true;
  return plataforma?.marketplaceVisivel !== false;
}

/** XG05 — respeita um override operacional por ambiente antes do valor persistido. */
export async function isMarketplaceVisivel(): Promise<boolean> {
  const plataforma = await getPlatformSetting("plataforma");
  return resolveMarketplaceVisivel(plataforma);
}

/** Zera o cache para refletir uma escrita imediatamente (chamar no PATCH). */
export function invalidatePlatformSettingsCache(): void {
  cache = null;
}
