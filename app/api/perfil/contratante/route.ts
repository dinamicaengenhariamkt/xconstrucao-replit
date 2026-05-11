import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { clientes, users } from "@shared/db/schema";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";
import { ensureProfileRow } from "@features/auth/api/auth-storage";

const updateSchema = z.object({
  nome: z.string().min(3).optional(),
  telefone: z.string().min(8).optional().nullable(),
  cnpjCpf: z.string().optional().nullable(),
  // Aceita tanto a label PT (vinda do select atual) quanto a normalização snake_case.
  tipo: z.enum(["Pessoa Física", "Pessoa Jurídica", "pessoa_fisica", "pessoa_juridica"]).optional(),
  cep: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  avatarUrl: z.string().max(2_500_000).optional().nullable(),
  // user-level fields (persisted in users table)
  bio: z.string().max(400).optional().nullable(),
  idioma: z.string().max(16).optional(),
  timezone: z.string().max(64).optional(),
});

function normalizeTipo(t: string | undefined): string | undefined {
  if (!t) return undefined;
  if (t === "pessoa_fisica") return "Pessoa Física";
  if (t === "pessoa_juridica") return "Pessoa Jurídica";
  return t;
}

function isProfileComplete(c: typeof clientes.$inferSelect) {
  return Boolean(
    c.nome &&
      c.email &&
      c.telefone &&
      c.cnpjCpf &&
      c.cep &&
      c.endereco &&
      c.cidade &&
      c.estado &&
      c.avatarUrl
  );
}

async function loadOrCreate(userId: string) {
  let [row] = await db.select().from(clientes).where(eq(clientes.userId, userId));
  if (!row) {
    const [u] = await db.select().from(users).where(eq(users.id, userId));
    if (!u) return null;
    await ensureProfileRow(u);
    [row] = await db.select().from(clientes).where(eq(clientes.userId, userId));
  }
  return row ?? null;
}

async function loadUser(userId: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  return u ?? null;
}

function withUserFields(row: typeof clientes.$inferSelect, u: typeof users.$inferSelect | null) {
  return {
    ...row,
    bio: u?.bio ?? null,
    idioma: u?.idioma ?? "pt-BR",
    timezone: u?.timezone ?? "America/Sao_Paulo",
  };
}

export async function GET(request: NextRequest) {
  const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload?.sub) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  if (payload.role !== "contratante") return NextResponse.json({ message: "Acesso negado" }, { status: 403 });

  const row = await loadOrCreate(payload.sub);
  if (!row) return NextResponse.json({ message: "Perfil não encontrado" }, { status: 404 });
  const u = await loadUser(payload.sub);
  return NextResponse.json(withUserFields(row, u));
}

export async function PATCH(request: NextRequest) {
  const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload?.sub) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  if (payload.role !== "contratante") return NextResponse.json({ message: "Acesso negado" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await loadOrCreate(payload.sub);
  if (!existing) return NextResponse.json({ message: "Perfil não encontrado" }, { status: 404 });

  const { bio, idioma, timezone, tipo, ...rest } = parsed.data;
  const clienteData = { ...rest, ...(tipo !== undefined ? { tipo: normalizeTipo(tipo)! } : {}) };

  const merged = { ...existing, ...clienteData } as typeof clientes.$inferSelect;
  const perfilCompleto = isProfileComplete(merged);

  // Status transition: só promove para fila de curadoria ('aprovacao')
  // quando o perfil fica completo. Usuários já 'ativo'/'inativo' não
  // regridem ao editar o perfil; perfis incompletos mantêm seu status atual.
  let status = existing.status;
  if (existing.status !== "ativo" && existing.status !== "inativo" && perfilCompleto) {
    status = "aprovacao";
  }

  const [updated] = await db
    .update(clientes)
    .set({ ...clienteData, perfilCompleto, status })
    .where(eq(clientes.id, existing.id))
    .returning();

  const userPatch: Partial<typeof users.$inferInsert> = {};
  if (bio !== undefined) userPatch.bio = bio;
  if (idioma !== undefined) userPatch.idioma = idioma;
  if (timezone !== undefined) userPatch.timezone = timezone;
  if (Object.keys(userPatch).length > 0) {
    await db.update(users).set(userPatch).where(eq(users.id, payload.sub));
  }
  const u = await loadUser(payload.sub);

  return NextResponse.json(withUserFields(updated, u));
}
