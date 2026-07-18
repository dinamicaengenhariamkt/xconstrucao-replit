/**
 * Tests for grace-period-downgrade-job.
 *
 * Part 1 — Pure unit tests (no DB):
 *   Covers `computeDowngradeCutoff` buffer logic.
 *
 * Part 2 — DB integration tests:
 *   Verifies that phase-2 of `downgradeInadimplentes` correctly resolves rows
 *   that are already in `pendente_reativacao` when the job starts — i.e. rows
 *   left behind by a job that crashed mid-phase-1.
 *
 *   These tests insert rows directly as `pendente_reativacao`, inject a mock
 *   gateway via `_overrideGatewayForTest`, and assert the final DB state.
 *
 * Run:
 *   node --import tsx/esm --test features/planos/grace-period-downgrade-job.test.ts
 * or:
 *   npx tsx --test features/planos/grace-period-downgrade-job.test.ts
 */

import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { eq, and } from "drizzle-orm";
import { db } from "@shared/db/db";
import { assinaturaEventos, assinaturas, planos, users } from "@shared/db/schema";
import { computeDowngradeCutoff, downgradeInadimplentes } from "./grace-period-downgrade-job";
import { _overrideGatewayForTest } from "./gateway";
import type { PaymentGateway, CheckoutInput, CheckoutResult, NormalizedWebhookEvent, GatewayPaymentStatus } from "./gateway";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// ---------------------------------------------------------------------------
// Part 1 — Pure unit tests (no DB)
// ---------------------------------------------------------------------------

describe("computeDowngradeCutoff — buffer protection", () => {
  it("cutoff is graceDays + bufferHours before the reference time", () => {
    const now = new Date("2026-01-10T12:00:00Z").getTime();
    const graceDays = 7;
    const bufferHours = 48;

    const cutoff = computeDowngradeCutoff(graceDays, bufferHours, now);
    const expectedMs = now - graceDays * DAY_MS - bufferHours * HOUR_MS;

    assert.equal(
      cutoff.getTime(),
      expectedMs,
      "cutoff must be exactly graceDays + bufferHours before now",
    );
  });

  it("a subscription that expired exactly at grace boundary is NOT eligible (buffer protects it)", () => {
    const now = new Date("2026-01-10T12:00:00Z").getTime();
    const graceDays = 7;
    const bufferHours = 48;

    const cutoff = computeDowngradeCutoff(graceDays, bufferHours, now);

    // renovaEm = exactly graceDays ago (just reached grace boundary, buffer not consumed)
    const renovaEmGraceBoundary = new Date(now - graceDays * DAY_MS);

    // Should NOT be eligible: renovaEm >= cutoff means the buffer window hasn't passed
    assert.ok(
      renovaEmGraceBoundary.getTime() >= cutoff.getTime(),
      "subscription at grace boundary must NOT be eligible — buffer has not elapsed",
    );
  });

  it("a subscription that is graceDays + bufferHours overdue IS eligible for downgrade", () => {
    const now = new Date("2026-01-10T12:00:00Z").getTime();
    const graceDays = 7;
    const bufferHours = 48;

    const cutoff = computeDowngradeCutoff(graceDays, bufferHours, now);

    // renovaEm = graceDays + bufferHours ago (buffer fully consumed, 1 extra minute)
    const renovaEmPastBuffer = new Date(
      now - graceDays * DAY_MS - bufferHours * HOUR_MS - 60_000,
    );

    // Should be eligible: renovaEm < cutoff
    assert.ok(
      renovaEmPastBuffer.getTime() < cutoff.getTime(),
      "subscription past grace + buffer window must be eligible for downgrade",
    );
  });

  it("a subscription 1 hour inside the buffer window is NOT eligible", () => {
    const now = new Date("2026-01-10T12:00:00Z").getTime();
    const graceDays = 7;
    const bufferHours = 48;

    const cutoff = computeDowngradeCutoff(graceDays, bufferHours, now);

    // renovaEm = graceDays + (bufferHours - 1) hours ago — still inside buffer
    const renovaEmInsideBuffer = new Date(
      now - graceDays * DAY_MS - (bufferHours - 1) * HOUR_MS,
    );

    assert.ok(
      renovaEmInsideBuffer.getTime() >= cutoff.getTime(),
      "subscription 1h inside buffer must NOT be eligible",
    );
  });

  it("zero buffer (bufferHours=0) falls back to grace-only behaviour", () => {
    const now = new Date("2026-01-10T12:00:00Z").getTime();
    const graceDays = 7;
    const bufferHours = 0;

    const cutoff = computeDowngradeCutoff(graceDays, bufferHours, now);
    const expectedMs = now - graceDays * DAY_MS;

    assert.equal(
      cutoff.getTime(),
      expectedMs,
      "zero buffer must produce a cutoff identical to grace-only",
    );
  });

  it("zero grace days with default buffer still protects within the buffer window", () => {
    const now = new Date("2026-01-10T12:00:00Z").getTime();
    const graceDays = 0;
    const bufferHours = 48;

    const cutoff = computeDowngradeCutoff(graceDays, bufferHours, now);

    // A subscription that expired 47h ago is still inside the buffer
    const renovaEm47hAgo = new Date(now - 47 * HOUR_MS);
    assert.ok(
      renovaEm47hAgo.getTime() >= cutoff.getTime(),
      "47h-old subscription must be protected by 48h buffer even with grace=0",
    );

    // A subscription that expired 49h ago is past the buffer
    const renovaEm49hAgo = new Date(now - 49 * HOUR_MS);
    assert.ok(
      renovaEm49hAgo.getTime() < cutoff.getTime(),
      "49h-old subscription must be eligible when buffer=48h and grace=0",
    );
  });

  it("fractional buffer hours are supported (e.g. 0.5h = 30min)", () => {
    const now = new Date("2026-01-10T12:00:00Z").getTime();
    const graceDays = 0;
    const bufferHours = 0.5; // 30 minutes

    const cutoff = computeDowngradeCutoff(graceDays, bufferHours, now);
    const expectedMs = now - 0.5 * HOUR_MS;

    assert.equal(
      cutoff.getTime(),
      expectedMs,
      "fractional buffer hours must be computed correctly",
    );
  });
});

