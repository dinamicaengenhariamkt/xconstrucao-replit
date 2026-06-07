import type { UploadKind } from "./key-builder";

export interface KindRule {
  maxBytes: number;
  mimes: readonly string[];
  /** Quem pode subir esse kind */
  roles: readonly ("admin" | "contratante" | "empreiteiro" | "superadmin" | "anunciante")[];
}

const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
const DOC_MIMES = ["application/pdf"] as const;

export const KIND_RULES: Record<UploadKind, KindRule> = {
  avatar: {
    maxBytes: 2_000_000,
    mimes: IMAGE_MIMES,
    roles: ["admin", "contratante", "empreiteiro", "superadmin"],
  },
  portfolio_imagem: {
    maxBytes: 8_000_000,
    mimes: IMAGE_MIMES,
    roles: ["empreiteiro", "superadmin"],
  },
  portfolio_doc: {
    maxBytes: 8_000_000,
    mimes: DOC_MIMES,
    roles: ["empreiteiro", "superadmin"],
  },
  empreiteiro_documento: {
    maxBytes: 15_000_000,
    mimes: [...IMAGE_MIMES, ...DOC_MIMES],
    roles: ["empreiteiro", "superadmin"],
  },
  obra_anexo: {
    maxBytes: 15_000_000,
    mimes: [...IMAGE_MIMES, ...DOC_MIMES],
    roles: ["contratante", "superadmin"],
  },
  comprovante_pagamento: {
    maxBytes: 8_000_000,
    mimes: [...IMAGE_MIMES, ...DOC_MIMES],
    roles: ["contratante", "superadmin"],
  },
  candidatura_anexo: {
    maxBytes: 10_000_000,
    mimes: [...IMAGE_MIMES, ...DOC_MIMES],
    roles: ["empreiteiro", "superadmin"],
  },
  obra_foto: {
    maxBytes: 8_000_000,
    mimes: IMAGE_MIMES,
    roles: ["contratante", "empreiteiro", "superadmin"],
  },
  // J24 — criativo de anúncio. J23 abriu para quem pode anunciar (self-service):
  // anunciante + cliente que anuncia. Imagem pública até 8 MB.
  anuncio_criativo: {
    maxBytes: 8_000_000,
    mimes: IMAGE_MIMES,
    roles: ["admin", "superadmin", "anunciante", "contratante", "empreiteiro"],
  },
};

export interface ValidateUploadInput {
  kind: UploadKind;
  mime: string;
  size: number;
  role: string;
}

export interface ValidationResult {
  ok: boolean;
  message?: string;
}

export function validateUpload(input: ValidateUploadInput): ValidationResult {
  const rule = KIND_RULES[input.kind];
  if (!rule) return { ok: false, message: "Tipo de upload desconhecido." };
  if (!rule.roles.includes(input.role as KindRule["roles"][number])) {
    return { ok: false, message: "Você não tem permissão para esse upload." };
  }
  if (!rule.mimes.includes(input.mime as KindRule["mimes"][number])) {
    return {
      ok: false,
      message: `Formato não aceito. Use ${rule.mimes.join(", ")}.`,
    };
  }
  if (input.size <= 0) return { ok: false, message: "Arquivo vazio." };
  if (input.size > rule.maxBytes) {
    const mb = (rule.maxBytes / 1_000_000).toFixed(1);
    return { ok: false, message: `Arquivo muito grande. Máximo ${mb} MB.` };
  }
  return { ok: true };
}
