import { z } from "zod";
import { evaluatePasswordPolicy } from "./password";
import { isCpfCnpjValid, unformatCpfCnpj } from "@shared/lib/masks";

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
    // CPF/CNPJ coletado no cadastro (obrigatório p/ contratante e empreiteiro).
    // O ASAAS exige esse dado para criar o customer e cobrar a assinatura; sem
    // ele o checkout aborta com PERFIL_INCOMPLETO. Anunciante não assina plano,
    // então o campo é opcional. Normalizado para dígitos no output.
    cpfCnpj: z
      .string()
      .optional()
      .transform((v) => (v ? unformatCpfCnpj(v) : v)),
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

    // Contratante/empreiteiro precisam de documento fiscal válido no cadastro
    // para conseguir assinar planos (pré-requisito do gateway de pagamento).
    //
    // Regra de negócio por persona:
    //  - contratante: CPF **ou** CNPJ. Pode ser tanto uma pessoa reformando a
    //    própria casa quanto uma empresa contratando outra.
    //  - empreiteiro: **somente CNPJ**. Quem executa a obra atua como empresa.
    //  - anunciante: isento aqui — o documento é coletado no checkout do
    //    anúncio (customer lazy do Asaas), não no cadastro. Ver
    //    features/anuncios/self-service/asaas-ad-billing.ts.
    if (data.role === "contratante" || data.role === "empreiteiro") {
      const ehEmpreiteiro = data.role === "empreiteiro";
      const rotulo = ehEmpreiteiro ? "CNPJ" : "CPF ou CNPJ";

      if (!data.cpfCnpj) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cpfCnpj"],
          message: `${rotulo} é obrigatório`,
        });
      } else if (!isCpfCnpjValid(data.cpfCnpj)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cpfCnpj"],
          message: `${rotulo} inválido`,
        });
      } else if (ehEmpreiteiro && data.cpfCnpj.length !== 14) {
        // Documento válido, mas é CPF (11 dígitos) — recusa com mensagem que
        // explica a razão, senão o usuário reenvia o mesmo CPF achando que
        // digitou errado.
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cpfCnpj"],
          message: "Empreiteiro precisa de CNPJ — o cadastro é de pessoa jurídica",
        });
      }
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
