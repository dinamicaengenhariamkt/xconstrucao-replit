/**
 * Convenção de chaves no bucket R2.
 *
 * Público (acessado via publicBaseUrl):
 *   public/avatars/{role}/{userId}/{ts}-avatar.{ext}
 *   public/empreiteiro/{userId}/portfolio/{ts}-{slug}.{ext}
 *
 * Privado (apenas via URL assinada):
 *   private/empreiteiro/{userId}/documentos/{tipo}/{ts}-{slug}.{ext}
 */

export type UploadKind = "avatar" | "portfolio_imagem" | "portfolio_doc" | "empreiteiro_documento" | "obra_anexo" | "obra_capa" | "comprovante_pagamento" | "candidatura_anexo" | "obra_foto" | "anuncio_criativo" | "cliente_documento";
export type UploadVisibility = "public" | "private";

export interface KeyBuilderArgs {
  kind: UploadKind;
  role: "admin" | "contratante" | "empreiteiro" | "superadmin" | "anunciante";
  userId: string;
  originalName: string;
  extras?: { tipoDocumento?: string };
}

/**
 * Prefixo de namespace para separar uploads de dev/prod no mesmo bucket.
 * Defina R2_KEY_PREFIX=dev em .env.local para desenvolvimento.
 * Em produção, deixe vazio ou não defina (sem prefixo).
 */
function getKeyPrefix(): string {
  const prefix =
    typeof process !== "undefined" ? process.env.R2_KEY_PREFIX ?? "" : "";
  return prefix.trim().replace(/\/+$/, "");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "arquivo";
}

export function timestampStamp(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds())
  );
}

export function visibilityForKind(kind: UploadKind): UploadVisibility {
  if (kind === "empreiteiro_documento") return "private";
  if (kind === "comprovante_pagamento") return "private";
  if (kind === "candidatura_anexo") return "private";
  // Dossiê do cliente anexado pelo admin: documento sensível, nunca público.
  if (kind === "cliente_documento") return "private";
  // anuncio_criativo é público (servido na landing/dashboards).
  return "public";
}

/** Para obra_anexo, o role do contratante que está subindo. */

function splitNameExt(originalName: string): { name: string; ext: string } {
  const idx = originalName.lastIndexOf(".");
  if (idx <= 0) return { name: originalName, ext: "" };
  return { name: originalName.slice(0, idx), ext: originalName.slice(idx + 1).toLowerCase() };
}

export interface ValidateKeyArgs {
  key: string;
  kind: UploadKind;
  role: "admin" | "contratante" | "empreiteiro" | "superadmin" | "anunciante";
  userId: string;
}

/**
 * Anti-tamper: confirma que a `key` enviada pelo cliente bate exatamente
 * com o padrão canônico permitido para `kind`/`role`/`userId`.
 *
 * Padrões aceitos (segmentos finais com timestamp + slug livre):
 *   avatar:                public/avatars/{role}/{userId}/<...>
 *   portfolio_imagem:      public/empreiteiro/{userId}/portfolio/<...>
 *   portfolio_doc:         public/empreiteiro/{userId}/portfolio-docs/<...>
 *   empreiteiro_documento: private/empreiteiro/{userId}/documentos/{tipo}/<...>
 */
