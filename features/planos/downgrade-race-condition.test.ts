/**
 * Integration tests: downgrade job race-condition guard.
 *
 * The `downgradeInadimplentes` job uses a two-step pattern:
 *   1. SELECT candidates WHERE status='inadimplente' AND renovaEm < cutoff
 *   2. Per-row: conditional UPDATE … WHERE id=? AND status='inadimplente' AND renovaEm < cutoff
 *
 * The second step is the race-condition guard: if a `payment_succeeded` webhook
 * arrives between the SELECT and the UPDATE (reactivating the subscription to
 * `ativa`), the UPDATE must return 0 rows and leave the subscription intact.
 *
 * IMPORTANT: the hook deliberately changes only `status` to 'ativa' without
 * touching `renovaEm`. This is critical for guard isolation:
 *
 *   - `renovaEm` stays in the past (< cutoff), so the per-row UPDATE's
 *     `renovaEm < cutoff` predicate still matches the row.
 *   - Only `AND status='inadimplente'` can block the UPDATE.
 *   - If that guard is removed from production code, the UPDATE succeeds,
 *     `downgraded` becomes 1, and the test fails — catching the regression.
 *
 * Run:
 *   node --import tsx/esm --test features/planos/downgrade-race-condition.test.ts
 * or:
 *   npx tsx --test features/planos/downgrade-race-condition.test.ts
 */

import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { assinaturaEventos, assinaturas, planos, users } from "@shared/db/schema";
import { downgradeInadimplentes } from "./grace-period-downgrade-job";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return crypto.randomUUID();
}

