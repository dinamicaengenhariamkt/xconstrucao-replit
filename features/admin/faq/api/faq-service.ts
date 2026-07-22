// Admin FAQ — leitura real da base de perguntas frequentes (substitui o mock).
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@shared/db/db";
import { faq } from "@shared/db/schema";
import type { AdminFAQItem, FAQVisao } from "../types";

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

export interface FaqInput {
  question: string;
  answer: string;
  category: string;
  visao: FAQVisao;
  ordem: number;
  ativo: boolean;
}

/** J32 — cria uma pergunta de FAQ. */
export async function criarFaqAdmin(input: FaqInput): Promise<{ id: string }> {
  const [row] = await db
    .insert(faq)
    .values({
      question: input.question,
      answer: input.answer,
      category: input.category,
      visao: input.visao,
      ordem: input.ordem,
      ativo: input.ativo,
    })
    .returning({ id: faq.id });
  return { id: row.id };
}

/** J32 — edita uma pergunta de FAQ (campos parciais). Atualiza atualizadoEm. */
export async function editarFaqAdmin(id: string, patch: Partial<FaqInput>): Promise<boolean> {
  const set: Record<string, unknown> = { atualizadoEm: new Date() };
  if (patch.question !== undefined) set.question = patch.question;
  if (patch.answer !== undefined) set.answer = patch.answer;
  if (patch.category !== undefined) set.category = patch.category;
  if (patch.visao !== undefined) set.visao = patch.visao;
  if (patch.ordem !== undefined) set.ordem = patch.ordem;
  if (patch.ativo !== undefined) set.ativo = patch.ativo;
  const rows = await db.update(faq).set(set).where(eq(faq.id, id)).returning({ id: faq.id });
  return rows.length > 0;
}

/** J32 — exclui uma pergunta de FAQ. */
export async function deletarFaqAdmin(id: string): Promise<boolean> {
  const rows = await db.delete(faq).where(eq(faq.id, id)).returning({ id: faq.id });
  return rows.length > 0;
}

export interface FaqPublicItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

/**
 * J32/J53 — leitura por visão (contratante/empreiteiro/anunciante). Inclui as
 * perguntas marcadas `ambos`. Só perguntas ativas. Ordenado por categoria + ordem.
 */
export async function listarFaqPorVisao(
  visao: "contratante" | "empreiteiro" | "anunciante",
): Promise<FaqPublicItem[]> {
  const rows = await db
    .select({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
    })
    .from(faq)
    .where(and(inArray(faq.visao, [visao, "ambos"]), eq(faq.ativo, true)))
    .orderBy(asc(faq.category), asc(faq.ordem));
  return rows;
}