export function validateKeyForOwner(args: ValidateKeyArgs): { ok: boolean; reason?: string } {
  const { key, kind, role, userId } = args;
  if (!key || key.includes("..") || key.startsWith("/") || key.includes("//")) {
    return { ok: false, reason: "key inválida" };
  }
  // userId deve ser um UUID v4-ish (sem barras / pontos)
  if (!/^[a-z0-9-]{8,64}$/i.test(userId)) {
    return { ok: false, reason: "userId inválido" };
  }

  // Strip do prefixo de dev/prod antes de checar a shape canônica.
  const prefix = getKeyPrefix();
  let effectiveKey = key;
  if (prefix && key.startsWith(prefix + "/")) {
    effectiveKey = key.slice(prefix.length + 1);
  }

  const segments = effectiveKey.split("/");
  // Segmento final precisa ter timestamp+slug com extensão segura
  const last = segments[segments.length - 1];
  if (!/^[a-zA-Z0-9._-]{3,160}$/.test(last)) {
    return { ok: false, reason: "nome inválido" };
  }

  if (kind === "avatar") {
    // public/avatars/{role}/{userId}/<file>
    if (segments.length !== 5) return { ok: false, reason: "shape avatar" };
    if (segments[0] !== "public" || segments[1] !== "avatars") return { ok: false, reason: "prefixo avatar" };
    if (segments[2] !== role) return { ok: false, reason: "role mismatch" };
    if (segments[3] !== userId) return { ok: false, reason: "userId mismatch" };
    return { ok: true };
  }

  if (kind === "portfolio_imagem") {
    // public/empreiteiro/{userId}/portfolio/<file>
    if (segments.length !== 5) return { ok: false, reason: "shape portfolio" };
    if (
      segments[0] !== "public" ||
      segments[1] !== "empreiteiro" ||
      segments[3] !== "portfolio"
    ) {
      return { ok: false, reason: "prefixo portfolio" };
    }
    if (segments[2] !== userId) return { ok: false, reason: "userId mismatch" };
    if (role !== "empreiteiro" && role !== "superadmin") return { ok: false, reason: "role" };
    return { ok: true };
  }

  if (kind === "portfolio_doc") {
    // public/empreiteiro/{userId}/portfolio-docs/<file>
    if (segments.length !== 5) return { ok: false, reason: "shape portfolio-doc" };
    if (
      segments[0] !== "public" ||
      segments[1] !== "empreiteiro" ||
      segments[3] !== "portfolio-docs"
    ) {
      return { ok: false, reason: "prefixo portfolio-doc" };
    }
    if (segments[2] !== userId) return { ok: false, reason: "userId mismatch" };
    if (role !== "empreiteiro" && role !== "superadmin") return { ok: false, reason: "role" };
    return { ok: true };
  }

  if (kind === "obra_anexo") {
    // public/obras/{userId}/anexos/<file>
    if (segments.length !== 5) return { ok: false, reason: "shape obra-anexo" };
    if (
      segments[0] !== "public" ||
      segments[1] !== "obras" ||
      segments[3] !== "anexos"
    ) {
      return { ok: false, reason: "prefixo obra-anexo" };
    }
    if (segments[2] !== userId) return { ok: false, reason: "userId mismatch" };
    if (role !== "contratante" && role !== "superadmin") return { ok: false, reason: "role" };
    return { ok: true };
  }

  if (kind === "obra_capa") {
    // public/obras/{userId}/capa/<file> — mesma raiz de obra_anexo (keyed pelo
    // usuário que envia). Sub-pasta `capa/` separa da `anexos/`; o arquivo é
    // vinculado à obra específica via obras.fotoCapaFileId no commit.
    if (segments.length !== 5) return { ok: false, reason: "shape obra-capa" };
    if (
      segments[0] !== "public" ||
      segments[1] !== "obras" ||
      segments[3] !== "capa"
    ) {
      return { ok: false, reason: "prefixo obra-capa" };
    }
    if (segments[2] !== userId) return { ok: false, reason: "userId mismatch" };
    if (role !== "contratante" && role !== "superadmin") return { ok: false, reason: "role" };
    return { ok: true };
  }

  if (kind === "comprovante_pagamento") {
    // private/contratante/{userId}/comprovantes/<file>
    if (segments.length !== 5) return { ok: false, reason: "shape comprovante" };
    if (
      segments[0] !== "private" ||
      segments[1] !== "contratante" ||
      segments[3] !== "comprovantes"
    ) {
      return { ok: false, reason: "prefixo comprovante" };
    }
    if (segments[2] !== userId) return { ok: false, reason: "userId mismatch" };
    if (role !== "contratante" && role !== "superadmin") return { ok: false, reason: "role" };
    return { ok: true };
  }

  if (kind === "candidatura_anexo") {
    // private/empreiteiro/{userId}/candidatura-anexos/<file>
    if (segments.length !== 5) return { ok: false, reason: "shape candidatura-anexo" };
    if (
      segments[0] !== "private" ||
      segments[1] !== "empreiteiro" ||
      segments[3] !== "candidatura-anexos"
    ) {
      return { ok: false, reason: "prefixo candidatura-anexo" };
    }
    if (segments[2] !== userId) return { ok: false, reason: "userId mismatch" };
    if (role !== "empreiteiro" && role !== "superadmin") return { ok: false, reason: "role" };
    return { ok: true };
  }

  if (kind === "obra_foto") {
    // public/obra-fotos/{userId}/<file>
    if (segments.length !== 4) return { ok: false, reason: "shape obra-foto" };
    if (segments[0] !== "public" || segments[1] !== "obra-fotos") return { ok: false, reason: "prefixo obra-foto" };
    if (segments[2] !== userId) return { ok: false, reason: "userId mismatch" };
    if (role !== "contratante" && role !== "empreiteiro" && role !== "superadmin") return { ok: false, reason: "role" };
    return { ok: true };
  }

  if (kind === "anuncio_criativo") {
    // public/anuncios/{userId}/criativos/<file>. J24 era admin-only; J23 abriu para
    // quem pode anunciar (self-service). Mantém alinhado com KIND_RULES.anuncio_criativo.
    if (segments.length !== 5) return { ok: false, reason: "shape anuncio-criativo" };
    if (
      segments[0] !== "public" ||
      segments[1] !== "anuncios" ||
      segments[3] !== "criativos"
    ) {
      return { ok: false, reason: "prefixo anuncio-criativo" };
    }
    if (segments[2] !== userId) return { ok: false, reason: "userId mismatch" };
    const rolesPermitidos = ["admin", "superadmin", "anunciante", "contratante", "empreiteiro"];
    if (!rolesPermitidos.includes(role)) return { ok: false, reason: "role" };
    return { ok: true };
  }

  if (kind === "cliente_documento") {
    // private/clientes/{userId}/documentos/<file> — keyed pelo admin que envia
    // (mesma convenção dos demais kinds); o vínculo com o cliente é feito na
    // tabela `cliente_documentos` no momento do POST.
    if (segments.length !== 5) return { ok: false, reason: "shape cliente-documento" };
    if (
      segments[0] !== "private" ||
      segments[1] !== "clientes" ||
      segments[3] !== "documentos"
    ) {
      return { ok: false, reason: "prefixo cliente-documento" };
    }
    if (segments[2] !== userId) return { ok: false, reason: "userId mismatch" };
    if (role !== "admin" && role !== "superadmin") return { ok: false, reason: "role" };
    return { ok: true };
  }

  // empreiteiro_documento → private/empreiteiro/{userId}/documentos/{tipo}/<file>
  if (segments.length !== 6) return { ok: false, reason: "shape documento" };
  if (
    segments[0] !== "private" ||
    segments[1] !== "empreiteiro" ||
    segments[3] !== "documentos"
  ) {
    return { ok: false, reason: "prefixo documento" };
  }
  if (segments[2] !== userId) return { ok: false, reason: "userId mismatch" };
  if (!/^[a-z0-9-]{1,40}$/.test(segments[4])) return { ok: false, reason: "tipo inválido" };
  if (role !== "empreiteiro" && role !== "superadmin") return { ok: false, reason: "role" };
  return { ok: true };
}

