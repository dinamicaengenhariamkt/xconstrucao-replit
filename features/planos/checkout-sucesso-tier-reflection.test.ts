/**
 * Integration test — checkout redirect + webhook → tier reflected correctly.
 *
 * Verifies the core invariant that Task #256 cares about: after the full cycle
 *
 *   iniciarCheckout (pendingMode → redirect)
 *   → aplicarEventoWebhook (payment_succeeded, externalReference)
 *
 * the user's `users.plano` column is set to the purchased tier (not left at
 * "free"), and getAssinaturaAtiva() returns an active subscription — exactly
 * what GET /api/perfil/plano (the data source for /planos/sucesso and the
 * navbar) reads to decide what to show.
 *
 * Covers both contratante and empreiteiro roles.
 *
 * Run:
 *   node --import tsx/esm --test features/planos/checkout-sucesso-tier-reflection.test.ts
 */

import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { assinaturas, clientes, empreiteiras, planos, users } from "@shared/db/schema";
import { iniciarCheckout, aplicarEventoWebhook, getAssinaturaAtiva } from "./assinatura-service";
import { _overrideGatewayForTest } from "./gateway";
import { ManualGateway } from "./gateway/manual-gateway";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

/** Extract the `ext` query parameter from the redirect URL returned by iniciarCheckout. */
function extractExtRef(redirectUrl: string): string | null {
  try {
    return new URL(redirectUrl).searchParams.get("ext");
  } catch {
    return null;
  }
}

/**
 * Create a minimal user for testing. We insert directly (no HTTP layer, no
 * email verification needed). No clientes/empreiteiras row is needed because
 * ManualGateway (PAYMENT_GATEWAY=manual, default in test env) skips the
 * cpfCnpj guard.
 */
async function createTestUser(opts: {
  role: "contratante" | "empreiteiro";
  suffix?: string;
}): Promise<string> {
  const sfx = opts.suffix ?? uid();
  const [u] = await db
    .insert(users)
    .values({
      name: `E2E Sucesso ${opts.role} ${sfx}`,
      email: `sucesso-${opts.role}-${sfx}@test.xconstrucao`,
      role: opts.role,
      plano: "free",
      ativo: true,
      mustChangePassword: false,
      canManageUsers: false,
    })
    .returning({ id: users.id });
  return u.id;
}

/** Read users.plano from the DB. */
async function getUserPlano(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ plano: users.plano })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.plano ?? null;
}

// ---------------------------------------------------------------------------
// Test state — collected for teardown
// ---------------------------------------------------------------------------

const createdUserIds: string[] = [];

async function cleanup(): Promise<void> {
  for (const id of createdUserIds) {
    // assinaturas + assinaturaEventos cascade; clientes/empreiteiras are
    // set-null on user delete via FK — delete profile rows first just in case.
    await db.delete(clientes).where(eq(clientes.userId, id)).catch(() => {});
    await db.delete(empreiteiras).where(eq(empreiteiras.userId, id)).catch(() => {});
    await db
      .delete(assinaturas)
      .where(eq(assinaturas.userId, id))
      .catch(() => {});
    await db.delete(users).where(eq(users.id, id)).catch(() => {});
  }
}

// Inject ManualGateway so tests are gateway-agnostic (PAYMENT_GATEWAY env may
// be "asaas" in dev; ManualGateway skips the cpfCnpj guard since its provider
// is "manual", and its pendingMode returns kind:"redirect" with the
// externalReference embedded in the URL — exactly what we need here).
const manualGateway = new ManualGateway();

// ---------------------------------------------------------------------------
// Resolve plan IDs by persona (avoids inserting duplicate tier+persona plans)
// ---------------------------------------------------------------------------

let proPlanIdEmpreiteiro: string | null = null;
let proPlanIdContratante: string | null = null;

before(async () => {
  // Inject ManualGateway for all tests in this suite so we don't depend on
  // PAYMENT_GATEWAY env (may be "asaas" in dev, which blocks checkout without
  // a real cpfCnpj). ManualGateway with pendingMode=true returns kind:"redirect"
  // with the externalReference embedded in the URL — exactly what we test here.
  _overrideGatewayForTest(manualGateway);

  // Find the "pro" plan for each persona (or "ambos" counts for both).
  // Filter tier in JS to avoid fighting the pgEnum column type in eq().
  const rows = await db
    .select({ id: planos.id, tier: planos.tier, persona: planos.persona })
    .from(planos)
    .where(eq(planos.ativo, true));

  for (const row of rows) {
    if (row.tier !== "pro") continue;
    if (row.persona === "empreiteiro" || row.persona === "ambos") {
      proPlanIdEmpreiteiro ??= row.id;
    }
    if (row.persona === "contratante" || row.persona === "ambos") {
      proPlanIdContratante ??= row.id;
    }
  }
});

