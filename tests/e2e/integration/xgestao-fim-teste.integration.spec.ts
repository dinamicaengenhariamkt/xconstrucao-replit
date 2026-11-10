import { expect, test, type APIRequestContext } from '@playwright/test';
import { and, eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturaEventos, assinaturas, obras } from '@shared/db/schema';
import { aplicarEventoWebhook } from '@features/planos/assinatura-service';
import { somarMeses } from '@features/xgestao/lib/acesso-plano';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';

/**
 * XG43 — fim do teste e assinatura (decisões de 09/11/2026): teste Basic que
 * começa sozinho no 1º acesso, 24h de tolerância, +1 mês para quem assina no
 * teste, cancelamento até o fim do período pago e carência de inadimplência.
 * Os eventos do Asaas são aplicados pelo mesmo `aplicarEventoWebhook` do
 * handler real; o ciclo do cartão no Asaas sandbox não é provado aqui.
 */
const DIA_MS = 24 * 60 * 60_000;

async function perfil(request: APIRequestContext) {
  const resposta = await request.get('/api/perfil/plano?persona=xgestao');
  expect(resposta.status(), await resposta.text()).toBe(200);
  return resposta.json();
}

async function planoId(request: APIRequestContext, tier: string): Promise<string> {
  const catalogo = await (await request.get('/api/planos?persona=xgestao')).json() as Array<{ id: string; tier: string }>;
  return catalogo.find((p) => p.tier === tier)!.id;
}

async function assinar(request: APIRequestContext, tier: string) {
  const r = await request.post('/api/assinaturas/checkout', {
    data: { planoId: await planoId(request, tier), persona: 'xgestao', ciclo: 'mensal' },
  });
  expect(r.status(), await r.text()).toBe(201);
  return r.json();
}

