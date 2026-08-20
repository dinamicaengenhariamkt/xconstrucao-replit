/**
 * Integration tests for retryPendingWebhookEvents (webhook-retry-job).
 *
 * Tests the full retry path at DB level — no HTTP layer required.
 * Exercises every critical branch:
 *   1. 'ignored' events are marked 'processed' (happy path — no sub lookup)
 *   2. payment_succeeded via ASAAS format reactivates an inadimplente subscription
 *   3. Rows already 'processed' are NOT picked up (idempotency / no double-process)
 *   4. Rows at MAX_RETRIES are NOT picked up (retry cap respected)
 *   5. Result shape: { ok, retried, succeeded, failed, runAt } always correct
 *
 * Run:
 *   node --import tsx/esm --test features/planos/webhook-retry-job.test.ts
 * or:
 *   npx tsx --test features/planos/webhook-retry-job.test.ts
 */

import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { assinaturaEventos, assinaturas, planos, users } from "@shared/db/schema";
import { retryPendingWebhookEvents, MAX_RETRIES } from "./webhook-retry-job";
import { _overrideGatewayForTest } from "./gateway";
import { ManualGateway } from "./gateway/manual-gateway";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

/** Insert a minimal user row and return its id. */
async function createTestUser(suffix: string): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({
      name: "Retry Job Test",
      email: `retry_test_${suffix}@test.xconstrucao`,
      role: "contratante",
      plano: "free",
      ativo: true,
      mustChangePassword: false,
      canManageUsers: false,
    })
    .returning({ id: users.id });
  return u.id;
}

/** Insert a subscription row in a given status and return its id. */
async function createTestAssinatura(
  userId: string,
  planoId: string,
  status: "inadimplente" | "expirada" | "ativa",
  gatewaySubscriptionId: string,
): Promise<string> {
  const renovaEm = new Date();
  renovaEm.setDate(renovaEm.getDate() - 30);
  const [plano] = await db.select({ persona: planos.persona }).from(planos).where(eq(planos.id, planoId)).limit(1);
  if (!plano || plano.persona === "ambos") throw new Error("plano de teste sem persona");
  const [a] = await db
    .insert(assinaturas)
    .values({
      userId,
      planoId,
      persona: plano.persona,
      status,
      ciclo: "mensal",
      renovaEm,
      gatewayProvider: "manual",
      gatewaySubscriptionId,
    })
    .returning({ id: assinaturas.id });
  return a.id;
}

/** Insert a webhook_delivery_log row and return its id. */
async function insertWebhookLog(opts: {
  gatewayEventId: string;
  eventType: string;
  rawBody: string;
  status: "pending" | "failed" | "processed";
  retryCount?: number;
}): Promise<string> {
  const result = await db.execute<{ id: string }>(sql`
    INSERT INTO webhook_delivery_log
      (gateway_event_id, event_type, raw_body, headers_json, status, retry_count)
    VALUES
      (${opts.gatewayEventId}, ${opts.eventType}, ${opts.rawBody},
       '{}'::jsonb, ${opts.status}, ${opts.retryCount ?? 0})
    RETURNING id
  `);
  const id = (result.rows[0] as { id: string } | undefined)?.id;
  if (!id) throw new Error("insertWebhookLog: INSERT did not return id");
  return id;
}

/** Read a single row from webhook_delivery_log. */
async function getLogRow(id: string): Promise<{
  status: string;
  retry_count: number;
  last_error: string | null;
} | null> {
  const result = await db.execute<{
    status: string;
    retry_count: number;
    last_error: string | null;
  }>(sql`
    SELECT status, retry_count, last_error
      FROM webhook_delivery_log
     WHERE id = ${id}
  `);
  return (result.rows[0] as { status: string; retry_count: number; last_error: string | null } | undefined) ?? null;
}

/** Read current assinatura status. */
async function getAssinaturaStatus(id: string): Promise<string | null> {
  const [row] = await db
    .select({ status: assinaturas.status })
    .from(assinaturas)
    .where(eq(assinaturas.id, id))
    .limit(1);
  return row?.status ?? null;
}

// ---------------------------------------------------------------------------
// Test state — collected for cleanup
// ---------------------------------------------------------------------------

const createdLogIds: string[] = [];
const createdGatewayEventIds: string[] = [];
const createdAssinaturaIds: string[] = [];
const createdUserIds: string[] = [];

