import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrubEvent, scrubTransaction } from '../../lib/sentry-scrub';

const TOKEN = 'AbC_dEf-123456789012345678901234567890123ab';

test('PUB-04: mascara o token em request.url, transaction e breadcrumbs', () => {
  const out = scrubEvent({
    message: `falha em /publico/obra/${TOKEN}`,
    transaction: `/publico/obra/${TOKEN}`,
    request: { url: `https://x.app/publico/obra/${TOKEN}?aba=fotos#topo` },
    breadcrumbs: [
      { category: 'navigation', data: { from: '/', to: `/publico/obra/${TOKEN}` } },
      { category: 'fetch', data: { url: `https://x.app/publico/obra/${TOKEN}` } },
    ],
  });
  const json = JSON.stringify(out);
  assert.equal(json.includes(TOKEN), false);
  assert.equal(out.transaction, '/publico/obra/[TOKEN]');
  assert.equal(out.request.url, 'https://x.app/publico/obra/[TOKEN]?aba=fotos#topo');
  assert.equal(out.breadcrumbs[0].data.to, '/publico/obra/[TOKEN]');
});

test('PUB-04: beforeSendTransaction usa o mesmo scrub, inclusive em spans', () => {
  const out = scrubTransaction({
    type: 'transaction',
    transaction: `GET /publico/obra/${TOKEN}`,
    spans: [{ description: `GET https://x.app/publico/obra/${TOKEN}` }],
  });
  assert.equal(JSON.stringify(out).includes(TOKEN), false);
  assert.equal(out.transaction, 'GET /publico/obra/[TOKEN]');
});

test('rota parametrizada e outras URLs ficam intactas', () => {
  const out = scrubEvent({ transaction: '/publico/obra/[token]', request: { url: 'https://x.app/xgestao/obras/123' } });
  assert.equal(out.request.url, 'https://x.app/xgestao/obras/123');
  assert.equal(out.transaction, '/publico/obra/[TOKEN]');
});
