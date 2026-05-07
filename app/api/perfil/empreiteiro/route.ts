import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { empreiteiras, users } from "@shared/db/schema";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";
import { ensureProfileRow } from "@features/auth/api/auth-storage";

export const ESPECIALIDADES_PERMITIDAS = [
  "Alvenaria",
  "Elétrica",
  "Hidráulica",
  "Pintura",
  "Acabamento",
  "Fundações",
  "Estrutura Metálica",
  "Gesso/Drywall",
  "Cobertura/Telhado",
  "Paisagismo",
  "Reformas",
  "Obras Comerciais",
] as const;

const updateSchema = z.object({
  nome: z.string().min(3).optional(),
  responsavel: z.string().min(3).optional(),
  telefone: z.string().min(8).optional().nullable(),
  cnpj: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  avatarUrl: z.string().max(2_500_000).optional().nullable(),
  especialidades: z.array(z.enum(ESPECIALIDADES_PERMITIDAS)).optional(),
  raioKm: z.number().int().min(0).max(2000).optional().nullable(),
  portfolioUrls: z.array(z.string().max(2_500_000)).max(20).optional(),
});

function isProfileComplete(e: typeof empreiteiras.$inferSelect) {
  return Boolean(
    e.nome &&
      e.responsavel &&
      e.email &&
      e.telefone &&
      e.cnpj &&
      e.cep &&
      e.endereco &&
      e.cidade &&
      e.estado &&
      e.avatarUrl &&
      Array.isArray(e.especialidades) &&
      e.especialidades.length > 0 &&
      typeof e.raioKm === "number" && e.raioKm > 0 &&
      Array.isArray(e.portfolioUrls) &&
      e.portfolioUrls.length > 0
  );
}

async function loadOrCreate(userId: string) {
  let [row] = await db.select().from(empreiteiras).where(eq(empreiteiras.userId, userId));
  if (!row) {
    const [u] = await db.select().from(users).where(eq(users.id, userId));
    if (!u) return null;
    await ensureProfileRow(u);
    [row] = await db.select().from(empreiteiras).where(eq(empreiteiras.userId, userId));
  }
  return row ?? null;
}

export async function GET(request: NextRequest) {
  const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload?.sub) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  if (payload.role !== "empreiteiro") return NextResponse.json({ message: "Acesso negado" }, { status: 403 });

  const row = await loadOrCreate(payload.sub);
  if (!row) return NextResponse.json({ message: "Perfil não encontrado" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(request: NextRequest) {
  const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload?.sub) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  if (payload.role !== "empreiteiro") return NextResponse.json({ message: "Acesso negado" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await loadOrCreate(payload.sub);
  if (!existing) return NextResponse.json({ message: "Perfil não encontrado" }, { status: 404 });

  const merged = { ...existing, ...parsed.data } as typeof empreiteiras.$inferSelect;
  const perfilCompleto = isProfileComplete(merged);

  // Status transition: só promove para fila de curadoria ('aprovacao')
  // quando o perfil fica completo. Usuários já 'ativo'/'inativo' não
  // regridem ao editar o perfil; perfis incompletos mantêm seu status atual.
  let status = existing.status;
  if (existing.status !== "ativo" && existing.status !== "inativo" && perfilCompleto) {
    status = "aprovacao";
  }

  const [updated] = await db
    .update(empreiteiras)
    .set({ ...parsed.data, perfilCompleto, status })
    .where(eq(empreiteiras.id, existing.id))
    .returning();

  return NextResponse.json(updated);
}
