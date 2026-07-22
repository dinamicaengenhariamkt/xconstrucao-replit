import { z } from "zod";
import { isZonaValida, templateAceitoNaZona } from "@features/anuncios/anuncios-service";
import { CONTEUDO_SCHEMAS, isTemplateValido } from "@features/shared/anuncios/templates/schemas";
import type { TemplateId } from "@features/shared/anuncios/templates/types";

/**
 * J23 — validação de pedido multi-slot. Cada slot referencia uma zona + template
 * compatíveis (reuso da regra da J24) e o `conteudo` é validado contra o schema do
 * template escolhido. Nunca confiar no client: zona/template/conteudo validados aqui.
 */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve ser yyyy-mm-dd")
  .optional()
  .nullable();

export const slotInputSchema = z
  .object({
    zona: z.string().refine(isZonaValida, "Zona inválida"),
    template: z.string().refine(isTemplateValido, "Template inválido"),
    titulo: z.string().trim().min(2, "Título muito curto").max(160),
    subtitulo: z.string().trim().max(200).optional().nullable(),
    criativoUrl: z
      .string()
      .url("URL de criativo inválida")
      .refine((u) => /^https?:\/\//i.test(u), "URL deve começar com http(s)")
      .optional()
      .nullable(),
    ctaUrl: z
      .string()
      .url("URL de destino inválida")
      .refine((u) => /^https?:\/\//i.test(u), "URL deve começar com http(s)")
      .optional()
      .nullable(),
    ctaTexto: z.string().trim().max(40).optional().nullable(),
    conteudo: z.unknown().optional().nullable(),
    periodoInicio: isoDate,
    periodoFim: isoDate,
  })
  .superRefine((data, ctx) => {
    // Template precisa ser compatível com a zona (regra J24).
    if (!templateAceitoNaZona(data.template, data.zona)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["template"],
        message: "Template não é compatível com a zona escolhida",
      });
    }
    // `conteudo` validado contra o schema do template efetivo.
    const schema = CONTEUDO_SCHEMAS[data.template as TemplateId];
    if (schema) {
      const res = schema.safeParse(data.conteudo ?? {});
      if (!res.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["conteudo"],
          message: "Conteúdo inválido para o template escolhido",
        });
      }
    }
    // Período coerente: se um lado vier, o outro também; fim ≥ início.
    if ((data.periodoInicio && !data.periodoFim) || (!data.periodoInicio && data.periodoFim)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["periodoFim"],
        message: "Informe início e fim do período",
      });
    }
    if (data.periodoInicio && data.periodoFim && data.periodoFim < data.periodoInicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["periodoFim"],
        message: "Fim do período não pode ser antes do início",
      });
    }
  });

export const criarPedidoSchema = z.object({
  slots: z.array(slotInputSchema).min(1, "Adicione ao menos um slot").max(10, "Máximo de 10 slots por pedido"),
});

export type SlotInput = z.infer<typeof slotInputSchema>;
export type CriarPedidoInput = z.infer<typeof criarPedidoSchema>;

/** Janela máxima (em dias) para a data de início da veiculação a partir de hoje. */
export const JANELA_INICIO_DIAS = 7;

/**
 * J31 — Validação adicional do modo PAGO (moderar-antes-de-pagar). No protótipo o
 * período é opcional (assume 30 dias); com cobrança real ele é OBRIGATÓRIO e a data
 * de início deve estar entre hoje e hoje+7 (o dinheiro não fica parado). Rodada
 * SERVER-SIDE (com "hoje" fresco), separada do schema base para não quebrar o
 * fluxo protótipo/E2E. Retorna a lista de erros (vazia = ok).
 */
export function validarPeriodoPago(slots: Array<{ periodoInicio?: string | null; periodoFim?: string | null }>): string[] {
  const erros: string[] = [];
  const hoje = new Date().toISOString().slice(0, 10);
  const limite = new Date();
  limite.setDate(limite.getDate() + JANELA_INICIO_DIAS);
  const limiteStr = limite.toISOString().slice(0, 10);

  slots.forEach((s, i) => {
    const n = i + 1;
    if (!s.periodoInicio || !s.periodoFim) {
      erros.push(`Slot ${n}: informe início e fim da veiculação (obrigatório).`);
      return;
    }
    if (s.periodoInicio < hoje) {
      erros.push(`Slot ${n}: a data de início não pode ser no passado.`);
    }
    if (s.periodoInicio > limiteStr) {
      erros.push(`Slot ${n}: o início deve ser em até ${JANELA_INICIO_DIAS} dias a partir de hoje.`);
    }
    if (s.periodoFim < s.periodoInicio) {
      erros.push(`Slot ${n}: o fim não pode ser antes do início.`);
    }
  });
  return erros;
}

// Gestão do próprio anúncio (PATCH /api/anuncios/meus/[id]).
export const gerirAnuncioSchema = z.object({
  acao: z.enum(["pausar", "reativar"]),
});
export type GerirAnuncioInput = z.infer<typeof gerirAnuncioSchema>;

// Moderação (admin) — PATCH /api/admin/anuncios/pedidos/[id].
export const moderarPedidoSchema = z
  .object({
    acao: z.enum(["aprovar", "recusar"]),
    motivoRecusa: z.string().trim().max(400).optional().nullable(),
    valorTotal: z.number().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.acao === "recusar" && !data.motivoRecusa?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["motivoRecusa"],
        message: "Motivo é obrigatório ao recusar",
      });
    }
  });
export type ModerarPedidoInput = z.infer<typeof moderarPedidoSchema>;
