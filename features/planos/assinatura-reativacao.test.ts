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
  status: "inadimplente" | "expirada" | "pendente_reativacao",
  gatewaySubscriptionId: string,
  options: { renovaEm?: Date; ciclo?: "mensal" | "anual" } = {},
): Promise<string> {
  const defaultRenovaEm = new Date();
  defaultRenovaEm.setDate(defaultRenovaEm.getDate() - 30); // 30 days overdue
  const renovaEm = options.renovaEm ?? defaultRenovaEm;
  const ciclo = options.ciclo ?? "mensal";
  const [a] = await db
    .insert(assinaturas)
    .values({
      userId,
      planoId,
      status,
      ciclo,
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

/** Fetch current assinatura renovaEm. */
async function getAssinaturaRenovaEm(id: string): Promise<Date | null> {
  const [row] = await db
    .select({ renovaEm: assinaturas.renovaEm })
    .from(assinaturas)
    .where(eq(assinaturas.id, id))
    .limit(1);
  return row?.renovaEm ?? null;
}

/**
 * Returns true when two dates are within `toleranceMs` of each other.
 * Used to avoid brittle exact-millisecond comparisons in date-arithmetic tests.
 */
function datesAreClose(a: Date, b: Date, toleranceMs = 2 * 60 * 1000): boolean {
  return Math.abs(a.getTime() - b.getTime()) <= toleranceMs;
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

  // ---------------------------------------------------------------------------
  // Billing anchor tests
  // ---------------------------------------------------------------------------

  it("billing anchor preserved: inadimplente 20 days overdue → renovaEm bumped from original date (not today)", async () => {
    const gatewaySubId = `test-sub-${uid()}`;
    const eventId = `test-evt-anchor-20d-${uid()}`;

    const userId = await createTestUser(`anchor-20d-${uid()}@test.xconstrucao`);
    createdUserIds.push(userId);

    // renovaEm = 20 days ago — within the 30-day anchor preservation window
    const originalRenovaEm = new Date();
    originalRenovaEm.setDate(originalRenovaEm.getDate() - 20);

    const assinaturaId = await createTestAssinatura(userId, testPlanoId, "inadimplente", gatewaySubId, {
      renovaEm: new Date(originalRenovaEm),
      ciclo: "mensal",
    });
    createdAssinaturaIds.push(assinaturaId);
    createdEventoGatewayIds.push(eventId);

    await aplicarEventoWebhook({
      eventId,
      type: "payment_succeeded",
      gatewaySubscriptionId: gatewaySubId,
    });

    const newRenovaEm = await getAssinaturaRenovaEm(assinaturaId);
    assert.ok(newRenovaEm, "renovaEm must be set after reactivation");

    // Expected: originalRenovaEm + 1 month (billing anchor preserved)
    const expected = new Date(originalRenovaEm);
    expected.setMonth(expected.getMonth() + 1);

    assert.ok(
      datesAreClose(newRenovaEm, expected),
      `renovaEm should be ~${expected.toISOString()} (original + 1 month), got ${newRenovaEm.toISOString()}`,
    );

    // Confirm it is NOT anchored to today
    const todayPlusMonth = new Date();
    todayPlusMonth.setMonth(todayPlusMonth.getMonth() + 1);
    // The gap between anchor-based and today-based results should be ~20 days;
    // if they were equal (both "today"), the test would be meaningless.
    const diffMs = Math.abs(newRenovaEm.getTime() - todayPlusMonth.getTime());
    assert.ok(
      diffMs > 18 * 24 * 60 * 60 * 1000, // more than 18 days apart
      `renovaEm must be anchored to original date (${originalRenovaEm.toISOString()}), not today`,
    );
  });

  it("billing anchor fallback: inadimplente 60 days overdue → renovaEm bumped from today (not original date)", async () => {
    const gatewaySubId = `test-sub-${uid()}`;
    const eventId = `test-evt-anchor-60d-${uid()}`;

    const userId = await createTestUser(`anchor-60d-${uid()}@test.xconstrucao`);
    createdUserIds.push(userId);

    // renovaEm = 60 days ago — outside the 30-day anchor preservation window
    const originalRenovaEm = new Date();
    originalRenovaEm.setDate(originalRenovaEm.getDate() - 60);

    const assinaturaId = await createTestAssinatura(userId, testPlanoId, "inadimplente", gatewaySubId, {
      renovaEm: new Date(originalRenovaEm),
      ciclo: "mensal",
    });
    createdAssinaturaIds.push(assinaturaId);
    createdEventoGatewayIds.push(eventId);

    const beforeCall = new Date();

    await aplicarEventoWebhook({
      eventId,
      type: "payment_succeeded",
      gatewaySubscriptionId: gatewaySubId,
    });

    const newRenovaEm = await getAssinaturaRenovaEm(assinaturaId);
    assert.ok(newRenovaEm, "renovaEm must be set after reactivation");

    // Expected: today + 1 month (fallback because original is >30 days ago)
    const expectedLow = new Date(beforeCall);
    expectedLow.setMonth(expectedLow.getMonth() + 1);
    const expectedHigh = new Date();
    expectedHigh.setMonth(expectedHigh.getMonth() + 1);
    // Allow 2 extra minutes tolerance
    expectedHigh.setMinutes(expectedHigh.getMinutes() + 2);

    assert.ok(
      newRenovaEm.getTime() >= expectedLow.getTime() - 2 * 60 * 1000 &&
        newRenovaEm.getTime() <= expectedHigh.getTime(),
      `renovaEm should be ~today + 1 month, got ${newRenovaEm.toISOString()}`,
    );

    // Confirm it is NOT the original anchor (which was 60 days ago + 1 month = 30 days ago)
    const anchorBasedExpected = new Date(originalRenovaEm);
    anchorBasedExpected.setMonth(anchorBasedExpected.getMonth() + 1);
    assert.ok(
      !datesAreClose(newRenovaEm, anchorBasedExpected, 24 * 60 * 60 * 1000),
      `renovaEm must NOT be anchored to old original date (${anchorBasedExpected.toISOString()}), got ${newRenovaEm.toISOString()}`,
    );
  });

  it("billing anchor annual: inadimplente 20 days overdue, ciclo=anual → renovaEm bumped 1 year from original date", async () => {
    const gatewaySubId = `test-sub-${uid()}`;
    const eventId = `test-evt-anchor-anual-${uid()}`;

    const userId = await createTestUser(`anchor-anual-${uid()}@test.xconstrucao`);
    createdUserIds.push(userId);

    // renovaEm = 20 days ago — within the 30-day anchor preservation window
    const originalRenovaEm = new Date();
    originalRenovaEm.setDate(originalRenovaEm.getDate() - 20);

    const assinaturaId = await createTestAssinatura(userId, testPlanoId, "inadimplente", gatewaySubId, {
      renovaEm: new Date(originalRenovaEm),
      ciclo: "anual",
    });
    createdAssinaturaIds.push(assinaturaId);
    createdEventoGatewayIds.push(eventId);

    await aplicarEventoWebhook({
      eventId,
      type: "payment_succeeded",
      gatewaySubscriptionId: gatewaySubId,
    });

    const newRenovaEm = await getAssinaturaRenovaEm(assinaturaId);
    assert.ok(newRenovaEm, "renovaEm must be set after reactivation");

    // Expected: originalRenovaEm + 1 year (billing anchor preserved, annual cycle)
    const expected = new Date(originalRenovaEm);
    expected.setFullYear(expected.getFullYear() + 1);

    assert.ok(
      datesAreClose(newRenovaEm, expected),
      `annual renovaEm should be ~${expected.toISOString()} (original + 1 year), got ${newRenovaEm.toISOString()}`,
    );

    // Confirm it is NOT today + 1 year
    const todayPlusYear = new Date();
    todayPlusYear.setFullYear(todayPlusYear.getFullYear() + 1);
    const diffMs = Math.abs(newRenovaEm.getTime() - todayPlusYear.getTime());
    assert.ok(
      diffMs > 18 * 24 * 60 * 60 * 1000,
      `annual renovaEm must be anchored to original date, not today`,
    );
  });

  it("pendente_reativacao → ativa: payment_succeeded webhook during gateway-check limbo reactivates subscription", async () => {
    const gatewaySubId = `test-sub-${uid()}`;
    const eventId = `test-evt-pendente-${uid()}`;

    const userId = await createTestUser(`pendente-${uid()}@test.xconstrucao`);
    createdUserIds.push(userId);

    const assinaturaId = await createTestAssinatura(
      userId,
      testPlanoId,
      "pendente_reativacao",
      gatewaySubId,
    );
    createdAssinaturaIds.push(assinaturaId);
    createdEventoGatewayIds.push(eventId);

    // Precondition: simulates the state set by phase-1 of the downgrade job —
    // status='pendente_reativacao' while the gateway is being queried.
    assert.equal(await getUserPlano(userId), "free");
    assert.equal(await getAssinaturaStatus(assinaturaId), "pendente_reativacao");

    const result = await aplicarEventoWebhook({
      eventId,
      type: "payment_succeeded",
      gatewaySubscriptionId: gatewaySubId,
    });

    assert.equal(result.processed, true, "should mark event as processed");
    assert.equal(
      await getAssinaturaStatus(assinaturaId),
      "ativa",
      "assinatura must be reactivated from pendente_reativacao to ativa via webhook",
    );
    assert.equal(
      await getUserPlano(userId),
      testPlanoTier,
      "users.plano must be restored when webhook arrives during gateway-check limbo",
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
