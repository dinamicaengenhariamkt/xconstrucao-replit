import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Cofre de criptografia simétrica em repouso — server-side ONLY.
 * AES-256-GCM (autenticado). Usado para cifrar segredos que precisam ser
 * recuperados em texto puro depois (ex: apiKey da subconta Asaas do empreiteiro
 * em `asaas_subcontas.asaas_api_key_enc`). NÃO usar para senhas (essas usam
 * hash one-way via bcrypt).
 *
 * Chave: `MARKETPLACE_ENC_KEY` (32 bytes em hex = 64 chars). DEVE ser estável
 * entre reinícios — um fallback aleatório tornaria os dados indecifráveis após
 * restart. Por isso lançamos se ausente/ inválida (padrão de getApiKey()).
 *
 * Formato de saída: `iv:authTag:ciphertext`, cada parte em base64.
 */

const ALGO = "aes-256-gcm";
const IV_BYTES = 12; // recomendado para GCM

function getKey(): Buffer {
  const hex = process.env.MARKETPLACE_ENC_KEY;
  if (!hex) {
    throw new Error(
      "[crypto-vault] MARKETPLACE_ENC_KEY não configurado. " +
        "Gere com: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error("[crypto-vault] MARKETPLACE_ENC_KEY deve ter 32 bytes (64 chars hex).");
  }
  return key;
}

/** Cifra `plaintext` e retorna `iv:authTag:ciphertext` (base64). */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(":");
}

/** Decifra o formato produzido por `encrypt`. Lança se adulterado (GCM). */
export function decrypt(payload: string): string {
  const key = getKey();
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("[crypto-vault] formato inválido (esperado iv:authTag:ciphertext).");
  }
  const [ivB64, tagB64, encB64] = parts;
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const dec = Buffer.concat([decipher.update(Buffer.from(encB64, "base64")), decipher.final()]);
  return dec.toString("utf8");
}

/** True se `MARKETPLACE_ENC_KEY` está presente e bem-formada (sem lançar). */
export function isVaultConfigured(): boolean {
  try {
    getKey();
    return true;
  } catch {
    return false;
  }
}