async function cleanup() {
  for (const id of createdLogIds) {
    await db.execute(sql`DELETE FROM webhook_delivery_log WHERE id = ${id}`).catch(() => {});
  }
  for (const gId of createdGatewayEventIds) {
    await db.delete(assinaturaEventos).where(eq(assinaturaEventos.gatewayEventId, gId)).catch(() => {});
  }
  for (const id of createdAssinaturaIds) {
    await db.delete(assinaturas).where(eq(assinaturas.id, id)).catch(() => {});
  }
  for (const id of createdUserIds) {
    await db.delete(users).where(eq(users.id, id)).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Plano fixture — reuse existing seeded plan
// ---------------------------------------------------------------------------

let testPlanoId: string;
let testPlanoTier: string;

before(async () => {
  // Ensure ManualGateway is active for all tests (safe even in prod-like envs
  // because tests never touch real billing).
  _overrideGatewayForTest(new ManualGateway());

  const [plano] = await db
    .select({ id: planos.id, tier: planos.tier })
    .from(planos)
    .where(eq(planos.ativo, true))
    .limit(1);

  if (!plano) {
    throw new Error(
      "No active plan found in DB — run the app at least once to seed plans before running this test.",
    );
  }
  testPlanoId = plano.id;
  testPlanoTier = plano.tier;
});

after(async () => {
  _overrideGatewayForTest(null);
  await cleanup();
});

// ---------------------------------------------------------------------------
// Suite 1 — 'ignored' event: marked 'processed' without touching assinaturas
// ---------------------------------------------------------------------------

describe("retryPendingWebhookEvents — ignored event", () => {
  it("failed row with type=ignored is marked processed and counted as succeeded", async () => {
    const gatewayEventId = `retry_test_ignored_${uid()}`;
    const rawBody = JSON.stringify({ type: "ignored", eventId: gatewayEventId });

    const logId = await insertWebhookLog({
      gatewayEventId,
      eventType: "ignored",
      rawBody,
      status: "failed",
      retryCount: 0,
    });
    createdLogIds.push(logId);

    const result = await retryPendingWebhookEvents(null, 50);

    assert.equal(result.ok, true, "result.ok must be true");
    assert.ok(result.retried >= 1, `retried must be ≥ 1 (got ${result.retried})`);
    assert.ok(result.succeeded >= 1, `succeeded must be ≥ 1 (got ${result.succeeded})`);
    assert.equal(
      result.retried,
      result.succeeded + result.failed,
      "retried must equal succeeded + failed",
    );
    assert.equal(typeof result.runAt, "string", "runAt must be an ISO string");

    const row = await getLogRow(logId);
    assert.ok(row, "log row must still exist");
    assert.equal(row.status, "processed", `row status must be 'processed' (got '${row.status}')`);
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — payment_succeeded: reactivates inadimplente subscription
// ---------------------------------------------------------------------------

describe("retryPendingWebhookEvents — payment_succeeded reactivates subscription", () => {
  it("failed row with ASAAS payment_succeeded updates assinatura to ativa", async () => {
    const gwSubId = `manual_sub_retry_${uid()}`;
    const paymentId = `pay_retry_${uid()}`;
    const gatewayEventId = `asaas_${paymentId}`;

    // Create a test user with an inadimplente subscription
    const userId = await createTestUser(`ps_${uid()}`);
    createdUserIds.push(userId);

    const assinaturaId = await createTestAssinatura(userId, testPlanoId, "inadimplente", gwSubId);
    createdAssinaturaIds.push(assinaturaId);
    createdGatewayEventIds.push(gatewayEventId);

    // Preconditions
    assert.equal(await getAssinaturaStatus(assinaturaId), "inadimplente");

    // ASAAS-format payload (same format the real gateway sends in production)
    const rawBody = JSON.stringify({
      event: "PAYMENT_RECEIVED",
      payment: {
        id: paymentId,
        subscription: gwSubId,
        externalReference: null,
        value: 99.9,
      },
    });

    const logId = await insertWebhookLog({
      gatewayEventId,
      eventType: "payment_succeeded",
      rawBody,
      status: "failed",
      retryCount: 1,
    });
    createdLogIds.push(logId);

    const result = await retryPendingWebhookEvents(null, 50);

    assert.equal(result.ok, true, "result.ok must be true");
    assert.ok(result.retried >= 1, `retried must be ≥ 1 (got ${result.retried})`);
    assert.ok(result.succeeded >= 1, `succeeded must be ≥ 1 (got ${result.succeeded})`);

    // Verify the log row is now 'processed'
    const row = await getLogRow(logId);
    assert.ok(row, "log row must still exist");
    assert.equal(row.status, "processed", `row status must be 'processed' (got '${row.status}')`);

    // Verify the subscription was reactivated
    const finalStatus = await getAssinaturaStatus(assinaturaId);
    assert.equal(
      finalStatus,
      "ativa",
      `assinatura must be 'ativa' after payment_succeeded retry (got '${finalStatus}')`,
    );
  });
});

// ---------------------------------------------------------------------------
// Suite 3 — idempotency: 'processed' rows are not picked up again
// ---------------------------------------------------------------------------

describe("retryPendingWebhookEvents — idempotency (already processed)", () => {
  it("row with status=processed is not retried and retried count does not increase for it", async () => {
    const gatewayEventId = `retry_test_already_done_${uid()}`;
    const rawBody = JSON.stringify({ type: "ignored", eventId: gatewayEventId });

    const logId = await insertWebhookLog({
      gatewayEventId,
      eventType: "ignored",
      rawBody,
      status: "processed",
      retryCount: 0,
    });
    createdLogIds.push(logId);

    // Call retry twice — neither call should touch this row
    const before1 = await getLogRow(logId);
    await retryPendingWebhookEvents(null, 50);
    await retryPendingWebhookEvents(null, 50);
    const after2 = await getLogRow(logId);

    assert.equal(after2?.status, "processed", "already-processed row must remain 'processed'");
    assert.equal(
      after2?.retry_count,
      before1?.retry_count,
      "retry_count of an already-processed row must not change",
    );
  });
});

// ---------------------------------------------------------------------------
// Suite 4 — retry cap: rows at MAX_RETRIES are skipped
// ---------------------------------------------------------------------------

describe("retryPendingWebhookEvents — retry cap (MAX_RETRIES reached)", () => {
  it("failed row with retry_count=MAX_RETRIES is not picked up", async () => {
    const gatewayEventId = `retry_test_max_retries_${uid()}`;
    const rawBody = JSON.stringify({ type: "ignored", eventId: gatewayEventId });

    const logId = await insertWebhookLog({
      gatewayEventId,
      eventType: "ignored",
      rawBody,
      status: "failed",
      retryCount: MAX_RETRIES,
    });
    createdLogIds.push(logId);

    const beforeRow = await getLogRow(logId);
    assert.equal(beforeRow?.retry_count, MAX_RETRIES);

    await retryPendingWebhookEvents(null, 50);

    const afterRow = await getLogRow(logId);
    assert.equal(
      afterRow?.status,
      "failed",
      "row at MAX_RETRIES must remain 'failed' (not processed)",
    );
    assert.equal(
      afterRow?.retry_count,
      MAX_RETRIES,
      "retry_count must not change for row at cap",
    );
  });
});

// ---------------------------------------------------------------------------
// Suite 5 — result shape: empty queue returns valid zero-count result
// ---------------------------------------------------------------------------

describe("retryPendingWebhookEvents — result shape when queue is empty", () => {
  it("returns ok=true with zero counts when no pending/failed events exist in the window", async () => {
    // Use a tiny limit=0 — no rows will be fetched, so we get a clean result shape check.
    const result = await retryPendingWebhookEvents(null, 0);

    assert.equal(result.ok, true, "ok must be true even with empty queue");
    assert.equal(result.retried, 0, "retried must be 0");
    assert.equal(result.succeeded, 0, "succeeded must be 0");
    assert.equal(result.failed, 0, "failed must be 0");
    assert.equal(typeof result.runAt, "string", "runAt must be a string");
    assert.ok(
      !isNaN(Date.parse(result.runAt)),
      `runAt must be a valid ISO date string (got '${result.runAt}')`,
    );
    assert.equal(result.error, undefined, "error must be undefined on success");
  });
});

// ---------------------------------------------------------------------------
// Suite 6 — excludeId: excluded row is not retried in the same run
// ---------------------------------------------------------------------------

describe("retryPendingWebhookEvents — excludeId skips specified row", () => {
  it("row matching excludeId is not processed in that run", async () => {
    const gatewayEventId = `retry_test_exclude_${uid()}`;
    const rawBody = JSON.stringify({ type: "ignored", eventId: gatewayEventId });

    const logId = await insertWebhookLog({
      gatewayEventId,
      eventType: "ignored",
      rawBody,
      status: "failed",
      retryCount: 0,
    });
    createdLogIds.push(logId);

    // Pass logId as excludeId — this row must be skipped
    await retryPendingWebhookEvents(logId, 50);

    const row = await getLogRow(logId);
    // The row should still be 'failed' because it was excluded
    assert.equal(
      row?.status,
      "failed",
      "excluded row must remain 'failed' during a run that excluded its id",
    );

    // Now retry without exclusion — it should be processed
    await retryPendingWebhookEvents(null, 50);
    const rowAfter = await getLogRow(logId);
    assert.equal(
      rowAfter?.status,
      "processed",
      "excluded row must be processed in subsequent run without exclusion",
    );
  });
});
