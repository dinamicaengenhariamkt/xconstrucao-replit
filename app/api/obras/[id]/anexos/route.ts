import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { obraAnexos, userFiles } from "@shared/db/schema";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { createSignedReadUrl, publicUrlForKey } from "@shared/lib/storage";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";

const TIPOS = [
  "projeto_arquitetonico",
  "projeto_estrutural",
  "art_rrt",
  "alvara",
  "foto_local",
  "contrato",
  "outros",
] as const;

/**
 * XG10 — o anexo é um arquivo do bucket OU um link externo, nunca os dois nem
 * nenhum. O `superRefine` garante isso; sem ele, uma linha sem origem passaria
 * e a lista mostraria um item que não abre nada.
 */
const bodySchema = z
  .object({
    fileId: z.string().min(8).max(64).optional().nullable(),
    linkUrl: z.string().trim().url().max(2000).optional().nullable(),
    titulo: z.string().trim().min(2).max(160).optional().nullable(),
    tipo: z.enum(TIPOS),
    observacao: z.string().trim().max(500).optional().nullable(),
  })
  .superRefine((v, ctx) => {
    const temArquivo = Boolean(v.fileId);
    const temLink = Boolean(v.linkUrl);
    if (temArquivo === temLink) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Envie um arquivo OU informe um link, não os dois.",
      });
      return;
    }
    if (temLink) {
      // http(s) apenas: `javascript:` e `data:` viram XSS ao clicar no link.
      if (!/^https?:\/\//i.test(v.linkUrl!)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["linkUrl"],
          message: "O link precisa começar com http:// ou https://.",
        });
      }
      if (!v.titulo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["titulo"],
          message: "Dê um nome ao link.",
        });
      }
    }
  });

/** GET — lista anexos da obra (qualquer um com acesso leitura pode ver). */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id: obraId } = await ctx.params;
  // XG10 — passa a usar o guard padrão dos recursos da obra. O check anterior
  // só liberava o empreiteiro em obra PUBLICADA E SEM VÍNCULO (descoberta do
  // marketplace), então o dono da obra do xgestão não via os próprios anexos.
  const access = await findObraAccess(obraId, { id: guard.user.id, role: guard.user.role }, { allowDiscovery: true });
  if (!access) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  // LEFT join: anexo-link não tem linha em `user_files`. O filtro de
  // `deletedAt` vai para o WHERE como "não é arquivo apagado".
  const rows = await db
    .select({
      id: obraAnexos.id,
      tipo: obraAnexos.tipo,
      observacao: obraAnexos.observacao,
      createdAt: obraAnexos.createdAt,
      fileId: obraAnexos.fileId,
      linkUrl: obraAnexos.linkUrl,
      titulo: obraAnexos.titulo,
      bucketKey: userFiles.bucketKey,
      originalName: userFiles.originalName,
      mime: userFiles.mime,
      sizeBytes: userFiles.sizeBytes,
      visibility: userFiles.visibility,
      publicUrl: userFiles.publicUrl,
      deletedAt: userFiles.deletedAt,
    })
    .from(obraAnexos)
    .leftJoin(userFiles, eq(userFiles.id, obraAnexos.fileId))
    .where(eq(obraAnexos.obraId, obraId))
    .orderBy(desc(obraAnexos.createdAt));

  const out = await Promise.all(
    rows
      .filter((a) => a.linkUrl !== null || (a.bucketKey !== null && a.deletedAt === null))
      .map(async (a) => ({
        id: a.id,
        tipo: a.tipo,
        observacao: a.observacao,
        createdAt: a.createdAt,
        fileId: a.fileId,
        linkUrl: a.linkUrl,
        originalName: a.originalName ?? a.titulo,
        mime: a.mime,
        sizeBytes: a.sizeBytes,
        url: a.linkUrl
          ? a.linkUrl
          : a.visibility === "public"
            ? (a.publicUrl ?? publicUrlForKey(a.bucketKey!))
            : await createSignedReadUrl({ key: a.bucketKey!, filename: a.originalName ?? undefined }).catch(() => null),
      })),
  );

  const r = NextResponse.json(out);
  setNoCacheHeaders(r);
  return r;
}

/**
 * POST — vincula um user_files (já uploaded com kind='obra_anexo') a uma obra.
 * Valida:
 *  - ownership da obra (ou admin).
 *  - existência do fileId, kind='obra_anexo', dono = usuário (ou admin).
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id: obraId } = await ctx.params;
  // XG10 — o guard anterior exigia role `contratante`, então o dono da obra no
  // xgestão não conseguia anexar nada à própria obra. `canWriteObraContent`
  // cobre admin, contratante dono e empreiteiro vinculado (não descoberta).
  const access = await findObraAccess(obraId, { id: guard.user.id, role: guard.user.role });
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

  // Rate limit: máx 20 anexos por obra por minuto + 60 por usuário por minuto.
  const ip = getClientIp(request);
  if (isRateLimited(`obras.anexo.create:obra:${obraId}`, 20, 60 * 1000)) {
    const r = NextResponse.json(
      { message: "Muitos anexos enviados nesta obra em pouco tempo. Aguarde um minuto e tente novamente." },
      { status: 429 },
    );
    setNoCacheHeaders(r);
    return r;
  }
  if (isRateLimited(`obras.anexo.create:user:${guard.user.id}`, 60, 60 * 1000)) {
    const r = NextResponse.json(
      { message: "Muitos anexos enviados em pouco tempo. Aguarde um minuto e tente novamente." },
      { status: 429 },
    );
    setNoCacheHeaders(r);
    return r;
  }
  if (isRateLimited(`obras.anexo.create:ip:${ip}`, 120, 60 * 1000)) {
    const r = NextResponse.json(
      { message: "Muitas requisições. Aguarde um minuto e tente novamente." },
      { status: 429 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json(
      { message: "Dados inválidos", errors: parsed.error.flatten() },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  // Anexo por arquivo: valida o upload. Anexo por link não toca o bucket.
  if (parsed.data.fileId) {
    const [file] = await db.select().from(userFiles).where(eq(userFiles.id, parsed.data.fileId));
    if (!file || file.deletedAt) {
      const r = NextResponse.json({ message: "Arquivo não encontrado" }, { status: 404 });
      setNoCacheHeaders(r);
      return r;
    }
    if (file.kind !== "obra_anexo") {
      const r = NextResponse.json({ message: "Arquivo não é do tipo obra_anexo" }, { status: 400 });
      setNoCacheHeaders(r);
      return r;
    }
    if (!isAdminLike(guard.user.role) && file.ownerUserId !== guard.user.id) {
      const r = NextResponse.json({ message: "Arquivo não pertence ao usuário" }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
  }

  const [created] = await db
    .insert(obraAnexos)
    .values({
      obraId,
      fileId: parsed.data.fileId ?? null,
      linkUrl: parsed.data.linkUrl ?? null,
      titulo: parsed.data.titulo ?? null,
      tipo: parsed.data.tipo,
      observacao: parsed.data.observacao ?? null,
      createdBy: guard.user.id,
    })
    .returning();

  await recordAudit({
    actorId: guard.user.id,
    action: "obras.anexo.create",
    targetUserId: null,
    payload: { obraId, anexoId: created.id, tipo: parsed.data.tipo, fileId: parsed.data.fileId },
    request,
  });

  const r = NextResponse.json(created, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
