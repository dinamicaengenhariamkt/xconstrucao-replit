import { z } from "zod";

/**
 * XG22 — campos de contrato/PIX do prestador, compartilhados entre o POST e o
 * PATCH da equipe.
 *
 * Ficam aqui, e não inline em cada rota, porque a regra "arquivo OU link, nunca
 * os dois" precisa valer igual nas duas: criar um membro com ambos e depois
 * editá-lo para o mesmo estado inválido seria a mesma inconsistência por dois
 * caminhos. A validação de formulário do modal é a terceira cópia — essa é
 * inevitável (roda no browser), mas o servidor é quem decide.
 */
export const contratoFields = {
  // Chave PIX aceita qualquer formato: CPF, CNPJ, e-mail, telefone ou aleatória.
  // Um regex aqui recusaria chave válida no meio do cadastro.
  pixChave: z.string().trim().max(140).nullable().optional(),
  // `coerce` porque o input numérico do formulário manda string.
  valorContrato: z.coerce
    .number()
    .nonnegative("O valor do contrato não pode ser negativo.")
    .max(999_999_999.99)
    .nullable()
    .optional(),
  contratoFileId: z.string().trim().min(8).max(64).nullable().optional(),
  contratoLinkUrl: z.string().trim().url("Link inválido.").max(2000).nullable().optional(),
};

/**
 * Recusa arquivo e link ao mesmo tempo, e barra esquemas não-http no link
 * (`javascript:`/`data:` passam no `.url()` do zod). Mesmo par de checagens da
 * rota de anexos da obra.
 *
 * Diferente dos anexos, aqui **nenhum dos dois** é válido: o contrato é
 * opcional, o prestador pode existir sem nada anexado.
 */
export function refineContrato(
  v: { contratoFileId?: string | null; contratoLinkUrl?: string | null },
  ctx: z.RefinementCtx,
): void {
  if (v.contratoFileId && v.contratoLinkUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["contratoLinkUrl"],
      message: "Envie um arquivo OU informe um link do contrato, não os dois.",
    });
    return;
  }
  if (v.contratoLinkUrl && !/^https?:\/\//i.test(v.contratoLinkUrl)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["contratoLinkUrl"],
      message: "O link precisa começar com http:// ou https://.",
    });
  }
}
