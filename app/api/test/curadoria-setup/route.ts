/**
 * Endpoint test-only: ajusta `perfilCompleto` e `status` de um cliente ou
 * empreiteira diretamente no banco, permitindo configurar cenários de aprovação
 * nos testes E2E sem precisar de dados semente específicos.
 *
 * Disponível APENAS quando E2E_TEST_AUTH=1.
 *
 *   POST /api/test/curadoria-setup
 *   { entity: "cliente" | "empreiteira", id: string,
 *     perfilCompleto: boolean, status?: "aprovacao" | "ativo" | "inativo" }
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { clientes, empreiteiras } from "@shared/db/schema";

function isEnabled(): boolean {
  return process.env.E2E_TEST_AUTH === "1";
}

const bodySchema = z.object({
  entity: z.enum(["cliente", "empreiteira"]),
  id: z.string().min(1),
  perfilCompleto: z.boolean(),
  status: z.enum(["aprovacao", "ativo", "inativo"]).optional(),
});

export async function POST(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const { entity, id, perfilCompleto, status } = parsed.data;

  if (entity === "cliente") {
    const [updated] = await db
      .update(clientes)
      .set({
        perfilCompleto,
        ...(status !== undefined ? { status } : {}),
      })
      .where(eq(clientes.id, id))
      .returning({ id: clientes.id, perfilCompleto: clientes.perfilCompleto, status: clientes.status });
    if (!updated) return NextResponse.json({ error: "cliente não encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true, ...updated });
  } else {
    const [updated] = await db
      .update(empreiteiras)
      .set({
        perfilCompleto,
        ...(status !== undefined ? { status } : {}),
      })
      .where(eq(empreiteiras.id, id))
      .returning({ id: empreiteiras.id, perfilCompleto: empreiteiras.perfilCompleto, status: empreiteiras.status });
    if (!updated) return NextResponse.json({ error: "empreiteira não encontrada" }, { status: 404 });
    return NextResponse.json({ ok: true, ...updated });
  }
}
