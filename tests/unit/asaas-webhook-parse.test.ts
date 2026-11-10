import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { AsaasGateway, tipoDoEventoAsaas } from '../../features/planos/gateway/asaas-gateway';
import { ManualGateway } from '../../features/planos/gateway/manual-gateway';
import { conferirChaveAsaas, exigirChaveAsaasCoerente } from '../../shared/lib/asaas-client';

/**
 * TST-01 — autenticação e mapeamento do webhook do Asaas.
 * PAG-03/PAG-04 — cobrança apagada e estorno/chargeback.
 * TST-20 — o gateway manual (Playwright) monta o mesmo evento da rota real.
 * PAG-08 — chave x ambiente do Asaas.
 */
const env = process.env as Record<string, string | undefined>;
const ORIGINAL = { ...env };

afterEach(() => {
  for (const chave of ['NODE_ENV', 'ASAAS_WEBHOOK_TOKEN', 'ASAAS_WEBHOOK_IPS']) {
    if (ORIGINAL[chave] === undefined) delete env[chave];
    else env[chave] = ORIGINAL[chave];
  }
});

const REF = 'xconstrucao|user-1|plano-1|mensal';

/** Fora de produção, sem token nem IPs: o mapeamento é testado isolado do env real. */
function semAutenticacao() {
  env.NODE_ENV = 'test';
  delete env.ASAAS_WEBHOOK_TOKEN;
  delete env.ASAAS_WEBHOOK_IPS;
}

function corpo(event: string, payment: Record<string, unknown> = {}) {
  return JSON.stringify({ event, payment: { id: 'pay_1', subscription: 'sub_1', externalReference: REF, value: 99, ...payment } });
}

test('TST-01 sem token e sem IPs em produção: recusa', async () => {
  env.NODE_ENV = 'production';
  delete env.ASAAS_WEBHOOK_TOKEN;
  delete env.ASAAS_WEBHOOK_IPS;
  await assert.rejects(new AsaasGateway().parseWebhook(corpo('PAYMENT_CONFIRMED'), {}), /sem autenticação/);
});

test('TST-01 token errado recusa; token certo passa', async () => {
  env.NODE_ENV = 'production';
  env.ASAAS_WEBHOOK_TOKEN = 'token-certo';
  delete env.ASAAS_WEBHOOK_IPS;
  const gw = new AsaasGateway();
  await assert.rejects(gw.parseWebhook(corpo('PAYMENT_CONFIRMED'), { 'asaas-access-token': 'errado' }), /token inválido/);
  await assert.rejects(gw.parseWebhook(corpo('PAYMENT_CONFIRMED'), {}), /token inválido/);
  const evt = await gw.parseWebhook(corpo('PAYMENT_CONFIRMED'), { 'asaas-access-token': 'token-certo' });
  assert.equal(evt.type, 'payment_succeeded');
  assert.equal(evt.eventId, 'PAYMENT_CONFIRMED:pay_1');
  assert.equal(evt.paymentId, 'pay_1');
  assert.equal(evt.gatewaySubscriptionId, 'sub_1');
});

test('TST-01 IP fora da lista recusa; IP da lista passa', async () => {
  env.NODE_ENV = 'production';
  delete env.ASAAS_WEBHOOK_TOKEN;
  env.ASAAS_WEBHOOK_IPS = '10.0.0.1, 10.0.0.2';
  const gw = new AsaasGateway();
  await assert.rejects(gw.parseWebhook(corpo('PAYMENT_CONFIRMED'), {}, '10.9.9.9'), /IP não autorizado/);
  await assert.rejects(gw.parseWebhook(corpo('PAYMENT_CONFIRMED'), {}), /IP não autorizado/);
  assert.equal((await gw.parseWebhook(corpo('PAYMENT_CONFIRMED'), {}, '10.0.0.2')).type, 'payment_succeeded');
});

test('PAG-03 PAYMENT_DELETED de assinatura não é falha; de obra/anúncio segue payment_failed', async () => {
  semAutenticacao();
  const gw = new AsaasGateway();
  assert.equal((await gw.parseWebhook(corpo('PAYMENT_DELETED'), {})).type, 'payment_deleted');
  assert.equal((await gw.parseWebhook(corpo('PAYMENT_DELETED', { externalReference: undefined }), {})).type, 'payment_deleted');
  assert.equal(
    (await gw.parseWebhook(corpo('PAYMENT_DELETED', { externalReference: 'xconstrucao-obra|f|o|s', subscription: undefined }), {})).type,
    'payment_failed',
  );
  assert.equal(
    (await gw.parseWebhook(corpo('PAYMENT_DELETED', { externalReference: 'xconstrucao-anuncio|p', subscription: undefined }), {})).type,
    'payment_failed',
  );
  assert.equal((await gw.parseWebhook(corpo('PAYMENT_OVERDUE'), {})).type, 'payment_failed');
});

