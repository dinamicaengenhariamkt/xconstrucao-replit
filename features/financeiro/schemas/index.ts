import { createInsertSchema } from "drizzle-zod";
import { financeiro } from "@shared/db/schema";

/**
 * Schemas Zod para validação de dados financeiros
 * Feature compartilhada usada por admin e contratante
 */

export const insertFinanceiroSchema = createInsertSchema(financeiro).omit({ id: true });
