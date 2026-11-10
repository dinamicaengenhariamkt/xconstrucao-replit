import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkRateLimit,
  rateLimitStoreSizeForTests,
  resetRateLimitStoreForTests,
  sweepExpiredRateLimits,
} from '../../features/auth/api/rate-limit';
import { tokenComFormatoValido } from '../../features/xgestao/obra-publica/token-formato';

beforeEach(() => {
  delete process.env.EMAIL_TEST_MODE;
  resetRateLimitStoreForTests();
});

test('PUB-03: formato do token é validado sem banco', () => {
  assert.equal(tokenComFormatoValido('a'.repeat(43)), true);
  assert.equal(tokenComFormatoValido('A_b-'.repeat(10) + 'xyz'), true);
  assert.equal(tokenComFormatoValido('a'.repeat(42)), false);
  assert.equal(tokenComFormatoValido('a'.repeat(44)), false);
  assert.equal(tokenComFormatoValido('a'.repeat(42) + '.'), false);
  assert.equal(tokenComFormatoValido('../../etc/passwd'), false);
  assert.equal(tokenComFormatoValido(undefined), false);
});

test('PUB-03: varredura remove só janelas vencidas', () => {
  const t0 = 1_000_000;
  checkRateLimit('a', 5, 1_000, t0);
  checkRateLimit('b', 5, 10_000, t0);
  assert.equal(rateLimitStoreSizeForTests(), 2);
  assert.equal(sweepExpiredRateLimits(t0 + 1_000), 1);
  assert.equal(rateLimitStoreSizeForTests(), 1);
  // A janela viva continua contando depois da varredura.
  assert.equal(checkRateLimit('b', 5, 10_000, t0 + 2_000).remaining, 3);
});

test('PUB-03: checkRateLimit varre sozinho depois do intervalo', () => {
  const t0 = 5_000_000;
  for (let i = 0; i < 50; i += 1) checkRateLimit(`ip:${i}`, 5, 1_000, t0);
  assert.equal(rateLimitStoreSizeForTests(), 50);
  checkRateLimit('novo', 5, 1_000, t0 + 61_000);
  assert.equal(rateLimitStoreSizeForTests(), 1);
});

test('limite continua igual: bloqueia acima do máximo na janela', () => {
  const t0 = 9_000_000;
  for (let i = 0; i < 3; i += 1) assert.equal(checkRateLimit('k', 3, 60_000, t0 + i).limited, false);
  assert.equal(checkRateLimit('k', 3, 60_000, t0 + 4).limited, true);
});
