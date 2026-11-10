import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assinaturaXgestaoVigente,
  bloqueioDoTeste,
  CARENCIA_INADIMPLENCIA_DIAS,
  primeiraCobrancaComBonus,
  somarMeses,
  TOLERANCIA_FIM_TESTE_MS,
} from '../../features/xgestao/lib/acesso-plano';
import { formatarContagem } from '../../features/xgestao/teste/contagem';
import { AsaasGateway, nextDueDate } from '../../features/planos/gateway/asaas-gateway';

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;
const agora = new Date('2026-11-09T15:00:00Z');

test('XG43 fim do teste: 24h de tolerância, depois somente leitura', () => {
  assert.equal(TOLERANCIA_FIM_TESTE_MS, DIA);
  const fim = new Date('2026-11-09T10:00:00Z');
  assert.equal(bloqueioDoTeste(fim).toISOString(), '2026-11-10T10:00:00.000Z');
  const trial = { status: 'ativa', provider: 'trial', preco: 99, renovaEm: fim };
  assert.equal(assinaturaXgestaoVigente(trial, new Date(fim.getTime() + 23 * HORA)), true);
  assert.equal(assinaturaXgestaoVigente(trial, new Date(fim.getTime() + DIA)), false);
  assert.equal(assinaturaXgestaoVigente(trial, new Date(fim.getTime() + DIA + 1)), false);
  // Teste já gravado como expirado nunca volta, mesmo dentro da janela.
  assert.equal(assinaturaXgestaoVigente({ ...trial, status: 'expirada' }, new Date(fim.getTime() + HORA)), false);
});

test('XG43 cancelamento pelo assinante vale até o fim do período pago', () => {
  const renovaEm = new Date(agora.getTime() + 10 * DIA);
  const paga = { status: 'ativa', provider: 'asaas', preco: '179.00', renovaEm, canceladaEm: agora };
  assert.equal(assinaturaXgestaoVigente(paga, agora), true);
  assert.equal(assinaturaXgestaoVigente(paga, new Date(renovaEm.getTime() - 1)), true);
  assert.equal(assinaturaXgestaoVigente(paga, renovaEm), false);
  assert.equal(assinaturaXgestaoVigente({ ...paga, renovaEm: null }, agora), false);
  // Sem cancelamento, a data antiga de renovação não bloqueia quem paga em dia.
  assert.equal(assinaturaXgestaoVigente({ ...paga, canceladaEm: null, renovaEm: new Date('2026-01-01') }, agora), true);
});

test('XG43 pagamento recusado: carência de 7 dias contados do vencimento', () => {
  assert.equal(CARENCIA_INADIMPLENCIA_DIAS, 7);
  const vencimento = new Date('2026-11-01T15:00:00Z');
  const inad = { status: 'inadimplente', provider: 'asaas', preco: 299, renovaEm: vencimento };
  assert.equal(assinaturaXgestaoVigente(inad, new Date(vencimento.getTime() + 7 * DIA - 1)), true);
  assert.equal(assinaturaXgestaoVigente(inad, new Date(vencimento.getTime() + 7 * DIA)), false);
  assert.equal(assinaturaXgestaoVigente({ ...inad, renovaEm: null }, vencimento), false);
  assert.equal(assinaturaXgestaoVigente({ ...inad, preco: 0 }, vencimento), false);
  for (const status of ['cancelada', 'expirada', 'pendente_reativacao']) {
    assert.equal(assinaturaXgestaoVigente({ ...inad, status }, vencimento), false);
  }
});

test('XG43 +1 mês: soma mês de calendário sem pular o fim do mês', () => {
  assert.equal(somarMeses(new Date('2027-01-31T13:00:00Z'), 1).toISOString(), '2027-02-28T13:00:00.000Z');
  assert.equal(somarMeses(new Date('2028-01-31T13:00:00Z'), 1).toISOString(), '2028-02-29T13:00:00.000Z');
  assert.equal(somarMeses(new Date('2026-12-15T09:30:00Z'), 1).toISOString(), '2027-01-15T09:30:00.000Z');
  assert.equal(somarMeses(new Date('2026-03-31T00:00:00Z'), 12).toISOString(), '2027-03-31T00:00:00.000Z');
  const fim = new Date('2027-02-07T15:00:00Z');
  assert.equal(primeiraCobrancaComBonus(fim).toISOString(), '2027-03-07T15:00:00.000Z');
});

