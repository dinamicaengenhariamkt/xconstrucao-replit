import { expect, test, type APIRequestContext } from '@playwright/test';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturaEventos, assinaturas, financeiro, planos } from '@shared/db/schema';
import { aplicarEventoWebhook } from '@features/planos/assinatura-service';
import { _overrideGatewayForTest, type PaymentGateway } from '@features/planos/gateway';
import { ManualGateway } from '@features/planos/gateway/manual-gateway';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';

/**
 * Auditoria pré-lançamento (doc 47) — pagamentos do xgestão:
 * - TST-20: rota REAL `/api/webhooks/gateway` (gateway manual faz o parse no
 *   formato do Asaas): CONFIRMED + RECEIVED do mesmo pagamento = 1 mensalidade;
 * - PAG-04: estorno/chargeback encerra a assinatura e lança 1 estorno no caixa;
 * - PAG-03: cobrança apagada não gera inadimplência nem revive cancelada
 *   (xgestão e marketplace);
 * - PAG-06: nova assinatura substitui a inadimplente e cancela a antiga no gateway;
 * - regra de 10/11/2026: mês bônus só com o 1º pagamento, uma vez por conta.
 */
const DIA_MS = 24 * 60 * 60_000;

function uid(rotulo: string) {
  return `aud47_${rotulo}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function hojeSp() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

async function planoId(request: APIRequestContext, tier: string): Promise<string> {
  const catalogo = await (await request.get('/api/planos?persona=xgestao')).json() as Array<{ id: string; tier: string }>;
  return catalogo.find((p) => p.tier === tier)!.id;
}

async function perfil(request: APIRequestContext) {
  const resposta = await request.get('/api/perfil/plano?persona=xgestao');
  expect(resposta.status(), await resposta.text()).toBe(200);
  return resposta.json();
}

async function assinar(request: APIRequestContext, tier: string) {
  const r = await request.post('/api/assinaturas/checkout', {
    data: { planoId: await planoId(request, tier), persona: 'xgestao', ciclo: 'mensal' },
  });
  expect(r.status(), await r.text()).toBe(201);
  return r.json() as Promise<{ primeiraCobrancaEm?: string }>;
}

async function cancelar(request: APIRequestContext) {
  const r = await request.post('/api/assinaturas/cancelar', { data: { persona: 'xgestao' } });
  expect(r.status(), await r.text()).toBe(200);
  return r.json() as Promise<{ ok: boolean; acessoAte?: string }>;
}

async function webhookReal(request: APIRequestContext, event: string, payment: Record<string, unknown>) {
  const r = await request.post('/api/webhooks/gateway', { data: { event, payment } });
  expect(r.status(), await r.text()).toBe(200);
  return r.json() as Promise<{ received: boolean; processed: boolean }>;
}

async function pagaXgestao(userId: string) {
  const linhas = await db.select().from(assinaturas).where(and(eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao')));
  return linhas.filter((a) => a.gatewayProvider !== 'trial');
}

test.describe('Auditoria 47 — pagamentos do xgestão', () => {
  test('TST-20 + PAG-04: rota real conta 1 mensalidade por pagamento; estorno encerra e lança 1 estorno', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'tst20');
    const basic = await planoId(request, 'basic');
    const sub = uid('sub');
    const pagamento = uid('pay');
    const payment = { id: pagamento, subscription: sub, externalReference: `xconstrucao|${userId}|${basic}|mensal`, value: 99, dueDate: hojeSp() };
    try {
      expect((await webhookReal(request, 'PAYMENT_CONFIRMED', payment)).processed).toBe(true);
      expect((await webhookReal(request, 'PAYMENT_RECEIVED', payment)).processed).toBe(true);
      // Reentrega do mesmo evento: deduplicada.
      expect((await webhookReal(request, 'PAYMENT_RECEIVED', payment)).processed).toBe(false);

      const mensalidades = await db.select().from(financeiro).where(and(
        eq(financeiro.origemTipo, 'xgestao_mensalidade'), eq(financeiro.origemId, pagamento),
      ));
      expect(mensalidades).toHaveLength(1);
      expect(Number(mensalidades[0].valor)).toBe(99);
      const [paga] = await db.select().from(assinaturas).where(eq(assinaturas.gatewaySubscriptionId, sub));
      expect(paga).toMatchObject({ status: 'ativa', persona: 'xgestao' });
      expect(paga.primeiroPagamentoEm).not.toBeNull();
      expect(await perfil(request)).toMatchObject({ plano: 'basic', somenteLeitura: false });

      // PAG-04 — estorno, depois chargeback do mesmo pagamento.
      expect((await webhookReal(request, 'PAYMENT_REFUNDED', payment)).processed).toBe(true);
      expect((await webhookReal(request, 'PAYMENT_CHARGEBACK_REQUESTED', payment)).processed).toBe(true);
      const [encerrada] = await db.select().from(assinaturas).where(eq(assinaturas.id, paga.id));
      expect(encerrada.status).toBe('cancelada');
      const estornos = await db.select().from(financeiro).where(and(
        eq(financeiro.origemTipo, 'xgestao_mensalidade_estorno'), eq(financeiro.origemId, pagamento),
      ));
      expect(estornos).toHaveLength(1);
      expect(estornos[0]).toMatchObject({ tipo: 'saida', status: 'pago', escopo: 'plataforma', recebedorUserId: userId });
      expect(Number(estornos[0].valor)).toBe(99);
      const eventos = await db.select().from(assinaturaEventos).where(and(
        eq(assinaturaEventos.assinaturaId, paga.id), eq(assinaturaEventos.tipo, 'payment_refunded'),
      ));
      expect(eventos.length).toBe(2);
      expect(eventos[0].payloadJson).toMatchObject({ paymentId: pagamento });
      expect(await perfil(request)).toMatchObject({ somenteLeitura: true });
    } finally {
      await db.delete(financeiro).where(inArray(financeiro.origemId, [pagamento]));
    }
  });

  test('PAG-03 xgestão: cobrança apagada não gera inadimplência, mantém o cancelamento agendado e não revive cancelada', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'pag03');
    await assinar(request, 'basic');
    const [paga] = await pagaXgestao(userId);
    await cancelar(request);
    const [agendada] = await db.select().from(assinaturas).where(eq(assinaturas.id, paga.id));
    const payment = {
      id: uid('pay'), subscription: paga.gatewaySubscriptionId,
      externalReference: `xconstrucao|${userId}|${paga.planoId}|mensal`, value: 99,
    };
    expect((await webhookReal(request, 'PAYMENT_DELETED', payment)).processed).toBe(true);
    expect((await webhookReal(request, 'PAYMENT_OVERDUE', { ...payment, id: uid('pay') })).processed).toBe(true);
    const [depois] = await db.select().from(assinaturas).where(eq(assinaturas.id, paga.id));
    expect(depois).toMatchObject({ status: 'ativa', canceladaEm: agendada.canceladaEm, renovaEm: agendada.renovaEm });
    expect(await perfil(request)).toMatchObject({ cancelamentoAgendado: true, inadimplente: false, somenteLeitura: false });

    // Já encerrada: nenhum evento de cobrança a revive.
    await db.update(assinaturas).set({ status: 'cancelada' }).where(eq(assinaturas.id, paga.id));
    await webhookReal(request, 'PAYMENT_DELETED', { ...payment, id: uid('pay') });
    await webhookReal(request, 'PAYMENT_OVERDUE', { ...payment, id: uid('pay') });
    expect((await db.select().from(assinaturas).where(eq(assinaturas.id, paga.id)))[0].status).toBe('cancelada');
  });

  test('PAG-03 marketplace: cancelada não volta; ativa com cobrança apagada segue como antes (inadimplente)', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'pag03-mkt', { iniciarTeste: false });
    const [pro] = await db.select().from(planos).where(and(eq(planos.persona, 'empreiteiro'), eq(planos.tier, 'pro')));
    const subCancelada = uid('sub');
    const subAtiva = uid('sub');
    const ref = `xconstrucao|${userId}|${pro.id}|mensal`;
    const criadas = await db.insert(assinaturas).values([
      { userId, planoId: pro.id, persona: 'empreiteiro', status: 'cancelada', canceladaEm: new Date(), gatewayProvider: 'asaas', gatewaySubscriptionId: subCancelada },
      { userId, planoId: pro.id, persona: 'empreiteiro', status: 'ativa', renovaEm: new Date(Date.now() + 20 * DIA_MS), gatewayProvider: 'asaas', gatewaySubscriptionId: subAtiva },
    ]).returning({ id: assinaturas.id });
    try {
      await webhookReal(request, 'PAYMENT_DELETED', { id: uid('pay'), subscription: subCancelada, externalReference: ref });
      await webhookReal(request, 'PAYMENT_OVERDUE', { id: uid('pay'), subscription: subCancelada, externalReference: ref });
      expect((await db.select().from(assinaturas).where(eq(assinaturas.gatewaySubscriptionId, subCancelada)))[0].status).toBe('cancelada');
      await webhookReal(request, 'PAYMENT_DELETED', { id: uid('pay'), subscription: subAtiva, externalReference: ref });
      expect((await db.select().from(assinaturas).where(eq(assinaturas.gatewaySubscriptionId, subAtiva)))[0].status).toBe('inadimplente');
      // Estorno de assinatura do marketplace segue sem efeito.
      await db.update(assinaturas).set({ status: 'ativa' }).where(eq(assinaturas.gatewaySubscriptionId, subAtiva));
      await webhookReal(request, 'PAYMENT_REFUNDED', { id: uid('pay'), subscription: subAtiva, externalReference: ref, value: 89 });
      expect((await db.select().from(assinaturas).where(eq(assinaturas.gatewaySubscriptionId, subAtiva)))[0].status).toBe('ativa');
    } finally {
      await db.delete(assinaturas).where(inArray(assinaturas.id, criadas.map((c) => c.id)));
    }
  });

  test('PAG-06: nova assinatura substitui a inadimplente e cancela a antiga no gateway', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'pag06');
    await assinar(request, 'basic');
    const [antiga] = await pagaXgestao(userId);
    await db.update(assinaturas).set({ status: 'inadimplente' }).where(eq(assinaturas.id, antiga.id));
    const canceladasNoGateway: Array<string | null> = [];
    const manual = new ManualGateway();
    const espiao: PaymentGateway = {
      provider: 'manual',
      createCheckout: (i) => manual.createCheckout(i),
      parseWebhook: (b, h, ip) => manual.parseWebhook(b, h, ip),
      checkPaymentStatus: (id) => manual.checkPaymentStatus(id),
      cancelSubscription: async (id) => { canceladasNoGateway.push(id); },
    };
    _overrideGatewayForTest(espiao);
    try {
      const nova = uid('sub');
      const r = await aplicarEventoWebhook({
        eventId: uid('evt'), type: 'payment_succeeded', gatewaySubscriptionId: nova,
        externalReference: `xconstrucao|${userId}|${await planoId(request, 'premium')}|mensal`, valor: 299, paymentId: uid('pay'),
      });
      expect(r.processed).toBe(true);
      const todas = await pagaXgestao(userId);
      expect(todas.find((a) => a.id === antiga.id)?.status).toBe('cancelada');
      expect(todas.filter((a) => a.status === 'ativa' || a.status === 'inadimplente')).toEqual([
        expect.objectContaining({ gatewaySubscriptionId: nova, status: 'ativa' }),
      ]);
      expect(canceladasNoGateway).toEqual([antiga.gatewaySubscriptionId]);
    } finally {
      _overrideGatewayForTest(null);
    }
  });

  test('bônus: cancelar no teste vale até o fim do teste + 24h, e reassinar não ganha outro mês', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'bonus-teste');
    const fimTeste = new Date((await perfil(request)).teste.fimTeste);
    const assinado = await assinar(request, 'basic');
    const [paga] = await pagaXgestao(userId);
    expect(paga.fimTesteEm?.toISOString()).toBe(fimTeste.toISOString());
    expect(paga.primeiroPagamentoEm).toBeNull();
    expect(paga.renovaEm!.toISOString()).toBe(assinado.primeiraCobrancaEm);
    const corte = new Date(fimTeste.getTime() + DIA_MS).toISOString();
    expect((await perfil(request)).acessoSeCancelar).toBe(corte);

    expect(await cancelar(request)).toEqual({ ok: true, acessoAte: corte });
    const [cancelada] = await db.select().from(assinaturas).where(eq(assinaturas.id, paga.id));
    expect(cancelada.renovaEm!.toISOString()).toBe(corte);
    const [evento] = await db.select().from(assinaturaEventos).where(and(
      eq(assinaturaEventos.assinaturaId, paga.id), eq(assinaturaEventos.tipo, 'cancelamento_agendado'),
    ));
    expect(evento.payloadJson).toMatchObject({ acessoAte: corte, motivo: 'bonus_sem_primeiro_pagamento' });
    expect(await perfil(request)).toMatchObject({ cancelamentoAgendado: true, somenteLeitura: false });

    // Reassinar: 1ª cobrança no fim do acesso que já tinha, sem novo mês grátis.
    const de_novo = await assinar(request, 'basic');
    expect(de_novo.primeiraCobrancaEm).toBe(corte);
    const nova = (await pagaXgestao(userId)).find((a) => a.status === 'ativa')!;
    expect(nova.id).not.toBe(paga.id);
    expect(nova.fimTesteEm).toBeNull();
  });

  test('bônus: no mês bônus vale 24h após cancelar; depois do 1º pagamento vale o período pago', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'bonus-mes');
    await assinar(request, 'basic');
    const [paga] = await pagaXgestao(userId);
    // Simula o teste já encerrado (estamos no mês bônus).
    await db.update(assinaturas).set({ fimTesteEm: new Date(Date.now() - 2 * DIA_MS) }).where(eq(assinaturas.id, paga.id));
    const antes = Date.now();
    const r = await cancelar(request);
    const ate = new Date(r.acessoAte!).getTime();
    expect(ate).toBeGreaterThanOrEqual(antes + DIA_MS - 1000);
    expect(ate).toBeLessThanOrEqual(Date.now() + DIA_MS + 1000);

    // Outra conta: já pagou a 1ª mensalidade, cancela e fica até o fim do período.
    const outro = await novoAssinanteHomologacao(request, 'bonus-pago');
    await assinar(request, 'basic');
    const [pagaOutro] = await pagaXgestao(outro.userId);
    await db.update(assinaturas).set({ primeiroPagamentoEm: new Date() }).where(eq(assinaturas.id, pagaOutro.id));
    expect(await cancelar(request)).toEqual({ ok: true, acessoAte: pagaOutro.renovaEm!.toISOString() });
  });
});
