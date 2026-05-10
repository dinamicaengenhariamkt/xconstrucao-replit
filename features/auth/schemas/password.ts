import { z } from "zod";

const COMMON_PASSWORDS = new Set([
  "12345678", "123456789", "1234567890", "password", "password1", "password123",
  "qwerty", "qwerty123", "qwertyuiop", "abc123", "abcd1234", "iloveyou",
  "admin", "admin123", "administrator", "welcome", "welcome1", "letmein",
  "senha123", "senha1234", "minhasenha", "brasil123", "construcao", "obras123",
  "monkey", "dragon", "master", "111111", "000000", "121212", "1q2w3e4r",
]);

export interface PasswordPolicyContext {
  email?: string;
  name?: string;
  username?: string;
}

export interface PasswordPolicyResult {
  valid: boolean;
  message?: string;
}

function deburr(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function evaluatePasswordPolicy(
  password: string,
  ctx: PasswordPolicyContext = {}
): PasswordPolicyResult {
  if (password.length < 8) {
    return { valid: false, message: "A senha deve ter no mínimo 8 caracteres." };
  }

  let categories = 0;
  if (/[a-z]/.test(password)) categories++;
  if (/[A-Z]/.test(password)) categories++;
  if (/[0-9]/.test(password)) categories++;
  if (/[^A-Za-z0-9]/.test(password)) categories++;
  if (categories < 3) {
    return {
      valid: false,
      message:
        "A senha precisa combinar pelo menos 3 dos critérios: maiúscula, minúscula, número e caractere especial.",
    };
  }

  const lower = deburr(password.toLowerCase());
  if (COMMON_PASSWORDS.has(lower)) {
    return { valid: false, message: "Esta senha é muito comum. Escolha outra mais difícil." };
  }

  if (ctx.email) {
    // Exige local-part >= 4 chars para evitar falsos positivos
    // (ex.: email "ana@..." bloquearia a senha legítima "Banana@2026").
    const local = deburr(ctx.email.toLowerCase().split("@")[0] ?? "");
    if (local && local.length >= 4 && lower.includes(local)) {
      return { valid: false, message: "A senha não pode conter partes do seu email." };
    }
  }

  for (const field of [ctx.name, ctx.username]) {
    if (!field) continue;
    const tokens = deburr(field.toLowerCase())
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 4);
    for (const token of tokens) {
      if (lower.includes(token)) {
        return { valid: false, message: "A senha não pode conter seu nome ou usuário." };
      }
    }
  }

  return { valid: true };
}

/**
 * Mede a força da senha (0..4) para o medidor visual.
 * 0 = muito fraca, 4 = forte.
 */
export function passwordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  let categories = 0;
  if (/[a-z]/.test(password)) categories++;
  if (/[A-Z]/.test(password)) categories++;
  if (/[0-9]/.test(password)) categories++;
  if (/[^A-Za-z0-9]/.test(password)) categories++;
  if (categories >= 2) score++;
  if (categories >= 3) score++;
  if (COMMON_PASSWORDS.has(password.toLowerCase())) score = Math.min(score, 1);
  return Math.min(score, 4);
}

/**
 * Schema Zod reutilizável aplicando a política "balanced".
 * Use com .superRefine para fornecer contexto (email, name, username).
 */
export const strongPasswordSchema = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres.");

export function refinePasswordWithContext<T extends { password: string } & PasswordPolicyContext>(
  schema: z.ZodType<T>
): z.ZodEffects<z.ZodType<T>, T, T> {
  return schema.superRefine((data, ctx) => {
    const result = evaluatePasswordPolicy(data.password, {
      email: data.email,
      name: data.name,
      username: data.username,
    });
    if (!result.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: result.message ?? "Senha inválida.",
      });
    }
  });
}
