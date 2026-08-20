import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { platformSettings } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders, isAdminLike } from "@features/auth/api/auth-utils";
import { invalidatePlatformSettingsCache } from "@features/admin/platform-settings/server/settings-reader";

const KEYS = ["geral", "plataforma", "seguranca", "integracoes", "notificacoes", "legal", "marketplace"] as const;
type SettingKey = typeof KEYS[number];

const patchSchema = z.object({
  chave: z.enum(KEYS),
  valor: z.record(z.unknown()),
});

const DEFAULTS: Record<SettingKey, Record<string, unknown>> = {
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
  notificacoes: {
    novoCliente: true,
    novaObra: true,
    pagamento: true,
    contrato: false,
    campanhaExpirando: true,
    manutencao: true,
    relatorioSemanal: false,
    atualizacoes: true,
  },
  // J28 — modo de re-consentimento quando uma nova versão legal é publicada.
  legal: {
    reconsentModo: "avisar", // "avisar" (não-bloqueante) | "bloquear"
  },
  // J47 — comissão da plataforma (%) no split de pagamento de obra.
  marketplace: {
    percentualPlataforma: "10",
  },
};

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const rows = await db.select().from(platformSettings);
  const map: Record<string, Record<string, unknown>> = {};
  for (const k of KEYS) map[k] = { ...DEFAULTS[k] };
  for (const row of rows) {
    if ((KEYS as readonly string[]).includes(row.chave)) {
      map[row.chave] = { ...DEFAULTS[row.chave as SettingKey], ...(row.valor as Record<string, unknown>) };
    }
  }

  const response = NextResponse.json(map);
  setNoCacheHeaders(response);
  return response;
}

export async function PATCH(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const { chave, valor } = parsed.data;
  const [existing] = await db.select().from(platformSettings).where(eq(platformSettings.chave, chave));
  const existingValor = (existing?.valor as Record<string, unknown> | null) ?? {};
  const merged = { ...DEFAULTS[chave], ...existingValor, ...valor };

  await db
    .insert(platformSettings)
    .values({ chave, valor: merged, updatedBy: guard.user.id })
    .onConflictDoUpdate({
      target: platformSettings.chave,
      set: { valor: merged, updatedAt: sql`now()`, updatedBy: guard.user.id },
    });

  // J26: zera o cache do settings-reader para o efeito (modo manutenção, gating,
  // senha mínima) refletir imediatamente neste processo. Outros workers expiram
  // pelo TTL de 30s.
  invalidatePlatformSettingsCache();

  const [row] = await db.select().from(platformSettings).where(eq(platformSettings.chave, chave));
  const response = NextResponse.json(row);
  setNoCacheHeaders(response);
  return response;
}
