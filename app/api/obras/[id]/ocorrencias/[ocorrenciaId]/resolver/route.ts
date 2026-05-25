import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { obraOcorrencias } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";
import { registrarAtividade } from "@features/atividades/api/registrar";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string; ocorrenciaId: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id, ocorrenciaId } = await ctx.params;
  const access = await findObraAccess(id, { id: guard.user.id, role: guard.user.role });
  if (!access) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (!canWriteObraContent(access)) {
    const r = NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  // UPDATE atômico: só fecha se estava aberta. Resposta 409 se já resolvida.
  const result = await db
    .update(obraOcorrencias)
    .set({ status: "resolvida", resolvidoPorId: guard.user.id, resolvidoEm: new Date() })
    .where(and(eq(obraOcorrencias.id, ocorrenciaId), eq(obraOcorrencias.obraId, id), eq(obraOcorrencias.status, "aberta")))
    .returning();
  if (result.length === 0) {
    // Distinguir 404 vs 409
    const [exists] = await db.select({ status: obraOcorrencias.status }).from(obraOcorrencias)
      .where(and(eq(obraOcorrencias.id, ocorrenciaId), eq(obraOcorrencias.obraId, id)));
    if (!exists) {
      const r = NextResponse.json({ message: "Ocorrência não encontrada" }, { status: 404 });
      setNoCacheHeaders(r);
      return r;
    }
    const r = NextResponse.json({ error: "ALREADY_RESOLVED", message: "Ocorrência já estava resolvida." }, { status: 409 });
    setNoCacheHeaders(r);
    return r;
  }
  await recordAudit({ actorId: guard.user.id, action: "obras.ocorrencia.resolver", payload: { obraId: id, ocorrenciaId }, request });
  void registrarAtividade({
    tipo: "ocorrencia_resolvida",
    actorUserId: guard.user.id,
    obraId: id,
    payload: { ocorrenciaId, titulo: result[0]?.titulo ?? null },
  });
  const r = NextResponse.json(result[0]);
  setNoCacheHeaders(r);
  return r;
}
