import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { obraEquipe, userFiles } from "@shared/db/schema";
import { deleteObject } from "@shared/lib/storage";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";
import { contratoFields } from "@features/obras/api/equipe-contrato-schema";
import { validarContratoMembro } from "@features/obras/api/validar-contrato-membro";

// Sem `superRefine` aqui de propósito: num PATCH parcial ele só enxergaria o
// que veio no corpo. Se o membro já tem arquivo e chega um patch com só o link,
// a combinação proibida passaria. A checagem roda abaixo, sobre o estado final.
const patchSchema = z.object({
  nome: z.string().trim().min(1).max(120).optional(),
  papel: z.string().trim().max(120).optional(),
  tipo: z.enum(["contratante", "engenheiro", "mestre", "equipe"]).optional(),
  cor: z.string().trim().max(40).optional(),
  telefone: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().max(160).nullable().optional(),
  registro: z.string().trim().max(80).nullable().optional(),
  membros: z.string().trim().max(240).nullable().optional(),
  ativo: z.boolean().optional(),
  permissao: z.enum(["visualizar", "editar", "admin"]).nullable().optional(),
  ...contratoFields,
});

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; membroId: string }> },
) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id, membroId } = await ctx.params;
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
  const [existing] = await db
    .select()
    .from(obraEquipe)
    .where(and(eq(obraEquipe.id, membroId), eq(obraEquipe.obraId, id)));
  if (!existing) {
    const r = NextResponse.json({ message: "Membro não encontrado" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const r = NextResponse.json(
      { message: "Dados inválidos", errors: parsed.error.flatten() },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }
  const data = parsed.data;

  // XG22 — "arquivo OU link" vale sobre o resultado da edição, não sobre o
  // pedaço enviado: quem já tem PDF anexado e manda só o link ficaria com os
  // dois. `undefined` mantém o que está lá; `null` limpa.
  const contratoFileFinal =
    data.contratoFileId !== undefined ? data.contratoFileId : existing.contratoFileId;
  const contratoLinkFinal =
    data.contratoLinkUrl !== undefined ? data.contratoLinkUrl : existing.contratoLinkUrl;
  if (contratoFileFinal && contratoLinkFinal) {
    const r = NextResponse.json(
      { message: "Envie um arquivo OU informe um link do contrato, não os dois." },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }
  if (contratoLinkFinal && !/^https?:\/\//i.test(contratoLinkFinal)) {
    const r = NextResponse.json(
      { message: "O link precisa começar com http:// ou https://." },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }
  // Só revalida o arquivo quando ele mudou nesta edição — o que já estava
  // vinculado passou por aqui na criação.
  if (data.contratoFileId) {
    const erroContrato = await validarContratoMembro(data.contratoFileId, guard.user.id);
    if (erroContrato) {
      const r = NextResponse.json({ message: erroContrato }, { status: 400 });
      setNoCacheHeaders(r);
      return r;
    }
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of Object.keys(data) as (keyof typeof data)[]) {
    if (data[k] !== undefined) updateData[k] = data[k];
  }
  // `numeric` vai como string para o driver; o zod entregou number.
  if (data.valorContrato !== undefined) {
    updateData.valorContrato = data.valorContrato == null ? null : String(data.valorContrato);
  }
  const [updated] = await db
    .update(obraEquipe)
    .set(updateData)
    .where(eq(obraEquipe.id, membroId))
    .returning();
  await recordAudit({
    actorId: guard.user.id,
    action: "obras.equipe.update",
    payload: { obraId: id, membroId, changes: Object.keys(data) },
    request,
  });
  const r = NextResponse.json(updated);
  setNoCacheHeaders(r);
  return r;
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; membroId: string }> },
) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id, membroId } = await ctx.params;
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
  // XG22 — descobre o contrato antes de apagar a linha: depois do DELETE não há
  // mais como saber qual arquivo ficou órfão no bucket.
  const [alvo] = await db
    .select({ contratoFileId: obraEquipe.contratoFileId, bucketKey: userFiles.bucketKey })
    .from(obraEquipe)
    .leftJoin(userFiles, eq(userFiles.id, obraEquipe.contratoFileId))
    .where(and(eq(obraEquipe.id, membroId), eq(obraEquipe.obraId, id)));

  await db.delete(obraEquipe).where(and(eq(obraEquipe.id, membroId), eq(obraEquipe.obraId, id)));

  // Mesmo encadeamento do DELETE de anexos da obra: soft-delete no banco (fonte
  // de verdade) e remoção do objeto em best-effort.
  if (alvo?.contratoFileId) {
    await db
      .update(userFiles)
      .set({ deletedAt: new Date() })
      .where(eq(userFiles.id, alvo.contratoFileId));
    if (alvo.bucketKey) {
      try {
        await deleteObject(alvo.bucketKey);
      } catch {
        // best-effort: o arquivo pode já ter sumido do R2 — o banco manda.
      }
    }
  }

  await recordAudit({
    actorId: guard.user.id,
    action: "obras.equipe.delete",
    payload: { obraId: id, membroId, contratoFileId: alvo?.contratoFileId ?? null },
    request,
  });
  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
