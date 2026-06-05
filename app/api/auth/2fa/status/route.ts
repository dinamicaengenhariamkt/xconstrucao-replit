import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders, isAdminLike } from "@features/auth/api/auth-utils";
import { getTotpByUser } from "@features/auth/api/totp-storage";
import { ADMIN_2FA_OBRIGATORIO } from "@features/auth/api/totp-policy";

/**
 * GET /api/auth/2fa/status — estado do 2FA da conta logada, pra renderizar o card (J22).
 * Retorna se está ativo, se a conta pode usar 2FA local (tem senha) e se é obrigatório.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { user } = guard;

  const totp = await getTotpByUser(user.id);
  const obrigatorio = ADMIN_2FA_OBRIGATORIO && isAdminLike(user.role);

  const r = NextResponse.json({
    enabled: Boolean(totp?.enabled),
    disponivel: Boolean(user.password), // contas OAuth-only não fazem 2FA local
    obrigatorio,
  });
  setNoCacheHeaders(r);
  return r;
}
