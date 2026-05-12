import { randomBytes, randomInt } from "crypto";

const LOWER = "abcdefghijkmnpqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGIT = "23456789";
const SYMBOL = "!@#$%&*?";
const ALL = LOWER + UPPER + DIGIT + SYMBOL;

function pick(set: string): string {
  return set[randomInt(0, set.length)];
}

/**
 * Gera senha aleatória forte (16 chars, atende política "balanced":
 * mínimo 8 + 4 categorias).
 */
export function generateStrongPassword(length = 16): string {
  if (length < 8) length = 8;
  const required = [pick(LOWER), pick(UPPER), pick(DIGIT), pick(SYMBOL)];
  const rest: string[] = [];
  for (let i = 0; i < length - required.length; i++) rest.push(pick(ALL));
  const all = [...required, ...rest];
  for (let i = all.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.join("");
}

/** Token URL-safe para link de definição de senha. */
export function generateSetupToken(): string {
  return randomBytes(32).toString("base64url");
}
