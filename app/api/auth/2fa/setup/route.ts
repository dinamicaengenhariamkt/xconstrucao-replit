import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { gerarSecret, montarOtpauthUri } from "@features/auth/api/totp";
import { getTotpByUser, salvarSecretPendente } from "@features/auth/api/totp-storage";

/**
 * POST /api/auth/2fa/setup — inicia a ativação do 2FA (J22).
 * Gera um secret TOTP pendente (NÃO ativa ainda) e devolve o QR + secret manual.
 * Idempotente: refazer o setup sobrescreve um secret pendente anterior.
 * Recusa se a conta JÁ tem 2FA ativo (precisa desativar antes) ou for OAuth-only.
 */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { user } = guard;

  // Contas OAuth (sem senha local) não fazem 2FA local — o provedor já cobre.
  if (!user.password) {
    const r = NextResponse.json(
      { error: "OAUTH_ACCOUNT", message: "Contas externas não usam verificação em duas etapas local." },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const existente = await getTotpByUser(user.id);
  if (existente?.enabled) {
    const r = NextResponse.json(
      { error: "ALREADY_ENABLED", message: "A verificação em duas etapas já está ativa." },
      { status: 409 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const secret = gerarSecret();
  const otpauthUri = montarOtpauthUri(user.email, secret);
  await salvarSecretPendente(user.id, secret);

  const qrDataUrl = await QRCode.toDataURL(otpauthUri);

  const r = NextResponse.json({ secret, otpauthUri, qrDataUrl });
  setNoCacheHeaders(r);
  return r;
}
