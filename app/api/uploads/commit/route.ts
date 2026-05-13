import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, empreiteiras, empreiteiroDocumentos, userFiles, users } from "@shared/db/schema";
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
  type UploadKind,
} from "@shared/lib/storage";

const bodySchema = z.object({
  kind: z.enum(["avatar", "portfolio_imagem", "portfolio_doc", "empreiteiro_documento"]),
  key: z.string().min(8).max(500),
  mime: z.string().min(3).max(120),
  size: z.number().int().min(1).max(20_000_000),
  originalName: z.string().min(1).max(240),
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

  const v = validateUpload({ kind: kind as UploadKind, mime, size, role: guard.user.role });
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
    const r = NextResponse.json(
      { message: "Chave inválida.", reason: keyCheck.reason },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  // Confirma que o objeto existe no R2 e bate com tamanho declarado.
  const head = await headObject(key);
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

  const visibility = visibilityForKind(kind as UploadKind);
  const publicUrl = visibility === "public" ? publicUrlForKey(key) : null;

  const [file] = await db
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

  // Side effects: associar ao perfil/registro correto.
  let signedUrl: string | null = null;
  let documentoId: string | null = null;

  if (kind === "avatar") {
    await db.update(users).set({ avatarUrl: publicUrl }).where(eq(users.id, guard.user.id));
    if (guard.user.role === "empreiteiro") {
      await db.update(empreiteiras).set({ avatarUrl: publicUrl }).where(eq(empreiteiras.userId, guard.user.id));
    } else if (guard.user.role === "contratante") {
      await db.update(clientes).set({ avatarUrl: publicUrl }).where(eq(clientes.userId, guard.user.id));
    }
  } else if (kind === "portfolio_imagem" || kind === "portfolio_doc") {
    // Persistência da lista (portfolioUrls / portfolioDocs) fica a cargo
    // do PATCH /api/perfil/empreiteiro chamado pelo frontend, que respeita
    // formatos específicos da UI (ex.: stamping "nome::url" para PDFs).
  } else if (kind === "empreiteiro_documento" && guard.user.role === "empreiteiro") {
    const [doc] = await db
      .insert(empreiteiroDocumentos)
      .values({
        empreiteiroUserId: guard.user.id,
        fileId: file.id,
        tipo: extras?.tipoDocumento || "outro",
        observacao: extras?.observacao || null,
      })
      .returning();
    documentoId = doc.id;
    signedUrl = await createSignedReadUrl({ key, filename: originalName });
    await recordAudit({
      actorId: guard.user.id,
      action: "uploads.commit.documento",
      payload: { fileId: file.id, kind, tipo: extras?.tipoDocumento || "outro", size },
      request,
    });
  }

  const r = NextResponse.json({
    id: file.id,
    documentoId,
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
