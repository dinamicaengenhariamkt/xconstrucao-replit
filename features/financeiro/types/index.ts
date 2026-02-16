import { financeiro } from "@shared/db/schema";
import { z } from "zod";
import { insertFinanceiroSchema } from "../schemas";

/**
 * Types TypeScript para financeiro
 * Feature compartilhada usada por admin e contratante
 */

export type Financeiro = typeof financeiro.$inferSelect;
export type InsertFinanceiro = z.infer<typeof insertFinanceiroSchema>;

export type TipoTransacao = "entrada" | "saida";

export type Categoria = "material" | "mao_obra" | "pagamento" | "outro";

export interface EntradasSaidas {
  totalEntradas: string;
  totalSaidas: string;
  saldoGeral: string;
}
