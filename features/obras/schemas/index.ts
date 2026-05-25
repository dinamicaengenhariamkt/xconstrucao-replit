import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { obras, obraAnexos } from "@shared/db/schema";

/**
 * Schemas Zod para validação de dados de obras
 * Feature compartilhada usada por admin, contratante e empreiteiro
 */

export const insertObraSchema = createInsertSchema(obras).omit({ id: true });

const UF_REGEX = /^[A-Z]{2}$/;
const CEP_REGEX = /^\d{5}-?\d{3}$/;

/** Normaliza strings vazias/whitespace para undefined antes da validação. */
const emptyToUndef = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

/**
 * Schema estrito para validação condicional por visibilidade.
 *
 * Regras:
 * - rascunho: campos mínimos (nome, descricao curta opcional). Quase tudo opcional.
 * - publicada: exige tipo, descricao (≥20), cep, cidade, uf, modalidade, materiaisPor.
 *
 * Wave 1: anexos validados em endpoint separado (POST /api/obras/[id]/anexos).
 */
export const insertObraSchemaStrict = insertObraSchema
  .extend({
    nome: z.string().trim().min(3, "Nome deve ter no mínimo 3 caracteres").max(160, "Nome muito longo"),
    descricao: z.preprocess(emptyToUndef, z.string().trim().max(4000, "Descrição muito longa").optional().nullable()),
    cep: z.preprocess(
      emptyToUndef,
      z.string().trim().regex(CEP_REGEX, "CEP inválido (use 00000-000)").optional().nullable(),
    ),
    uf: z.preprocess(
      emptyToUndef,
      z
        .string()
        .trim()
        .transform((v) => v.toUpperCase())
        .pipe(z.string().regex(UF_REGEX, "UF inválida (2 letras)"))
        .optional()
        .nullable(),
    ),
    cidade: z.preprocess(emptyToUndef, z.string().trim().min(2, "Cidade inválida").max(120).optional().nullable()),
    tipo: z.preprocess(emptyToUndef, z.string().trim().max(80).optional().nullable()),
    endereco: z.string().trim().min(3, "Endereço inválido").max(240),
    visibilidade: z.enum(["rascunho", "publicada", "pausada", "arquivada"]).default("rascunho"),
    modalidade: z.preprocess(
      emptyToUndef,
      z.enum(["administracao", "empreitada_global", "empreitada_etapa"]).optional().nullable(),
    ),
    materiaisPor: z.preprocess(
      emptyToUndef,
      z.enum(["contratante", "empreiteiro", "misto"]).optional().nullable(),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.visibilidade !== "publicada") return;

    const requireField = (key: keyof typeof data, label: string, predicate: (v: unknown) => boolean) => {
      if (!predicate(data[key])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key as string],
          message: `${label} é obrigatório para publicar a obra`,
        });
      }
    };

    requireField("tipo", "Tipo de obra", (v) => typeof v === "string" && v.trim().length >= 2);
    requireField("descricao", "Descrição (mín. 20 caracteres)", (v) => typeof v === "string" && v.trim().length >= 20);
    requireField("cep", "CEP", (v) => typeof v === "string" && CEP_REGEX.test(v));
    requireField("cidade", "Cidade", (v) => typeof v === "string" && v.trim().length >= 2);
    requireField("uf", "UF", (v) => typeof v === "string" && UF_REGEX.test(v));
    requireField("modalidade", "Modalidade", (v) => typeof v === "string" && v.length > 0);
    requireField("materiaisPor", "Materiais por", (v) => typeof v === "string" && v.length > 0);
  });

export const insertObraAnexoSchema = createInsertSchema(obraAnexos).omit({
  id: true,
  createdAt: true,
  createdBy: true,
});

export type InsertObraStrict = z.infer<typeof insertObraSchemaStrict>;
export type InsertObraAnexo = z.infer<typeof insertObraAnexoSchema>;
