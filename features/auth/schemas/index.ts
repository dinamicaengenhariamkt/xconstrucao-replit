import { z } from "zod";
import { evaluatePasswordPolicy } from "./password";

const emailField = z
  .string()
  .min(1, "Email é obrigatório")
  .transform((s) => s.trim().toLowerCase())
  .pipe(z.string().email("Email inválido"));

/**
 * Login não exige senha forte (usuários antigos) — apenas que algo seja enviado.
 * O `expectedRole` é opcional e usado para invalidar tentativas de login
 * em uma tela de role diferente da real, sem revelar isso ao atacante.
 */
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Senha obrigatória"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Nome deve ter no mínimo 2 caracteres"),
    email: emailField,
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "Usuário deve ter no mínimo 3 caracteres")
      .regex(/^[a-z0-9_.]+$/, "Use apenas letras, números, ponto ou underline"),
    password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
    role: z.enum(["contratante", "empreiteiro", "anunciante"]),
    phone: z.string().optional(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({
        message: "Você deve aceitar os Termos de Uso e a Política de Privacidade",
      }),
    }),
  })
  .superRefine((data, ctx) => {
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

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirmação obrigatória"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "As senhas não coincidem",
      });
    }
    const result = evaluatePasswordPolicy(data.password);
    if (!result.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: result.message ?? "Senha inválida.",
      });
    }
  });
