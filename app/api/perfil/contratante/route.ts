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
  tipo: z.enum(["pessoa_fisica", "pessoa_juridica"]).optional(),
  cep: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  avatarUrl: z.string().max(2_500_000).optional().nullable(),
});

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

export async function GET(request: NextRequest) {
  const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload?.sub) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  if (payload.role !== "contratante") return NextResponse.json({ message: "Acesso negado" }, { status: 403 });

  const row = await loadOrCreate(payload.sub);
  if (!row) return NextResponse.json({ message: "Perfil não encontrado" }, { status: 404 });
  return NextResponse.json(row);
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

  const merged = { ...existing, ...parsed.data } as typeof clientes.$inferSelect;
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
    .set({ ...parsed.data, perfilCompleto, status })
    .where(eq(clientes.id, existing.id))
    .returning();

  return NextResponse.json(updated);
}
