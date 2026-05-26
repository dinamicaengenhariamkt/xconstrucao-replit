import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { obras } from "@shared/db/schema";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { registrarAtividade } from "@features/atividades/api/registrar";
import { dispararNotificacaoNovaObraZona } from "@features/notificacoes/nova-obra-zona-dispatcher";

/**
 * POST /api/admin/obras/[id]/aprovar  (J03 — Task #86)
 * Gate isAdminLike. Aprova obra publicada em moderação:
 *  - statusModeracao = 'aprovada', moderadoEm = now(), moderadoPor = admin
 *  - limpa motivoModeracao
 *  - registra atividade 'obra_publicada' (J07) — esta é a primeira vez que a obra
 *    realmente vai para o marketplace.
 *  - audit log obras.moderar.aprovar
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

  // Atômico: lê com FOR UPDATE, valida invariantes, atualiza condicionalmente
  // (visibilidade='publicada' AND status_moderacao<>'aprovada'). Em caso de corrida,
  // apenas o primeiro request que casar com o WHERE realmente troca o status —
  // o segundo recebe 0 linhas e devolve a obra existente (idempotente, sem dupla atividade).
  const txResult = await db.transaction(async (tx) => {
    const [obra] = await tx.select().from(obras).where(eq(obras.id, id)).for("update");
    if (!obra) return { kind: "not_found" as const };
    if (obra.visibilidade !== "publicada") {
      return { kind: "not_published" as const };
    }
    if (obra.statusModeracao === "aprovada") {
      return { kind: "already_approved" as const, obra };
    }

    const [updated] = await tx
      .update(obras)
      .set({
        statusModeracao: "aprovada",
        motivoModeracao: null,
        moderadoEm: new Date(),
        moderadoPor: guard.user.id,
        updatedAt: new Date(),
      })
      .where(eq(obras.id, id))
      .returning();
    return { kind: "approved" as const, obra, updated };
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
  if (txResult.kind === "already_approved") {
    const r = NextResponse.json(txResult.obra);
    setNoCacheHeaders(r);
    return r;
  }

  // Só chega aqui se realmente passou de não-aprovada → aprovada (uma única vez).
  await recordAudit({
    actorId: guard.user.id,
    action: "obras.moderar.aprovar",
    targetUserId: null,
    payload: { obraId: id, nome: txResult.obra.nome, statusAnterior: txResult.obra.statusModeracao },
    request,
  });

  void registrarAtividade({
    tipo: "obra_publicada",
    actorUserId: guard.user.id,
    obraId: id,
    payload: {
      nome: txResult.updated.nome,
      valorTotal: txResult.updated.valorTotal,
      moderadoPor: guard.user.id,
    },
  });

  // Task #94 (J13): notifica empreiteiros cuja zona de atuação bate com a obra.
  // Fire-and-forget — falhas logam mas não derrubam a aprovação.
  void dispararNotificacaoNovaObraZona(id).catch((err) => {
    console.error("[aprovar] falha no disparo de nova-obra-zona:", err);
  });

  const r = NextResponse.json(txResult.updated);
  setNoCacheHeaders(r);
  return r;
}
