/**
 * Unit tests for AsaasGateway.createCheckout — stale customer ID healing.
 *
 * Verifies that when `userAsaasCustomerId` holds a stale ID (e.g. from the
 * wrong Asaas environment), the gateway silently falls back to
 * findOrCreateCustomer and returns the correct `gatewayCustomerId` so the
 * caller can persist it and avoid the problem on subsequent checkouts.
 *
 * Mocking strategy: `asaasRequest` calls `global.fetch` internally, so we
 * intercept fetch at the global level — no module mocking required, works
 * on Node.js 20 with the built-in test runner.
 *
 * Run:
 *   node --import tsx/esm --test features/planos/gateway/asaas-gateway.test.ts
 */

import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { AsaasGateway } from "./asaas-gateway";

// ── Env setup ────────────────────────────────────────────────────────────────
// Set required env vars before any import resolves the values.
// ASAAS_API_KEY must be non-empty (getApiKey() throws otherwise).
// ASAAS_ENVIRONMENT must be "sandbox" or "production".
process.env.ASAAS_API_KEY = "test-api-key-unit";
process.env.ASAAS_ENVIRONMENT = "sandbox";
process.env.NEXT_PUBLIC_BASE_URL = "https://test.xconstrucao.com.br";

// ── Helpers ──────────────────────────────────────────────────────────────────

type FetchHandler = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * Replaces global.fetch with a handler that intercepts requests by URL
 * substring. Returns a restore function to call in afterEach.
 */
function mockFetch(handler: FetchHandler): () => void {
  const original = global.fetch as typeof fetch;
  // @ts-expect-error — intentional global override for testing
  global.fetch = handler;
  return () => {
    // @ts-expect-error — restore original
    global.fetch = original;
  };
}

