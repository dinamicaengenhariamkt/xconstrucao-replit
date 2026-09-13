import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import {
  buildKey,
  createSignedUploadUrl,
  isStorageConfigured,
  validateUpload,
  type UploadKind,
} from "@shared/lib/storage";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";
import { verificarQuotaObra } from "@features/obras/api/storage-quota";

const bodySchema = z.object({
  kind: z.enum(["avatar", "portfolio_imagem", "portfolio_doc", "empreiteiro_documento", "obra_anexo", "obra_capa", "comprovante_pagamento", "candidatura_anexo", "obra_foto", "anuncio_criativo", "cliente_documento"]),
  mime: z.string().min(3).max(120),
  // XG10 — teto de sanidade do payload. Sobe de 20 para 50 MB porque vídeo
  // passou a ser aceito em `obra_anexo`; o limite real por tipo e a quota da
  // obra são aplicados logo abaixo, em `validateUpload` e `assertQuotaObra`.
  size: z.number().int().min(1).max(50_000_000),
  // contrato: presign usa `filename`; aceitamos `originalName` por compat.
  filename: z.string().min(1).max(240).optional(),
  originalName: z.string().min(1).max(240).optional(),
  // XG10 — obra de destino, para checar a quota ANTES de o usuário gastar
  // banda subindo um arquivo que seria recusado no commit. Opcional: uploads
  // que não pertencem a uma obra (avatar, portfólio) não têm quota por obra.
  obraId: z.string().min(8).max(64).optional(),
  extras: z.object({ tipoDocumento: z.string().max(60).optional() }).optional(),
}).refine((v) => !!(v.filename || v.originalName), {
  message: "filename obrigatório",
  path: ["filename"],
});

export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (!isStorageConfigured()) {
    const r = NextResponse.json(
      { message: "Armazenamento de arquivos indisponível. Contate o administrador." },
      { status: 503 },
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

  const v = validateUpload({
    kind: parsed.data.kind as UploadKind,
    mime: parsed.data.mime,
    size: parsed.data.size,
    role: guard.user.role,
  });
  if (!v.ok) {
    const r = NextResponse.json({ message: v.message }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  // XG10 — quota acumulada da obra. Checar aqui evita o upload inteiro para
  // depois recusar no commit; o commit repete a checagem porque o espaço pode
  // ter sido consumido por outro envio no intervalo.
  if (parsed.data.obraId) {
    const acesso = await findObraAccess(parsed.data.obraId, {
      id: guard.user.id,
      role: guard.user.role,
    });
    if (!acesso || !canWriteObraContent(acesso)) {
      const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
      setNoCacheHeaders(r);
      return r;
    }
    const quota = await verificarQuotaObra(parsed.data.obraId, parsed.data.size);
    if (!quota.ok) {
      const r = NextResponse.json(
        { error: "QUOTA_EXCEDIDA", message: quota.message, uso: quota.uso },
        { status: 413 },
      );
      setNoCacheHeaders(r);
      return r;
    }
  }

  const filename = (parsed.data.filename || parsed.data.originalName)!;
  const key = buildKey({
    kind: parsed.data.kind as UploadKind,
    role: guard.user.role as "admin" | "contratante" | "empreiteiro" | "superadmin",
    userId: guard.user.id,
    originalName: filename,
    extras: parsed.data.extras,
  });

  try {
    const uploadUrl = await createSignedUploadUrl({ key, mime: parsed.data.mime });
    const r = NextResponse.json({ uploadUrl, key, headers: { "Content-Type": parsed.data.mime } });
    setNoCacheHeaders(r);
    return r;
  } catch (err) {
    console.error("[uploads/presign]", err);
    const r = NextResponse.json(
      { message: "Falha ao gerar URL de upload." },
      { status: 500 },
    );
    setNoCacheHeaders(r);
    return r;
  }
}
