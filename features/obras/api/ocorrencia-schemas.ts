import { z } from "zod";

/** Limites compartilhados por criação e edição de ocorrência. */
export const ocorrenciaTitulo = z.string().trim().min(3).max(160);
export const ocorrenciaDescricao = z.string().trim().min(3).max(2000);
export const ocorrenciaGravidade = z.enum(["critico", "medio", "baixo"]);
/** Texto livre de como o problema foi resolvido; vazio vira null. */
export const observacaoResolucao = z
  .string()
  .trim()
  .max(1000)
  .nullable()
  .optional()
  .transform((v) => (v ? v : v === undefined ? undefined : null));

export const ocorrenciaUpdateSchema = z
  .object({
    titulo: ocorrenciaTitulo.optional(),
    descricao: ocorrenciaDescricao.optional(),
    gravidade: ocorrenciaGravidade.optional(),
    fotoFileId: z.string().uuid().nullable().optional(),
    observacaoResolucao,
  })
  .strict()
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "Nada para alterar.",
  });

export const ocorrenciaResolverSchema = z.object({ observacaoResolucao }).strict();

export type PapelEmpresaOcorrencia = "dono" | "gestor" | "colaborador" | null;

/**
 * Editar, excluir e reabrir seguem o diário: o autor, e acima dele o dono e o
 * gestor da empresa. A checagem de escrita da área (visualizar, somente
 * leitura do plano) vem antes, em `canWriteObraArea`.
 */
export function podeGerenciarOcorrencia(
  userId: string,
  autorId: string,
  papel: PapelEmpresaOcorrencia,
): boolean {
  return autorId === userId || papel === "dono" || papel === "gestor";
}
