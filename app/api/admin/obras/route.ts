import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, empreiteiras, obras, users } from "@shared/db/schema";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";

/**
 * GET /api/admin/obras
 *  Gate isAdminLike (admin + superadmin).
 *  Filtros: cliente_id, empreiteira_id, status, visibilidade, periodo_inicio, periodo_fim, q.
 *  Paginação: page (≥1), pageSize (1..100, default 20).
 *  Devolve { rows, total, page, pageSize, totalPages } com join leve (clienteNome, empreiteiraNome).
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const q = new URL(request.url).searchParams;
  const clienteId = q.get("cliente_id");
  const empreiteiraId = q.get("empreiteira_id");
  const status = q.get("status");
  const visibilidade = q.get("visibilidade");
  const statusModeracao = q.get("status_moderacao");
  const periodoInicio = q.get("periodo_inicio");
  const periodoFim = q.get("periodo_fim");
  const search = q.get("q")?.trim();
  const page = Math.max(1, Number(q.get("page") ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(q.get("pageSize") ?? 20) || 20));

  const filters: any[] = [];
  if (clienteId) filters.push(eq(obras.clienteId, clienteId));
  if (empreiteiraId) filters.push(eq(obras.empreiteiraId, empreiteiraId));
  if (status && ["em_andamento", "concluida", "pausada", "planejamento"].includes(status)) {
    filters.push(eq(obras.status, status as any));
  }
  if (visibilidade && ["rascunho", "publicada", "pausada", "arquivada"].includes(visibilidade)) {
    filters.push(eq(obras.visibilidade, visibilidade as any));
  }
  if (statusModeracao && ["pendente", "aprovada", "rejeitada"].includes(statusModeracao)) {
    filters.push(eq(obras.statusModeracao, statusModeracao as any));
  }
  if (periodoInicio) filters.push(gte(obras.createdAt, new Date(periodoInicio)));
  if (periodoFim) filters.push(lte(obras.createdAt, new Date(periodoFim)));
  if (search) {
    filters.push(
      or(
        ilike(obras.nome, `%${search}%`),
        ilike(obras.cidade, `%${search}%`),
        ilike(obras.endereco, `%${search}%`),
      ),
    );
  }

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(obras)
    .where(whereClause);
  const total = Number(count) || 0;

  const rows = await db
    .select({
      obra: obras,
      clienteNome: clientes.nome,
      empreiteiraNome: empreiteiras.nome,
    })
    .from(obras)
    .leftJoin(clientes, eq(clientes.id, obras.clienteId))
    .leftJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .where(whereClause)
    .orderBy(desc(obras.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const r = NextResponse.json({
    rows: rows.map((row) => ({
      ...row.obra,
      clienteNome: row.clienteNome ?? null,
      empreiteiraNome: row.empreiteiraNome ?? null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
  setNoCacheHeaders(r);
  return r;
}
