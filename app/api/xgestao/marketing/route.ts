import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireVerifiedUser, setNoCacheHeaders } from '@features/auth/api/auth-utils';
import {
  alterarConsentimentoMarketing,
  lerConsentimentoMarketing,
} from '@features/xgestao/marketing/server/consentimento-service';

/**
 * XG52 — liga/desliga o e-mail de dicas e novidades do xgestão (LGPD,
 * consentimento revogável a qualquer momento). Só a própria conta.
 *
 *   GET   /api/xgestao/marketing  -> { ativo, consentimentoEm, revogadoEm, origem }
 *   PATCH /api/xgestao/marketing  { aceitar: boolean }
 */
const corpoSchema = z.object({ aceitar: z.boolean() });

function responder(payload: unknown, status = 200) {
  const r = NextResponse.json(payload, { status });
  setNoCacheHeaders(r);
  return r;
}

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const estado = await lerConsentimentoMarketing(guard.user.id);
  if (!estado) return responder({ message: 'Conta não encontrada' }, 404);
  return responder(estado);
}

export async function PATCH(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const parsed = corpoSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return responder({ message: 'Dados inválidos' }, 400);
  const estado = await alterarConsentimentoMarketing({
    userId: guard.user.id,
    aceitar: parsed.data.aceitar,
    origem: 'configuracoes',
    request,
  });
  if (!estado) return responder({ message: 'Conta não encontrada' }, 404);
  return responder(estado);
}
