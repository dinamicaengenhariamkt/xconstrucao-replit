import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { isAdminLike, requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { isRateLimited } from "@features/auth/api/rate-limit";
import { recordAudit } from "@features/auth/api/audit";
import { assertXgestaoUser } from "@features/xgestao/lib/entitlement";
import { confirmarTroca, previaTroca } from "@features/planos/troca-plano-service";
import { db } from "@shared/db/db";
import { xgestaoMembros } from "@shared/db/schema";

const bodySchema = z.object({
  planoId: z.string().min(1).max(64),
  persona: z.literal("xgestao"),
  /** true = só o cálculo e a lista do que excede, sem efeito. */
  previa: z.boolean().optional(),
  /** Uma por diálogo aberto: clique duplo e reenvio aplicam a troca uma vez. */
  chave: z.string().min(8).max(100).optional(),
  obras: z.array(z.string().min(1).max(64)).max(200).optional(),
  membros: z.array(z.string().min(1).max(64)).max(200).optional(),
  ciente: z.boolean().optional(),
});

function json(body: unknown, status = 200) {
  const r = NextResponse.json(body, { status });
  setNoCacheHeaders(r);
  return r;
}

/**
 * XG48 — POST /api/assinaturas/trocar: troca de plano do xgestão com
 * assinatura paga. `previa: true` devolve o cálculo (proporcional, próxima
 * fatura) e o que excede o plano novo; sem `previa`, confirma com `chave`.
 * Só o responsável (dono) troca; membro, admin e superadmin recebem 403.
 */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (isAdminLike(guard.user.role)) return json({ message: "Perfil administrativo não tem plano xgestão." }, 403);
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return json({ message: "Dados inválidos.", errors: parsed.error.flatten() }, 400);

  // Membro (ativo, convidado ou pausado) nunca decide o plano da empresa.
  const [membro] = await db.select({ id: xgestaoMembros.id }).from(xgestaoMembros).where(and(
    eq(xgestaoMembros.userId, guard.user.id), inArray(xgestaoMembros.status, ["ativo", "convidado", "pausado"]),
  ));
  if (membro) return json({ message: "Somente o responsável da empresa pode mudar o plano xgestão." }, 403);
  const entitlement = await assertXgestaoUser(guard.user.id);
  if (!entitlement || entitlement.papel !== "dono") return json({ message: "Acesso xgestão não autorizado." }, 403);

  if (isRateLimited(`assinatura.trocar:user:${guard.user.id}`, 30, 60 * 1000)) {
    return json({ message: "Muitas requisições. Aguarde um minuto." }, 429);
  }

  if (parsed.data.previa) {
    const r = await previaTroca(guard.user.id, parsed.data.planoId);
    return r.ok ? json(r.previa) : json({ message: r.message, code: r.code }, r.status);
  }

  if (!parsed.data.chave) return json({ message: "Pedido sem chave de idempotência.", code: "CHAVE_OBRIGATORIA" }, 400);
  const r = await confirmarTroca(guard.user.id, {
    planoId: parsed.data.planoId,
    chave: parsed.data.chave,
    obras: parsed.data.obras,
    membros: parsed.data.membros,
    ciente: parsed.data.ciente,
  });
  if (!r.ok) return json({ message: r.message, code: r.code }, r.status);
  if (!r.repetida) {
    void recordAudit({
      actorId: guard.user.id,
      action: "assinatura.trocar",
      payload: { planoId: parsed.data.planoId, trocaId: r.trocaId, status: r.status, acao: r.previa?.acao ?? null },
      request,
    });
  }
  return json({ ok: true, trocaId: r.trocaId, status: r.status, repetida: r.repetida, previa: r.previa });
}