/** Build a minimal successful JSON Response. */
function jsonOk(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/** Build an error JSON Response (Asaas error shape). */
function jsonError(status: number, description = "Not found"): Response {
  return new Response(JSON.stringify({ errors: [{ description }] }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── Shared fixture ────────────────────────────────────────────────────────────

const STALE_CUSTOMER_ID = "cus_stale_000sandbox";
const VALID_CUSTOMER_ID = "cus_valid_999sandbox";
const FRESH_CUSTOMER_ID = "cus_fresh_111sandbox";

const CHECKOUT_RESPONSE = {
  id: "ckout_abc123",
  url: "https://checkout.asaas.com/c/ckout_abc123",
  status: "ACTIVE",
};

const baseInput = {
  userId: "user-uuid-1234",
  planoId: "plano-uuid-pro",
  tier: "pro" as const,
  ciclo: "mensal" as const,
  valor: 49.9,
  userEmail: "user@example.com",
  userName: "Test User",
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AsaasGateway.createCheckout — stale customer ID healing", () => {
  let restore: () => void;

  afterEach(() => {
    restore?.();
  });

  // ── Test 1: stale ID → HTTP 404 → fallback to findOrCreateCustomer ──────

  it("stale cached ID (404) → falls back to findOrCreateCustomer and returns fresh gatewayCustomerId", async () => {
    const calls: string[] = [];

    restore = mockFetch(async (url, _init) => {
      const u = url as string;
      calls.push(u);

      // 1. Validation of cached ID → 404 (stale / wrong environment)
      if (u.includes(`/customers/${STALE_CUSTOMER_ID}`)) {
        return jsonError(404, "Customer not found");
      }

      // 2. findOrCreateCustomer: lookup by email → returns existing fresh customer
      if (u.includes("/customers?email=")) {
        return jsonOk({
          data: [{ id: FRESH_CUSTOMER_ID, name: "Test User", email: "user@example.com" }],
          totalCount: 1,
        });
      }

      // 3. POST /checkouts → success
      if (u.includes("/checkouts")) {
        return jsonOk(CHECKOUT_RESPONSE);
      }

      throw new Error(`Unexpected fetch call to: ${u}`);
    });

    const gateway = new AsaasGateway();
    const result = await gateway.createCheckout({
      ...baseInput,
      userAsaasCustomerId: STALE_CUSTOMER_ID,
    });

    // Result must be a redirect (checkout hosted page)
    assert.equal(result.kind, "redirect", "createCheckout must return kind='redirect'");
    assert.equal(
      result.url,
      CHECKOUT_RESPONSE.url,
      "checkout URL must match the gateway response",
    );

    // The FRESH customer ID (from fallback) must be returned for caching
    assert.equal(
      result.gatewayCustomerId,
      FRESH_CUSTOMER_ID,
      "gatewayCustomerId must be the fresh ID resolved after fallback, not the stale one",
    );

    // Confirm validation of stale ID was attempted
    const validationCall = calls.find((u) => u.includes(`/customers/${STALE_CUSTOMER_ID}`));
    assert.ok(
      validationCall,
      `expected a GET /customers/${STALE_CUSTOMER_ID} validation call, but none was made`,
    );

    // Confirm fallback lookup by email was attempted
    const lookupCall = calls.find((u) => u.includes("/customers?email="));
    assert.ok(
      lookupCall,
      "expected a GET /customers?email= fallback lookup after stale ID 404",
    );
  });

  // ── Test 2: valid ID → HTTP 200 → cached ID is reused ───────────────────

  it("valid cached ID (200) → reuses the cached ID without calling findOrCreateCustomer", async () => {
    const calls: string[] = [];

    restore = mockFetch(async (url, _init) => {
      const u = url as string;
      calls.push(u);

      // 1. Validation of cached ID → 200 (valid in current environment)
      if (u.includes(`/customers/${VALID_CUSTOMER_ID}`)) {
        return jsonOk({ id: VALID_CUSTOMER_ID, name: "Test User", email: "user@example.com" });
      }

      // 2. POST /checkouts → success
      if (u.includes("/checkouts")) {
        return jsonOk(CHECKOUT_RESPONSE);
      }

      // findOrCreateCustomer should NOT be called — fail loudly if it is
      if (u.includes("/customers?email=") || (u.includes("/customers") && u.includes("POST"))) {
        throw new Error(`findOrCreateCustomer must NOT be called when the cached ID is valid. URL: ${u}`);
      }

      throw new Error(`Unexpected fetch call to: ${u}`);
    });

    const gateway = new AsaasGateway();
    const result = await gateway.createCheckout({
      ...baseInput,
      userAsaasCustomerId: VALID_CUSTOMER_ID,
    });

    // Result must be a redirect
    assert.equal(result.kind, "redirect", "createCheckout must return kind='redirect'");
    assert.equal(
      result.url,
      CHECKOUT_RESPONSE.url,
      "checkout URL must match the gateway response",
    );

    // The VALID cached customer ID must be reused unchanged
    assert.equal(
      result.gatewayCustomerId,
      VALID_CUSTOMER_ID,
      "gatewayCustomerId must be the validated cached ID when it is healthy",
    );

    // Confirm validation call was made
    const validationCall = calls.find((u) => u.includes(`/customers/${VALID_CUSTOMER_ID}`));
    assert.ok(
      validationCall,
      `expected a GET /customers/${VALID_CUSTOMER_ID} validation call`,
    );

    // Confirm NO email-based lookup was attempted
    const emailLookup = calls.find((u) => u.includes("/customers?email="));
    assert.equal(
      emailLookup,
      undefined,
      "findOrCreateCustomer (email lookup) must NOT be called when the cached ID is valid",
    );
  });

  // ── Test 3: no cached ID → falls through to findOrCreateCustomer ─────────

  it("no cached ID → calls findOrCreateCustomer and returns resolved gatewayCustomerId", async () => {
    const calls: string[] = [];

    restore = mockFetch(async (url, _init) => {
      const u = url as string;
      calls.push(u);

      // findOrCreateCustomer: no existing customer → create new
      if (u.includes("/customers?email=")) {
        return jsonOk({ data: [], totalCount: 0 });
      }

      if (u.includes("/customers") && !u.includes("/checkouts")) {
        // POST /customers (create)
        return jsonOk({ id: FRESH_CUSTOMER_ID, name: "Test User", email: "user@example.com" });
      }

      if (u.includes("/checkouts")) {
        return jsonOk(CHECKOUT_RESPONSE);
      }

      throw new Error(`Unexpected fetch call to: ${u}`);
    });

    const gateway = new AsaasGateway();
    const result = await gateway.createCheckout({
      ...baseInput,
      // userAsaasCustomerId intentionally omitted
    });

    assert.equal(result.kind, "redirect", "createCheckout must return kind='redirect'");

    assert.equal(
      result.gatewayCustomerId,
      FRESH_CUSTOMER_ID,
      "gatewayCustomerId must be the newly created customer ID",
    );

    // No validation call should have been attempted (no cached ID to validate)
    const validationCall = calls.find(
      (u) => u.includes("/customers/cus_") && !u.includes("email="),
    );
    assert.equal(
      validationCall,
      undefined,
      "no GET /customers/{id} validation call expected when no cached ID is provided",
    );
  });
});
