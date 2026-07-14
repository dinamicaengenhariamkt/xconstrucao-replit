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

const bodySchema = z.object({
  kind: z.enum(["avatar", "portfolio_imagem", "portfolio_doc", "empreiteiro_documento", "obra_anexo", "obra_capa", "candidatura_anexo", "obra_foto", "anuncio_criativo"]),
  mime: z.string().min(3).max(120),
  size: z.number().int().min(1).max(20_000_000),
  // contrato: presign usa `filename`; aceitamos `originalName` por compat.
  filename: z.string().min(1).max(240).optional(),
  originalName: z.string().min(1).max(240).optional(),
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
