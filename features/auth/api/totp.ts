// J22 — Autenticação Forte (2FA / TOTP).
// Helper isolado e testável em torno de `otplib` (v13, API funcional). Concentra aqui:
//   - geração de secret + otpauth URI (pro QR)
//   - validação de código TOTP com tolerância de clock drift
//   - geração e verificação de recovery codes (uso único, guardados como HASH)
// Só `validarCodigo` é assíncrona (verify do otplib é Promise). O resto é puro.
import { generateSecret, generateURI, verify } from "otplib";
import { createHash, randomBytes, timingSafeEqual } from "crypto";

const SERVICE_NAME = "XConstrução";
// Tolerância de ±1 janela (30s) pra absorver clock drift entre servidor e app.
const EPOCH_TOLERANCE = 30;

/** Gera um novo secret TOTP base32 (não persiste nada). */
export function gerarSecret(): string {
  return generateSecret();
}

/** Monta a otpauth:// URI usada pelo QR code do app autenticador. */
export function montarOtpauthUri(email: string, secret: string): string {
  return generateURI({ issuer: SERVICE_NAME, label: email, secret });
}

/** Valida um código TOTP de 6 dígitos contra o secret (±1 janela). */
export async function validarCodigo(codigo: string, secret: string): Promise<boolean> {
  const limpo = codigo.replace(/\s/g, "");
  if (!/^\d{6}$/.test(limpo)) return false;
  try {
    const res = await verify({ secret, token: limpo, epochTolerance: EPOCH_TOLERANCE });
    return res.valid === true;
  } catch {
    return false;
  }
}

// ── Recovery codes ───────────────────────────────────────────────────────────
const QTD_RECOVERY = 10;

/** Formata bytes aleatórios como "XXXX-XXXX" (legível, sem caracteres ambíguos). */
function formatarRecovery(buf: Buffer): string {
  const alf = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem I,O,0,1
  let s = "";
  for (let i = 0; i < 8; i++) s += alf[buf[i] % alf.length];
  return `${s.slice(0, 4)}-${s.slice(4, 8)}`;
}

/** Hash determinístico (SHA-256) de um recovery code, normalizado. */
export function hashRecovery(codigo: string): string {
  const normalizado = codigo.replace(/[\s-]/g, "").toUpperCase();
  return createHash("sha256").update(normalizado).digest("hex");
}

/**
 * Gera N recovery codes em claro (mostrados UMA vez) + seus hashes (persistidos).
 * Retorna { claros, hashes } — o caller mostra `claros` e salva `hashes`.
 */
export function gerarRecoveryCodes(): { claros: string[]; hashes: string[] } {
  const claros: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < QTD_RECOVERY; i++) {
    const codigo = formatarRecovery(randomBytes(8));
    claros.push(codigo);
    hashes.push(hashRecovery(codigo));
  }
  return { claros, hashes };
}

/** Só valida (sem consumir): true se o recovery code casa com algum hash. */
export function validarRecovery(codigo: string, hashes: string[]): boolean {
  return consumirRecovery(codigo, hashes) !== -1;
}

/**
 * Verifica um recovery code contra a lista de hashes (comparação constante).
 * Retorna o índice do hash consumido, ou -1 se inválido. Caller remove o índice.
 */
export function consumirRecovery(codigo: string, hashes: string[]): number {
  if (!codigo) return -1;
  const alvo = Buffer.from(hashRecovery(codigo), "hex");
  for (let i = 0; i < hashes.length; i++) {
    const atual = Buffer.from(hashes[i], "hex");
    if (atual.length === alvo.length && timingSafeEqual(atual, alvo)) return i;
  }
  return -1;
}
