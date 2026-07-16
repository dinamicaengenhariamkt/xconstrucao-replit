import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { podeAcessarThread } from "@features/chat/service";
import { createSignedUploadUrl, isStorageConfigured, publicUrlForKey } from "@shared/lib/storage/r2";
import { slugify, timestampStamp } from "@shared/lib/storage/key-builder";

const ACCEPTED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

type AcceptedMime = (typeof ACCEPTED_MIMES)[number];

const bodySchema = z.object({
  filename: z.string().min(1).max(240),
  mime: z.string().min(3).max(120),
  size: z.number().int().min(1).max(10_000_001),
});

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ threadId: string }> },
) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { threadId } = await ctx.params;

  const thread = await podeAcessarThread(guard.user.id, threadId);
  if (!thread) {
    const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

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

  const { filename, mime, size } = parsed.data;

  if (!ACCEPTED_MIMES.includes(mime as AcceptedMime)) {
    const r = NextResponse.json(
      { message: "Formato não aceito. Use imagens (JPEG, PNG, WebP, GIF), PDF ou DOCX." },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const maxBytes = mime.startsWith("image/") ? 8_000_000 : 10_000_000;
  if (size > maxBytes) {
    const mb = (maxBytes / 1_000_000).toFixed(0);
    const r = NextResponse.json(
      { message: `Arquivo muito grande. Máximo ${mb} MB.` },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const dotIdx = filename.lastIndexOf(".");
  const ext = dotIdx > 0 ? filename.slice(dotIdx + 1).toLowerCase() : "";
  const name = dotIdx > 0 ? filename.slice(0, dotIdx) : filename;
  const slug = slugify(name);
  const ts = timestampStamp();
  const safeExt = ext ? `.${slugify(ext)}` : "";
  const key = `public/chat/${threadId}/${ts}-${slug}${safeExt}`;

  try {
    const uploadUrl = await createSignedUploadUrl({ key, mime });
    const publicUrl = publicUrlForKey(key);
    const r = NextResponse.json({ uploadUrl, key, publicUrl });
    setNoCacheHeaders(r);
    return r;
  } catch (err) {
    console.error("[chat/upload/presign]", err);
    const r = NextResponse.json({ message: "Falha ao gerar URL de upload." }, { status: 500 });
    setNoCacheHeaders(r);
    return r;
  }
}
