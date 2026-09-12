import assert from "node:assert/strict";
import test from "node:test";
import { checkRateLimit, resetRateLimitStoreForTests } from "./rate-limit";

function withRateLimitEnabled(run: () => void) {
  const previousEmailTestMode = process.env.EMAIL_TEST_MODE;
  delete process.env.EMAIL_TEST_MODE;
  resetRateLimitStoreForTests();
  try {
    run();
  } finally {
    resetRateLimitStoreForTests();
    if (previousEmailTestMode === undefined) delete process.env.EMAIL_TEST_MODE;
    else process.env.EMAIL_TEST_MODE = previousEmailTestMode;
  }
}

test("checkRateLimit permite o limite exato e informa o tempo no bloqueio", () => {
  withRateLimitEnabled(() => {
    const now = 1_000_000;
    assert.equal(checkRateLimit("boundary", 2, 60_000, now).limited, false);
    assert.equal(checkRateLimit("boundary", 2, 60_000, now + 1).limited, false);
    const blocked = checkRateLimit("boundary", 2, 60_000, now + 2);
    assert.equal(blocked.limited, true);
    assert.equal(blocked.remaining, 0);
    assert.equal(blocked.retryAfterSeconds, 60);
    assert.equal(blocked.resetAt, now + 60_000);
  });
});

test("checkRateLimit reinicia a cota no instante do reset", () => {
  withRateLimitEnabled(() => {
    const now = 2_000_000;
    checkRateLimit("reset", 1, 10_000, now);
    assert.equal(checkRateLimit("reset", 1, 10_000, now + 1).limited, true);
    const reset = checkRateLimit("reset", 1, 10_000, now + 10_000);
    assert.equal(reset.limited, false);
    assert.equal(reset.remaining, 0);
  });
});