import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { xgestaoMembros } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { assertXgestaoUser } from "@features/xgestao/lib/entitlement";

export function jsonSemCache(payload: unknown, status = 200) {
  const response = NextResponse.json(payload, { status });
  setNoCacheHeaders(response);
  return response;
}

/**
 * XG35 — quem decide sobre o plano do xgestão é o responsável pela conta, nunca
 * um membro da equipe. Mesma regra de `GET /api/perfil/plano?persona=xgestao`.
 */
export async function requireResponsavelPlanoXgestao(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return { error: guard.error } as const;
  const [membership] = await db
    .select({ id: xgestaoMembros.id })
    .from(xgestaoMembros)
    .where(and(eq(xgestaoMembros.userId, guard.user.id), eq(xgestaoMembros.status, "ativo")));
  if (membership) {
    return { error: jsonSemCache({ message: "O plano do xgestão é gerenciado pelo responsável da empresa." }, 403) } as const;
  }
  if (!(await assertXgestaoUser(guard.user.id))) {
    return { error: jsonSemCache({ message: "Acesso xgestão não autorizado." }, 403) } as const;
  }
  return { error: null, userId: guard.user.id } as const;
}
