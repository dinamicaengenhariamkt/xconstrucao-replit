/**
 * Integration test — stale customer ID persistence after fallback.
 *
 * Verifies that when `iniciarCheckout` receives a `kind:"redirect"` result from
 * the gateway carrying a `gatewayCustomerId` that differs from the one stored in
 * `users.asaas_customer_id`, the service writes the fresh ID back to the database.
 *
 * Context: the gateway resolves a fresh customer ID when the cached one is stale
 * (e.g. from the wrong Asaas environment). The service is responsible for
 * persisting it so subsequent checkouts don't hit the stale-ID 404 path again.
 * The update is AWAITED — a DB failure is surfaced as INTERNAL_ERROR rather than
 * silently dropped, preventing the stale ID from surviving indefinitely.
 *
 * Run:
 *   node --import tsx/esm --test features/planos/stale-customer-id-persistence.test.ts
 */

import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, planos, users } from "@shared/db/schema";
import { iniciarCheckout } from "./assinatura-service";
import { _overrideGatewayForTest } from "./gateway";
import type { PaymentGateway, CheckoutInput, CheckoutResult, NormalizedWebhookEvent, GatewayPaymentStatus } from "./gateway";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STALE_CUSTOMER_ID = "cus_stale_integration_test";
const FRESH_CUSTOMER_ID = "cus_fresh_integration_test";

// ---------------------------------------------------------------------------
// Stub gateway
//
// Behaves like a real (non-manual) external gateway: provider is NOT "manual"
// so the cpfCnpj guard is active. Always returns kind:"redirect" with the
// FRESH_CUSTOMER_ID — exactly what the ASAAS adapter would return after healing
// a stale ID via fallback to findOrCreateCustomer.
// ---------------------------------------------------------------------------

function makeStubGateway(freshCustomerId: string): PaymentGateway {
  return {
    provider: "stub",

    async createCheckout(_input: CheckoutInput): Promise<CheckoutResult> {
      return {
        kind: "redirect",
        url: "https://checkout.stub.example.com/pay/test-session",
        gatewayCustomerId: freshCustomerId,
        gatewaySubscriptionId: undefined,
      };
    },

    async cancelSubscription(_id: string | null): Promise<void> {
      // no-op
    },

    async parseWebhook(
      _rawBody: string,
      _headers: Record<string, string>,
      _clientIp?: string,
    ): Promise<NormalizedWebhookEvent> {
      return { eventId: "stub", type: "ignored", raw: {} };
    },

    async checkPaymentStatus(_id: string | null): Promise<GatewayPaymentStatus> {
      return "unknown";
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return crypto.randomUUID();
}

/** Insert a minimal user row with a stale asaasCustomerId and return its id. */
async function createTestUser(email: string, asaasCustomerId: string): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({
      name: "Test Stale Customer",
      email,
      role: "contratante",
      plano: "free",
      ativo: true,
      mustChangePassword: false,
      canManageUsers: false,
      asaasCustomerId,
    })
    .returning({ id: users.id });
  return u.id;
}

/** Insert a minimal clientes row with cpfCnpj (required by non-manual gateways). */
async function createTestCliente(userId: string): Promise<void> {
  await db.insert(clientes).values({
    userId,
    nome: "Test Stale Customer",
    email: `stale-${uid()}@test.xconstrucao`,
    cnpjCpf: "123.456.789-09",
  });
}

/** Read asaasCustomerId from the users table. */
async function getAsaasCustomerId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ asaasCustomerId: users.asaasCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.asaasCustomerId ?? null;
}

/**
 * Poll the DB until `users.asaas_customer_id` equals `expectedId` or
 * `timeoutMs` elapses. Returns the final value.
 *
 * The DB update in iniciarCheckout is AWAITED, so the value is guaranteed to be
 * committed (or an error surfaced) before iniciarCheckout returns. This helper
 * is kept as a defensive fallback for any future revert to async, but a direct
 * read immediately after iniciarCheckout should already return the expected value.
 */