async function assinaturasDo(userId: string) {
  return db.select().from(assinaturas).where(and(eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao')));
}

/** Vencimento como o Asaas manda: só a data, no fuso de São Paulo. */
function diaSp(data: Date): string {
  return data.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

function eventoId(rotulo: string) {
  return `xg43-${rotulo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

test.describe('XG43 — fim do teste, +1 mês, cancelamento e carência', () => {
  test('o teste Basic começa sozinho no 1º acesso, uma vez só, e não volta para ex-assinante', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'auto-teste', { iniciarTeste: false });
    expect(await assinaturasDo(userId)).toHaveLength(0);
    for (let i = 0; i < 2; i++) {
      const pagina = await request.get('/xgestao/dashboard');
      expect(pagina.status(), `acesso ${i + 1}`).toBe(200);
    }
    const criadas = await assinaturasDo(userId);
    expect(criadas).toHaveLength(1);
    expect(criadas[0]).toMatchObject({ gatewayProvider: 'trial', status: 'ativa' });
    const atual = await perfil(request);
    expect(atual).toMatchObject({ plano: 'basic', somenteLeitura: false });
    expect(atual.teste).toMatchObject({ emTeste: true, tierTeste: 'basic', duracaoDias: 90, emTolerancia: false });
    const fim = new Date(atual.teste.fimTeste).getTime();
    expect(fim - Date.now()).toBeGreaterThan(89 * DIA_MS);
    expect(fim - Date.now()).toBeLessThanOrEqual(90 * DIA_MS);
    expect(await db.select().from(assinaturaEventos).where(and(
      eq(assinaturaEventos.assinaturaId, criadas[0].id), eq(assinaturaEventos.tipo, 'teste_iniciado'),
    ))).toHaveLength(1);

    // Ex-assinante sem teste (assinou direto e o período acabou) não ganha teste novo sozinho.
    const ex = await novoAssinanteHomologacao(request, 'auto-ex', { iniciarTeste: false });
    await assinar(request, 'basic');
    expect((await request.post('/api/assinaturas/cancelar', { data: { persona: 'xgestao' } })).status()).toBe(200);
    await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - 60_000) }).where(eq(assinaturas.userId, ex.userId));
    expect((await request.get('/xgestao/dashboard')).status()).toBe(200);
    const doEx = await assinaturasDo(ex.userId);
    expect(doEx.filter((a) => a.gatewayProvider === 'trial')).toHaveLength(0);
    expect(await perfil(request)).toMatchObject({ somenteLeitura: true });
  });

  test('teste não se cancela: vence sozinho', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'cancelar-teste');
    const r = await request.post('/api/assinaturas/cancelar', { data: { persona: 'xgestao' } });
    expect(r.status(), await r.text()).toBe(409);
    expect((await assinaturasDo(userId))[0]).toMatchObject({ gatewayProvider: 'trial', status: 'ativa', canceladaEm: null });
  });

  test('webhook: assinatura no teste vale já e só é cobrada 1 mês após o fim do teste', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'bonus-webhook');
    const [trial] = await assinaturasDo(userId);
    const premium = await planoId(request, 'premium');
    const ref = `xconstrucao|${userId}|${premium}|mensal`;
    const vencimento = diaSp(somarMeses(trial.renovaEm!, 1));
    expect((await perfil(request)).teste.primeiraCobrancaComBonus).toBe(somarMeses(trial.renovaEm!, 1).toISOString());
    const sub = `sub_xg43_${Date.now()}`;

    // Cobrança imediata (fluxo normal) não ativa nada antes do pagamento.
    await aplicarEventoWebhook({
      eventId: eventoId('imediata'), type: 'payment_created', externalReference: ref,
      gatewaySubscriptionId: `${sub}_imediata`, dueDate: diaSp(new Date()),
    });
    expect((await assinaturasDo(userId)).filter((a) => a.status === 'ativa')).toEqual([
      expect.objectContaining({ gatewayProvider: 'trial' }),
    ]);

    const criado = eventoId('criada');
    const r1 = await aplicarEventoWebhook({
      eventId: criado, type: 'payment_created', externalReference: ref,
      gatewaySubscriptionId: sub, gatewayCustomerId: 'cus_xg43', dueDate: vencimento,
    });
    expect(r1.processed).toBe(true);
    const ativas = (await assinaturasDo(userId)).filter((a) => a.status === 'ativa');
    expect(ativas).toHaveLength(1);
    expect(ativas[0]).toMatchObject({ gatewaySubscriptionId: sub, planoId: premium, canceladaEm: null });
    expect(diaSp(ativas[0].renovaEm!)).toBe(vencimento);
    expect((await db.select().from(assinaturas).where(eq(assinaturas.id, trial.id)))[0].status).toBe('cancelada');
    expect(await perfil(request)).toMatchObject({ plano: 'premium', somenteLeitura: false });

    // Idempotência: o mesmo evento e a cobrança do mês seguinte não duplicam nada.
    expect((await aplicarEventoWebhook({
      eventId: criado, type: 'payment_created', externalReference: ref, gatewaySubscriptionId: sub, dueDate: vencimento,
    })).processed).toBe(false);
    await aplicarEventoWebhook({
      eventId: eventoId('proxima'), type: 'payment_created', externalReference: ref,
      gatewaySubscriptionId: sub, dueDate: diaSp(somarMeses(trial.renovaEm!, 2)),
    });
    // Quem já paga, sem cancelamento, não ganha outra assinatura com cobrança futura.
    await aplicarEventoWebhook({
      eventId: eventoId('outra'), type: 'payment_created', externalReference: ref,
      gatewaySubscriptionId: `${sub}_outra`, dueDate: vencimento,
    });
    expect((await assinaturasDo(userId)).filter((a) => a.status === 'ativa')).toHaveLength(1);

    // No vencimento: CONFIRMED renova por 1 mês; RECEIVED do mesmo pagamento não renova de novo.
    for (const rotulo of ['confirmed', 'received']) {
      await aplicarEventoWebhook({
        eventId: eventoId(rotulo), type: 'payment_succeeded', externalReference: ref,
        gatewaySubscriptionId: sub, dueDate: vencimento, valor: 299,
      });
      const [renovada] = await db.select().from(assinaturas).where(eq(assinaturas.gatewaySubscriptionId, sub));
      expect(renovada.status).toBe('ativa');
      expect(diaSp(renovada.renovaEm!)).toBe(diaSp(somarMeses(ativas[0].renovaEm!, 1)));
    }
  });

  test('cancelamento vale até o fim do período, ignora o eco do Asaas e permite assinar de novo sem cobrar em dobro', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'cancelar-periodo');
    const assinado = await assinar(request, 'basic_plus');
    const [paga] = (await assinaturasDo(userId)).filter((a) => a.status === 'ativa');
    expect(paga.renovaEm!.toISOString()).toBe(assinado.primeiraCobrancaEm);

    // 10/11/2026 — assinou no teste e cancelou antes do 1º pagamento: o mês
    // bônus deixa de valer e o acesso vai até o fim do teste + 24h.
    const acessoAte = new Date(paga.fimTesteEm!.getTime() + DIA_MS).toISOString();
    const cancelar = await request.post('/api/assinaturas/cancelar', { data: { persona: 'xgestao' } });
    expect(await cancelar.json()).toEqual({ ok: true, acessoAte });
    // Eco do Asaas (SUBSCRIPTION_DELETED) depois do cancelamento pedido pelo assinante.
    await aplicarEventoWebhook({ eventId: eventoId('eco'), type: 'subscription_canceled', gatewaySubscriptionId: paga.gatewaySubscriptionId! });
    const [depoisEco] = await db.select().from(assinaturas).where(eq(assinaturas.id, paga.id));
    expect(depoisEco.status).toBe('ativa');
    expect(depoisEco.canceladaEm).not.toBeNull();
    expect(await perfil(request)).toMatchObject({ plano: 'basic_plus', somenteLeitura: false, cancelamentoAgendado: true });
    const escrita = await request.post('/api/xgestao/obras', { data: { nome: 'E2E XG43 período pago', endereco: 'Rua 43' } });
    expect(escrita.status(), await escrita.text()).toBe(201);
    const obraId = (await escrita.json()).id as string;
    try {
      // Assinar de novo o mesmo plano: a 1ª cobrança fica no fim do acesso que
      // ainda vale, sem cobrar em dobro e sem outro mês bônus.
      const novamente = await assinar(request, 'basic_plus');
      expect(novamente.primeiraCobrancaEm).toBe(acessoAte);
      const ativas = (await assinaturasDo(userId)).filter((a) => a.status === 'ativa');
      expect(ativas).toHaveLength(1);
      expect(ativas[0].id).not.toBe(paga.id);
      expect(ativas[0].canceladaEm).toBeNull();
      expect(await perfil(request)).toMatchObject({ plano: 'basic_plus', cancelamentoAgendado: false });
    } finally {
      await db.delete(obras).where(eq(obras.id, obraId));
    }
  });

  test('pagamento recusado: 7 dias de carência com aviso, depois somente leitura; pagar reativa', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'carencia');
    await assinar(request, 'basic');
    const [paga] = (await assinaturasDo(userId)).filter((a) => a.status === 'ativa');
    await aplicarEventoWebhook({ eventId: eventoId('falha'), type: 'payment_failed', gatewaySubscriptionId: paga.gatewaySubscriptionId! });
    await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - 3 * DIA_MS) }).where(eq(assinaturas.id, paga.id));
    expect(await perfil(request)).toMatchObject({
      plano: 'basic', somenteLeitura: false, inadimplente: true, assinaturaStatus: 'inadimplente',
    });
    // Escrita e cota usam a mesma regra: dentro da carência, cria obra normalmente.
    const criada = await request.post('/api/xgestao/obras', { data: { nome: 'E2E XG43 carência', endereco: 'Rua 43' } });
    expect(criada.status(), await criada.text()).toBe(201);
    const obraId = (await criada.json()).id as string;
    try {
      await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - 8 * DIA_MS) }).where(eq(assinaturas.id, paga.id));
      expect(await perfil(request)).toMatchObject({ plano: 'free', somenteLeitura: true, inadimplente: false });
      const bloqueada = await request.patch(`/api/obras/${obraId}`, { data: { nome: 'Não pode' } });
      expect(bloqueada.status(), await bloqueada.text()).toBe(403);
      await aplicarEventoWebhook({
        eventId: eventoId('regulariza'), type: 'payment_succeeded', gatewaySubscriptionId: paga.gatewaySubscriptionId!, valor: 99,
      });
      expect(await perfil(request)).toMatchObject({ plano: 'basic', somenteLeitura: false });
      expect((await request.patch(`/api/obras/${obraId}`, { data: { nome: 'E2E XG43 regularizada' } })).status()).toBe(200);
    } finally {
      await db.delete(obras).where(eq(obras.id, obraId));
    }
  });
});
