import { obras } from "@shared/db/schema";
import { z } from "zod";
import { insertObraSchema } from "../schemas";

/**
 * Types TypeScript para obras
 * Feature compartilhada usada por admin, contratante e empreiteiro
 */

export type Obra = typeof obras.$inferSelect;
export type InsertObra = z.infer<typeof insertObraSchema>;

export type ObraStatus = "em_andamento" | "concluida" | "pausada" | "planejamento";
