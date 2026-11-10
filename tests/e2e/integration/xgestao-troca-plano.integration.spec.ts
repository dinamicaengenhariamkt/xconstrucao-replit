import { expect, test, type APIRequestContext } from '@playwright/test';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@shared/db/db';
import {
  appErrors,
  assinaturaTrocas,
  assinaturas,
  financeiro,
  obraShareLinks,
  obras,
  userRoles,
  users,
  xgestaoMembros,
} from '@shared/db/schema';
import { aplicarEventoWebhook } from '@features/planos/assinatura-service';
import { _hooksTrocaParaTeste, confirmarTroca, recuperarTrocasPendentes } from '@features/planos/troca-plano-service';
import { _overrideGatewayForTest, type CobrancaPendente, type PaymentGateway } from '@features/planos/gateway';
import { ManualGateway } from '@features/planos/gateway/manual-gateway';
import { aplicarTrocasVencidas, reprocessarAjustesPendentes } from '@features/xgestao/server/troca-marcas';
import { calcularProporcional, dataSp } from '@features/xgestao/lib/troca-plano';
import { SEED_ADMIN_EMAIL, loginAs, logout } from '../helpers';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';

/**
 * XG48 — troca de plano do xgestão (docs/jornadas-xgestao/48-troca-de-plano.md).
 * Gateway manual no servidor; nos casos que precisam ver o que iria ao Asaas,
 * o service roda no processo do teste com um gateway espião.
 */
const DIA_MS = 24 * 60 * 60_000;
const MSG_BLOQUEADA = 'Esta obra está só para visualização no seu plano atual. Para editar, mude para um plano maior.';

