// Admin FAQ — leitura real da base de perguntas frequentes (substitui o mock).
import { asc } from "drizzle-orm";
import { db } from "@shared/db/db";
import { faq } from "@shared/db/schema";
import type { AdminFAQItem } from "../types";

/** Data → 'YYYY-MM-DD' (formato que a UI já consumia do mock). */
function ymd(value: Date | string | null | undefined): string {
  if (value == null) return "";
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export async function listarFaqAdmin(): Promise<AdminFAQItem[]> {
  const rows = await db
    .select()
    .from(faq)
    .orderBy(asc(faq.category), asc(faq.ordem));

  return rows.map((r) => ({
    id: r.id,
    question: r.question,
    answer: r.answer,
    category: r.category,
    visao: r.visao,
    ordem: r.ordem,
    ativo: r.ativo,
    criadoEm: ymd(r.criadoEm),
    atualizadoEm: ymd(r.atualizadoEm),
  }));
}
