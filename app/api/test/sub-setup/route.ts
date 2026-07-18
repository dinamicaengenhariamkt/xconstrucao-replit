/**
 * Endpoint test-only: cria/reseta uma assinatura em estado "inadimplente" com
 * ciclo e gatewaySubscriptionId controlados pelo teste, e permite ler o estado
 * atual para verificação pós-webhook.
 *
 * Disponível APENAS quando E2E_TEST_AUTH=1.
 *
 *   POST /api/test/sub-setup  { email, ciclo, gatewaySubscriptionId }
 *     → JSON { id, status, ciclo, renovaEm }
 *
 *   GET  /api/test/sub-setup?gatewaySubscriptionId=...
 *     → JSON { id, status, ciclo, renovaEm } | { error }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@shared/db/db";
import { assinaturas, planos, users } from "@shared/db/schema";
import { and, eq } from "drizzle-orm";

function isEnabled(): boolean {
  return process.env.E2E_TEST_AUTH === "1";
}

export async function POST(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    ciclo?: string;
    gatewaySubscriptionId?: string;
  };

  const { email, ciclo = "mensal", gatewaySubscriptionId } = body;

  if (!email || !gatewaySubscriptionId) {
    return NextResponse.json({ error: "email e gatewaySubscriptionId são obrigatórios" }, { status: 400 });
  }

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    return NextResponse.json({ error: "user não encontrado" }, { status: 404 });
  }

  const [plano] = await db.select({ id: planos.id }).from(planos).where(eq(planos.ativo, true)).limit(1);
  if (!plano) {
    return NextResponse.json({ error: "nenhum plano ativo encontrado" }, { status: 500 });
  }

  // Cancela qualquer assinatura ativa/inadimplente existente do usuário (limpeza).
  await db
    .update(assinaturas)
    .set({ status: "cancelada" })
    .where(and(eq(assinaturas.userId, user.id), eq(assinaturas.status, "ativa")));
  await db
    .update(assinaturas)
    .set({ status: "cancelada" })
    .where(and(eq(assinaturas.userId, user.id), eq(assinaturas.status, "inadimplente")));

  const renovaVencida = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [nova] = await db
    .insert(assinaturas)
    .values({
      userId: user.id,
      planoId: plano.id,
      status: "inadimplente",
      ciclo: ciclo as "mensal" | "anual",
      renovaEm: renovaVencida,
      gatewayProvider: "manual",
      gatewaySubscriptionId,
    })
    .returning({ id: assinaturas.id, status: assinaturas.status, ciclo: assinaturas.ciclo, renovaEm: assinaturas.renovaEm });

  return NextResponse.json(nova);
}

export async function GET(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const gSubId = new URL(request.url).searchParams.get("gatewaySubscriptionId");
  if (!gSubId) {
    return NextResponse.json({ error: "gatewaySubscriptionId obrigatório" }, { status: 400 });
  }

  const [row] = await db
    .select({ id: assinaturas.id, status: assinaturas.status, ciclo: assinaturas.ciclo, renovaEm: assinaturas.renovaEm })
    .from(assinaturas)
    .where(eq(assinaturas.gatewaySubscriptionId, gSubId))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "assinatura não encontrada" }, { status: 404 });
  }

  return NextResponse.json(row);
}
