/**
 * Integration tests for aplicarEventoWebhook — reactivation paths.
 *
 * Covers:
 *   1. inadimplente  + payment_succeeded → status='ativa', users.plano restored
 *   2. expirada      + payment_succeeded → status='ativa', users.plano restored
 *      (pays after grace window; this is the path added alongside the downgrade job)
 *   3. idempotency   → processing the same eventId twice returns processed=false
 *
 * Run:
 *   node --import tsx/esm --test features/planos/assinatura-reativacao.test.ts
 * or:
 *   tsx --test features/planos/assinatura-reativacao.test.ts
 */

import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { assinaturaEventos, assinaturas, planos, users } from "@shared/db/schema";
import { aplicarEventoWebhook } from "./assinatura-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return crypto.randomUUID();
}

/** Insert a minimal user row and return its id. */
async function createTestUser(email: string): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({
      name: "Teste Reativacao",
      email,
      role: "contratante",
      plano: "free",
      ativo: true,
      mustChangePassword: false,
      canManageUsers: false,
    })
    .returning({ id: users.id });
  return u.id;
}

/** Insert a subscription row with the given status and return its id. */
async function createTestAssinatura(
  userId: string,
  planoId: string,
  status: "inadimplente" | "expirada",
  gatewaySubscriptionId: string,
): Promise<string> {
  const renovaEm = new Date();
  renovaEm.setDate(renovaEm.getDate() - 30); // 30 days overdue
  const [a] = await db
    .insert(assinaturas)
    .values({
      userId,
      planoId,
      status,
      ciclo: "mensal",
      renovaEm,
      gatewayProvider: "test",
      gatewaySubscriptionId,
    })
    .returning({ id: assinaturas.id });
  return a.id;
}

/** Fetch current assinatura status. */
async function getAssinaturaStatus(id: string): Promise<string | null> {
  const [row] = await db
    .select({ status: assinaturas.status })
    .from(assinaturas)
    .where(eq(assinaturas.id, id))
    .limit(1);
  return row?.status ?? null;
}

/** Fetch current users.plano. */
async function getUserPlano(id: string): Promise<string | null> {
  const [row] = await db
    .select({ plano: users.plano })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return row?.plano ?? null;
}

// ---------------------------------------------------------------------------
// Test state — collected for cleanup
// ---------------------------------------------------------------------------

const createdUserIds: string[] = [];
const createdAssinaturaIds: string[] = [];
const createdEventoGatewayIds: string[] = [];

