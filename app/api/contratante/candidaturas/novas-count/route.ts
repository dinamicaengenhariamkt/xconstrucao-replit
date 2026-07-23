import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { candidaturas, clientes, obras } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";

/**
 * GET /api/contratante/candidaturas/novas-count  (J57)
 *
 * Total agregado de propostas PENDENTES nas obras do contratante logado. Fonte
 * de verdade do badge "propostas novas" no menu Minhas Obras da sidebar. Espelha
 * `/api/contratante/chat/unread-count`: guard padrão, resposta `{ total }`.
 *
 * Resolve o cliente por userId e conta candidaturas pendentes cujas obras
 * pertencem a esse cliente. Contratante sem perfil de cliente devolve 0.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const [cli] = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(eq(clientes.userId, guard.user.id));

  if (!cli) {
    const r = NextResponse.json({ total: 0 });
    setNoCacheHeaders(r);
    return r;
  }

  const [row] = await db
    .select({ total: sql<number>`COUNT(*)::int` })
    .from(candidaturas)
    .innerJoin(obras, eq(obras.id, candidaturas.obraId))
    .where(and(eq(obras.clienteId, cli.id), eq(candidaturas.status, "pendente")));

  const r = NextResponse.json({ total: row?.total ?? 0 });
  setNoCacheHeaders(r);
  return r;
}
