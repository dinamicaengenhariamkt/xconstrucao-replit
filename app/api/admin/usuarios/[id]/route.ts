import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getUser, getUserByEmail } from "@features/auth/api/auth-storage";
import { recordAudit } from "@features/auth/api/audit";
import { canManage, hasUsersTabAccess } from "../route";

type Role = "superadmin" | "admin" | "contratante" | "empreiteiro";

const patchSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().toLowerCase().email("Email inválido").optional(),
  phone: z.string().nullable().optional(),
  role: z.enum(["superadmin", "admin", "contratante", "empreiteiro"]).optional(),
  ativo: z.boolean().optional(),
  canManageUsers: z.boolean().optional(),
  // XG06 — escopo administrativo. Mesmas travas de canManageUsers.
  adminEscopo: z.enum(["global", "xgestao"]).optional(),
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
  if (!hasUsersTabAccess(guard.user as { role: string; canManageUsers?: boolean | null })) {
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
    canManageUsers: (target as { canManageUsers?: boolean }).canManageUsers ?? false,
    adminEscopo: (target as { adminEscopo?: string }).adminEscopo ?? "global",
    mustChangePassword: target.mustChangePassword,
    emailVerified: target.emailVerified,
    createdAt: target.createdAt,
  });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!hasUsersTabAccess(guard.user as { role: string; canManageUsers?: boolean | null })) {
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

  // canManageUsers só pode ser modificado por superadmin e somente para admins
  if (updates.canManageUsers !== undefined) {
    if (guard.user.role !== "superadmin") {
      return jsonNoStore({ message: "Apenas super admin pode alterar permissões." }, 403);
    }
    const finalRole = (updates.role ?? target.role) as Role;
    if (finalRole !== "admin") {
      return jsonNoStore({ message: "Permissão de gestão de usuários só se aplica a admins." }, 400);
    }
  }

  // XG06 — adminEscopo: só superadmin altera, só sobre admins, e nunca sobre a
  // própria conta (auto-restrição/auto-promoção é caminho de escalação).
  if (updates.adminEscopo !== undefined) {
    if (guard.user.role !== "superadmin") {
      return jsonNoStore({ message: "Apenas super admin pode alterar o escopo administrativo." }, 403);
    }
    if (target.id === guard.user.id) {
      return jsonNoStore({ message: "Não é possível alterar o próprio escopo administrativo." }, 400);
    }
    const finalRole = (updates.role ?? target.role) as Role;
    if (finalRole !== "admin") {
      return jsonNoStore({ message: "Escopo administrativo só se aplica a admins." }, 400);
    }
  }

  // Email change: validate uniqueness → 409 conflict
  if (updates.email && updates.email !== target.email) {
    const conflict = await getUserByEmail(updates.email);
    if (conflict && conflict.id !== target.id) {
      return jsonNoStore({ message: "Já existe um usuário com este email." }, 409);
    }
  }

  const [updated] = await db
    .update(users)
    .set({
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.email !== undefined ? { email: updates.email } : {}),
      ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
      ...(updates.role !== undefined ? { role: updates.role } : {}),
      ...(updates.ativo !== undefined ? { ativo: updates.ativo } : {}),
      ...(updates.canManageUsers !== undefined ? { canManageUsers: updates.canManageUsers } : {}),
      ...(updates.adminEscopo !== undefined ? { adminEscopo: updates.adminEscopo } : {}),
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
    canManageUsers: (updated as { canManageUsers?: boolean }).canManageUsers ?? false,
  });
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!hasUsersTabAccess(guard.user as { role: string; canManageUsers?: boolean | null })) {
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
