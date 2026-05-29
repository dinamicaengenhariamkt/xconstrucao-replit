import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { medicoes } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { isRateLimited } from "@features/auth/api/rate-limit";
import { assertMedicaoEditableByContratante, recomputeObraProgresso } from "../../_shared";
import { registrarAtividade } from "@features/atividades/api/registrar";
import { dispararNotificacaoMedicaoContestada } from "@features/notificacoes/medicao-dispatcher";

const bodySchema = z.object({
  motivo: z.string().trim().min(10).max(2000),
});

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id } = await ctx.params;

  if (isRateLimited(`medicoes.contestar:user:${guard.user.id}`, 60, 60 * 1000)) {
    const r = NextResponse.json({ message: "Muitas requisições. Aguarde um minuto." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json(
      { message: "Motivo inválido (mín. 10 caracteres).", errors: parsed.error.flatten() },
      { status: 400 },
    );
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

  const [updated] = await db
    .update(medicoes)
    .set({
      status: "contestada",
      decidedAt: new Date(),
      decidedBy: guard.user.id,
      motivoContestacao: parsed.data.motivo,
    })
    .where(eq(medicoes.id, id))
    .returning();

  // Recalcula progresso (não muda, mas mantém invariante caso houvesse drift).
  await recomputeObraProgresso(check.medicao.obraId);

  await recordAudit({
    actorId: guard.user.id,
    action: "medicoes.contestar",
    targetUserId: check.medicao.empreiteiroId,
    payload: { medicaoId: id, obraId: check.medicao.obraId, motivo: parsed.data.motivo },
    request,
  });
  void registrarAtividade({
    tipo: "medicao_contestada",
    actorUserId: guard.user.id,
    obraId: check.medicao.obraId,
    targetUserId: check.medicao.empreiteiroId,
    payload: { medicaoId: id, numero: check.medicao.numero, etapa: check.medicao.etapa, motivo: parsed.data.motivo },
  });

  // J06 — notificar empreiteiro de medição contestada (com motivo).
  after(() => dispararNotificacaoMedicaoContestada({ medicaoId: id, motivo: parsed.data.motivo }));

  const r = NextResponse.json(updated);
  setNoCacheHeaders(r);
  return r;
}
