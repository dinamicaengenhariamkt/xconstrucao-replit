/**
 * Endpoint test-only: apaga obras de teste (nome contém "E2E") para um usuário.
 * Usado no beforeEach dos testes Playwright para garantir estado limpo.
 *
 * Disponível APENAS quando E2E_TEST_AUTH=1.
 *
 *   DELETE /api/test/cleanup-obras?email=...
 *
 * As candidaturas das obras alvo são apagadas ANTES das obras, por dois motivos:
 *  1. `candidaturas.obra_id` é NO ACTION (não cascade) — sem isso o DELETE das
 *     obras falha com violação de FK assim que alguém se candidatou.
 *  2. O limite de propostas/mês do plano (J11) conta candidaturas criadas no mês,
 *     independente do estado da obra. Concluir a obra não devolve a cota — só
 *     apagar a candidatura devolve. Sem esta limpeza a suíte se auto-envenena:
 *     após ~5 propostas do empreiteiro seed, os specs seguintes recebem 402 e
 *     passam a skipar em silêncio (falso verde).
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@shared/db/db";
import { users, clientes, obras, candidaturas } from "@shared/db/schema";
import { eq, and, like, inArray } from "drizzle-orm";

function isEnabled(): boolean {
  return process.env.E2E_TEST_AUTH === "1";
}

export async function DELETE(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.toLowerCase().trim();

  if (!email) {
    return NextResponse.json({ error: "email é obrigatório" }, { status: 400 });
  }

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (!user) {
    return NextResponse.json({ error: "user não encontrado" }, { status: 404 });
  }

  const [cli] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, user.id));
  if (!cli) {
    return NextResponse.json({ deleted: 0 });
  }

  const alvos = await db
    .select({ id: obras.id })
    .from(obras)
    .where(and(eq(obras.clienteId, cli.id), like(obras.nome, "%E2E%")));

  if (alvos.length === 0) {
    return NextResponse.json({ deleted: 0, candidaturasDeleted: 0 });
  }
  const obraIds = alvos.map((o) => o.id);

  const candidaturasDeleted = await db
    .delete(candidaturas)
    .where(inArray(candidaturas.obraId, obraIds))
    .returning({ id: candidaturas.id });

  const deleted = await db
    .delete(obras)
    .where(inArray(obras.id, obraIds))
    .returning({ id: obras.id });

  return NextResponse.json({
    deleted: deleted.length,
    candidaturasDeleted: candidaturasDeleted.length,
  });
}