async function pollUntilCustomerId(
  userId: string,
  expectedId: string,
  timeoutMs = 3000,
  intervalMs = 50,
): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const current = await getAsaasCustomerId(userId);
    if (current === expectedId) return current;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return getAsaasCustomerId(userId);
}

// ---------------------------------------------------------------------------
// Test state — collected for teardown
// ---------------------------------------------------------------------------

const createdUserIds: string[] = [];

async function cleanup(): Promise<void> {
  for (const id of createdUserIds) {
    // clientes row cascades via FK, but clientes.userId is nullable/set-null —
    // delete explicitly to avoid constraint issues.
    await db.delete(clientes).where(eq(clientes.userId, id)).catch(() => {});
    await db.delete(users).where(eq(users.id, id)).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Resolve a real active plan from the DB (avoids inserting a duplicate plan
// that violates the tier+persona unique constraint).
// ---------------------------------------------------------------------------

let testPlanoId: string;

before(async () => {
  const [plano] = await db
    .select({ id: planos.id })
    .from(planos)
    .where(eq(planos.ativo, true))
    .limit(1);

  if (!plano) {
    throw new Error(
      "No active plan found in DB. Run the app once to seed plans before running this test.",
    );
  }
  testPlanoId = plano.id;
});

after(async () => {
  // Restore the real gateway singleton before cleaning up rows.
  _overrideGatewayForTest(null);
  await cleanup();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("iniciarCheckout — stale customer ID persistence", () => {
  it("saves the fresh gatewayCustomerId to users.asaas_customer_id when the gateway returns a different ID", async () => {
    const email = `stale-cid-${uid()}@test.xconstrucao`;
    const userId = await createTestUser(email, STALE_CUSTOMER_ID);
    createdUserIds.push(userId);

    await createTestCliente(userId);

    // Precondition: DB holds the stale ID.
    const before = await getAsaasCustomerId(userId);
    assert.equal(before, STALE_CUSTOMER_ID, "precondition: DB must start with the stale customer ID");

    // Inject the stub gateway that returns the fresh ID.
    _overrideGatewayForTest(makeStubGateway(FRESH_CUSTOMER_ID));
    try {
      const result = await iniciarCheckout({
        userId,
        planoId: testPlanoId,
        ciclo: "mensal",
      });

      // Service must return a redirect (the stub always does).
      assert.equal(result.ok, true, `iniciarCheckout must succeed, got: ${JSON.stringify(result)}`);
      assert.ok(
        result.ok && result.kind === "redirect",
        `expected kind='redirect', got kind='${result.ok ? (result as { kind: string }).kind : "error"}'`,
      );
    } finally {
      // Restore before the await so any subsequent test gets the real gateway.
      _overrideGatewayForTest(null);
    }

    // The write is now AWAITED, so the value must be committed as soon as
    // iniciarCheckout returns. Poll is kept as a defensive fallback only.
    const persisted = await pollUntilCustomerId(userId, FRESH_CUSTOMER_ID);

    assert.equal(
      persisted,
      FRESH_CUSTOMER_ID,
      `users.asaas_customer_id must be updated from the stale ID ("${STALE_CUSTOMER_ID}") ` +
        `to the fresh ID ("${FRESH_CUSTOMER_ID}") returned by the gateway. Got: "${persisted}"`,
    );
  });

  it("persists the fresh customer ID synchronously — a direct read immediately after iniciarCheckout returns the updated value", async () => {
    // This test asserts the synchronous guarantee: because the DB write is
    // AWAITED (not fire-and-forget), the value is available without polling
    // as soon as iniciarCheckout resolves.
    const email = `sync-cid-${uid()}@test.xconstrucao`;
    const userId = await createTestUser(email, STALE_CUSTOMER_ID);
    createdUserIds.push(userId);

    await createTestCliente(userId);

    _overrideGatewayForTest(makeStubGateway(FRESH_CUSTOMER_ID));
    try {
      const result = await iniciarCheckout({ userId, planoId: testPlanoId, ciclo: "mensal" });
      assert.equal(result.ok, true, `iniciarCheckout must succeed, got: ${JSON.stringify(result)}`);
    } finally {
      _overrideGatewayForTest(null);
    }

    // Direct read — no poll, no sleep. If the write were still fire-and-forget
    // this would be a race; with the awaited write it is deterministic.
    const persisted = await getAsaasCustomerId(userId);
    assert.equal(
      persisted,
      FRESH_CUSTOMER_ID,
      `users.asaas_customer_id must be written synchronously before iniciarCheckout returns. Got: "${persisted}"`,
    );
  });

  it("does NOT update users.asaas_customer_id when the gateway returns the same ID that is already in the DB", async () => {
    // This test documents the guard on line 186:
    //   `result.gatewayCustomerId !== userRow?.asaasCustomerId`
    // When the IDs match, no superfluous UPDATE is issued.

    const SAME_CUSTOMER_ID = "cus_same_already_correct";
    const email = `same-cid-${uid()}@test.xconstrucao`;
    const userId = await createTestUser(email, SAME_CUSTOMER_ID);
    createdUserIds.push(userId);

    await createTestCliente(userId);

    // Precondition: DB already has the "correct" ID.
    const before = await getAsaasCustomerId(userId);
    assert.equal(before, SAME_CUSTOMER_ID, "precondition: DB must start with the same customer ID");

    // Stub returns the exact same ID — no update should be needed.
    _overrideGatewayForTest(makeStubGateway(SAME_CUSTOMER_ID));
    try {
      const result = await iniciarCheckout({
        userId,
        planoId: testPlanoId,
        ciclo: "mensal",
      });
      assert.equal(result.ok, true, `iniciarCheckout must succeed, got: ${JSON.stringify(result)}`);
    } finally {
      _overrideGatewayForTest(null);
    }

    // Allow time for any async writes (there should be none for the same ID).
    await new Promise((resolve) => setTimeout(resolve, 200));

    const after = await getAsaasCustomerId(userId);
    assert.equal(
      after,
      SAME_CUSTOMER_ID,
      "users.asaas_customer_id must remain unchanged when the gateway returns the same ID",
    );
  });

  it("writes the gatewayCustomerId when the user had no customer ID in the DB (null → fresh ID)", async () => {
    const email = `null-cid-${uid()}@test.xconstrucao`;
    // Insert user with no asaasCustomerId (null).
    const [u] = await db
      .insert(users)
      .values({
        name: "Test Null Customer",
        email,
        role: "contratante",
        plano: "free",
        ativo: true,
        mustChangePassword: false,
        canManageUsers: false,
        // asaasCustomerId intentionally omitted → null
      })
      .returning({ id: users.id });
    const userId = u.id;
    createdUserIds.push(userId);

    await createTestCliente(userId);

    // Precondition: no customer ID in the DB.
    const before = await getAsaasCustomerId(userId);
    assert.equal(before, null, "precondition: DB must start with null asaasCustomerId");

    // Gateway returns a fresh ID (first-time customer creation scenario).
    _overrideGatewayForTest(makeStubGateway(FRESH_CUSTOMER_ID));
    try {
      const result = await iniciarCheckout({
        userId,
        planoId: testPlanoId,
        ciclo: "mensal",
      });
      assert.equal(result.ok, true, `iniciarCheckout must succeed, got: ${JSON.stringify(result)}`);
    } finally {
      _overrideGatewayForTest(null);
    }

    // Poll until the write completes (null → FRESH_CUSTOMER_ID).
    const persisted = await pollUntilCustomerId(userId, FRESH_CUSTOMER_ID);

    assert.equal(
      persisted,
      FRESH_CUSTOMER_ID,
      `users.asaas_customer_id must be written with the fresh ID when the DB value was null. Got: "${persisted}"`,
    );
  });
});