async function createTestUser(email: string): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({
      name: "Teste Race Condition",
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

/**
 * Creates an inadimplente subscription with renovaEm set `renovaEmDaysAgo`
 * days in the past, making it eligible for the downgrade job's SELECT.
 */
async function createInadimplente(
  userId: string,
  planoId: string,
  gatewaySubscriptionId: string,
  renovaEmDaysAgo: number,
): Promise<string> {
  const renovaEm = new Date();
  renovaEm.setDate(renovaEm.getDate() - renovaEmDaysAgo);
  const [plano] = await db.select({ persona: planos.persona }).from(planos).where(eq(planos.id, planoId)).limit(1);
  if (!plano || plano.persona === "ambos") throw new Error("plano de teste sem persona");
  const [a] = await db
    .insert(assinaturas)
    .values({
      userId,
      planoId,
      persona: plano.persona,
      status: "inadimplente",
      ciclo: "mensal",
      renovaEm,
      gatewayProvider: "test",
      gatewaySubscriptionId,
    })
    .returning({ id: assinaturas.id });
  return a.id;
}

/**
 * Simulates a concurrent reactivation webhook by updating only `status` to
 * 'ativa' WITHOUT changing `renovaEm`. This is intentional:
 *
 * - `renovaEm` remains in the past (< cutoff), so the job's per-row UPDATE
 *   WHERE clause matches on `renovaEm < cutoff`.
 * - Only `AND status='inadimplente'` can prevent the UPDATE from executing.
 * - If that predicate is ever removed, the UPDATE succeeds, `downgraded`
 *   becomes 1, and the test catches the regression.
 *
 * (A real `payment_succeeded` webhook would also bump renovaEm to the future,
 * which would make the `renovaEm` predicate block the UPDATE too — hiding a
 * potential regression of the `status` guard.)
 */
async function reactivateStatusOnly(assinaturaId: string): Promise<void> {
  await db
    .update(assinaturas)
    .set({ status: "ativa" })
    .where(eq(assinaturas.id, assinaturaId));
}

async function getAssinaturaStatus(id: string): Promise<string | null> {
  const [row] = await db
    .select({ status: assinaturas.status })
    .from(assinaturas)
    .where(eq(assinaturas.id, id))
    .limit(1);
  return row?.status ?? null;
}

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

async function cleanup() {
  for (const id of createdAssinaturaIds) {
    await db
      .delete(assinaturaEventos)
      .where(eq(assinaturaEventos.assinaturaId, id))
      .catch(() => {});
    await db.delete(assinaturas).where(eq(assinaturas.id, id)).catch(() => {});
  }
  for (const id of createdUserIds) {
    await db.delete(users).where(eq(users.id, id)).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Find an active plan to reuse across tests
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

describe("downgradeInadimplentes — race-condition guard", () => {
  /**
   * Core race-condition guard test.
   *
   * Verifies that the per-row `AND status='inadimplente'` guard in
   * `downgradeInadimplentes` prevents a subscription from being wrongly
   * marked `expirada` when a concurrent reactivation arrives between the
   * job's SELECT phase and its per-row UPDATE.
   *
   * The `onCandidatesSelected` test seam (added to the job for this purpose)
   * fires after the SELECT but before any per-row UPDATE, providing the exact
   * window where the race occurs in production.
   *
   * Guard isolation: the hook updates only `status` to 'ativa', leaving
   * `renovaEm` unchanged (still in the past). This ensures the `renovaEm <
   * cutoff` predicate still matches, so `AND status='inadimplente'` is the
   * sole predicate protecting the row. Removing it from production code makes
   * `downgraded` become 1 and the test fail.
   */
  it("skips downgrade when subscription is reactivated between job SELECT and per-row UPDATE", async () => {
    const userId = await createTestUser(`race-guard-${uid()}@test.xconstrucao`);
    createdUserIds.push(userId);

    // Set users.plano to the paid tier so we can verify it is not cleared.
    await db
      .update(users)
      .set({ plano: testPlanoTier as "free" })
      .where(eq(users.id, userId));

    // 30-day-overdue inadimplente — the job's SELECT will pick this up as a
    // candidate. renovaEm is intentionally left in the past throughout the
    // test so that `renovaEm < cutoff` always matches; only `status` changes.
    const assinaturaId = await createInadimplente(
      userId,
      testPlanoId,
      `test-sub-${uid()}`,
      30,
    );
    createdAssinaturaIds.push(assinaturaId);

    // Precondition: row is inadimplente and overdue.
    assert.equal(await getAssinaturaStatus(assinaturaId), "inadimplente");

    let hookFired = false;

    // Run the job with the test seam. The hook fires after SELECT (the job has
    // already captured this row as a candidate) but before the per-row UPDATE.
    const result = await downgradeInadimplentes(
      0, // graceDays=0: any overdue renovaEm qualifies
      0, // bufferHours=0: no extra window, maximally aggressive
      {
        onCandidatesSelected: async (candidates) => {
          // Confirm the row is in the SELECT results — the job would downgrade
          // it without the guard.
          const found = candidates.some((c) => c.id === assinaturaId);
          assert.ok(
            found,
            "subscription must appear in candidates — confirming the SELECT found it",
          );
          hookFired = true;

          // Simulate the concurrent reactivation. Only `status` is updated;
          // `renovaEm` deliberately stays in the past so the `renovaEm <
          // cutoff` predicate in the per-row UPDATE still matches — the ONLY
          // thing blocking the UPDATE is `AND status='inadimplente'`.
          await reactivateStatusOnly(assinaturaId);

          assert.equal(
            await getAssinaturaStatus(assinaturaId),
            "ativa",
            "status must be ativa immediately after the hook fires",
          );
        },
      },
    );

    // Guard: the hook must have run (if not, the test is vacuous).
    assert.ok(hookFired, "onCandidatesSelected hook must have fired");

    // Core assertion: the job's status guard must have blocked the downgrade.
    assert.equal(result.ok, true, "job must complete without error");
    assert.equal(
      result.downgraded,
      0,
      "downgraded must be 0 — AND status='inadimplente' guard must skip the reactivated row",
    );

    // Subscription must remain ativa (not wrongly 'expirada').
    assert.equal(
      await getAssinaturaStatus(assinaturaId),
      "ativa",
      "subscription must remain ativa — the guard prevented the erroneous downgrade",
    );

    // users.plano must NOT have been cleared by the job.
    assert.equal(
      await getUserPlano(userId),
      testPlanoTier,
      "users.plano must remain at the paid tier — job must not have cleared it",
    );
  });
});
