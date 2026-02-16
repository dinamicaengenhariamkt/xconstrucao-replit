import { createInsertSchema } from "drizzle-zod";
import { obras } from "@shared/db/schema";

/**
 * Schemas Zod para validação de dados de obras
 * Feature compartilhada usada por admin, contratante e empreiteiro
 */

export const insertObraSchema = createInsertSchema(obras).omit({ id: true });

// Podemos adicionar schemas personalizados conforme necessário
// export const updateObraSchema = insertObraSchema.partial();