// ---------------------------------------------------------------------------
// Part 2 — DB integration tests: phase-2 recovery after a crashed phase-1
// ---------------------------------------------------------------------------

/**
 * Minimal mock gateway whose `checkPaymentStatus` returns a configurable value.
 * All other methods are no-ops — they are never called by the downgrade job.
 */
function makeMockGateway(paymentStatus: GatewayPaymentStatus): PaymentGateway {
  return {
    provider: "mock-test",
    async createCheckout(_input: CheckoutInput): Promise<CheckoutResult> {
      return { kind: "activated" };
    },
    async cancelSubscription(_id: string | null): Promise<void> {},
    async parseWebhook(
      _rawBody: string,
      _headers: Record<string, string>,
      _clientIp?: string,
    ): Promise<NormalizedWebhookEvent> {
      return { eventId: "mock", type: "ignored", raw: {} };
    },
    async checkPaymentStatus(_id: string | null): Promise<GatewayPaymentStatus> {
      return paymentStatus;
    },
  };
}

function uid(): string {
  return crypto.randomUUID();
}

/** Insert a minimal user row and return its id. */
async function createTestUser(email: string): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({
      name: "Teste Downgrade Job",
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
 * Insert a subscription row already in `pendente_reativacao`, simulating the
 * state left by a phase-1 run that crashed before completing phase-2.
 */
async function createPendenteReativacaoAssinatura(
  userId: string,
  planoId: string,
  gatewaySubscriptionId: string,
): Promise<string> {
  const renovaEm = new Date();
  renovaEm.setDate(renovaEm.getDate() - 30); // well past grace window
  const [a] = await db
    .insert(assinaturas)
    .values({
      userId,
      planoId,
      status: "pendente_reativacao",
      ciclo: "mensal",
      renovaEm,
      gatewayProvider: "mock-test",
      gatewaySubscriptionId,
    })
    .returning({ id: assinaturas.id });
  return a.id;
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

async function countPendenteReativacaoForUser(userId: string): Promise<number> {
  const rows = await db
    .select({ id: assinaturas.id })
    .from(assinaturas)
    .where(
      and(
        eq(assinaturas.userId, userId),
        eq(assinaturas.status, "pendente_reativacao"),
      ),
    );
  return rows.length;
}

// Rows created during integration tests — collected for cleanup.
const createdUserIds: string[] = [];
const createdAssinaturaIds: string[] = [];

async function cleanupIntegration() {
  // Delete in FK-safe order: eventos → assinaturas → users
  for (const id of createdAssinaturaIds) {
    await db.delete(assinaturaEventos).where(eq(assinaturaEventos.assinaturaId, id)).catch(() => {});
    await db.delete(assinaturas).where(eq(assinaturas.id, id)).catch(() => {});
  }
  for (const id of createdUserIds) {
    await db.delete(users).where(eq(users.id, id)).catch(() => {});
  }
  // Always restore gateway singleton after each suite.
  _overrideGatewayForTest(null);
}

let testPlanoId: string;
let testPlanoTier: string;

describe("downgradeInadimplentes — phase-2 recovery after crashed phase-1 (DB integration)", () => {
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

  after(cleanupIntegration);

  it("pre-existing pendente_reativacao row + gateway returns 'paid' → transitions to ativa", async () => {
    const gatewaySubId = `mock-sub-paid-${uid()}`;
    const userId = await createTestUser(`phase2-paid-${uid()}@test.xconstrucao`);
    createdUserIds.push(userId);

    const assinaturaId = await createPendenteReativacaoAssinatura(userId, testPlanoId, gatewaySubId);
    createdAssinaturaIds.push(assinaturaId);

    // Preconditions: user is on free plan, subscription in gateway-limbo state.
    assert.equal(await getAssinaturaStatus(assinaturaId), "pendente_reativacao");
    assert.equal(await getUserPlano(userId), "free");

    // Inject mock gateway that reports payment as successful.
    _overrideGatewayForTest(makeMockGateway("paid"));

    const result = await downgradeInadimplentes(
      0,   // graceDays=0 — no new phase-1 candidates, only phase-2 cleanup
      0,   // bufferHours=0
    );

    assert.equal(result.ok, true, "job must complete successfully");
    assert.ok(result.reactivated >= 1, `reactivated must be ≥1, got ${result.reactivated}`);

    assert.equal(
      await getAssinaturaStatus(assinaturaId),
      "ativa",
      "pre-existing pendente_reativacao + paid → must transition to ativa",
    );
    assert.equal(
      await getUserPlano(userId),
      testPlanoTier,
      "users.plano must be restored when gateway confirms payment",
    );

    // No orphaned pendente_reativacao rows remain for this user.
    assert.equal(
      await countPendenteReativacaoForUser(userId),
      0,
      "no pendente_reativacao rows must remain after successful phase-2",
    );
  });

  it("pre-existing pendente_reativacao row + gateway returns 'unpaid' → transitions to expirada", async () => {
    const gatewaySubId = `mock-sub-unpaid-${uid()}`;
    const userId = await createTestUser(`phase2-unpaid-${uid()}@test.xconstrucao`);
    createdUserIds.push(userId);

    const assinaturaId = await createPendenteReativacaoAssinatura(userId, testPlanoId, gatewaySubId);
    createdAssinaturaIds.push(assinaturaId);

    assert.equal(await getAssinaturaStatus(assinaturaId), "pendente_reativacao");
    assert.equal(await getUserPlano(userId), "free");

    _overrideGatewayForTest(makeMockGateway("unpaid"));

    const result = await downgradeInadimplentes(0, 0);

    assert.equal(result.ok, true, "job must complete successfully");
    assert.ok(result.downgraded >= 1, `downgraded must be ≥1, got ${result.downgraded}`);

    assert.equal(
      await getAssinaturaStatus(assinaturaId),
      "expirada",
      "pre-existing pendente_reativacao + unpaid → must transition to expirada",
    );
    assert.equal(
      await getUserPlano(userId),
      "free",
      "users.plano must remain free when gateway confirms non-payment",
    );

    assert.equal(
      await countPendenteReativacaoForUser(userId),
      0,
      "no pendente_reativacao rows must remain after phase-2 downgrade",
    );
  });

  it("pre-existing pendente_reativacao row + gateway returns 'unknown' → transitions to expirada (conservative)", async () => {
    const gatewaySubId = `mock-sub-unknown-${uid()}`;
    const userId = await createTestUser(`phase2-unknown-${uid()}@test.xconstrucao`);
    createdUserIds.push(userId);

    const assinaturaId = await createPendenteReativacaoAssinatura(userId, testPlanoId, gatewaySubId);
    createdAssinaturaIds.push(assinaturaId);

    assert.equal(await getAssinaturaStatus(assinaturaId), "pendente_reativacao");

    _overrideGatewayForTest(makeMockGateway("unknown"));

    const result = await downgradeInadimplentes(0, 0);

    assert.equal(result.ok, true);
    assert.ok(result.downgraded >= 1, `downgraded must be ≥1 for unknown status, got ${result.downgraded}`);

    assert.equal(
      await getAssinaturaStatus(assinaturaId),
      "expirada",
      "unknown gateway status must conservatively expire the subscription",
    );

    assert.equal(
      await countPendenteReativacaoForUser(userId),
      0,
      "no pendente_reativacao rows must remain after conservative phase-2 expiry",
    );
  });

  it("full job run leaves no orphaned pendente_reativacao rows for any processed user", async () => {
    const users_data: Array<{ userId: string; assinaturaId: string; gatewayStatus: GatewayPaymentStatus }> = [];

    // Seed three users with different expected gateway outcomes.
    for (const gatewayStatus of ["paid", "unpaid", "unknown"] as GatewayPaymentStatus[]) {
      const gatewaySubId = `mock-sub-orphan-${gatewayStatus}-${uid()}`;
      const userId = await createTestUser(`phase2-orphan-${gatewayStatus}-${uid()}@test.xconstrucao`);
      createdUserIds.push(userId);

      const assinaturaId = await createPendenteReativacaoAssinatura(userId, testPlanoId, gatewaySubId);
      createdAssinaturaIds.push(assinaturaId);

      users_data.push({ userId, assinaturaId, gatewayStatus });
    }

    // Use a gateway that rotates through responses based on the gatewaySubId suffix.
    // Since the job processes rows one-by-one, we track call order to match sub IDs.
    const callMap = new Map<string, GatewayPaymentStatus>(
      users_data.map((d) => [d.assinaturaId, d.gatewayStatus]),
    );

    // We need per-subscription routing. Build a gateway that reads from callMap
    // keyed by the gatewaySubscriptionId stored in the DB row (which we set to
    // mock-sub-orphan-{status}-{uuid}, so we can match by status prefix).
    const routingGateway: PaymentGateway = {
      provider: "mock-routing",
      async createCheckout(_i: CheckoutInput): Promise<CheckoutResult> {
        return { kind: "activated" };
      },
      async cancelSubscription(_id: string | null): Promise<void> {},
      async parseWebhook(
        _rawBody: string,
        _headers: Record<string, string>,
      ): Promise<NormalizedWebhookEvent> {
        return { eventId: "mock", type: "ignored", raw: {} };
      },
      async checkPaymentStatus(gatewaySubId: string | null): Promise<GatewayPaymentStatus> {
        if (!gatewaySubId) return "unknown";
        if (gatewaySubId.includes("-paid-")) return "paid";
        if (gatewaySubId.includes("-unpaid-")) return "unpaid";
        return "unknown";
      },
    };

    _overrideGatewayForTest(routingGateway);

    const result = await downgradeInadimplentes(0, 0);
    assert.equal(result.ok, true, "job must complete without errors");

    // Verify: no pendente_reativacao rows remain for any of the seeded users.
    for (const { userId, assinaturaId } of users_data) {
      const remaining = await countPendenteReativacaoForUser(userId);
      assert.equal(
        remaining,
        0,
        `orphaned pendente_reativacao row must not remain for userId=${userId} assinaturaId=${assinaturaId}`,
      );

      // Each row must have transitioned to a terminal state.
      const finalStatus = await getAssinaturaStatus(assinaturaId);
      assert.ok(
        finalStatus === "ativa" || finalStatus === "expirada",
        `assinatura ${assinaturaId} must be ativa or expirada after job, got ${finalStatus}`,
      );
    }
  });
});