function uid(rotulo: string) {
  return `xg48_${rotulo}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Meio-dia em São Paulo, `dias` à frente. */
function diaSp(dias: number) {
  return new Date(`${dataSp(new Date(Date.now() + dias * DIA_MS))}T12:00:00-03:00`);
}

async function planoIds(request: APIRequestContext) {
  const catalogo = await (await request.get('/api/planos?persona=xgestao')).json() as Array<{ id: string; tier: string; valorMensal: string }>;
  const id = (tier: string) => catalogo.find((p) => p.tier === tier)!.id;
  return { basic: id('basic'), basic_plus: id('basic_plus'), premium: id('premium') };
}

async function assinarNoTeste(request: APIRequestContext, planoId: string) {
  const r = await request.post('/api/assinaturas/checkout', { data: { planoId, persona: 'xgestao', ciclo: 'mensal' } });
  expect(r.status(), await r.text()).toBe(201);
}

async function assinaturaViva(userId: string) {
  const linhas = await db.select().from(assinaturas).where(and(eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao')));
  return linhas.find((a) => a.gatewayProvider !== 'trial' && (a.status === 'ativa' || a.status === 'inadimplente'))!;
}

/** Assinatura paga (1º pagamento feito), renovando em `dias` dias. */
async function tornarPaga(userId: string, dias = 15) {
  const a = await assinaturaViva(userId);
  const sub = uid('sub');
  await db.update(assinaturas).set({
    primeiroPagamentoEm: new Date(Date.now() - 15 * DIA_MS), fimTesteEm: null, renovaEm: diaSp(dias), gatewaySubscriptionId: sub,
  }).where(eq(assinaturas.id, a.id));
  return { ...a, gatewaySubscriptionId: sub, renovaEm: diaSp(dias) };
}

/** Novo dono xgestão com assinatura paga no plano pedido. */
async function donoPago(request: APIRequestContext, label: string, tier: 'basic' | 'basic_plus' | 'premium', dias = 15) {
  const { userId, email } = await novoAssinanteHomologacao(request, label);
  const ids = await planoIds(request);
  await assinarNoTeste(request, ids[tier]);
  const assinatura = await tornarPaga(userId, dias);
  return { userId, email, ids, assinatura };
}

type Espiao = {
  gateway: PaymentGateway;
  chamadas: Array<{ metodo: string; args: unknown[] }>;
  pendente: CobrancaPendente | null;
  falharAssinatura: boolean;
  falharCobranca: boolean;
};

function criarEspiao(pendente: CobrancaPendente | null): Espiao {
  const manual = new ManualGateway();
  const e: Espiao = {
    chamadas: [], pendente, falharAssinatura: false, falharCobranca: false,
    gateway: undefined as unknown as PaymentGateway,
  };
  e.gateway = {
    provider: 'manual',
    createCheckout: (i) => manual.createCheckout(i),
    parseWebhook: (b, h, ip) => manual.parseWebhook(b, h, ip),
    checkPaymentStatus: (id) => manual.checkPaymentStatus(id),
    cancelSubscription: async (id) => { e.chamadas.push({ metodo: 'cancelSubscription', args: [id] }); },
    atualizarValorAssinatura: async (sub, valor) => {
      e.chamadas.push({ metodo: 'atualizarValorAssinatura', args: [sub, valor] });
      if (e.falharAssinatura) throw new Error('[asaas] HTTP 500: indisponível');
      // Como no Asaas (`updatePendingPayments`): a pendente passa ao valor novo.
      if (e.pendente) e.pendente = { ...e.pendente, valor };
    },
    proximaCobrancaPendente: async (sub) => {
      e.chamadas.push({ metodo: 'proximaCobrancaPendente', args: [sub] });
      return e.pendente;
    },
    atualizarValorCobranca: async (id, valor) => {
      e.chamadas.push({ metodo: 'atualizarValorCobranca', args: [id, valor] });
      if (e.falharCobranca) throw new Error('[asaas] HTTP 400: cobrança não pode ser alterada');
      if (e.pendente?.id === id) e.pendente = { ...e.pendente, valor };
    },
  };
  return e;
}

const chamadas = (e: Espiao, metodo: string) => e.chamadas.filter((c) => c.metodo === metodo).map((c) => c.args);

async function trocarHttp(request: APIRequestContext, planoId: string, extra: Record<string, unknown> = {}) {
  return request.post('/api/assinaturas/trocar', { data: { planoId, persona: 'xgestao', ...extra } });
}

async function trocasDe(userId: string) {
  return db.select().from(assinaturaTrocas).where(eq(assinaturaTrocas.userId, userId));
}

async function criarObra(request: APIRequestContext, nome: string) {
  const r = await request.post('/api/xgestao/obras', { data: { nome, endereco: 'Rua E2E Troca, 10', cidade: 'São Paulo', uf: 'SP' } });
  expect(r.status(), await r.text()).toBe(201);
  return (await r.json()).id as string;
}

async function criarLink(request: APIRequestContext, obraId: string, nome: string) {
  const r = await request.post(`/api/xgestao/obras/${obraId}/share`, { data: { nome } });
  expect(r.status(), await r.text()).toBe(201);
  return (await r.json()).share as { id: string; path: string };
}

async function criarMembro(empresaId: string, donoId: string, rotulo: string) {
  const email = `${uid(rotulo)}@e2e.xconstrucao.test`;
  const [u] = await db.insert(users).values({
    name: `E2E Membro ${rotulo}`, email, role: 'empreiteiro', password: 'x', ativo: true, onboardingConcluido: true,
  } as typeof users.$inferInsert).returning({ id: users.id });
  await db.insert(userRoles).values([{ userId: u.id, role: 'empreiteiro', origem: 'signup' }, { userId: u.id, role: 'xgestao', origem: 'upgrade' }]);
  const [m] = await db.insert(xgestaoMembros).values({
    empreiteiraId: empresaId, userId: u.id, papel: 'gestor', status: 'ativo', convidadoPor: donoId,
  }).returning({ id: xgestaoMembros.id });
  return { userId: u.id, membroId: m.id, email };
}

async function empresaDe(userId: string) {
  const { empreiteiras } = await import('@shared/db/schema');
  const [e] = await db.select({ id: empreiteiras.id }).from(empreiteiras).where(eq(empreiteiras.userId, userId));
  return e.id;
}

async function apagarObras(ids: string[]) {
  for (const id of ids) {
    await db.delete(financeiro).where(eq(financeiro.obraId, id));
    await db.delete(obras).where(eq(obras.id, id));
  }
}

async function perfil(request: APIRequestContext) {
  const r = await request.get('/api/perfil/plano?persona=xgestao');
  expect(r.status(), await r.text()).toBe(200);
  return r.json();
}

test.describe('XG48 — troca de plano do xgestão', () => {
  test.afterEach(() => { _overrideGatewayForTest(null); _hooksTrocaParaTeste.depoisDoGateway = undefined; });

  test('subir: vale na hora, sem cobrança agora, diferença proporcional só na próxima fatura', async ({ request }) => {
    const { userId, ids, assinatura } = await donoPago(request, 'subir', 'basic');
    const espiao = criarEspiao({ id: uid('pay'), valor: 99, vencimento: dataSp(assinatura.renovaEm) });
    _overrideGatewayForTest(espiao.gateway);

    // Prévia pela rota real: cálculo sem efeito.
    const previa = await trocarHttp(request, ids.basic_plus, { previa: true });
    expect(previa.status(), await previa.text()).toBe(200);
    const p = await previa.json();
    const esperado = calcularProporcional({ valorAtual: 99, valorNovo: 179, renovaEm: assinatura.renovaEm });
    expect(p).toMatchObject({ acao: 'subir', tipo: 'subir', diferenca: esperado.diferenca, diasRestantes: esperado.diasRestantes, valorDepois: 179 });
    expect(p.valorProximaFatura).toBeCloseTo(179 + esperado.diferenca, 2);
    expect(await trocasDe(userId)).toHaveLength(0);

    const r = await confirmarTroca(userId, { planoId: ids.basic_plus, chave: uid('chave') });
    expect(r.ok).toBe(true);
    // Na hora: plano e limites novos.
    expect((await assinaturaViva(userId)).planoId).toBe(ids.basic_plus);
    const depois = await perfil(request);
    expect(depois.plano).toBe('basic_plus');
    expect(depois.uso.find((u: { key: string }) => u.key === 'obrasAtivas').max).toBe(3);
    // Gateway: valor novo na assinatura e soma só na próxima cobrança.
    expect(chamadas(espiao, 'atualizarValorAssinatura')).toEqual([[assinatura.gatewaySubscriptionId, 179]]);
    expect(chamadas(espiao, 'atualizarValorCobranca')).toEqual([[espiao.pendente!.id, 179 + esperado.diferenca]]);
    expect(chamadas(espiao, 'cancelSubscription')).toEqual([]);
    const [troca] = await trocasDe(userId);
    expect(troca).toMatchObject({ tipo: 'subir', status: 'aplicada', ajustePendente: false, paymentIdAjustado: espiao.pendente!.id });
    expect(Number(troca.valorDiferenca)).toBe(esperado.diferenca);

    // Fatura com a diferença paga: a subida fica quitada.
    await aplicarEventoWebhook({
      eventId: uid('evt'), type: 'payment_succeeded', gatewaySubscriptionId: assinatura.gatewaySubscriptionId,
      paymentId: espiao.pendente!.id, valor: 179 + esperado.diferenca, dueDate: dataSp(assinatura.renovaEm),
    });
    const [quitada] = await trocasDe(userId);
    expect(quitada.quitadaEm).not.toBeNull();
    // Depois da fatura paga, cancelar não volta o plano.
    expect((await request.post('/api/assinaturas/cancelar', { data: { persona: 'xgestao' } })).status()).toBe(200);
    expect((await assinaturaViva(userId)).planoId).toBe(ids.basic_plus);
  });

  test('idempotência: clique duplo, requisição repetida e concorrente aplicam uma vez', async ({ request }) => {
    const { userId, ids } = await donoPago(request, 'idem', 'basic');
    const espiao = criarEspiao({ id: uid('pay'), valor: 99, vencimento: dataSp(diaSp(15)) });
    _overrideGatewayForTest(espiao.gateway);
    const chave = uid('chave');
    const [a, b] = await Promise.all([
      confirmarTroca(userId, { planoId: ids.premium, chave }),
      confirmarTroca(userId, { planoId: ids.premium, chave }),
    ]);
    expect([a.ok, b.ok]).toEqual([true, true]);
    expect([a, b].filter((x) => x.ok && x.repetida)).toHaveLength(1);
    const c = await confirmarTroca(userId, { planoId: ids.premium, chave });
    expect(c.ok && c.repetida).toBe(true);
    expect(await trocasDe(userId)).toHaveLength(1);
    expect(chamadas(espiao, 'atualizarValorAssinatura')).toHaveLength(1);
    // Pela rota: mesma chave repetida responde a mesma troca; sem chave é 400.
    const http = await trocarHttp(request, ids.premium, { chave });
    expect(http.status(), await http.text()).toBe(200);
    expect(await http.json()).toMatchObject({ repetida: true });
    expect((await trocarHttp(request, ids.premium)).status()).toBe(400);
    expect(await trocasDe(userId)).toHaveLength(1);
  });

  test('subir e cancelar antes de pagar a fatura com a diferença: volta ao plano anterior', async ({ request }) => {
    const { userId, ids, assinatura } = await donoPago(request, 'sobe-cancela', 'basic');
    const r = await trocarHttp(request, ids.premium, { chave: uid('chave') });
    expect(r.status(), await r.text()).toBe(200);
    expect((await assinaturaViva(userId)).planoId).toBe(ids.premium);
    const cancelar = await request.post('/api/assinaturas/cancelar', { data: { persona: 'xgestao' } });
    expect(cancelar.status(), await cancelar.text()).toBe(200);
    const depois = await assinaturaViva(userId);
    expect(depois.planoId).toBe(ids.basic);
    expect(depois.canceladaEm).not.toBeNull();
    expect(depois.renovaEm!.getTime()).toBe(assinatura.renovaEm.getTime()); // regra de cancelamento existente
    expect((await trocasDe(userId))[0].status).toBe('cancelada');
    expect((await perfil(request)).plano).toBe('basic');
  });

  test('falha do Asaas: PUT da assinatura recusado não muda nada; PUT da cobrança recusado fica pendente e o retry soma uma vez', async ({ request }) => {
    const { userId, ids, assinatura } = await donoPago(request, 'falha', 'basic');
    const espiao = criarEspiao({ id: uid('pay'), valor: 99, vencimento: dataSp(assinatura.renovaEm) });
    _overrideGatewayForTest(espiao.gateway);

    espiao.falharAssinatura = true;
    const recusada = await confirmarTroca(userId, { planoId: ids.basic_plus, chave: uid('chave') });
    expect(recusada).toMatchObject({ ok: false, status: 502, code: 'GATEWAY_ERROR' });
    expect((await assinaturaViva(userId)).planoId).toBe(ids.basic);
    expect((await trocasDe(userId)).map((t) => t.status)).toEqual(['falhou']);

    espiao.falharAssinatura = false;
    espiao.falharCobranca = true;
    const desde = new Date();
    const ok = await confirmarTroca(userId, { planoId: ids.basic_plus, chave: uid('chave') });
    expect(ok.ok).toBe(true);
    expect((await assinaturaViva(userId)).planoId).toBe(ids.basic_plus);
    const aplicada = (await trocasDe(userId)).find((t) => t.status === 'aplicada')!;
    expect(aplicada.ajustePendente).toBe(true);
    expect(aplicada.erro).toContain('HTTP 400');
    const erros = await db.select().from(appErrors).where(eq(appErrors.route, 'xgestao.troca-plano'));
    expect(erros.some((e) => e.createdAt >= desde && JSON.stringify(e.meta).includes(assinatura.id))).toBe(true);

    espiao.falharCobranca = false;
    await reprocessarAjustesPendentes(userId);
    await reprocessarAjustesPendentes(userId); // retry repetido não soma de novo
    const diferenca = Number(aplicada.valorDiferenca);
    expect(espiao.pendente!.valor).toBeCloseTo(179 + diferenca, 2);
    const sucesso = chamadas(espiao, 'atualizarValorCobranca').filter(([, v]) => v === 179 + diferenca);
    expect(sucesso.length).toBeGreaterThanOrEqual(1);
    expect((await trocasDe(userId)).find((t) => t.id === aplicada.id)?.ajustePendente).toBe(false);
  });

  test('REV-07 commit falha depois do PUT: troca falhou, valor anterior volta ao gateway e o plano não muda', async ({ request }) => {
    const { userId, ids, assinatura } = await donoPago(request, 'rev07', 'basic');
    const espiao = criarEspiao({ id: uid('pay'), valor: 99, vencimento: dataSp(assinatura.renovaEm) });
    _overrideGatewayForTest(espiao.gateway);
    _hooksTrocaParaTeste.depoisDoGateway = () => { throw new Error('commit simulado falhou'); };

    const chave = uid('chave');
    const r = await confirmarTroca(userId, { planoId: ids.premium, chave });
    expect(r).toMatchObject({ ok: false, status: 502, code: 'GATEWAY_ERROR' });
    // PUT com o valor novo e, depois da falha, PUT de volta com o anterior.
    expect(chamadas(espiao, 'atualizarValorAssinatura')).toEqual([
      [assinatura.gatewaySubscriptionId, 299],
      [assinatura.gatewaySubscriptionId, 99],
    ]);
    expect(chamadas(espiao, 'atualizarValorCobranca')).toEqual([]);
    expect((await assinaturaViva(userId)).planoId).toBe(ids.basic);
    const [falhou] = await trocasDe(userId);
    expect(falhou).toMatchObject({ status: 'falhou', chaveIdempotencia: null });
    expect(falhou.erro).toContain('commit simulado falhou');

    // A mesma chave pode tentar de novo (a falha soltou a chave) e aplica uma vez.
    _hooksTrocaParaTeste.depoisDoGateway = undefined;
    const ok = await confirmarTroca(userId, { planoId: ids.premium, chave });
    expect(ok).toMatchObject({ ok: true, repetida: false, status: 'aplicada' });
    expect((await assinaturaViva(userId)).planoId).toBe(ids.premium);
    expect((await confirmarTroca(userId, { planoId: ids.premium, chave }))).toMatchObject({ ok: true, repetida: true });
  });

  test('REV-07 troca pendente esquecida (processo caiu entre PUT e aplicação) é recuperada e compensada', async ({ request }) => {
    const { userId, ids, assinatura } = await donoPago(request, 'rev07-presa', 'basic');
    const espiao = criarEspiao(null);
    _overrideGatewayForTest(espiao.gateway);
    const [planoAtual] = await db.select({ planoId: assinaturas.planoId }).from(assinaturas).where(eq(assinaturas.id, assinatura.id));
    const [presa] = await db.insert(assinaturaTrocas).values({
      userId, assinaturaId: assinatura.id, planoDeId: planoAtual.planoId, planoParaId: ids.premium, tierDe: 'basic', tierPara: 'premium',
      tipo: 'subir', valorDe: '99', valorPara: '299', status: 'pendente_gateway', efetivaEm: new Date(),
      chaveIdempotencia: uid('chave'), escolhas: { gateway: { anterior: 99, novo: 299, acao: 'subir' } },
      criadaEm: new Date(Date.now() - 10 * 60_000),
    }).returning({ id: assinaturaTrocas.id });
    // Passado o prazo, é marcada `falhou` uma única vez e o valor anterior volta.
    expect(await recuperarTrocasPendentes(userId)).toBe(1);
    expect(await recuperarTrocasPendentes(userId)).toBe(0);
    const [depois] = await db.select().from(assinaturaTrocas).where(eq(assinaturaTrocas.id, presa.id));
    expect(depois).toMatchObject({ status: 'falhou', chaveIdempotencia: null });
    expect(chamadas(espiao, 'atualizarValorAssinatura')).toEqual([[assinatura.gatewaySubscriptionId, 99]]);
    expect((await assinaturaViva(userId)).planoId).toBe(ids.basic);
  });

  test('REV-03 checkout recusa ciclo anual no xgestão (cobrava o valor mensal como anual)', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'rev03');
    const ids = await planoIds(request);
    const r = await request.post('/api/assinaturas/checkout', { data: { planoId: ids.basic_plus, persona: 'xgestao', ciclo: 'anual' } });
    expect(r.status(), await r.text()).toBe(400);
    expect((await r.json()).code).toBe('CICLO_INVALIDO');
    const linhas = await db.select().from(assinaturas).where(and(eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao')));
    expect(linhas.some((a) => a.ciclo === 'anual')).toBe(false);
    // Mensal segue normal.
    const mensal = await request.post('/api/assinaturas/checkout', { data: { planoId: ids.basic_plus, persona: 'xgestao', ciclo: 'mensal' } });
    expect(mensal.status(), await mensal.text()).toBe(201);
  });

  test('REV-10 a chave de idempotência vale por titular', async ({ request }) => {
    const a = await donoPago(request, 'rev10-a', 'basic');
    const chave = uid('chave-comum');
    expect((await confirmarTroca(a.userId, { planoId: a.ids.premium, chave })).ok).toBe(true);
    await logout(request);
    const b = await donoPago(request, 'rev10-b', 'basic');
    const rb = await confirmarTroca(b.userId, { planoId: b.ids.premium, chave });
    expect(rb).toMatchObject({ ok: true, repetida: false });
    expect((await assinaturaViva(b.userId)).planoId).toBe(b.ids.premium);
  });

  test('sem cobrança pendente ainda: a diferença espera o PAYMENT_CREATED da assinatura', async ({ request }) => {
    const { userId, ids, assinatura } = await donoPago(request, 'payment-created', 'basic', 40);
    const espiao = criarEspiao(null);
    _overrideGatewayForTest(espiao.gateway);
    expect((await confirmarTroca(userId, { planoId: ids.premium, chave: uid('chave') })).ok).toBe(true);
    const [pendente] = await trocasDe(userId);
    expect(pendente.ajustePendente).toBe(true);
    expect(chamadas(espiao, 'atualizarValorCobranca')).toEqual([]);

    espiao.pendente = { id: uid('pay'), valor: 299, vencimento: dataSp(assinatura.renovaEm) };
    const evento = { eventId: uid('evt'), type: 'payment_created', gatewaySubscriptionId: assinatura.gatewaySubscriptionId!, paymentId: espiao.pendente.id, valor: 299, dueDate: dataSp(assinatura.renovaEm) };
    await aplicarEventoWebhook(evento);
    expect((await aplicarEventoWebhook(evento)).processed).toBe(false); // webhook repetido
    expect(chamadas(espiao, 'atualizarValorCobranca')).toEqual([[espiao.pendente.id, 299 + Number(pendente.valorDiferenca)]]);
    const [ajustada] = await trocasDe(userId);
    expect(ajustada).toMatchObject({ ajustePendente: false, paymentIdAjustado: espiao.pendente.id });
  });

  test('descer: aviso, escolha única obrigatória, data efetiva e guards de obra, membro e link', async ({ request }) => {
    const { userId, email, ids, assinatura } = await donoPago(request, 'descer', 'premium');
    const empresaId = await empresaDe(userId);
    const obraA = await criarObra(request, 'E2E troca obra A');
    const obraB = await criarObra(request, 'E2E troca obra B');
    const obraC = await criarObra(request, 'E2E troca obra C');
    const link1 = await criarLink(request, obraA, 'Cliente');
    const link2 = await criarLink(request, obraA, 'Arquiteto');
    const m1 = await criarMembro(empresaId, userId, 'm1');
    const m2 = await criarMembro(empresaId, userId, 'm2');
    try {
      const previa = await trocarHttp(request, ids.basic, { previa: true });
      expect(previa.status(), await previa.text()).toBe(200);
      const p = await previa.json();
      expect(p).toMatchObject({ acao: 'descer', tipo: 'descer', valorDepois: 99, valorProximaFatura: 99 });
      expect(p.efetivaEm).toBe(assinatura.renovaEm.toISOString());
      expect(p.excedentes.obras).toMatchObject({ limite: 1, precisaEscolher: true });
      expect(p.excedentes.obras.emAndamento).toHaveLength(3);
      expect(p.excedentes.membros).toMatchObject({ limite: 1, precisaEscolher: true });
      expect(p.excedentes.links).toEqual({ limitePorObra: 1, pausados: 1 });
      expect(p.excedentes.perdeValoresPublicos).toBe(true);

      // Sem escolher até o limite, ou sem ciência: não confirma.
      expect((await trocarHttp(request, ids.basic, { chave: uid('c'), ciente: true })).status()).toBe(400);
      expect((await trocarHttp(request, ids.basic, { chave: uid('c'), obras: [obraA, obraB], membros: [m1.membroId], ciente: true })).status()).toBe(400);
      const semCiencia = await trocarHttp(request, ids.basic, { chave: uid('c'), obras: [obraB], membros: [m1.membroId] });
      expect(semCiencia.status()).toBe(400);
      expect((await semCiencia.json()).code).toBe('CIENCIA_OBRIGATORIA');

      const ok = await trocarHttp(request, ids.basic, { chave: uid('c'), obras: [obraB], membros: [m1.membroId], ciente: true });
      expect(ok.status(), await ok.text()).toBe(200);
      expect((await ok.json()).status).toBe('agendada');
      // Até a data efetiva nada muda.
      expect((await assinaturaViva(userId)).planoId).toBe(ids.premium);
      const agendado = await perfil(request);
      expect(agendado.plano).toBe('premium');
      expect(agendado.trocaAgendada).toMatchObject({ tierPara: 'basic', valorPara: 99 });
      expect((await request.patch(`/api/obras/${obraC}`, { data: { descricao: 'ainda editável' } })).status()).toBe(200);

      // A escolha é única: outra descida não é aceita.
      const outra = await trocarHttp(request, ids.basic, { chave: uid('c'), obras: [obraC], membros: [m2.membroId], ciente: true });
      expect(outra.status()).toBe(409);
      expect((await outra.json()).code).toBe('TROCA_AGENDADA');

      // Chega a data efetiva: a leitura do plano aplica (idempotente).
      await db.update(assinaturaTrocas).set({ efetivaEm: new Date(Date.now() - 60_000) })
        .where(and(eq(assinaturaTrocas.userId, userId), eq(assinaturaTrocas.status, 'agendada')));
      const efetivo = await perfil(request);
      expect(efetivo.plano).toBe('basic');
      expect(await aplicarTrocasVencidas(userId)).toBe(0);
      const marcadas = await db.select({ id: obras.id, b: obras.xgestaoBloqueadaPorPlano }).from(obras).where(inArray(obras.id, [obraA, obraB, obraC]));
      expect(Object.fromEntries(marcadas.map((o) => [o.id, o.b]))).toEqual({ [obraA]: true, [obraB]: false, [obraC]: true });
      const membros = await db.select({ id: xgestaoMembros.id, status: xgestaoMembros.status }).from(xgestaoMembros).where(inArray(xgestaoMembros.id, [m1.membroId, m2.membroId]));
      expect(Object.fromEntries(membros.map((m) => [m.id, m.status]))).toEqual({ [m1.membroId]: 'ativo', [m2.membroId]: 'pausado' });
      const links = await db.select({ id: obraShareLinks.id, p: obraShareLinks.pausadoPorPlano }).from(obraShareLinks).where(inArray(obraShareLinks.id, [link1.id, link2.id]));
      expect(Object.fromEntries(links.map((l) => [l.id, l.p]))).toEqual({ [link1.id]: false, [link2.id]: true });

      // Guards: obra bloqueada não aceita escrita nem upload; a escolhida aceita.
      const patch = await request.patch(`/api/obras/${obraC}`, { data: { descricao: 'tentativa' } });
      expect(patch.status()).toBe(403);
      expect((await patch.json()).message).toBe(MSG_BLOQUEADA);
      expect((await request.post(`/api/obras/${obraA}/diario`, { data: { texto: 'tentativa', data: dataSp(new Date()) } })).status()).toBe(403);
      expect((await request.post(`/api/xgestao/obras/${obraA}/share`, { data: { nome: 'Novo' } })).status()).toBe(403);
      const upload = await request.post('/api/uploads/presign', {
        data: { kind: 'obra_anexo', filename: 'planta.pdf', mime: 'application/pdf', size: 1000, obraId: obraC },
      });
      expect(upload.status()).toBe(403);
      expect((await request.patch(`/api/obras/${obraB}`, { data: { descricao: 'editável' } })).status()).toBe(200);
      const detalhe = await (await request.get(`/api/empreiteiro/minhas-obras/${obraA}`)).json();
      expect(detalhe.permissoesXgestao).toMatchObject({ somenteLeitura: true, bloqueadaPorPlano: true });
      // Nada é excluído: a obra bloqueada continua visível.
      expect((await request.get(`/api/obras/${obraA}`)).status()).toBe(200);

      // Link pausado responde como indisponível; o mais antigo segue no ar.
      expect(await (await request.get(link2.path)).text()).toContain('Esta obra não está disponível no momento');
      expect(await (await request.get(link1.path)).text()).toContain('E2E troca obra A');

      // Obra bloqueada não ocupa vaga; concluir a escolhida libera a vaga.
      const cheia = await request.post('/api/xgestao/obras', { data: { nome: 'E2E troca obra D', endereco: 'Rua E2E, 1', cidade: 'São Paulo', uf: 'SP' } });
      expect(cheia.status()).toBe(402);
      expect((await request.patch(`/api/obras/${obraB}`, { data: { status: 'concluida' } })).status()).toBe(200);
      const obraD = await criarObra(request, 'E2E troca obra D');
      await apagarObras([obraD]);

      // Membro pausado não entra no xgestão da empresa.
      await logout(request);
      await loginAs(request, m2.email);
      expect((await request.get('/api/xgestao/perfil-status')).status()).toBe(403);
      await logout(request);
      await loginAs(request, m1.email);
      expect((await request.get('/api/xgestao/perfil-status')).status()).toBe(200);
      // Membro ativo não troca plano: 403.
      expect((await trocarHttp(request, ids.premium, { previa: true })).status()).toBe(403);
      await logout(request);
      await loginAs(request, email);

      // Subir depois da descida efetivada: tudo volta, com proporcional normal.
      const sobe = await trocarHttp(request, ids.premium, { chave: uid('c') });
      expect(sobe.status(), await sobe.text()).toBe(200);
      expect((await sobe.json()).previa).toMatchObject({ acao: 'subir' });
      const voltaObras = await db.select({ b: obras.xgestaoBloqueadaPorPlano }).from(obras).where(inArray(obras.id, [obraA, obraC]));
      expect(voltaObras.every((o) => o.b === false)).toBe(true);
      const [voltaMembro] = await db.select({ status: xgestaoMembros.status }).from(xgestaoMembros).where(eq(xgestaoMembros.id, m2.membroId));
      expect(voltaMembro.status).toBe('ativo');
      const [voltaLink] = await db.select({ p: obraShareLinks.pausadoPorPlano }).from(obraShareLinks).where(eq(obraShareLinks.id, link2.id));
      expect(voltaLink.p).toBe(false);
      expect((await request.patch(`/api/obras/${obraC}`, { data: { descricao: 'editável de novo' } })).status()).toBe(200);
    } finally {
      await logout(request);
      await db.delete(users).where(inArray(users.id, [m1.userId, m2.userId]));
      await apagarObras([obraA, obraB, obraC]);
    }
  });

  test('descer e subir de novo antes da data efetiva: desfaz sem cobrança e descarta a escolha', async ({ request }) => {
    const { userId, ids, assinatura } = await donoPago(request, 'desfaz', 'basic_plus');
    const espiao = criarEspiao({ id: uid('pay'), valor: 179, vencimento: dataSp(assinatura.renovaEm) });
    _overrideGatewayForTest(espiao.gateway);
    expect((await confirmarTroca(userId, { planoId: ids.basic, chave: uid('c'), ciente: true })).ok).toBe(true);
    expect(chamadas(espiao, 'atualizarValorAssinatura')).toEqual([[assinatura.gatewaySubscriptionId, 99]]);
    expect(espiao.pendente!.valor).toBe(99); // próxima fatura já vem menor

    const desfaz = await confirmarTroca(userId, { planoId: ids.basic_plus, chave: uid('c') });
    expect(desfaz).toMatchObject({ ok: true, status: 'desfeita' });
    expect(chamadas(espiao, 'atualizarValorAssinatura')).toEqual([[assinatura.gatewaySubscriptionId, 99], [assinatura.gatewaySubscriptionId, 179]]);
    expect(chamadas(espiao, 'atualizarValorCobranca')).toEqual([]); // sem cobrança
    expect(espiao.pendente!.valor).toBe(179);
    expect((await assinaturaViva(userId)).planoId).toBe(ids.basic_plus);
    const trocas = await trocasDe(userId);
    expect(trocas.filter((t) => t.status === 'agendada')).toHaveLength(0);
    expect(trocas.filter((t) => t.tipo === 'descer').map((t) => t.status)).toEqual(['desfeita']);
    // Data passa: nada a aplicar.
    expect(await aplicarTrocasVencidas(userId)).toBe(0);
    expect((await perfil(request)).trocaAgendada).toBeNull();
  });

  test('descer e subir para um plano acima do atual antes da data: desfaz e sobe com proporcional', async ({ request }) => {
    const { userId, ids } = await donoPago(request, 'desfaz-sobe', 'basic_plus');
    expect((await trocarHttp(request, ids.basic, { chave: uid('c'), ciente: true })).status()).toBe(200);
    const previa = await (await trocarHttp(request, ids.premium, { previa: true })).json();
    expect(previa).toMatchObject({ acao: 'desfazer_e_subir', tipo: 'subir' });
    expect(previa.diferenca).toBeGreaterThan(0);
    expect((await trocarHttp(request, ids.premium, { chave: uid('c') })).status()).toBe(200);
    expect((await assinaturaViva(userId)).planoId).toBe(ids.premium);
    const trocas = await trocasDe(userId);
    expect(trocas.map((t) => `${t.tipo}:${t.status}`).sort()).toEqual(['descer:desfeita', 'subir:aplicada']);
  });

  test('bloqueios: fatura atrasada, cancelamento agendado, teste sem assinatura, admin', async ({ request }) => {
    const { userId, ids } = await donoPago(request, 'bloqueios', 'basic');
    const a = await assinaturaViva(userId);
    // Pagamento da fatura falhou: segue a inadimplência existente e bloqueia a troca.
    await aplicarEventoWebhook({ eventId: uid('evt'), type: 'payment_failed', gatewaySubscriptionId: a.gatewaySubscriptionId!, paymentId: uid('pay') });
    expect((await assinaturaViva(userId)).status).toBe('inadimplente');
    const inad = await trocarHttp(request, ids.premium, { previa: true });
    expect(inad.status()).toBe(409);
    expect((await inad.json()).code).toBe('INADIMPLENTE');

    await db.update(assinaturas).set({ status: 'ativa' }).where(eq(assinaturas.id, a.id));
    expect((await request.post('/api/assinaturas/cancelar', { data: { persona: 'xgestao' } })).status()).toBe(200);
    const cancelada = await trocarHttp(request, ids.premium, { previa: true });
    expect(cancelada.status()).toBe(409);
    expect((await cancelada.json()).code).toBe('CANCELAMENTO_AGENDADO');

    // Teste sem assinatura: é checkout, não troca.
    await novoAssinanteHomologacao(request, 'bloqueio-teste');
    const teste = await trocarHttp(request, ids.premium, { previa: true });
    expect(teste.status()).toBe(409);
    expect((await teste.json()).code).toBe('SEM_ASSINATURA');

    await logout(request);
    await loginAs(request, SEED_ADMIN_EMAIL);
    expect((await trocarHttp(request, ids.premium, { previa: true })).status()).toBe(403);
    await logout(request);
  });

  test('mês bônus do teste ainda não pago: só muda plano e valor da 1ª cobrança, bônus mantido', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'bonus');
    const ids = await planoIds(request);
    await assinarNoTeste(request, ids.basic);
    const antes = await assinaturaViva(userId);
    expect(antes.fimTesteEm).not.toBeNull();
    expect(antes.primeiroPagamentoEm).toBeNull();
    const espiao = criarEspiao({ id: uid('pay'), valor: 99, vencimento: dataSp(antes.renovaEm!) });
    _overrideGatewayForTest(espiao.gateway);
    await db.update(assinaturas).set({ gatewaySubscriptionId: uid('sub') }).where(eq(assinaturas.id, antes.id));

    const previa = await (await trocarHttp(request, ids.premium, { previa: true })).json();
    expect(previa).toMatchObject({ acao: 'subir_sem_proporcional', diferenca: 0, valorProximaFatura: 299 });
    expect((await confirmarTroca(userId, { planoId: ids.premium, chave: uid('c') })).ok).toBe(true);
    const depois = await assinaturaViva(userId);
    expect(depois.planoId).toBe(ids.premium);
    expect(depois.renovaEm!.getTime()).toBe(antes.renovaEm!.getTime());
    expect(depois.fimTesteEm!.getTime()).toBe(antes.fimTesteEm!.getTime());
    expect(espiao.pendente!.valor).toBe(299);
    expect(chamadas(espiao, 'atualizarValorCobranca')).toEqual([]);
  });

  test('estorno pelo painel do Asaas durante troca pendente: troca cancelada', async ({ request }) => {
    const { userId, ids, assinatura } = await donoPago(request, 'estorno', 'premium');
    expect((await trocarHttp(request, ids.basic_plus, { chave: uid('c'), ciente: true })).status()).toBe(200);
    expect((await trocasDe(userId))[0].status).toBe('agendada');
    await aplicarEventoWebhook({ eventId: uid('evt'), type: 'payment_refunded', gatewaySubscriptionId: assinatura.gatewaySubscriptionId!, paymentId: uid('pay'), valor: 299 });
    expect((await trocasDe(userId))[0].status).toBe('cancelada');
    expect(await aplicarTrocasVencidas(userId)).toBe(0);
  });

  test('marketplace intacto: obra com contratante não é marcada e o empreiteiro de marketplace não é bloqueado', async ({ request }) => {
    const { userId, ids } = await donoPago(request, 'marketplace', 'basic_plus');
    const empresaId = await empresaDe(userId);
    const obraPropria = await criarObra(request, 'E2E troca própria');
    const obraPropria2 = await criarObra(request, 'E2E troca própria 2');
    const { clientes } = await import('@shared/db/schema');
    const [cliente] = await db.select({ id: clientes.id }).from(clientes).limit(1);
    const [marketplace] = await db.insert(obras).values({
      nome: 'E2E troca marketplace', endereco: 'Rua Marketplace, 1', clienteId: cliente.id, empreiteiraId: empresaId, status: 'em_andamento',
    }).returning({ id: obras.id });
    try {
      expect((await trocarHttp(request, ids.basic, { chave: uid('c'), obras: [obraPropria], ciente: true })).status()).toBe(200);
      await db.update(assinaturaTrocas).set({ efetivaEm: new Date(Date.now() - 60_000) }).where(eq(assinaturaTrocas.userId, userId));
      await aplicarTrocasVencidas(userId);
      const [mk] = await db.select({ b: obras.xgestaoBloqueadaPorPlano }).from(obras).where(eq(obras.id, marketplace.id));
      expect(mk.b).toBe(false);
      const [p2] = await db.select({ b: obras.xgestaoBloqueadaPorPlano }).from(obras).where(eq(obras.id, obraPropria2));
      expect(p2.b).toBe(true);
      // A marca não pode ser escrita pelo PATCH genérico.
      await request.patch(`/api/obras/${obraPropria}`, { data: { xgestaoBloqueadaPorPlano: true } });
      const [p1] = await db.select({ b: obras.xgestaoBloqueadaPorPlano }).from(obras).where(eq(obras.id, obraPropria));
      expect(p1.b).toBe(false);
      // Assinaturas de marketplace não têm troca xgestão.
      const mkAssinaturas = await db.select().from(assinaturaTrocas).where(eq(assinaturaTrocas.userId, userId));
      expect(mkAssinaturas.every((t) => t.tierPara === 'basic')).toBe(true);
    } finally {
      await apagarObras([obraPropria, obraPropria2, marketplace.id]);
    }
  });
});
