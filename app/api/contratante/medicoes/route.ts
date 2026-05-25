import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getClienteIdForUser, listMedicoesForContratante } from "./_shared";
import { db } from "@shared/db/db";
import { medicoes, obras } from "@shared/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (isAdminLike(guard.user.role)) {
    // Admin vê tudo (usado em telas internas; mantém shape).
    const rows = await db
      .select({ id: medicoes.id, obraId: medicoes.obraId, status: medicoes.status })
      .from(medicoes)
      .innerJoin(obras, eq(obras.id, medicoes.obraId))
      .orderBy(desc(medicoes.createdAt));
    // Para o admin, devolvemos lista vazia aqui — telas admin usam /api/admin/obras/[id]/medicoes
    // (mantemos endpoint genérico, mas evitamos vazar dados de todos os clientes nessa rota).
    const r = NextResponse.json([]);
    setNoCacheHeaders(r);
    void rows;
    return r;
  }

  if (guard.user.role !== "contratante") {
    const r = NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const clienteId = await getClienteIdForUser(guard.user.id);
  if (!clienteId) {
    const r = NextResponse.json([]);
    setNoCacheHeaders(r);
    return r;
  }

  const result = await listMedicoesForContratante(clienteId);
  // Ordem: mais recentes primeiro (createdAt já vem ordenado pelo banco quando a UI quer).
  result.sort((a, b) => (a.dataEnvio < b.dataEnvio ? 1 : -1));
  const r = NextResponse.json(result);
  setNoCacheHeaders(r);
  return r;
}
