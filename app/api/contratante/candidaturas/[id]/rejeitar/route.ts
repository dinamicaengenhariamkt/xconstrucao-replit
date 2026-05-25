import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { candidaturas, clientes, obras } from "@shared/db/schema";
import { isAdminLike, requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { dispararNotificacaoCandidaturaDecidida } from "@features/notificacoes/candidatura-dispatcher";
import { registrarAtividade } from "@features/atividades/api/registrar";

const bodySchema = z.object({
  motivo: z.string().max(500).optional(),
});

/**
 * POST /api/contratante/candidaturas/[id]/rejeitar
 *  - Apenas contratante DONO da obra (ou admin/superadmin).
 *  - Só permite rejeitar status=pendente. 409 caso contrário.
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (!isAdminLike(guard.user.role) && guard.user.role !== "contratante") {
    const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const { id: candidaturaId } = await ctx.params;
  let bodyJson: unknown = {};
  try {
    bodyJson = await request.json();
  } catch {
    // body opcional
  }
  const parsed = bodySchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_BODY", errors: parsed.error.flatten() }, { status: 400 });
  }
  const motivo = parsed.data.motivo?.trim() || null;

  // Lookup candidatura + obra para ownership.
  const [cand] = await db.select().from(candidaturas).where(eq(candidaturas.id, candidaturaId));
  if (!cand) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (!cand.obraId) {
    return NextResponse.json({ error: "CANDIDATURA_INCOMPLETA" }, { status: 422 });
  }

  const [obra] = await db.select({ id: obras.id, clienteId: obras.clienteId }).from(obras).where(eq(obras.id, cand.obraId));
  if (!obra) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  if (!isAdminLike(guard.user.role)) {
    const [cli] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, guard.user.id));
    if (!cli || obra.clienteId !== cli.id) {
      const r = NextResponse.json(
        { error: "FORBIDDEN", message: "Você não é dono desta obra." },
        { status: 403 },
      );
      setNoCacheHeaders(r);
      return r;
    }
  }

  // UPDATE atômico: condicionado a status='pendente' no WHERE evita race
  // com aceite/cancelamento concorrente. rowCount=0 → 409 (anti-sobrescrita).
  const updatedRows = await db
    .update(candidaturas)
    .set({
      status: "rejeitada",
      motivoRejeicao: motivo,
      decididaEm: new Date(),
    })
    .where(and(eq(candidaturas.id, candidaturaId), eq(candidaturas.status, "pendente")))
    .returning();

  if (updatedRows.length === 0) {
    const r = NextResponse.json(
      { error: "INVALID_STATE", message: "Esta proposta não está mais pendente." },
      { status: 409 },
    );
    setNoCacheHeaders(r);
    return r;
  }
  const updated = updatedRows[0];

  void recordAudit({
    actorId: guard.user.id,
    action: "candidaturas.rejeitar",
    targetUserId: null,
    payload: { candidaturaId, obraId: cand.obraId, motivo: motivo ?? null },
    request,
  });
  // J07: target = empreiteiro user (cand.empreiteiroId já é users.id).
  void registrarAtividade({
    tipo: "candidatura_rejeitada",
    actorUserId: guard.user.id,
    obraId: cand.obraId,
    targetUserId: cand.empreiteiroId ?? null,
    payload: { candidaturaId, motivo: motivo ?? null },
  });

  // Notifica empreiteiro (in-app + email, idempotente via flag).
  void dispararNotificacaoCandidaturaDecidida({ candidaturaId, request });

  const r = NextResponse.json(updated);
  setNoCacheHeaders(r);
  return r;
}
