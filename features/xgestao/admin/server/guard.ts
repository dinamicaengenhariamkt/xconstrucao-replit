import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { isAdminLike, requireVerifiedUser, setNoCacheHeaders } from '@features/auth/api/auth-utils';

/**
 * Porta de entrada das rotas administrativas do xgestão.
 *
 * O escopo (`adminEscopo`) é aplicado por prefixo em `auth-utils`, que lê o
 * usuário do banco: como estas rotas ficam sob `/api/admin/xgestao`, um admin
 * restrito ao produto passa e um admin global também. Aqui resta garantir que
 * quem não é administrador não entra.
 */
export async function requireAdminXgestao(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return { error: guard.error };

  if (!isAdminLike(guard.user.role)) {
    const response = NextResponse.json({ message: 'Apenas administradores.' }, { status: 403 });
    setNoCacheHeaders(response);
    return { error: response };
  }
  return { error: null as null };
}

/** Resposta JSON sem cache, padrão das rotas administrativas. */
export function adminJson(data: unknown, status = 200) {
  const response = NextResponse.json(data, { status });
  setNoCacheHeaders(response);
  return response;
}