after(async () => {
  // Restore real gateway resolution before cleanup so any cascading calls
  // during teardown use the correct adapter.
  _overrideGatewayForTest(null);
  await cleanup();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("checkout-sucesso: tier reflected correctly after redirect + webhook", () => {
  // ── Empreiteiro ────────────────────────────────────────────────────────────

  it("empreiteiro: redirect checkout → tier=free (pending) → webhook payment_succeeded → tier=pro + assinatura ativa", async () => {
    if (!proPlanIdEmpreiteiro) {
      // Skip gracefully if catalog has no pro plan for empreiteiro
      console.log("SKIP: no pro plan found for empreiteiro — skipping");
      return;
    }

    const userId = await createTestUser({ role: "empreiteiro" });
    createdUserIds.push(userId);

    // ── Precondition: tier is free ─────────────────────────────────────────
    const planoBefore = await getUserPlano(userId);
    assert.equal(planoBefore, "free", "empreiteiro must start at tier free");

    // ── Step 1: checkout in redirect mode (pendingMode=true) ───────────────
    // This simulates the gateway redirect flow (e.g. ASAAS) where the
    // subscription is NOT activated yet — only after webhook confirmation.
    const checkoutResult = await iniciarCheckout({
      userId,
      planoId: proPlanIdEmpreiteiro,
      ciclo: "mensal",
      pendingMode: true,
    });

    assert.ok(
      checkoutResult.ok,
      `iniciarCheckout must succeed — got: ${JSON.stringify(checkoutResult)}`,
    );
    assert.ok(
      checkoutResult.ok && checkoutResult.kind === "redirect",
      `kind must be "redirect" (pendingMode=true) — got: ${checkoutResult.ok ? (checkoutResult as { kind: string }).kind : "error"}`,
    );

    const redirectUrl = checkoutResult.ok && checkoutResult.kind === "redirect"
      ? checkoutResult.url
      : null;
    assert.ok(redirectUrl, "redirect URL must be non-null");

    // Extract externalReference from the redirect URL
    const extRef = extractExtRef(redirectUrl!);
    assert.ok(extRef, "redirect URL must contain 'ext' query param (externalReference)");
    assert.match(
      extRef!,
      /^xconstrucao\|.+\|.+\|mensal$/,
      "externalReference must follow format 'xconstrucao|userId|planoId|ciclo'",
    );

    // ── Step 2: tier must still be free (payment not confirmed yet) ────────
    // This is what the /planos/sucesso page would see while polling before
    // the webhook arrives.
    const planoPending = await getUserPlano(userId);
    assert.equal(
      planoPending,
      "free",
      "tier must remain free while payment is pending (no webhook fired yet)",
    );

    const assinaturaPending = await getAssinaturaAtiva(userId);
    assert.equal(
      assinaturaPending,
      null,
      "no active subscription must exist before webhook is processed",
    );

    // ── Step 3: fire webhook payment_succeeded ─────────────────────────────
    // Simulates the ASAAS payment confirmation webhook.
    const webhookResult = await aplicarEventoWebhook({
      eventId: `test-sucesso-emp-${uid()}`,
      type: "payment_succeeded",
      externalReference: extRef!,
      valor: 99.9,
    });

    assert.ok(
      webhookResult.processed,
      "webhook must be processed (new subscription created and tier updated)",
    );

    // ── Step 4: tier must now reflect the purchased plan ───────────────────
    // This is what GET /api/perfil/plano (the /planos/sucesso data source)
    // returns after the webhook is processed.
    const planoAfter = await getUserPlano(userId);
    assert.equal(
      planoAfter,
      "pro",
      "users.plano must be updated to 'pro' after webhook payment_succeeded",
    );

    const assinaturaAtiva = await getAssinaturaAtiva(userId);
    assert.ok(
      assinaturaAtiva !== null,
      "an active subscription must exist after webhook is processed",
    );
    assert.equal(
      assinaturaAtiva!.status,
      "ativa",
      "assinatura status must be 'ativa' after payment confirmation",
    );
    assert.equal(
      assinaturaAtiva!.planoId,
      proPlanIdEmpreiteiro,
      "active subscription must reference the correct pro plan",
    );
  });

  // ── Contratante ────────────────────────────────────────────────────────────

  it("contratante: redirect checkout → tier=free (pending) → webhook payment_succeeded → tier=pro + assinatura ativa", async () => {
    if (!proPlanIdContratante) {
      console.log("SKIP: no pro plan found for contratante — skipping");
      return;
    }

    const userId = await createTestUser({ role: "contratante" });
    createdUserIds.push(userId);

    // ── Precondition ────────────────────────────────────────────────────────
    const planoBefore = await getUserPlano(userId);
    assert.equal(planoBefore, "free", "contratante must start at tier free");

    // ── Step 1: redirect checkout ───────────────────────────────────────────
    const checkoutResult = await iniciarCheckout({
      userId,
      planoId: proPlanIdContratante,
      ciclo: "mensal",
      pendingMode: true,
    });

    assert.ok(
      checkoutResult.ok,
      `iniciarCheckout must succeed — got: ${JSON.stringify(checkoutResult)}`,
    );
    assert.ok(
      checkoutResult.ok && checkoutResult.kind === "redirect",
      `kind must be "redirect" — got: ${checkoutResult.ok ? (checkoutResult as { kind: string }).kind : "error"}`,
    );

    const redirectUrl = checkoutResult.ok && checkoutResult.kind === "redirect"
      ? checkoutResult.url
      : null;
    const extRef = extractExtRef(redirectUrl!);
    assert.ok(extRef, "redirect URL must contain 'ext' query param");
    assert.match(
      extRef!,
      /^xconstrucao\|.+\|.+\|mensal$/,
      "externalReference must follow correct format",
    );

    // ── Step 2: tier still free before webhook ──────────────────────────────
    assert.equal(
      await getUserPlano(userId),
      "free",
      "tier must stay free while payment is pending",
    );
    assert.equal(
      await getAssinaturaAtiva(userId),
      null,
      "no active subscription before webhook",
    );

    // ── Step 3: fire webhook ────────────────────────────────────────────────
    const webhookResult = await aplicarEventoWebhook({
      eventId: `test-sucesso-ctr-${uid()}`,
      type: "payment_succeeded",
      externalReference: extRef!,
      valor: 99.9,
    });

    assert.ok(webhookResult.processed, "webhook must be processed");

    // ── Step 4: tier reflects the purchased plan ────────────────────────────
    assert.equal(
      await getUserPlano(userId),
      "pro",
      "users.plano must be updated to 'pro' after webhook",
    );

    const assinaturaAtiva = await getAssinaturaAtiva(userId);
    assert.ok(assinaturaAtiva !== null, "active subscription must exist after webhook");
    assert.equal(assinaturaAtiva!.status, "ativa", "status must be 'ativa'");
    assert.equal(
      assinaturaAtiva!.planoId,
      proPlanIdContratante,
      "subscription must reference the correct pro plan",
    );
  });

  // ── Guard: stale-free guard ────────────────────────────────────────────────

  it("checkout redirect WITHOUT webhook → tier remains free (payment not confirmed)", async () => {
    // Ensure that a redirect-only checkout (no webhook) does NOT prematurely
    // upgrade the user. This is the state the /planos/sucesso page sees while
    // polling for confirmation.
    const planId = proPlanIdEmpreiteiro ?? proPlanIdContratante;
    const role = proPlanIdEmpreiteiro ? "empreiteiro" : "contratante";
    if (!planId) {
      console.log("SKIP: no pro plan found — skipping guard test");
      return;
    }

    const userId = await createTestUser({ role });
    createdUserIds.push(userId);

    const checkoutResult = await iniciarCheckout({
      userId,
      planoId: planId,
      ciclo: "mensal",
      pendingMode: true,
    });

    assert.ok(checkoutResult.ok && checkoutResult.kind === "redirect", "must be redirect");

    // Without firing a webhook, the tier must stay free.
    const planoAfter = await getUserPlano(userId);
    assert.equal(
      planoAfter,
      "free",
      "tier must NOT be upgraded by redirect checkout alone — webhook required",
    );
    assert.equal(
      await getAssinaturaAtiva(userId),
      null,
      "no active subscription must exist without webhook",
    );
  });

  // ── Idempotency guard ──────────────────────────────────────────────────────

  it("firing the same webhook event twice does not create duplicate subscriptions (idempotency)", async () => {
    const planId = proPlanIdEmpreiteiro ?? proPlanIdContratante;
    const role = proPlanIdEmpreiteiro ? "empreiteiro" : "contratante";
    if (!planId) {
      console.log("SKIP: no pro plan found — skipping idempotency test");
      return;
    }

    const userId = await createTestUser({ role });
    createdUserIds.push(userId);

    const checkoutResult = await iniciarCheckout({
      userId,
      planoId: planId,
      ciclo: "mensal",
      pendingMode: true,
    });
    assert.ok(checkoutResult.ok && checkoutResult.kind === "redirect");
    const redirectUrl = checkoutResult.ok && checkoutResult.kind === "redirect"
      ? checkoutResult.url : null;
    const extRef = extractExtRef(redirectUrl!);
    assert.ok(extRef);

    const fixedEventId = `test-idempotency-${uid()}`;

    // First fire: processed = true
    const first = await aplicarEventoWebhook({
      eventId: fixedEventId,
      type: "payment_succeeded",
      externalReference: extRef!,
      valor: 99.9,
    });
    assert.ok(first.processed, "first webhook must be processed");
    assert.equal(await getUserPlano(userId), "pro", "tier must be pro after first webhook");

    // Second fire with same eventId: processed = false (dedup)
    const second = await aplicarEventoWebhook({
      eventId: fixedEventId,
      type: "payment_succeeded",
      externalReference: extRef!,
      valor: 99.9,
    });
    assert.equal(second.processed, false, "duplicate webhook must be rejected (idempotency)");

    // Exactly one active subscription
    const subs = await db
      .select({ id: assinaturas.id })
      .from(assinaturas)
      .where(and(eq(assinaturas.userId, userId), eq(assinaturas.status, "ativa")));
    assert.equal(subs.length, 1, "exactly one active subscription must exist after two identical webhooks");
  });
});
