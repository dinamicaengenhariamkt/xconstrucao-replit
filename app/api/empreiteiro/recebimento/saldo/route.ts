import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { isMarketplaceSplitEnabled } from "@features/marketplace/flags";
import { consultarSaldo, listarSaques } from "@features/marketplace/saldo-service";

/**
 * GET /api/empreiteiro/recebimento/saldo — J49
 * Saldo real da subconta + histórico de saques. Guard: só empreiteiro.
 * Gate: MARKETPLACE_SPLIT=on + subconta aprovada.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "empreiteiro") {
    const r = NextResponse.json({ message: "Perfil sem acesso" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  if (!isMarketplaceSplitEnabled()) {
    const r = NextResponse.json({ enabled: false, saldo: null, saques: [] });
    setNoCacheHeaders(r);
    return r;
  }

  const saldoResult = await consultarSaldo(guard.user.id);
  const saques = await listarSaques(guard.user.id);

  if (!saldoResult.ok) {
    // SUBCONTA_NAO_APROVADA não é erro — a tela orienta o empreiteiro.
    const r = NextResponse.json({
      enabled: true,
      saldo: null,
      saques,
      motivo: saldoResult.code,
    });
    setNoCacheHeaders(r);
    return r;
  }

  const r = NextResponse.json({ enabled: true, saldo: saldoResult.saldo, saques });
  setNoCacheHeaders(r);
  return r;
}
