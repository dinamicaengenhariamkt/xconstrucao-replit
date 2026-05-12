import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getUser } from "@features/auth/api/auth-storage";
import { createImpersonationToken, setImpersonationCookie } from "@features/auth/api/impersonation";
import { recordAudit } from "@features/auth/api/audit";

function jsonNoStore(payload: unknown, status = 200): NextResponse {
  const r = NextResponse.json(payload, { status });
  setNoCacheHeaders(r);
  return r;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "superadmin") return jsonNoStore({ message: "Apenas super admin." }, 403);
  if (id === guard.user.id) return jsonNoStore({ message: "Não é possível impersonar a si mesmo." }, 400);

  const target = await getUser(id);
  if (!target) return jsonNoStore({ message: "Usuário não encontrado." }, 404);
  if (target.role === "superadmin") return jsonNoStore({ message: "Não é possível impersonar outro super admin." }, 403);
  if (!target.ativo) return jsonNoStore({ message: "Usuário inativo." }, 400);

  const token = createImpersonationToken(guard.user.id, target.id);
  await recordAudit({
    actorId: guard.user.id,
    targetUserId: target.id,
    action: "impersonate.start",
    payload: { targetRole: target.role },
    request,
  });

  const response = jsonNoStore({
    ok: true,
    target: { id: target.id, name: target.name, email: target.email, role: target.role },
  });
  setImpersonationCookie(response, token);
  return response;
}
