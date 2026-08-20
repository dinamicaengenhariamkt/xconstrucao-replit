import 'server-only';

import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { db } from '@shared/db/db';
import { empreiteiras } from '@shared/db/schema';
import { getUser } from '@features/auth/api/auth-storage';
import {
  verifyAccessToken,
  verifyAccessTokenAllowExpired,
} from '@features/auth/api/auth-service';
import { userHasRole } from '@features/auth/api/auth-utils';
import {
  IMPERSONATION_COOKIE_NAME,
  verifyImpersonationToken,
} from '@features/auth/api/impersonation';

export type XGestaoEntitlement = {
  empreiteiraId: string;
  hasXgestao: true;
};

/**
 * Verifica a capacidade adicional do produto e resolve a empreiteira operacional.
 *
 * O JWT não carrega roles aditivas, portanto esta checagem sempre consulta o banco.
 * Todas as rotas futuras de API do xgestão devem chamar este helper depois de
 * autenticar a request com `requireVerifiedUser`.
 */
export async function assertXgestaoUser(userId: string): Promise<XGestaoEntitlement | null> {
  if (!userId || !(await userHasRole(userId, 'xgestao'))) {
    return null;
  }

  const [empreiteira] = await db
    .select({ id: empreiteiras.id })
    .from(empreiteiras)
    .where(eq(empreiteiras.userId, userId));

  if (!empreiteira) {
    return null;
  }

  return { empreiteiraId: empreiteira.id, hasXgestao: true };
}

/**
 * Resolve o direito de acesso para Server Components do xgestão.
 *
 * Tokens recém-expirados são aceitos quando a assinatura continua íntegra, como no
 * proxy: o cliente pode renová-los normalmente. Ainda assim, o usuário e o direito
 * adicional são sempre relidos do banco.
 */
export async function getCurrentXGestaoEntitlement(): Promise<XGestaoEntitlement | null> {
  const accessToken = (await cookies()).get('access_token')?.value;
  const claims = accessToken
    ? verifyAccessToken(accessToken) ?? verifyAccessTokenAllowExpired(accessToken)
    : null;

  if (!claims?.sub) {
    return null;
  }

  const actor = await getUser(claims.sub);
  if (!actor || !actor.ativo || !actor.emailVerified || actor.mustChangePassword) {
    return null;
  }

  // Superadmins só entram no produto ao visualizar um empreiteiro autorizado.
  // Não existe um "tenant" próprio de superadmin para listar obras, e tratá-lo
  // como cliente do produto permitiria uma visão operacional sem dono.
  const impersonationToken = (await cookies()).get(IMPERSONATION_COOKIE_NAME)?.value;
  const impersonation = impersonationToken
    ? verifyImpersonationToken(impersonationToken)
    : null;
  const subjectId =
    actor.role === 'superadmin' && impersonation?.actorId === actor.id
      ? impersonation.targetId
      : actor.id;

  const subject = subjectId === actor.id ? actor : await getUser(subjectId);
  if (!subject || !subject.ativo || !subject.emailVerified || subject.mustChangePassword) {
    return null;
  }

  return assertXgestaoUser(subject.id);
}