import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { candidaturas, clientes, empreiteiras, obras } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { getClientIp } from "@features/auth/api/rate-limit";
import { assinarContrato, montarContrato } from "@features/contratos/contrato-service";
import {
  dispararNotificacaoVezDeAssinar,
  dispararNotificacaoContratoEfetivado,
} from "@features/notificacoes/contrato-dispatcher";

/**
 * POST /api/obras/[id]/contrato/assinar  (J58)
 * Registra a assinatura eletrônica (IP/UA) da parte requester e avança o estado.
 * Contratante assina 1º; empreiteiro só quando pendente_empreiteiro. Ao assinar
 * o empreiteiro, a obra é efetivada (em_andamento).
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id: obraId } = await ctx.params;

  const [obra] = await db
    .select({ clienteId: obras.clienteId, empreiteiraId: obras.empreiteiraId })
    .from(obras)
    .where(eq(obras.id, obraId));
  if (!obra) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  // Descobre o papel do requester (admin NÃO assina — só observa).
  let papel: "contratante" | "empreiteiro" | null = null;
  if (obra.clienteId) {
    const [cli] = await db.select({ userId: clientes.userId }).from(clientes).where(eq(clientes.id, obra.clienteId));
    if (cli?.userId === guard.user.id) papel = "contratante";
  }
  if (!papel && obra.empreiteiraId) {
    const [emp] = await db.select({ userId: empreiteiras.userId }).from(empreiteiras).where(eq(empreiteiras.id, obra.empreiteiraId));
    if (emp?.userId === guard.user.id) papel = "empreiteiro";
  }
  if (!papel) {
    const r = NextResponse.json({ error: "FORBIDDEN", message: "Apenas as partes assinam o contrato." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const contrato = await montarContrato(obraId);
  if (!contrato) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (contrato.versaoTemplate < 1) {
    const r = NextResponse.json({ error: "SEM_TEMPLATE", message: "Contrato indisponível." }, { status: 409 });
    setNoCacheHeaders(r);
    return r;
  }

  const [candAceita] = await db
    .select({ id: candidaturas.id })
    .from(candidaturas)
    .where(and(eq(candidaturas.obraId, obraId), eq(candidaturas.status, "aceita")))
    .orderBy(desc(candidaturas.decididaEm))
    .limit(1);

  const res = await assinarContrato({
    obraId,
    userId: guard.user.id,
    papel,
    versaoTemplate: contrato.versaoTemplate,
    candidaturaId: candAceita?.id ?? null,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
  });

  if (!res.ok) {
    const status = res.code === "NAO_E_SUA_VEZ" ? 409 : res.code === "SEM_CONTRATO" ? 409 : 404;
    const r = NextResponse.json({ error: res.code }, { status });
    setNoCacheHeaders(r);
    return r;
  }

  void recordAudit({
    actorId: guard.user.id,
    action: "contrato.assinar",
    payload: { obraId, papel, versaoTemplate: contrato.versaoTemplate, contratoStatus: res.contratoStatus },
    request,
  });

  // Notificações fire-and-forget.
  if (res.efetivada) {
    void dispararNotificacaoContratoEfetivado(obraId).catch(() => {});
  } else {
    // Contratante assinou → é a vez do empreiteiro.
    void dispararNotificacaoVezDeAssinar(obraId, "empreiteiro").catch(() => {});
  }

  const r = NextResponse.json({ ok: true, contratoStatus: res.contratoStatus, efetivada: res.efetivada });
  setNoCacheHeaders(r);
  return r;
}