export function buildKey(args: KeyBuilderArgs): string {
  const { kind, role, userId, originalName, extras } = args;
  const visibility = visibilityForKind(kind);
  const { name, ext } = splitNameExt(originalName);
  const slug = slugify(name);
  const ts = timestampStamp();
  const safeExt = ext ? `.${slugify(ext)}` : "";

  let base: string;
  if (kind === "avatar") {
    base = `${visibility}/avatars/${role}/${userId}/${ts}-avatar${safeExt}`;
  } else if (kind === "portfolio_imagem") {
    base = `public/empreiteiro/${userId}/portfolio/${ts}-${slug}${safeExt}`;
  } else if (kind === "portfolio_doc") {
    base = `public/empreiteiro/${userId}/portfolio-docs/${ts}-${slug}${safeExt}`;
  } else if (kind === "obra_anexo") {
    base = `public/obras/${userId}/anexos/${ts}-${slug}${safeExt}`;
  } else if (kind === "obra_capa") {
    // Nome fixo `capa` (não depende do originalName) para ficar legível ao
    // navegar no bucket: public/obras/{userId}/capa/{ts}-capa.{ext}
    base = `public/obras/${userId}/capa/${ts}-capa${safeExt}`;
  } else if (kind === "comprovante_pagamento") {
    base = `private/contratante/${userId}/comprovantes/${ts}-${slug}${safeExt}`;
  } else if (kind === "candidatura_anexo") {
    base = `private/empreiteiro/${userId}/candidatura-anexos/${ts}-${slug}${safeExt}`;
  } else if (kind === "obra_foto") {
    base = `public/obra-fotos/${userId}/${ts}-${slug}${safeExt}`;
  } else if (kind === "anuncio_criativo") {
    base = `public/anuncios/${userId}/criativos/${ts}-${slug}${safeExt}`;
  } else if (kind === "cliente_documento") {
    base = `private/clientes/${userId}/documentos/${ts}-${slug}${safeExt}`;
  } else {
    // empreiteiro_documento
    const tipo = slugify(extras?.tipoDocumento || "outro");
    base = `private/empreiteiro/${userId}/documentos/${tipo}/${ts}-${slug}${safeExt}`;
  }

  // Prefixo de namespace dev/prod (ex.: "dev" → "dev/public/avatars/...").
  const prefix = getKeyPrefix();
  return prefix ? `${prefix}/${base}` : base;
}
