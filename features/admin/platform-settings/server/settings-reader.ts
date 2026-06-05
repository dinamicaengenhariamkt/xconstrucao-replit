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

/** Zera o cache para refletir uma escrita imediatamente (chamar no PATCH). */
export function invalidatePlatformSettingsCache(): void {
  cache = null;
}
