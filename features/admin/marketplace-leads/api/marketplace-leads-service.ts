// Admin Marketplace Leads — camada real (J27). Lista/filtra os leads capturados
// na landing (`marketplace_leads`), conta por status e permite avançar o status.
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { marketplaceLeads } from "@shared/db/schema";
import type {
  MarketplaceLead,
  MarketplaceLeadStatus,
  MarketplaceLeadsFilters,
  MarketplaceLeadsResponse,
} from "../types";

function clampPage(page?: number): number {
  return page && page > 0 ? Math.trunc(page) : 1;
}
function clampPageSize(pageSize?: number): number {
  if (!pageSize || pageSize < 1) return 20;
  return Math.min(100, Math.trunc(pageSize));
}
function iso(d: Date | null): string {
  return d ? d.toISOString() : "";
}

/** Monta as condições de filtro compartilhadas entre listagem, contagem e export. */
function buildConditions(filtros: MarketplaceLeadsFilters) {
  const condicoes = [];
  if (filtros.status) condicoes.push(eq(marketplaceLeads.status, filtros.status));
  const busca = filtros.q?.trim();
  if (busca) {
    const like = `%${busca}%`;
    condicoes.push(
      or(
        ilike(marketplaceLeads.nome, like),
        ilike(marketplaceLeads.email, like),
        ilike(marketplaceLeads.telefone, like),
      ),
    );
  }
  if (filtros.dataInicio) {
    condicoes.push(gte(marketplaceLeads.createdAt, new Date(`${filtros.dataInicio}T00:00:00`)));
  }
  if (filtros.dataFim) {
    // cobre o dia inteiro (até 23:59:59.999)
    condicoes.push(lte(marketplaceLeads.createdAt, new Date(`${filtros.dataFim}T23:59:59.999`)));
  }
  return condicoes.length ? and(...condicoes) : undefined;
}

function mapRow(r: typeof marketplaceLeads.$inferSelect): MarketplaceLead {
  return {
    id: r.id,
    nome: r.nome,
    email: r.email,
    telefone: r.telefone,
    isWhatsapp: r.isWhatsapp,
    status: r.status as MarketplaceLeadStatus,
    createdAt: iso(r.createdAt),
  };
}

export async function contarLeadsPorStatus(): Promise<Record<MarketplaceLeadStatus, number>> {
  const rows = await db
    .select({ status: marketplaceLeads.status, count: sql<number>`COUNT(*)::int` })
    .from(marketplaceLeads)
    .groupBy(marketplaceLeads.status);
  const counts: Record<MarketplaceLeadStatus, number> = {
    pendente: 0,
    notificado: 0,
    descartado: 0,
  };
  for (const r of rows) counts[r.status as MarketplaceLeadStatus] = r.count;
  return counts;
}

export async function listarLeadsAdmin(
  filtros: MarketplaceLeadsFilters,
): Promise<MarketplaceLeadsResponse> {
  const page = clampPage(filtros.page);
  const pageSize = clampPageSize(filtros.pageSize);
  const offset = (page - 1) * pageSize;
  const where = buildConditions(filtros);

  const baseFrom = db.select().from(marketplaceLeads);
  const rows = await (where ? baseFrom.where(where) : baseFrom)
    .orderBy(desc(marketplaceLeads.createdAt))
    .limit(pageSize)
    .offset(offset);

  const totalQuery = db.select({ count: sql<number>`COUNT(*)::int` }).from(marketplaceLeads);
  const [{ count: total } = { count: 0 }] = await (where ? totalQuery.where(where) : totalQuery);

  const counts = await contarLeadsPorStatus();

  return {
    rows: rows.map(mapRow),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    counts,
  };
}

/** Mesma query da listagem, sem paginação — para gerar o CSV completo (com filtros). */
export async function listarLeadsParaExport(
  filtros: MarketplaceLeadsFilters,
): Promise<MarketplaceLead[]> {
  const where = buildConditions(filtros);
  const baseFrom = db.select().from(marketplaceLeads);
  const rows = await (where ? baseFrom.where(where) : baseFrom).orderBy(
    desc(marketplaceLeads.createdAt),
  );
  return rows.map(mapRow);
}

export interface AtualizarStatusResult {
  lead: MarketplaceLead;
  statusAnterior: MarketplaceLeadStatus;
}

/** Atualiza o status de um lead. Retorna `null` se o lead não existe. */
export async function atualizarStatusLead(
  id: string,
  status: MarketplaceLeadStatus,
): Promise<AtualizarStatusResult | null> {
  const [atual] = await db
    .select({ status: marketplaceLeads.status })
    .from(marketplaceLeads)
    .where(eq(marketplaceLeads.id, id))
    .limit(1);
  if (!atual) return null;

  const [updated] = await db
    .update(marketplaceLeads)
    .set({ status })
    .where(eq(marketplaceLeads.id, id))
    .returning();
  if (!updated) return null;

  return { lead: mapRow(updated), statusAnterior: atual.status as MarketplaceLeadStatus };
}