async function cleanup() {
  // Delete in FK-safe order: eventos → assinaturas → users
  // (assinaturaEventos has ON DELETE CASCADE from assinaturas, but we clean
  //  explicitly to avoid leftover rows if tests partially fail.)
  for (const gId of createdEventoGatewayIds) {
    await db
      .delete(assinaturaEventos)
      .where(eq(assinaturaEventos.gatewayEventId, gId))
      .catch(() => {});
  }
  for (const id of createdAssinaturaIds) {
    await db.delete(assinaturas).where(eq(assinaturas.id, id)).catch(() => {});
  }
  for (const id of createdUserIds) {
    await db.delete(users).where(eq(users.id, id)).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Find a real 'pro' plan to reuse across tests (avoids violating tier+persona
// unique constraint that forbids duplicate plan inserts).
// ---------------------------------------------------------------------------

let testPlanoId: string;
let testPlanoTier: string;

before(async () => {
  const [plano] = await db
    .select({ id: planos.id, tier: planos.tier })
    .from(planos)
    .where(eq(planos.ativo, true))
    .limit(1);

  if (!plano) {
    throw new Error(
      "No active plan found in DB. Run the app once to seed plans before running this test.",
    );
  }
  testPlanoId = plano.id;
  testPlanoTier = plano.tier;
});

after(cleanup);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("aplicarEventoWebhook — reactivation paths", () => {
  it("inadimplente → ativa: payment_succeeded restores subscription and user tier", async () => {
    const gatewaySubId = `test-sub-${uid()}`;
    const eventId = `test-evt-inadimplente-${uid()}`;

    const userId = await createTestUser(`inadimplente-${uid()}@test.xconstrucao`);
    createdUserIds.push(userId);

    const assinaturaId = await createTestAssinatura(
      userId,
      testPlanoId,
      "inadimplente",
      gatewaySubId,
    );
    createdAssinaturaIds.push(assinaturaId);
    createdEventoGatewayIds.push(eventId);

    // Precondition: user starts with free plan
    assert.equal(await getUserPlano(userId), "free");
    assert.equal(await getAssinaturaStatus(assinaturaId), "inadimplente");

    const result = await aplicarEventoWebhook({
      eventId,
      type: "payment_succeeded",
      gatewaySubscriptionId: gatewaySubId,
    });

    assert.equal(result.processed, true, "should mark event as processed");
    assert.equal(
      await getAssinaturaStatus(assinaturaId),
      "ativa",
      "assinatura must be reactivated to ativa",
    );
    assert.equal(
      await getUserPlano(userId),
      testPlanoTier,
      "users.plano must be restored to the plan tier",
    );
  });

  it("expirada → ativa: payment_succeeded after grace window restores subscription and user tier", async () => {
    const gatewaySubId = `test-sub-${uid()}`;
    const eventId = `test-evt-expirada-${uid()}`;

    const userId = await createTestUser(`expirada-${uid()}@test.xconstrucao`);
    createdUserIds.push(userId);

    const assinaturaId = await createTestAssinatura(
      userId,
      testPlanoId,
      "expirada",
      gatewaySubId,
    );
    createdAssinaturaIds.push(assinaturaId);
    createdEventoGatewayIds.push(eventId);

    // Precondition: simulates the state left by downgradeInadimplentes job —
    // status='expirada' and users.plano='free' (cleared by the job).
    assert.equal(await getUserPlano(userId), "free");
    assert.equal(await getAssinaturaStatus(assinaturaId), "expirada");

    const result = await aplicarEventoWebhook({
      eventId,
      type: "payment_succeeded",
      gatewaySubscriptionId: gatewaySubId,
    });

    assert.equal(result.processed, true, "should mark event as processed");
    assert.equal(
      await getAssinaturaStatus(assinaturaId),
      "ativa",
      "assinatura must be reactivated to ativa after paying past grace window",
    );
    assert.equal(
      await getUserPlano(userId),
      testPlanoTier,
      "users.plano must be restored to the plan tier (was cleared by downgrade job)",
    );
  });

  it("idempotency: replaying the same eventId returns processed=false without changing state", async () => {
    const gatewaySubId = `test-sub-${uid()}`;
    const eventId = `test-evt-idem-${uid()}`;

    const userId = await createTestUser(`idem-${uid()}@test.xconstrucao`);
    createdUserIds.push(userId);

    const assinaturaId = await createTestAssinatura(
      userId,
      testPlanoId,
      "inadimplente",
      gatewaySubId,
    );
    createdAssinaturaIds.push(assinaturaId);
    createdEventoGatewayIds.push(eventId);

    // First processing: reactivates
    const first = await aplicarEventoWebhook({
      eventId,
      type: "payment_succeeded",
      gatewaySubscriptionId: gatewaySubId,
    });
    assert.equal(first.processed, true);
    assert.equal(await getAssinaturaStatus(assinaturaId), "ativa");

    // Second processing of the same event: idempotent no-op
    const second = await aplicarEventoWebhook({
      eventId,
      type: "payment_succeeded",
      gatewaySubscriptionId: gatewaySubId,
    });
    assert.equal(
      second.processed,
      false,
      "replaying the same eventId must return processed=false",
    );
    // State must remain ativa (not double-processed)
    assert.equal(await getAssinaturaStatus(assinaturaId), "ativa");
  });
});
