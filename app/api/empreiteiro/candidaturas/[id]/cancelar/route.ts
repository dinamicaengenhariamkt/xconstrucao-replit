import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { candidaturas } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";

/**
 * POST /api/empreiteiro/candidaturas/[id]/cancelar
 *  - Empreiteiro dono cancela a própria proposta enquanto está `pendente`.
 *  - Reusa o enum existente: status → `rejeitada` + flag `cancelada_pelo_empreiteiro=true`
 *    (evita migrar enum). UI distingue ambas via flag.
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "empreiteiro") {
    const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const { id } = await ctx.params;

  // Ownership: descobrir a candidatura primeiro para devolver 404 (anti-enum)
  // se não for do empreiteiro logado, sem mexer no status.
  const [existing] = await db
    .select({ id: candidaturas.id, status: candidaturas.status, obraId: candidaturas.obraId })
    .from(candidaturas)
    .where(and(eq(candidaturas.id, id), eq(candidaturas.empreiteiroId, guard.user.id)));

  if (!existing) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  // UPDATE atômico: condicionado a status='pendente'. Se outra request
  // (aceite/rejeição pelo contratante) já mudou o status entre o SELECT e
  // o UPDATE, rowCount=0 → devolve 409 sem sobrescrever.
  const updatedRows = await db
    .update(candidaturas)
    .set({
      status: "rejeitada",
      canceladaPeloEmpreiteiro: true,
      motivoRejeicao: "Cancelada pelo empreiteiro",
      decididaEm: new Date(),
    })
    .where(and(eq(candidaturas.id, id), eq(candidaturas.status, "pendente")))
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
    action: "candidaturas.cancelar",
    targetUserId: null,
    payload: { candidaturaId: id, obraId: existing.obraId },
    request,
  });

  const r = NextResponse.json(updated);
  setNoCacheHeaders(r);
  return r;
}
