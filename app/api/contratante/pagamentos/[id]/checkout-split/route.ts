import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";
import {
  getLancamento,
  isContratanteOwnerOfLancamento,
} from "@features/financeiro/lancamentos-service";
import { temDisputaAtivaNoAlvo } from "@features/disputas/disputas-service";
import { iniciarCheckoutSplit } from "@features/marketplace/split-service";

/**
 * POST /api/contratante/pagamentos/[id]/checkout-split — J47
 * Inicia o pagamento de obra via plataforma (checkout Asaas com split).
 * Reusa as MESMAS validações do fluxo manual (ownership, já pago, disputa).
 * Não altera o status do `financeiro` — isso ocorre no webhook (J48).
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "contratante" && guard.user.role !== "superadmin") {
    const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const ip = getClientIp(request);
  if (isRateLimited(`checkout-split:${guard.user.id}`, 10, 60 * 1000)) {
    const r = NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }
  if (isRateLimited(`checkout-split.ip:${ip}`, 30, 60 * 1000)) {
    const r = NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }

  const { id } = await ctx.params;
  const lanc = await getLancamento(id);
  if (!lanc) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  const owns = await isContratanteOwnerOfLancamento(lanc, guard.user.id);
  if (!owns && guard.user.role !== "superadmin") {
    const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  if (lanc.status === "pago") {
    const r = NextResponse.json({ error: "ALREADY_PAID" }, { status: 409 });
    setNoCacheHeaders(r);
    return r;
  }

  // J10 — pagamento sob disputa ativa fica congelado até a resolução do admin.
  if (await temDisputaAtivaNoAlvo("pagamento", id)) {
    const r = NextResponse.json({ error: "EM_DISPUTA" }, { status: 409 });
    setNoCacheHeaders(r);
    return r;
  }

  const result = await iniciarCheckoutSplit({ lancamento: lanc, pagadorUserId: guard.user.id });

  if (!result.ok) {
    const status =
      result.code === "SPLIT_DESABILITADO"
        ? 403
        : result.code === "SUBCONTA_NAO_APROVADA" || result.code === "RECEBEDOR_INDEFINIDO"
          ? 422
          : 500;
    const message =
      result.code === "SPLIT_DESABILITADO"
        ? "Pagamento via plataforma indisponível no momento."
        : result.code === "SUBCONTA_NAO_APROVADA" || result.code === "RECEBEDOR_INDEFINIDO"
          ? result.detail
          : "Não foi possível iniciar o pagamento. Tente novamente.";
    const r = NextResponse.json({ error: result.code, message }, { status });
    setNoCacheHeaders(r);
    return r;
  }

  await recordAudit({
    actorId: guard.user.id,
    action: "pagamentos.checkout-split",
    targetUserId: null,
    payload: { financeiroId: id, splitId: result.splitId, asaasPaymentId: result.asaasPaymentId },
    request,
  });

  const r = NextResponse.json({ ok: true, url: result.invoiceUrl });
  setNoCacheHeaders(r);
  return r;
}
