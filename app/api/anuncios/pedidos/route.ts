import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";
import { criarPedidoSchema, validarPeriodoPago } from "@features/anuncios/self-service/schemas";
import { criarPedido, listarPedidosDoUsuario } from "@features/anuncios/self-service/pedido-service";
import { isAdPaymentEnabled } from "@features/anuncios/self-service/flags";
import { anuncianteAceitouContratoVigente, getVersaoVigente } from "@features/legal/legal-service";

/** GET /api/anuncios/pedidos — pedidos do usuário logado (com slots). */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const pedidos = await listarPedidosDoUsuario(guard.user.id);
  const r = NextResponse.json({ pedidos });
  setNoCacheHeaders(r);
  return r;
}

/** POST /api/anuncios/pedidos — cria pedido multi-slot (checkout-protótipo). */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  // J59 — gate de contrato do anunciante: só quem aceitou a versão vigente do
  // Termo do Anunciante pode criar um pedido. Cobre os dois caminhos (anunciante
  // puro E cliente que anuncia), pois ambos batem neste POST — e fica ANTES de
  // criarPedido (que criaria a identidade/papel de anunciante). Fail-open quando
  // não há termo publicado (ver anuncianteAceitouContratoVigente).
  if (!(await anuncianteAceitouContratoVigente(guard.user.id))) {
    const vigente = await getVersaoVigente("termo_anunciante");
    const r = NextResponse.json(
      {
        message: "Você precisa aceitar o Termo do Anunciante antes de anunciar.",
        code: "CONTRATO_ANUNCIANTE_NAO_ACEITO",
        versao: vigente?.versao ?? null,
      },
      { status: 403 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  // Anti-abuso: limita criação por usuário e por IP (J19).
  const ip = getClientIp(request);
  if (isRateLimited(`anuncios.pedido:${guard.user.id}`, 10, 60 * 1000)) {
    const r = NextResponse.json({ message: "Muitos pedidos em pouco tempo. Aguarde um instante." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }
  if (isRateLimited(`anuncios.pedido.ip:${ip}`, 30, 60 * 1000)) {
    const r = NextResponse.json({ message: "Muitas requisições deste IP." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const parsed = criarPedidoSchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json(
      { message: "Dados inválidos", errors: parsed.error.flatten() },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  // J31 — no modo pago, período é obrigatório e o início deve estar na janela
  // [hoje, hoje+7]. Validação server-side (fresca), separada do schema base.
  if (isAdPaymentEnabled()) {
    const errosPeriodo = validarPeriodoPago(parsed.data.slots);
    if (errosPeriodo.length > 0) {
      const r = NextResponse.json(
        { message: errosPeriodo[0], errors: { periodo: errosPeriodo }, code: "PERIODO_INVALIDO" },
        { status: 400 },
      );
      setNoCacheHeaders(r);
      return r;
    }
  }

  let result: Awaited<ReturnType<typeof criarPedido>>;
  try {
    result = await criarPedido({ solicitanteUserId: guard.user.id, slots: parsed.data.slots });
  } catch (err) {
    console.error("[POST /api/anuncios/pedidos] falha:", err);
    const r = NextResponse.json({ message: "Não foi possível criar o pedido", code: "PEDIDO_CREATE_FAILED" }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  void recordAudit({
    actorId: guard.user.id,
    action: "anuncios.pedido.create",
    payload: { pedidoId: result.pedido.id, slots: result.pedido.slots.length, valorTotal: result.pedido.valorTotal },
    request,
  });

  // Notifica o anunciante que o pedido foi recebido (best-effort).
  void import("@features/notificacoes/anuncio-dispatcher")
    .then((m) => m.notificarPedidoRecebido(result.pedido.id, guard.user.id))
    .catch(() => {});

  const r = NextResponse.json({ pedido: result.pedido, cobranca: result.cobranca }, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
