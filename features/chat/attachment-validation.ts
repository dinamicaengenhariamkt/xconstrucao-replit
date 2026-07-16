const CHAT_ACCEPTED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

export type ChatAcceptedMime = (typeof CHAT_ACCEPTED_MIMES)[number];

export function isChatAcceptedMime(mime: string): mime is ChatAcceptedMime {
  return (CHAT_ACCEPTED_MIMES as readonly string[]).includes(mime);
}

export interface AttachmentFields {
  arquivoUrl?: string;
  arquivoNome?: string;
  arquivoMime?: string;
}

export type AttachmentValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

export function validateChatAttachment(
  fields: AttachmentFields,
  conversationId: string,
): AttachmentValidationResult {
  const { arquivoUrl, arquivoNome, arquivoMime } = fields;

  if (!arquivoUrl) return { ok: true };

  if (!arquivoNome || !arquivoNome.trim()) {
    return { ok: false, reason: "arquivoNome obrigatório quando arquivoUrl presente" };
  }
  if (!arquivoMime) {
    return { ok: false, reason: "arquivoMime obrigatório quando arquivoUrl presente" };
  }

  if (!isChatAcceptedMime(arquivoMime)) {
    return { ok: false, reason: "Formato de arquivo não aceito" };
  }

  let urlObj: URL;
  try {
    urlObj = new URL(arquivoUrl);
  } catch {
    return { ok: false, reason: "arquivoUrl inválida" };
  }

  const expectedPathPrefix = `/public/chat/${conversationId}/`;
  if (!urlObj.pathname.startsWith(expectedPathPrefix)) {
    return { ok: false, reason: "arquivoUrl path inválido" };
  }

  const r2Base = process.env.R2_PUBLIC_BASE_URL;
  if (r2Base) {
    let expectedOrigin: string;
    try {
      expectedOrigin = new URL(r2Base).origin;
    } catch {
      return { ok: false, reason: "Configuração R2 inválida" };
    }
    if (urlObj.origin !== expectedOrigin) {
      return { ok: false, reason: "arquivoUrl host não autorizado" };
    }
  }

  return { ok: true };
}
