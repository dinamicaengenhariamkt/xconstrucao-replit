/**
 * Endpoint test-only: apaga obras de teste (nome contém "E2E") para um usuário.
 * Usado no beforeEach dos testes Playwright para garantir estado limpo.
 *
 * Disponível APENAS quando E2E_TEST_AUTH=1.
 *
 *   DELETE /api/test/cleanup-obras?email=...
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@shared/db/db";
import { users, clientes, obras } from "@shared/db/schema";
import { eq, and, like } from "drizzle-orm";

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

  const deleted = await db
    .delete(obras)
    .where(and(eq(obras.clienteId, cli.id), like(obras.nome, "%E2E%")))
    .returning({ id: obras.id });

  return NextResponse.json({ deleted: deleted.length });
}
