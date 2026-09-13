import type { UploadKind } from "./key-builder";

export interface KindRule {
  maxBytes: number;
  mimes: readonly string[];
  /** Quem pode subir esse kind */
  roles: readonly ("admin" | "contratante" | "empreiteiro" | "superadmin" | "anunciante")[];
}

const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
const DOC_MIMES = ["application/pdf"] as const;

/**
 * XG10 — formatos de projeto de obra. Antes só imagem e PDF passavam, então
 * DWG e vídeo eram recusados em silêncio — e o cliente tinha "vídeo 3D" e
 * plantas em CAD para anexar (15:06).
 *
 * DWG/DXF não têm MIME padronizado: cada browser e sistema envia um valor
 * diferente (às vezes `application/octet-stream`, que é o genérico de "binário
 * desconhecido"). Por isso a lista é ampla e o teto por tipo é o que segura o
 * tamanho — a alternativa seria recusar arquivo legítimo do usuário.
 */
const CAD_MIMES = [
  "image/vnd.dwg",
  "application/acad",
  "application/x-acad",
  "application/dwg",
  "application/x-dwg",
  "image/vnd.dxf",
  "application/dxf",
  "application/octet-stream",
] as const;

const PLANILHA_MIMES = [
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
] as const;

const TEXTO_MIMES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const VIDEO_MIMES = ["video/mp4", "video/quicktime"] as const;

/**
 * Teto por família de arquivo, dentro do mesmo `kind`. Um único `maxBytes` por
 * kind obrigaria a escolher entre recusar vídeo ou liberar PDF de 50 MB; o
 * cliente foi explícito em querer os dois tratados de forma diferente: "dá pra
 * definir também por extensão... PDF o cara pode subir até X, um vídeo até Y"
 * (23:47).
 */
export const MIME_MAX_BYTES: { mimes: readonly string[]; maxBytes: number }[] = [
  { mimes: IMAGE_MIMES, maxBytes: 10_000_000 },
  { mimes: DOC_MIMES, maxBytes: 20_000_000 },
  { mimes: CAD_MIMES, maxBytes: 20_000_000 },
  { mimes: PLANILHA_MIMES, maxBytes: 20_000_000 },
  { mimes: TEXTO_MIMES, maxBytes: 20_000_000 },
  { mimes: VIDEO_MIMES, maxBytes: 50_000_000 },
];

/** Teto específico do mime, quando houver; senão cai no limite do kind. */
export function maxBytesParaMime(mime: string): number | null {
  const regra = MIME_MAX_BYTES.find((r) => (r.mimes as readonly string[]).includes(mime));
  return regra?.maxBytes ?? null;
}

/**
 * XG10 — quota acumulada por obra. Consenso da reunião: "uns 200 megas por obra
 * tá ótimo" (22:00). Ponto de partida ajustável — o R2 está no free tier
 * (10 GB), o que dá folga para ~50 obras cheias.
 */
export const QUOTA_OBRA_BYTES = 200_000_000;

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
  // XG10 — `empreiteiro` entrou: no xgestão ele É o dono da obra, e a regra
  // herdada do marketplace o impedia de anexar documento à própria obra. O
  // vínculo com a obra é checado na rota (`canWriteObraContent`), não aqui.
  // XG10 — documento da obra aceita projeto em CAD, planilha, documento de
  // texto e vídeo, além de imagem e PDF. O teto de 50 MB é o do maior tipo
  // (vídeo); cada família tem o seu em `MIME_MAX_BYTES`.
  obra_anexo: {
    maxBytes: 50_000_000,
    mimes: [
      ...IMAGE_MIMES,
      ...DOC_MIMES,
      ...CAD_MIMES,
      ...PLANILHA_MIMES,
      ...TEXTO_MIMES,
      ...VIDEO_MIMES,
    ],
    roles: ["contratante", "empreiteiro", "superadmin"],
  },
  // Imagem de capa da obra (J40 #20). Só imagem, até 8 MB. Grava em
  // public/obras/{obraId}/capa/. A dimensão mínima é validada no cliente.
  obra_capa: {
    maxBytes: 8_000_000,
    mimes: IMAGE_MIMES,
    roles: ["contratante", "empreiteiro", "superadmin"],
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
  // Documento do dossiê do cliente, anexado pelo admin em /admin/clientes/[id].
  cliente_documento: {
    maxBytes: 15_000_000,
    mimes: [...IMAGE_MIMES, ...DOC_MIMES],
    roles: ["admin", "superadmin"],
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

  // XG10 — o menor entre o teto do kind e o teto da família do arquivo. Sem
  // isto, liberar vídeo de 50 MB liberaria PDF de 50 MB junto.
  const tetoMime = maxBytesParaMime(input.mime);
  const limite = tetoMime !== null ? Math.min(rule.maxBytes, tetoMime) : rule.maxBytes;
  if (input.size > limite) {
    const mb = (limite / 1_000_000).toFixed(0);
    return { ok: false, message: `Arquivo muito grande. Máximo ${mb} MB para este tipo.` };
  }
  return { ok: true };
}
