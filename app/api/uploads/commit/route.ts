import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, isNull, sql as dsql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, empreiteiras, empreiteiroDocumentos, empreiteiroPortfolio, userFiles, users } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import {
  createSignedReadUrl,
  deleteObject,
  headObject,
  publicUrlForKey,
  validateKeyForOwner,
  validateUpload,
  visibilityForKind,
  visibilityFromKey,
  kindPrivatizavel,
  type UploadKind,
} from "@shared/lib/storage";
import { findObraAccess, canWriteObraArea, canWriteObraContent } from "@features/obras/api/access";
import { verificarQuotaObra } from "@features/obras/api/storage-quota";
import { visibilidadeDoUpload } from "@features/xgestao/server/arquivos-obra";
import { logError } from "@/server/lib/logger";
import { erroSomenteLeituraUpload } from "@features/xgestao/server/guard-mutacao";

const bodySchema = z.object({
  kind: z.enum(["avatar", "portfolio_imagem", "portfolio_doc", "empreiteiro_documento", "obra_anexo", "obra_capa", "comprovante_pagamento", "candidatura_anexo", "obra_foto", "anuncio_criativo", "cliente_documento"]),
  key: z.string().min(8).max(500),
  mime: z.string().min(3).max(120),
  // XG10 — ver nota em presign/route.ts: teto de sanidade, não o limite real.
  size: z.number().int().min(1).max(50_000_000),
  originalName: z.string().min(1).max(240),
  // XG10 — ver presign: a quota é reconfirmada aqui porque o espaço pode ter
  // sido consumido por outro upload entre o presign e este commit.
  obraId: z.string().min(8).max(64).optional(),
  extras: z
    .object({
      tipoDocumento: z.string().max(60).optional(),
      observacao: z.string().max(500).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

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

  const { kind, key, mime, size, originalName, extras } = parsed.data;

  // EMP-05 — conta xgestão somente leitura não envia arquivo de obra.
  const erroLeitura = await erroSomenteLeituraUpload(guard.user, kind, parsed.data.obraId);
  if (erroLeitura) {
    const r = NextResponse.json({ code: "XGESTAO_SOMENTE_LEITURA", message: erroLeitura }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  // EMP-11 — allowlist de CAD só em obra do xgestão (chave privada). A chave é
  // conferida contra a obra mais abaixo, então não dá para fugir dela por aqui.
  const v = validateUpload({
    kind: kind as UploadKind,
    mime,
    size,
    role: guard.user.role,
    filename: originalName,
    restringirCad: kindPrivatizavel(kind as UploadKind) && visibilityFromKey(key) === "private",
  });
  if (!v.ok) {
    const r = NextResponse.json({ message: v.message }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  // Anti-tampering estrito: chave deve bater com o padrão canônico
  // para o `kind` declarado, o role do usuário e o seu userId.
  const keyCheck = validateKeyForOwner({
    key,
    kind: kind as UploadKind,
    role: guard.user.role as "admin" | "contratante" | "empreiteiro" | "superadmin",
    userId: guard.user.id,
  });
  if (!keyCheck.ok) {
    // Tenta apagar o objeto subido por uma chave inválida (best-effort).
    await deleteObject(key).catch(() => null);
    // ADM-04 — recusa no commit é sinal de divergência entre presign e commit
    // (já aconteceu: XG19). Precisa aparecer no painel, não só no console.
    await logError("warn", "Upload recusado no commit: chave inválida", {
      route: "/api/uploads/commit",
      userId: guard.user.id,
      meta: { kind, reason: keyCheck.reason ?? null, keyPrefix: key.split("/").slice(0, -1).join("/") },
    });
    // XG19 — "Chave inválida" é vocabulário de servidor: o usuário não sabe o
    // que é uma chave, nem o que fazer com a informação. A causa mais provável
    // de chegar aqui é permissão; o `reason` segue no corpo para depuração.
    const r = NextResponse.json(
      {
        message:
          keyCheck.reason === "role"
            ? "Você não tem permissão para enviar arquivos aqui."
            : "Não foi possível confirmar este arquivo. Tente enviar novamente.",
        reason: keyCheck.reason,
      },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  // Confirma que o objeto existe no R2 e bate com tamanho declarado.
  let head: Awaited<ReturnType<typeof headObject>>;
  try {
    head = await headObject(key);
  } catch (error) {
    console.error("[uploads/commit] falha ao verificar objeto", {
      kind,
      keyPrefix: key.split("/").slice(0, -1).join("/"),
      errorName: error instanceof Error ? error.name : "unknown",
    });
    await logError("error", "Falha ao verificar objeto no storage (commit)", {
      route: "/api/uploads/commit",
      userId: guard.user.id,
      stack: error instanceof Error ? error.stack : undefined,
      meta: { kind, keyPrefix: key.split("/").slice(0, -1).join("/") },
    });
    const r = NextResponse.json(
      { message: "Armazenamento temporariamente indisponível. Tente confirmar o arquivo novamente." },
      { status: 503 },
    );
    setNoCacheHeaders(r);
    return r;
  }
  if (!head) {
    const r = NextResponse.json({ message: "Arquivo não encontrado no storage." }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (head.size !== size) {
    // tamanho real diverge do declarado — apaga e rejeita
    await deleteObject(key).catch(() => null);
    const r = NextResponse.json({ message: "Tamanho do arquivo divergente." }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  const actualMime = head.contentType?.split(";", 1)[0]?.trim().toLowerCase() ?? null;
  if (!actualMime || actualMime !== mime.toLowerCase()) {
    await deleteObject(key).catch(() => null);
    const r = NextResponse.json({ message: "Formato real do arquivo divergente." }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  // XG10 — reconfirma a quota da obra com o tamanho REAL já verificado no R2.
  // Só aqui a decisão é definitiva: entre o presign e este ponto, outro upload
  // pode ter ocupado o espaço. Estourou, apaga o objeto e devolve 413 — não
  // vale gravar em `user_files` um arquivo que a obra não comporta.
  if (parsed.data.obraId) {
    const acesso = await findObraAccess(parsed.data.obraId, {
      id: guard.user.id,
      role: guard.user.role,
    });
    const area = kind === "comprovante_pagamento"
      ? "financeiro"
      : kind === "obra_anexo"
        ? "equipe"
        : kind === "obra_foto" || kind === "obra_capa"
          ? "diario"
          : null;
    if (!acesso || !canWriteObraContent(acesso) || (area !== null && !canWriteObraArea(acesso, area))) {
      await deleteObject(key).catch(() => null);
      const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
      setNoCacheHeaders(r);
      return r;
    }
    const quota = await verificarQuotaObra(parsed.data.obraId, size);
    if (!quota.ok) {
      await deleteObject(key).catch(() => null);
      const r = NextResponse.json(
        { error: "QUOTA_EXCEDIDA", message: quota.message, uso: quota.uso },
        { status: 413 },
      );
      setNoCacheHeaders(r);
      return r;
    }
  }

  // EMP-02 — nos kinds de obra a visibilidade vem da chave, que o presign montou
  // conforme a obra. Para não aceitar uma chave pública numa obra do xgestão
  // (presign antigo, cliente adulterado), a decisão é refeita aqui.
  let visibility = visibilityForKind(kind as UploadKind);
  if (kindPrivatizavel(kind as UploadKind)) {
    const esperada = (await visibilidadeDoUpload({
      kind: kind as UploadKind,
      obraId: parsed.data.obraId,
      userId: guard.user.id,
      role: guard.user.role,
    })) ?? visibility;
    const real = visibilityFromKey(key);
    if (real !== esperada) {
      await deleteObject(key).catch(() => null);
      await logError("warn", "Upload recusado no commit: visibilidade divergente", {
        route: "/api/uploads/commit",
        userId: guard.user.id,
        meta: { kind, esperada, real, obraId: parsed.data.obraId ?? null },
      });
      const r = NextResponse.json(
        { message: "Não foi possível confirmar este arquivo. Tente enviar novamente.", reason: "visibilidade" },
        { status: 400 },
      );
      setNoCacheHeaders(r);
      return r;
    }
    visibility = real;
  }
  const publicUrl = visibility === "public" ? publicUrlForKey(key) : null;

  let file: typeof userFiles.$inferSelect;
  try {
    [file] = await db
      .insert(userFiles)
      .values({
        ownerUserId: guard.user.id,
        kind,
        visibility,
        bucketKey: key,
        originalName,
        mime,
        sizeBytes: size,
        publicUrl,
      })
      .returning();
  } catch (error) {
    await logError("error", "Falha ao gravar arquivo enviado (commit)", {
      route: "/api/uploads/commit",
      userId: guard.user.id,
      stack: error instanceof Error ? error.stack : undefined,
      meta: { kind, size },
    });
    throw error;
  }

  // Side effects: associar ao perfil/registro correto.
  let signedUrl: string | null = null;
  // EMP-01/EMP-02 — arquivo de obra privado e comprovante: a tela precisa de
  // uma URL para a prévia, e não há `publicUrl`.
  if (
    visibility === "private" &&
    (kindPrivatizavel(kind as UploadKind) ||
      (kind === "comprovante_pagamento" && guard.user.role === "empreiteiro"))
  ) {
    signedUrl = await createSignedReadUrl({ key }).catch(() => null);
  }
  let documentoId: string | null = null;

  let portfolioItemId: string | null = null;

  if (kind === "avatar") {
    await db
      .update(users)
      .set({ avatarUrl: publicUrl, avatarFileId: file.id })
      .where(eq(users.id, guard.user.id));
    if (guard.user.role === "empreiteiro") {
      await db.update(empreiteiras).set({ avatarUrl: publicUrl }).where(eq(empreiteiras.userId, guard.user.id));
    } else if (guard.user.role === "contratante") {
      await db.update(clientes).set({ avatarUrl: publicUrl }).where(eq(clientes.userId, guard.user.id));
    }
  } else if ((kind === "portfolio_imagem" || kind === "portfolio_doc") && (guard.user.role === "empreiteiro" || guard.user.role === "superadmin")) {
    // Insere registro em empreiteiro_portfolio (source of truth do domínio)
    const [{ ordem: maxOrdem } = { ordem: -1 as number | null }] = await db
      .select({ ordem: dsql<number>`COALESCE(MAX(${empreiteiroPortfolio.ordem}), -1)` })
      .from(empreiteiroPortfolio)
      .where(eq(empreiteiroPortfolio.empreiteiroUserId, guard.user.id));
    const nextOrdem = (maxOrdem ?? -1) + 1;
    const [item] = await db
      .insert(empreiteiroPortfolio)
      .values({
        empreiteiroUserId: guard.user.id,
        fileId: file.id,
        titulo: extras?.observacao || originalName,
        ordem: nextOrdem,
      })
      .returning();
    portfolioItemId = item.id;
    // Source of truth = empreiteiro_portfolio. Não duplicar em portfolioUrls/portfolioDocs.
  } else if (kind === "empreiteiro_documento" && (guard.user.role === "empreiteiro" || guard.user.role === "superadmin")) {
    const tipoFinal = extras?.tipoDocumento || "outro";
    // Replace-by-tipo: soft-delete docs ativos do mesmo tipo deste usuário.
    const previas = await db
      .select({ id: empreiteiroDocumentos.id, fileId: empreiteiroDocumentos.fileId })
      .from(empreiteiroDocumentos)
      .innerJoin(userFiles, eq(userFiles.id, empreiteiroDocumentos.fileId))
      .where(
        and(
          eq(empreiteiroDocumentos.empreiteiroUserId, guard.user.id),
          eq(empreiteiroDocumentos.tipo, tipoFinal),
          isNull(userFiles.deletedAt),
        ),
      );
    for (const prev of previas) {
      await db.update(userFiles).set({ deletedAt: new Date() }).where(eq(userFiles.id, prev.fileId));
      await db.delete(empreiteiroDocumentos).where(eq(empreiteiroDocumentos.id, prev.id));
    }
    const [doc] = await db
      .insert(empreiteiroDocumentos)
      .values({
        empreiteiroUserId: guard.user.id,
        fileId: file.id,
        tipo: tipoFinal,
        status: "enviado",
        observacao: extras?.observacao || null,
      })
      .returning();
    documentoId = doc.id;
    signedUrl = await createSignedReadUrl({ key, filename: originalName });
    await recordAudit({
      actorId: guard.user.id,
      action: "uploads.commit.documento",
      payload: { fileId: file.id, kind, tipo: tipoFinal, size, replaced: previas.length },
      request,
    });
  }

  const r = NextResponse.json({
    id: file.id,
    documentoId,
    portfolioItemId,
    kind,
    visibility,
    publicUrl,
    signedUrl,
    originalName,
    mime,
    size,
  });
  setNoCacheHeaders(r);
  return r;
}
