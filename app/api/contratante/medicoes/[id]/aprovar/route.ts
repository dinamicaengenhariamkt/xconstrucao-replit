import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { medicoes } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { isRateLimited } from "@features/auth/api/rate-limit";
import { assertMedicaoEditableByContratante, recomputeObraProgresso } from "../../_shared";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id } = await ctx.params;

  if (isRateLimited(`medicoes.aprovar:user:${guard.user.id}`, 60, 60 * 1000)) {
    const r = NextResponse.json({ message: "Muitas requisições. Aguarde um minuto." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }

  const check = await assertMedicaoEditableByContratante(id, { id: guard.user.id, role: guard.user.role });
  if (!check.ok) {
    const r = NextResponse.json({ message: check.message }, { status: check.status });
    setNoCacheHeaders(r);
    return r;
  }

  if (check.medicao.status !== "pendente") {
    const r = NextResponse.json(
      { message: `Esta medição já foi ${check.medicao.status === "aprovada" ? "aprovada" : "contestada"}.` },
      { status: 409 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  // Garante que aprovar não estoure 100% (soma das aprovadas já existentes + esta).
  const [agg] = await db
    .select({ soma: sql<string>`COALESCE(SUM(percentual), 0)` })
    .from(medicoes)
    .where(and(eq(medicoes.obraId, check.medicao.obraId), eq(medicoes.status, "aprovada")));

  const somaAprovada = Number(agg?.soma ?? 0);
  const novo = somaAprovada + Number(check.medicao.percentual);
  if (novo > 100.01) {
    const r = NextResponse.json(
      { message: `Aprovação ultrapassaria 100% concluído (atual aprovado: ${somaAprovada}%, esta medição: ${check.medicao.percentual}%).` },
      { status: 422 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const [updated] = await db
    .update(medicoes)
    .set({ status: "aprovada", decidedAt: new Date(), decidedBy: guard.user.id, motivoContestacao: null })
    .where(eq(medicoes.id, id))
    .returning();

  const progresso = await recomputeObraProgresso(check.medicao.obraId);

  await recordAudit({
    actorId: guard.user.id,
    action: "medicoes.aprovar",
    targetUserId: check.medicao.empreiteiroId,
    payload: { medicaoId: id, obraId: check.medicao.obraId, percentual: Number(check.medicao.percentual), novoProgresso: progresso },
    request,
  });

  const r = NextResponse.json({ ...updated, progresso });
  setNoCacheHeaders(r);
  return r;
}
