import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  candidaturas,
  clientes,
  empreiteiras,
  obras,
  obraAnexos,
  userFiles,
} from "@shared/db/schema";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { insertObraSchemaStrict } from "@features/obras/schemas";
import { recordAudit } from "@features/auth/api/audit";
import { createSignedReadUrl, publicUrlForKey } from "@shared/lib/storage";

/**
 * Helper de scoping: devolve a obra se o usuário tiver acesso de leitura,
 * senão null (caller responde 404 — anti-enumeração).
 */
async function findObraWithAccess(
  obraId: string,
  user: { id: string; role: string },
): Promise<{ obra: typeof obras.$inferSelect; clienteId: string | null; empreiteiraId: string | null } | null> {
  const [obra] = await db.select().from(obras).where(eq(obras.id, obraId));
  if (!obra) return null;

  if (isAdminLike(user.role)) {
    return { obra, clienteId: null, empreiteiraId: null };
  }

  if (user.role === "contratante") {
    const [cli] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, user.id));
    if (!cli || obra.clienteId !== cli.id) return null;
    return { obra, clienteId: cli.id, empreiteiraId: null };
  }

  if (user.role === "empreiteiro") {
    const [emp] = await db.select({ id: empreiteiras.id }).from(empreiteiras).where(eq(empreiteiras.userId, user.id));
    const isPublicaAvailable = obra.visibilidade === "publicada" && obra.empreiteiraId === null;
    const isAssigned = emp && obra.empreiteiraId === emp.id;
    if (!isPublicaAvailable && !isAssigned) return null;
    return { obra, clienteId: null, empreiteiraId: emp?.id ?? null };
  }

  return null;
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const access = await findObraWithAccess(id, { id: guard.user.id, role: guard.user.role });
  if (!access) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  // Anexos com URL: signed se file privado, public caso contrário.
  const anexosRows = await db
    .select({
      id: obraAnexos.id,
      tipo: obraAnexos.tipo,
      observacao: obraAnexos.observacao,
      createdAt: obraAnexos.createdAt,
      fileId: obraAnexos.fileId,
      bucketKey: userFiles.bucketKey,
      originalName: userFiles.originalName,
      mime: userFiles.mime,
      sizeBytes: userFiles.sizeBytes,
      publicUrl: userFiles.publicUrl,
      visibility: userFiles.visibility,
    })
    .from(obraAnexos)
    .innerJoin(userFiles, eq(userFiles.id, obraAnexos.fileId))
    .where(and(eq(obraAnexos.obraId, id), isNull(userFiles.deletedAt)));

  const anexos = await Promise.all(
    anexosRows.map(async (a) => {
      const url = a.visibility === "public"
        ? (a.publicUrl ?? publicUrlForKey(a.bucketKey))
        : await createSignedReadUrl({ key: a.bucketKey, filename: a.originalName }).catch(() => null);
      return {
        id: a.id,
        tipo: a.tipo,
        observacao: a.observacao,
        createdAt: a.createdAt,
        fileId: a.fileId,
        originalName: a.originalName,
        mime: a.mime,
        sizeBytes: a.sizeBytes,
        url,
      };
    }),
  );

  // Empreiteiro: sanitizar PII do contratante.
  const obraOut = guard.user.role === "empreiteiro"
    ? (() => { const { clienteId, ...rest } = access.obra; return rest; })()
    : access.obra;

  const r = NextResponse.json({ ...obraOut, anexos });
  setNoCacheHeaders(r);
  return r;
}

