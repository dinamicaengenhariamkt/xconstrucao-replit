import { NextRequest, NextResponse } from 'next/server';
import { lerTokenDescadastro } from '@features/xgestao/marketing/lib/token-descadastro';
import { alterarConsentimentoMarketing } from '@features/xgestao/marketing/server/consentimento-service';
import { checkRateLimit, getClientIp } from '@features/auth/api/rate-limit';

/**
 * XG52 — descadastro do e-mail de marketing, sem login.
 *
 *   POST /api/xgestao/descadastro?t=<token>     (botão da página /descadastro e
 *                                               `List-Unsubscribe-Post` em um clique)
 *   POST /api/xgestao/descadastro  { "token": "<token>" }
 *
 * Token inválido: 400 genérico (não diz se a conta existe). Repetir o pedido
 * não muda nada e responde 200. Só POST: um GET (pré-visualização do link pelo
 * provedor de e-mail) não pode tirar ninguém da lista.
 */
function responder(payload: unknown, status: number) {
  return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function tokenDoPedido(request: NextRequest): Promise<string | null> {
  const daUrl = request.nextUrl.searchParams.get('t');
  if (daUrl) return daUrl;
  const tipo = request.headers.get('content-type') ?? '';
  if (tipo.includes('application/json')) {
    const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
    return typeof body?.token === 'string' ? body.token : null;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const limite = checkRateLimit(`descadastro:${getClientIp(request)}`, 30, 15 * 60 * 1000);
  if (limite.limited) return responder({ message: 'Muitas tentativas. Tente de novo em alguns minutos.' }, 429);

  const userId = lerTokenDescadastro(await tokenDoPedido(request));
  if (!userId) return responder({ message: 'Link de descadastro inválido.' }, 400);

  const estado = await alterarConsentimentoMarketing({ userId, aceitar: false, origem: 'descadastro', request });
  if (!estado) return responder({ message: 'Link de descadastro inválido.' }, 400);
  return responder({ ok: true }, 200);
}
