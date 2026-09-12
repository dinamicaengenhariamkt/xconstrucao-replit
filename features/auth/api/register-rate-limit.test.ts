import assert from "node:assert/strict";
import test from "node:test";
import { resetRateLimitStoreForTests } from "./rate-limit";
import {
  checkRegisterCreationLimit,
  checkRegisterRequestLimit,
  checkRegisterTargetLimit,
  formatRetryWait,
  getRegisterClientKey,
} from "./register-rate-limit";

function withCleanLimiter(run: () => void) {
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

test("correções inválidas não consomem a cota pequena do cadastro válido", () => {
  withCleanLimiter(() => {
    const now = 3_000_000;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      assert.equal(checkRegisterRequestLimit("ip:203.0.113.10", now + attempt).limited, false);
      // Schema/senha inválidos encerram a rota antes dos tiers abaixo.
    }

    assert.equal(checkRegisterTargetLimit("pessoa@example.com", now + 10).limited, false);
    assert.equal(checkRegisterCreationLimit("ip:203.0.113.10", now + 10).limited, false);
  });
});

test("limite por alvo não mistura emails e não pode ser burlado alternando IP", () => {
  withCleanLimiter(() => {
    const now = 4_000_000;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      assert.equal(
        checkRegisterTargetLimit("primeira@example.com", now + attempt).limited,
        false,
      );
    }
    assert.equal(
      checkRegisterTargetLimit("primeira@example.com", now + 6).limited,
      true,
    );
    assert.equal(
      checkRegisterTargetLimit("segunda@example.com", now + 6).limited,
      false,
    );
  });
});

test("spam bruto continua bloqueado", () => {
  withCleanLimiter(() => {
    const now = 5_000_000;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      assert.equal(checkRegisterRequestLimit("ip:203.0.113.30", now + attempt).limited, false);
    }
    assert.equal(checkRegisterRequestLimit("ip:203.0.113.30", now + 61).limited, true);
  });
});

test("IP desconhecido usa circuito alto que não pode ser rotacionado por headers", () => {
  withCleanLimiter(() => {
    const key = getRegisterClientKey("unknown");
    assert.equal(key, "unidentified");
    assert.equal(getRegisterClientKey("203.0.113.40"), "ip:203.0.113.40");

    const now = 6_000_000;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      assert.equal(checkRegisterCreationLimit(key, now + attempt).limited, false);
    }
    assert.equal(checkRegisterCreationLimit(key, now + 101).limited, true);
  });
});

test("formatRetryWait comunica segundos, minutos e horas sem promessa vaga", () => {
  assert.equal(formatRetryWait(30), "menos de 1 minuto");
  assert.equal(formatRetryWait(60), "1 minuto");
  assert.equal(formatRetryWait(61), "2 minutos");
  assert.equal(formatRetryWait(3600), "1 hora");
});