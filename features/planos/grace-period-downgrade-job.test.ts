/**
 * Unit tests for grace-period-downgrade-job — buffer logic.
 *
 * These tests cover the pure `computeDowngradeCutoff` helper and verify that
 * the extra gateway-outage buffer (`INADIMPLENTE_DOWNGRADE_BUFFER_HOURS`) is
 * correctly applied before a subscription is marked `expirada`.
 *
 * No database connection required — all tests are pure logic.
 *
 * Run:
 *   node --import tsx/esm --test features/planos/grace-period-downgrade-job.test.ts
 * or:
 *   npx tsx --test features/planos/grace-period-downgrade-job.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeDowngradeCutoff } from "./grace-period-downgrade-job";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

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
