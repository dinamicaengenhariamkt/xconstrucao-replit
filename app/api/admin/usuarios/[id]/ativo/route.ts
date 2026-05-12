import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getUser } from "@features/auth/api/auth-storage";
import { recordAudit } from "@features/auth/api/audit";
import { canManage, hasUsersTabAccess } from "../../route";

type Role = "superadmin" | "admin" | "contratante" | "empreiteiro";

const schema = z.object({ ativo: z.boolean() });

function jsonNoStore(payload: unknown, status = 200): NextResponse {
  const r = NextResponse.json(payload, { status });
  setNoCacheHeaders(r);
  return r;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonNoStore({ message: "Dados inválidos" }, 400);

  if (!parsed.data.ativo && target.role === "superadmin") {
    const others = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "superadmin"), eq(users.ativo, true), ne(users.id, target.id)));
    if (others.length === 0) {
      return jsonNoStore({ message: "Não é possível desativar o último super admin ativo." }, 400);
    }
  }

  await db.update(users).set({ ativo: parsed.data.ativo }).where(eq(users.id, id));
  await recordAudit({
    actorId: guard.user.id,
    targetUserId: id,
    action: parsed.data.ativo ? "user.reactivate" : "user.deactivate",
    request,
  });
  return jsonNoStore({ ok: true, ativo: parsed.data.ativo });
}
