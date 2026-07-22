import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";
import { gerarLinkPagamento } from "@features/anuncios/self-service/pedido-service";
import { isAdPaymentEnabled } from "@features/anuncios/self-service/flags";
import { unformatCpfCnpj } from "@shared/lib/masks";

const bodySchema = z.object({
  cpfCnpj: z.string().transform(unformatCpfCnpj).refine((v) => v.length === 11 || v.length === 14, {
    message: "CPF (11) ou CNPJ (14) dígitos.",
  }),
});

/**
 * POST /api/anuncios/pedidos/[id]/pagar (J31) — gera o link de pagamento de um
 * pedido APROVADO (moderar-antes-de-pagar). Exige CPF/CNPJ (customer lazy do
 * anunciante). Retorna { invoiceUrl } para o client redirecionar ao checkout Asaas.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  // Só existe no modo pago; no protótipo não há link (o pedido já "adquire").
  if (!isAdPaymentEnabled()) {
    const r = NextResponse.json({ message: "Cobrança de anúncio não está habilitada." }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  const ip = getClientIp(request);
  if (isRateLimited(`anuncios.pagar:${guard.user.id}`, 10, 60 * 1000) || isRateLimited(`anuncios.pagar.ip:${ip}`, 30, 60 * 1000)) {
    const r = NextResponse.json({ message: "Muitas tentativas. Aguarde um instante." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json(
      { message: "Informe um CPF ou CNPJ válido.", code: "CPF_CNPJ_INVALIDO" },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const result = await gerarLinkPagamento({ pedidoId: id, userId: guard.user.id, cpfCnpj: parsed.data.cpfCnpj });

  if (!result.ok) {
    const statusMap: Record<string, number> = {
      NAO_ENCONTRADO: 404,
      ESTADO_INVALIDO: 409,
      ZONAS_INDISPONIVEIS: 409,
      ERRO_GATEWAY: 502,
    };
    const msgMap: Record<string, string> = {
      NAO_ENCONTRADO: "Pedido não encontrado.",
      ESTADO_INVALIDO: "Este pedido não está aguardando pagamento.",
      ZONAS_INDISPONIVEIS: "As zonas escolhidas não estão disponíveis no período. Fale com o suporte.",
      ERRO_GATEWAY: "Não foi possível gerar o pagamento agora. Tente novamente.",
    };
    const r = NextResponse.json({ message: msgMap[result.code], code: result.code }, { status: statusMap[result.code] });
    setNoCacheHeaders(r);
    return r;
  }

  const r = NextResponse.json({ ok: true, invoiceUrl: result.invoiceUrl });
  setNoCacheHeaders(r);
  return r;
}
