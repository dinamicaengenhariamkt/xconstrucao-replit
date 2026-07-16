import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getClientIp, isRateLimited } from "@features/auth/api/rate-limit";
import {
  criarMensagem,
  listarMensagensDaThread,
  podeAcessarThread,
} from "@features/chat/service";
import { toMessageDTO } from "@features/chat/dto";
import { clampLimit, decodeCursor, encodeCursor } from "@features/chat/cursor";
import { notificarNovaMensagem } from "@features/notificacoes/nova-mensagem-chat-dispatcher";
import { validateChatAttachment } from "@features/chat/attachment-validation";

const enviarSchema = z
  .object({
    texto: z.string().trim().max(5000).optional().default(""),
    anexoObraId: z.string().nullable().optional(),
    arquivoUrl: z.string().url().max(1000).optional(),
    arquivoNome: z.string().max(240).optional(),
    arquivoMime: z.string().max(120).optional(),
  })
  .refine((d) => (d.texto && d.texto.length > 0) || !!d.arquivoUrl, {
    message: "Texto ou arquivo obrigatório",
    path: ["texto"],
  });

export async function GET(request: NextRequest, ctx: { params: Promise<{ conversationId: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { conversationId } = await ctx.params;
  const thread = await podeAcessarThread(guard.user.id, conversationId);
  if (!thread) {
    const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const url = new URL(request.url);
  const limit = clampLimit(url.searchParams.get("limit"));
  const before = decodeCursor(url.searchParams.get("before"));
  const { messages, nextCursor } = await listarMensagensDaThread(conversationId, { limit, before });
  const dto = messages.map((row) => toMessageDTO(row, guard.user.id));

  const r = NextResponse.json(dto);
  if (nextCursor) r.headers.set("X-Next-Cursor", encodeCursor(nextCursor));
  setNoCacheHeaders(r);
  return r;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ conversationId: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { conversationId } = await ctx.params;

  const ip = getClientIp(request);
  if (isRateLimited(`chat.message.create:user:${guard.user.id}`, 30, 60 * 1000)) {
    const r = NextResponse.json({ error: "RATE_LIMITED", message: "Muitas mensagens enviadas. Aguarde um instante." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }
  if (isRateLimited(`chat.message.create:ip:${ip}`, 120, 60 * 1000)) {
    const r = NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }

  const thread = await podeAcessarThread(guard.user.id, conversationId);
  if (!thread) {
    const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  if (isRateLimited(`chat.message.create:thread:${conversationId}`, 60, 60 * 1000)) {
    const r = NextResponse.json({ error: "RATE_LIMITED", message: "Esta conversa atingiu o limite por minuto." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }

  let bodyJson: unknown = {};
  try {
    bodyJson = await request.json();
  } catch {
    /* body vazio */
  }
  const parsed = enviarSchema.safeParse(bodyJson);
  if (!parsed.success) {
    const r = NextResponse.json({ error: "INVALID_BODY", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  if (parsed.data.anexoObraId && parsed.data.anexoObraId !== thread.obraId) {
    const r = NextResponse.json({ error: "ANEXO_OBRA_NOT_ALLOWED" }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  // Anti-tamper: valida host R2, path prefix estrito e MIME allowlist
  const attachmentCheck = validateChatAttachment(parsed.data, conversationId);
  if (!attachmentCheck.ok) {
    const r = NextResponse.json({ error: "ARQUIVO_URL_INVALID", message: attachmentCheck.reason }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  try {
    const result = await criarMensagem({
      threadId: conversationId,
      autorUserId: guard.user.id,
      texto: parsed.data.texto,
      anexoObraId: parsed.data.anexoObraId ?? null,
      arquivoUrl: parsed.data.arquivoUrl ?? null,
      arquivoNome: parsed.data.arquivoNome ?? null,
      arquivoMime: parsed.data.arquivoMime ?? null,
    });

    void notificarNovaMensagem({
      threadId: conversationId,
      autorUserId: guard.user.id,
      destinatarioUserId: result.destinatarioUserId,
      texto: parsed.data.texto || (parsed.data.arquivoNome ? `📎 ${parsed.data.arquivoNome}` : "📎 Arquivo"),
    });

    const r = NextResponse.json({ ok: true, id: result.mensagem.id });
    setNoCacheHeaders(r);
    return r;
  } catch (err) {
    console.error("[POST chat/messages]", err);
    const r = NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
    setNoCacheHeaders(r);
    return r;
  }
}