test('XG43 Asaas: 1ª cobrança futura no dia de São Paulo; sem bônus, em 5 minutos', () => {
  assert.equal(nextDueDate(undefined, agora), '2026-11-09 15:05:00');
  // 02:00 UTC de 01/03 ainda é 28/02 em São Paulo.
  assert.equal(nextDueDate(new Date('2027-03-01T02:00:00Z'), agora), '2027-02-28 00:00:00');
  assert.equal(nextDueDate(new Date('2027-03-07T15:00:00Z'), agora), '2027-03-07 00:00:00');
  // Data no passado ou em menos de 1 dia não adia a cobrança.
  assert.equal(nextDueDate(new Date(agora.getTime() + 2 * HORA), agora), '2026-11-09 15:05:00');
  assert.equal(nextDueDate(new Date(agora.getTime() - DIA), agora), '2026-11-09 15:05:00');
});

test('XG43 Asaas: PAYMENT_CREATED só vale para assinatura da plataforma e traz o vencimento', async () => {
  // O teste não depende do ASAAS_WEBHOOK_TOKEN do ambiente: fixa um token
  // próprio, manda no cabeçalho como o Asaas faz e devolve o valor original.
  const tokenOriginal = process.env.ASAAS_WEBHOOK_TOKEN;
  process.env.ASAAS_WEBHOOK_TOKEN = 'token-teste-unitario-xg43';
  const cabecalho = { 'asaas-access-token': 'token-teste-unitario-xg43' };
  try {
    const gw = new AsaasGateway();
    const evento = (event: string, externalReference: string) => JSON.stringify({
      event,
      payment: { id: 'pay_1', subscription: 'sub_1', customer: 'cus_1', externalReference, value: 99, dueDate: '2027-03-07' },
    });
    const plataforma = await gw.parseWebhook(evento('PAYMENT_CREATED', 'xconstrucao|u|p|mensal'), cabecalho);
    assert.equal(plataforma.type, 'payment_created');
    assert.equal(plataforma.dueDate, '2027-03-07');
    assert.equal(plataforma.gatewaySubscriptionId, 'sub_1');
    assert.equal(plataforma.eventId, 'PAYMENT_CREATED:pay_1');
    for (const ref of ['xconstrucao-obra|x|y', 'xconstrucao-anuncio|z', '']) {
      assert.equal((await gw.parseWebhook(evento('PAYMENT_CREATED', ref), cabecalho)).type, 'ignored');
    }
    const pago = await gw.parseWebhook(evento('PAYMENT_CONFIRMED', 'xconstrucao|u|p|mensal'), cabecalho);
    assert.equal(pago.type, 'payment_succeeded');
    assert.equal(pago.dueDate, '2027-03-07');
    // Token errado continua recusado: o teste não afrouxa a checagem.
    await assert.rejects(gw.parseWebhook(evento('PAYMENT_CREATED', 'xconstrucao|u|p|mensal'), { 'asaas-access-token': 'errado' }), /token inválido/);
  } finally {
    if (tokenOriginal === undefined) delete process.env.ASAAS_WEBHOOK_TOKEN;
    else process.env.ASAAS_WEBHOOK_TOKEN = tokenOriginal;
  }
});

test('XG43 relógio regressivo da faixa', () => {
  assert.equal(formatarContagem(12 * DIA + 4 * HORA + 31 * 60_000 + 59_000), '12d 04h 31min');
  assert.equal(formatarContagem(DIA), '1d 00h 00min');
  assert.equal(formatarContagem(DIA - 1000), '23h 59min 59s');
  assert.equal(formatarContagem(4 * HORA + 31 * 60_000 + 9_000), '04h 31min 09s');
  assert.equal(formatarContagem(0), '00h 00min 00s');
  assert.equal(formatarContagem(-5_000), '00h 00min 00s');
});