/**
 * PATCH /api/obras/[id]
 *  - Ownership (contratante dono) OU isAdminLike.
 *  - Permite transição rascunho→publicada com validação completa.
 *  - Bloqueia edição de clienteId/empreiteiraId (este último vem de J05).
 *  - Edição de valorTotal/descricao em obra com empreiteiraId != null → 409.
 */
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const access = await findObraWithAccess(id, { id: guard.user.id, role: guard.user.role });
  if (!access) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  // empreiteiro nunca edita
  if (guard.user.role === "empreiteiro") {
    const r = NextResponse.json({ message: "Sem permissão para editar." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const { clienteId: _c, empreiteiraId: _e, id: _i, ...safeBody } = body ?? {};

  // Merge com a obra atual e revalida (suporta transição rascunho → publicada).
  const merged = { ...access.obra, ...safeBody };
  const parsed = insertObraSchemaStrict.safeParse(merged);
  if (!parsed.success) {
    const r = NextResponse.json(
      { message: "Dados inválidos", errors: parsed.error.flatten() },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  // Bloqueio: valorTotal/descricao não podem ser alterados após vínculo com empreiteira.
  if (access.obra.empreiteiraId !== null) {
    const valorMudou = "valorTotal" in safeBody && String(safeBody.valorTotal) !== String(access.obra.valorTotal);
    const descMudou = "descricao" in safeBody && safeBody.descricao !== access.obra.descricao;
    if (valorMudou || descMudou) {
      const r = NextResponse.json(
        {
          error: "OBRA_LOCKED_AFTER_BIND",
          message: "Obra já vinculada a uma empreiteira. Use aditivo (J10) para alterar valor ou escopo.",
        },
        { status: 409 },
      );
      setNoCacheHeaders(r);
      return r;
    }
  }

  // Aplica apenas os campos enviados (não sobrescreve com merged completo).
  const updateData: Record<string, unknown> = {};
  for (const k of Object.keys(safeBody)) {
    updateData[k] = (parsed.data as any)[k];
  }
  updateData.updatedAt = new Date();

  const [updated] = await db.update(obras).set(updateData).where(eq(obras.id, id)).returning();

  await recordAudit({
    actorId: guard.user.id,
    action: "obras.update",
    targetUserId: null,
    payload: {
      obraId: id,
      changes: Object.keys(safeBody),
      visibilidadeAnterior: access.obra.visibilidade,
      visibilidadeNova: updated.visibilidade,
    },
    request,
  });

  const r = NextResponse.json(updated);
  setNoCacheHeaders(r);
  return r;
}

/**
 * DELETE /api/obras/[id]
 *  - Ownership ou isAdminLike.
 *  - 409 se há candidatura pendente. Cliente deve PATCH visibilidade='arquivada'.
 *  - Sem candidaturas → hard delete; cascade derruba obra_anexos.
 */
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const access = await findObraWithAccess(id, { id: guard.user.id, role: guard.user.role });
  if (!access) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (guard.user.role === "empreiteiro") {
    const r = NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  // Transação + SELECT ... FOR UPDATE na row da obra para fechar a janela de
  // corrida entre "tem candidatura pendente?" e o DELETE. Se uma candidatura
  // for criada concorrentemente, ou ela vê a row travada e espera (e o count
  // posterior a enxerga → 409) ou o DELETE roda primeiro e o INSERT da
  // candidatura falha por FK.
  const txResult = await db.transaction(async (tx) => {
    const locked = await tx
      .select({ id: obras.id })
      .from(obras)
      .where(eq(obras.id, id))
      .for("update");
    if (locked.length === 0) {
      return { kind: "not_found" as const };
    }

    const pendentes = await tx
      .select({ id: candidaturas.id })
      .from(candidaturas)
      .where(and(eq(candidaturas.obraId, id), eq(candidaturas.status, "pendente")));
    if (pendentes.length > 0) {
      return { kind: "conflict" as const, count: pendentes.length };
    }

    await tx.delete(obras).where(eq(obras.id, id));
    return { kind: "deleted" as const };
  });

  if (txResult.kind === "not_found") {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (txResult.kind === "conflict") {
    const r = NextResponse.json(
      {
        error: "OBRA_HAS_PENDING_CANDIDATURAS",
        message: `Há ${txResult.count} candidatura(s) pendente(s). Arquive a obra em vez de excluir (PATCH visibilidade='arquivada').`,
      },
      { status: 409 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  await recordAudit({
    actorId: guard.user.id,
    action: "obras.delete",
    targetUserId: null,
    payload: { obraId: id, nome: access.obra.nome },
    request,
  });

  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