test('PAG-04/REV-08 só pedido de estorno e chargeback viram payment_refunded, com motivo; obra/anúncio seguem ignorados', async () => {
  semAutenticacao();
  const gw = new AsaasGateway();
  for (const [event, motivo] of [
    ['PAYMENT_REFUNDED', 'estorno'],
    ['PAYMENT_REFUND_IN_PROGRESS', 'estorno'],
    ['PAYMENT_CHARGEBACK_REQUESTED', 'chargeback'],
  ] as const) {
    const evt = await gw.parseWebhook(corpo(event), {});
    assert.equal(evt.type, 'payment_refunded', event);
    assert.equal(evt.motivo, motivo, event);
    assert.equal(evt.eventId, `${event}:pay_1`);
    assert.equal(
      (await gw.parseWebhook(corpo(event, { externalReference: 'xconstrucao-obra|f|o|s', subscription: undefined }), {})).type,
      'ignored',
    );
    // Gateway manual (Playwright) segue a mesma regra.
    const manual = await new ManualGateway().parseWebhook(corpo(event), {});
    assert.equal(manual.type, 'payment_refunded', `manual ${event}`);
    assert.equal(manual.motivo, motivo, `manual ${event}`);
  }
  // REV-08: disputa e espera da reversão não encerram nada (chargeback já veio como REQUESTED).
  for (const event of ['PAYMENT_CHARGEBACK_DISPUTE', 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL']) {
    assert.equal(tipoDoEventoAsaas(event, REF, true), 'ignored', event);
    const evt = await gw.parseWebhook(corpo(event), {});
    assert.equal(evt.type, 'ignored', event);
    assert.equal(evt.motivo, undefined, event);
  }
  // Outros tipos não levam motivo.
  assert.equal((await gw.parseWebhook(corpo('PAYMENT_CONFIRMED'), {})).motivo, undefined);
  // Estorno parcial não encerra assinatura.
  assert.equal(tipoDoEventoAsaas('PAYMENT_PARTIALLY_REFUNDED', REF, true), 'ignored');
  // Sem subscription não há assinatura para encerrar.
  assert.equal(tipoDoEventoAsaas('PAYMENT_REFUNDED', REF, false), 'ignored');
  assert.equal(tipoDoEventoAsaas('PAYMENT_CREATED', 'xconstrucao-obra|f|o|s', false), 'ignored');
  assert.equal(tipoDoEventoAsaas('PAYMENT_CREATED', REF, true), 'payment_created');
});

test('TST-20 gateway manual: CONFIRMED e RECEIVED do mesmo pagamento têm ids distintos e o mesmo paymentId', async () => {
  const gw = new ManualGateway();
  const confirmado = await gw.parseWebhook(corpo('PAYMENT_CONFIRMED'), {});
  const recebido = await gw.parseWebhook(corpo('PAYMENT_RECEIVED'), {});
  assert.notEqual(confirmado.eventId, recebido.eventId);
  assert.equal(confirmado.paymentId, 'pay_1');
  assert.equal(recebido.paymentId, 'pay_1');
  assert.equal((await gw.parseWebhook(corpo('PAYMENT_DELETED'), {})).type, 'payment_deleted');
  assert.equal((await gw.parseWebhook(corpo('PAYMENT_REFUNDED'), {})).type, 'payment_refunded');
  assert.equal(
    (await gw.parseWebhook(corpo('PAYMENT_DELETED', { externalReference: 'xconstrucao-anuncio|p', subscription: undefined }), {})).type,
    'payment_failed',
  );
});

test('PAG-08 chave do Asaas precisa combinar com o ambiente', () => {
  const sandbox = '$aact_hmlg_000Teste';
  const prod = '$aact_prod_000Teste';
  assert.deepEqual(conferirChaveAsaas({ PAYMENT_GATEWAY: 'manual' }), { ok: true });
  assert.deepEqual(conferirChaveAsaas({ PAYMENT_GATEWAY: 'asaas', ASAAS_ENVIRONMENT: 'sandbox', ASAAS_API_KEY: sandbox }), { ok: true });
  assert.deepEqual(conferirChaveAsaas({ PAYMENT_GATEWAY: 'asaas', ASAAS_ENVIRONMENT: 'production', ASAAS_API_KEY: prod }), { ok: true });
  for (const caso of [
    { PAYMENT_GATEWAY: 'asaas', ASAAS_ENVIRONMENT: 'sandbox', ASAAS_API_KEY: prod },
    { PAYMENT_GATEWAY: 'asaas', ASAAS_ENVIRONMENT: 'production', ASAAS_API_KEY: sandbox },
    { PAYMENT_GATEWAY: 'asaas', ASAAS_ENVIRONMENT: 'production' },
    { PAYMENT_GATEWAY: 'asaas', ASAAS_API_KEY: prod },
  ]) {
    const r = conferirChaveAsaas(caso);
    assert.equal(r.ok, false, JSON.stringify({ ...caso, ASAAS_API_KEY: caso.ASAAS_API_KEY ? 'x' : undefined }));
    // O motivo nunca expõe a chave.
    if (!r.ok) {
      assert.ok(!r.motivo.includes(sandbox) && !r.motivo.includes(prod));
    }
  }
  // Só recusa checkout em produção.
  const errado = { PAYMENT_GATEWAY: 'asaas', ASAAS_ENVIRONMENT: 'production', ASAAS_API_KEY: sandbox };
  assert.doesNotThrow(() => exigirChaveAsaasCoerente({ ...errado, NODE_ENV: 'development' }));
  assert.throws(() => exigirChaveAsaasCoerente({ ...errado, NODE_ENV: 'production' }), /^Error: \[asaas\] configuração incoerente/);
  assert.doesNotThrow(() => exigirChaveAsaasCoerente({ PAYMENT_GATEWAY: 'asaas', ASAAS_ENVIRONMENT: 'production', ASAAS_API_KEY: prod, NODE_ENV: 'production' }));
});
