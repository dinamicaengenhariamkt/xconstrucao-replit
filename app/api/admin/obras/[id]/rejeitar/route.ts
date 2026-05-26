import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { obras } from "@shared/db/schema";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";

const bodySchema = z.object({
  motivo: z.string().trim().min(5, "Motivo deve ter pelo menos 5 caracteres").max(500),
});

/**
 * POST /api/admin/obras/[id]/rejeitar  (J03 — Task #86)
 * Gate isAdminLike. Rejeita obra publicada em moderação:
 *  - statusModeracao = 'rejeitada' + motivoModeracao = body.motivo
 *  - moderadoEm = now(), moderadoPor = admin
 *  - audit log obras.moderar.rejeitar
 * Não emite atividade J07 (obra não entra no marketplace).
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const { id } = await ctx.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const r = NextResponse.json(
      { message: "Dados inválidos", errors: parsed.error.flatten() },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const txResult = await db.transaction(async (tx) => {
    const [obra] = await tx.select().from(obras).where(eq(obras.id, id)).for("update");
    if (!obra) return { kind: "not_found" as const };
    if (obra.visibilidade !== "publicada") {
      return { kind: "not_published" as const };
    }

    const [updated] = await tx
      .update(obras)
      .set({
        statusModeracao: "rejeitada",
        motivoModeracao: parsed.data.motivo,
        moderadoEm: new Date(),
        moderadoPor: guard.user.id,
        updatedAt: new Date(),
      })
      .where(eq(obras.id, id))
      .returning();
    return { kind: "rejected" as const, obra, updated };
  });

  if (txResult.kind === "not_found") {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (txResult.kind === "not_published") {
    const r = NextResponse.json(
      { error: "OBRA_NAO_PUBLICADA", message: "Só é possível moderar obras com visibilidade 'publicada'." },
      { status: 409 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  await recordAudit({
    actorId: guard.user.id,
    action: "obras.moderar.rejeitar",
    targetUserId: null,
    payload: {
      obraId: id,
      nome: txResult.obra.nome,
      motivo: parsed.data.motivo,
      statusAnterior: txResult.obra.statusModeracao,
    },
    request,
  });

  const r = NextResponse.json(txResult.updated);
  setNoCacheHeaders(r);
  return r;
}
