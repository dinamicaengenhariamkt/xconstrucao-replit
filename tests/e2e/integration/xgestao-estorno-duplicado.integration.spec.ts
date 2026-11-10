import { expect, test, type APIRequestContext } from '@playwright/test';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturaEventos, assinaturas, financeiro } from '@shared/db/schema';
import { aplicarEventoWebhook } from '@features/planos/assinatura-service';
import { _overrideGatewayForTest, type PaymentGateway } from '@features/planos/gateway';
import { ManualGateway } from '@features/planos/gateway/manual-gateway';
import { somarMeses } from '@features/xgestao/lib/acesso-plano';
import { ORIGEM_ESTORNO_MENSALIDADE_XGESTAO, ORIGEM_MENSALIDADE_XGESTAO } from '@features/xgestao/lib/receita';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';

/**
 * 10/11/2026 — estorno automático do pagamento de assinatura duplicada (XG50,
 * docs/jornadas-xgestao/50-fluxo-pagamento-validacao.md).
 *
 * Os eventos passam pelo mesmo `aplicarEventoWebhook` do handler real, no
 * processo do teste, com um gateway espião: nada vai ao Asaas.
 */
function uid(rotulo: string) {
  return `xgdup_${rotulo}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function diaSp(data: Date): string {
  return data.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

type Espiao = { gateway: PaymentGateway; cancelados: string[]; estornados: string[]; falharEstorno: number };

function criarEspiao(): Espiao {
  const manual = new ManualGateway();
  const e: Espiao = { cancelados: [], estornados: [], falharEstorno: 0, gateway: undefined as unknown as PaymentGateway };
  e.gateway = {
    provider: 'manual',
    createCheckout: (i) => manual.createCheckout({ ...i, pendingMode: true }),
    parseWebhook: (b, h, ip) => manual.parseWebhook(b, h, ip),
    checkPaymentStatus: (id) => manual.checkPaymentStatus(id),
    cancelSubscription: async (id) => { if (id) e.cancelados.push(id); },
    atualizarValorAssinatura: async () => undefined,
    proximaCobrancaPendente: async () => null,
    atualizarValorCobranca: async () => undefined,
    refundPayment: async (paymentId) => {
      if (e.falharEstorno > 0) {
        e.falharEstorno -= 1;
        throw new Error('HTTP 500 simulado');
      }
      e.estornados.push(paymentId);
    },
  };
  return e;
}

async function planoBasic(request: APIRequestContext) {
  const catalogo = await (await request.get('/api/planos?persona=xgestao')).json() as Array<{ id: string; tier: string }>;
  return catalogo.find((p) => p.tier === 'basic')!.id;
}

async function eventos(userId: string, tipo: string) {
  return db.select().from(assinaturaEventos).where(and(eq(assinaturaEventos.userId, userId), eq(assinaturaEventos.tipo, tipo)));
}

async function ativas(userId: string) {
  return db.select().from(assinaturas).where(and(
    eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao'), eq(assinaturas.status, 'ativa'),
  ));
}

async function caixaDoPagamento(paymentId: string) {
  return db.select().from(financeiro).where(and(
    eq(financeiro.origemId, paymentId),
    inArray(financeiro.origemTipo, [ORIGEM_MENSALIDADE_XGESTAO, ORIGEM_ESTORNO_MENSALIDADE_XGESTAO]),
  ));
}

/** Conta no teste que assina (subA, 1ª cobrança futura): plano pago ativo e válido. */
async function contaComPlanoPago(request: APIRequestContext, rotulo: string) {
  const { userId } = await novoAssinanteHomologacao(request, rotulo);
  const basic = await planoBasic(request);
  const [teste] = await db.select().from(assinaturas).where(and(eq(assinaturas.userId, userId), eq(assinaturas.gatewayProvider, 'trial')));
  const ref = `xconstrucao|${userId}|${basic}|mensal`;
  const subA = uid('subA');
  await aplicarEventoWebhook({
    eventId: `PAYMENT_CREATED:${uid('pA')}`, type: 'payment_created', gatewaySubscriptionId: subA,
    externalReference: ref, dueDate: diaSp(somarMeses(teste.renovaEm!, 1)), paymentId: uid('pA'), valor: 99,
  });
  const [valida] = await ativas(userId);
  expect(valida.gatewaySubscriptionId).toBe(subA);
  // Já pagou a 1ª: plano pago "de verdade", sem cancelamento agendado.
  await db.update(assinaturas).set({ primeiroPagamentoEm: new Date(), fimTesteEm: null }).where(eq(assinaturas.id, valida.id));
  return { userId, ref, valida };
}

test.describe('XG50 — estorno automático do pagamento em dobro', () => {
  test.afterEach(() => { _overrideGatewayForTest(null); });

  test('duplicada paga: estorna 1 vez, a válida fica intacta, reprocessar não estorna de novo, o REFUNDED depois não mexe na válida', async ({ request }) => {
    const espiao = criarEspiao();
    _overrideGatewayForTest(espiao.gateway);
    const { userId, ref, valida } = await contaComPlanoPago(request, 'dup-estorno');

    const subC = uid('subC');
    const pC = uid('pC');
    const base = { gatewaySubscriptionId: subC, externalReference: ref, dueDate: diaSp(new Date()), paymentId: pC, valor: 99 };

    const confirmado = await aplicarEventoWebhook({ ...base, eventId: `PAYMENT_CONFIRMED:${pC}`, type: 'payment_succeeded' });
    expect(confirmado.processed).toBe(true);
    expect(espiao.cancelados).toContain(subC);
    expect(espiao.estornados).toEqual([pC]);

    // RECEIVED do mesmo pagamento (outro eventId) e a mesma entrega repetida.
    await aplicarEventoWebhook({ ...base, eventId: `PAYMENT_RECEIVED:${pC}`, type: 'payment_succeeded' });
    const repetido = await aplicarEventoWebhook({ ...base, eventId: `PAYMENT_CONFIRMED:${pC}`, type: 'payment_succeeded' });
    expect(repetido.processed).toBe(false);
    expect(espiao.estornados).toEqual([pC]);

    const estornados = await eventos(userId, 'pagamento_duplicado_estornado');
    expect(estornados).toHaveLength(1);
    expect(estornados[0].payloadJson).toMatchObject({ paymentId: pC, valor: 99 });
    expect(estornados[0].assinaturaId).toBe(valida.id);
    expect(await eventos(userId, 'pagamento_duplicado_estorno_falhou')).toHaveLength(0);
    const duplicadas = await eventos(userId, 'assinatura_duplicada_cancelada');
    expect(duplicadas.filter((e) => e.payloadJson.estornoAutomatico === true)).toHaveLength(1);

    // O gateway devolve o PAYMENT_REFUNDED da duplicada.
    await aplicarEventoWebhook({ ...base, eventId: `PAYMENT_REFUNDED:${pC}`, type: 'payment_refunded', motivo: 'estorno' });
    const [depois] = await ativas(userId);
    expect(depois.id).toBe(valida.id);
    expect(depois.status).toBe('ativa');
    expect(depois.canceladaEm).toBeNull();
    expect(depois.renovaEm?.getTime()).toBe(valida.renovaEm?.getTime());
    expect(espiao.cancelados).not.toContain(valida.gatewaySubscriptionId);
    // Caixa: nem a entrada da duplicada nem a saída do estorno.
    expect(await caixaDoPagamento(pC)).toHaveLength(0);
    // Nenhum aviso de inadimplência/cancelamento na conta.
    const perfil = await (await request.get('/api/perfil/plano?persona=xgestao')).json();
    expect(perfil.inadimplente ?? false).toBe(false);
    expect(perfil.somenteLeitura ?? false).toBe(false);
  });

  test('estorno que falha fica registrado e a próxima entrega tenta de novo', async ({ request }) => {
    const espiao = criarEspiao();
    espiao.falharEstorno = 1;
    _overrideGatewayForTest(espiao.gateway);
    const { userId, ref, valida } = await contaComPlanoPago(request, 'dup-falha');

    const subD = uid('subD');
    const pD = uid('pD');
    const base = { gatewaySubscriptionId: subD, externalReference: ref, dueDate: diaSp(new Date()), paymentId: pD, valor: 99 };

    await aplicarEventoWebhook({ ...base, eventId: `PAYMENT_CONFIRMED:${pD}`, type: 'payment_succeeded' });
    expect(espiao.estornados).toEqual([]);
    const falhas = await eventos(userId, 'pagamento_duplicado_estorno_falhou');
    expect(falhas).toHaveLength(1);
    expect(falhas[0].payloadJson).toMatchObject({ paymentId: pD });

    await aplicarEventoWebhook({ ...base, eventId: `PAYMENT_RECEIVED:${pD}`, type: 'payment_succeeded' });
    expect(espiao.estornados).toEqual([pD]);
    expect(await eventos(userId, 'pagamento_duplicado_estornado')).toHaveLength(1);

    // Terceira entrega: já estornado, nada mais.
    await aplicarEventoWebhook({ ...base, eventId: `PAYMENT_RECEIVED:${pD}:retry`, type: 'payment_succeeded' });
    expect(espiao.estornados).toEqual([pD]);
    expect((await ativas(userId)).map((a) => a.id)).toEqual([valida.id]);
  });

  test('duplicada só criada (1ª cobrança futura): cancela a assinatura, sem estorno', async ({ request }) => {
    const espiao = criarEspiao();
    _overrideGatewayForTest(espiao.gateway);
    const { userId, ref, valida } = await contaComPlanoPago(request, 'dup-pendente');

    const subE = uid('subE');
    await aplicarEventoWebhook({
      eventId: `PAYMENT_CREATED:${uid('pE')}`, type: 'payment_created', gatewaySubscriptionId: subE,
      externalReference: ref, dueDate: diaSp(somarMeses(new Date(), 1)), paymentId: uid('pE'), valor: 99,
    });
    expect(espiao.cancelados).toContain(subE);
    expect(espiao.estornados).toEqual([]);
    expect(await eventos(userId, 'pagamento_duplicado_estornado')).toHaveLength(0);
    expect((await ativas(userId)).map((a) => a.id)).toEqual([valida.id]);
  });
});
