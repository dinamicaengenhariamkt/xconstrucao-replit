import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { platformSettings } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";

const KEYS = ["geral", "plataforma", "seguranca", "integracoes", "notificacoes"] as const;
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
};

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "admin") {
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
  if (guard.user.role !== "admin") {
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
  const merged = { ...DEFAULTS[chave], ...valor };

  await db
    .insert(platformSettings)
    .values({ chave, valor: merged, updatedBy: guard.user.id })
    .onConflictDoUpdate({
      target: platformSettings.chave,
      set: { valor: merged, updatedAt: sql`now()`, updatedBy: guard.user.id },
    });

  const [row] = await db.select().from(platformSettings).where(eq(platformSettings.chave, chave));
  const response = NextResponse.json(row);
  setNoCacheHeaders(response);
  return response;
}
