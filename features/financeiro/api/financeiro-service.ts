import { eq, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { financeiro, type Financeiro, type InsertFinanceiro } from "@shared/db/schema";

/**
 * Service para operações financeiras
 * Feature compartilhada usada principalmente por admin e contratante
 */

export async function getFinanceiros(): Promise<Financeiro[]> {
  return db.select().from(financeiro);
}

export async function createFinanceiro(data: InsertFinanceiro): Promise<Financeiro> {
  const [f] = await db.insert(financeiro).values(data).returning();
  return f;
}

/**
 * Calcula totais de entradas e saídas
 * Usado principalmente pelo admin para visualização de caixa
 */
export async function getEntradasSaidas(): Promise<{
  totalEntradas: string;
  totalSaidas: string;
  saldoGeral: string;
}> {
  const [entradasSum] = await db.select({
    total: sql<string>`COALESCE(SUM(valor::numeric), 0)::text`
  }).from(financeiro).where(eq(financeiro.tipo, "entrada"));

  const [saidasSum] = await db.select({
    total: sql<string>`COALESCE(SUM(valor::numeric), 0)::text`
  }).from(financeiro).where(eq(financeiro.tipo, "saida"));

  const entradas = parseFloat(entradasSum.total || "0");
  const saidas = parseFloat(saidasSum.total || "0");

  return {
    totalEntradas: entradasSum.total || "0",
    totalSaidas: saidasSum.total || "0",
    saldoGeral: (entradas - saidas).toString(),
  };
}
