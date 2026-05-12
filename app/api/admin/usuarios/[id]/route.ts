import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getUser } from "@features/auth/api/auth-storage";
import { recordAudit } from "@features/auth/api/audit";
import { canManage } from "../route";

type Role = "superadmin" | "admin" | "contratante" | "empreiteiro";

const patchSchema = z.object({
  name: z.string().trim().min(2).optional(),
  phone: z.string().nullable().optional(),
  role: z.enum(["superadmin", "admin", "contratante", "empreiteiro"]).optional(),
  ativo: z.boolean().optional(),
});

function jsonNoStore(payload: unknown, status = 200): NextResponse {
  const r = NextResponse.json(payload, { status });
  setNoCacheHeaders(r);
  return r;
}

async function ensureNotLastSuperadmin(targetId: string): Promise<boolean> {
  const ativos = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "superadmin"), eq(users.ativo, true), ne(users.id, targetId)));
  return ativos.length > 0;
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "superadmin" && guard.user.role !== "admin") {
    return jsonNoStore({ message: "Acesso negado" }, 403);
  }
  const target = await getUser(id);
  if (!target) return jsonNoStore({ message: "Usuário não encontrado" }, 404);
  if (!canManage(guard.user.role, target.role as Role)) {
    return jsonNoStore({ message: "Acesso negado" }, 403);
  }
  return jsonNoStore({
    id: target.id,
    name: target.name,
    email: target.email,
    role: target.role,
    phone: target.phone,
    ativo: target.ativo,
    mustChangePassword: target.mustChangePassword,
    emailVerified: target.emailVerified,
    createdAt: target.createdAt,
  });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "superadmin" && guard.user.role !== "admin") {
    return jsonNoStore({ message: "Acesso negado" }, 403);
  }
  const target = await getUser(id);
  if (!target) return jsonNoStore({ message: "Usuário não encontrado" }, 404);
  if (!canManage(guard.user.role, target.role as Role)) {
    return jsonNoStore({ message: "Acesso negado" }, 403);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonNoStore({ message: "Dados inválidos", errors: parsed.error.flatten() }, 400);
  const updates = parsed.data;

  if (updates.role && !canManage(guard.user.role, updates.role)) {
    return jsonNoStore({ message: "Você não pode atribuir esse perfil." }, 403);
  }

  if (updates.role && target.role === "superadmin" && updates.role !== "superadmin") {
    const ok = await ensureNotLastSuperadmin(target.id);
    if (!ok) return jsonNoStore({ message: "Não é possível remover o último super admin ativo." }, 400);
  }

  if (updates.ativo === false && target.role === "superadmin") {
    const ok = await ensureNotLastSuperadmin(target.id);
    if (!ok) return jsonNoStore({ message: "Não é possível desativar o último super admin ativo." }, 400);
  }

  const [updated] = await db
    .update(users)
    .set({
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
      ...(updates.role !== undefined ? { role: updates.role } : {}),
      ...(updates.ativo !== undefined ? { ativo: updates.ativo } : {}),
    })
    .where(eq(users.id, id))
    .returning();

  await recordAudit({
    actorId: guard.user.id,
    targetUserId: id,
    action: "user.update",
    payload: updates as Record<string, unknown>,
    request,
  });

  return jsonNoStore({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    phone: updated.phone,
    ativo: updated.ativo,
  });
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "superadmin" && guard.user.role !== "admin") {
    return jsonNoStore({ message: "Acesso negado" }, 403);
  }
  const target = await getUser(id);
  if (!target) return jsonNoStore({ message: "Usuário não encontrado" }, 404);
  if (!canManage(guard.user.role, target.role as Role)) {
    return jsonNoStore({ message: "Acesso negado" }, 403);
  }
  if (target.role === "superadmin") {
    const ok = await ensureNotLastSuperadmin(target.id);
    if (!ok) return jsonNoStore({ message: "Não é possível desativar o último super admin ativo." }, 400);
  }
  await db.update(users).set({ ativo: false }).where(eq(users.id, id));
  await recordAudit({
    actorId: guard.user.id,
    targetUserId: id,
    action: "user.deactivate",
    request,
  });
  return jsonNoStore({ ok: true });
}
