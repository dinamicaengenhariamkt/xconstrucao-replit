import { expect, test, type APIRequestContext } from '@playwright/test';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@shared/db/db';
import {
  assinaturaEventos,
  assinaturaTrocas,
  assinaturas,
  empreiteiras,
  financeiro,
  planos,
  platformSettings,
  users,
} from '@shared/db/schema';
import { aplicarEventoWebhook, cancelarAssinatura, iniciarCheckout } from '@features/planos/assinatura-service';
import { confirmarTroca, previaTroca } from '@features/planos/troca-plano-service';
import { _overrideGatewayForTest, type PaymentGateway } from '@features/planos/gateway';
import { ManualGateway } from '@features/planos/gateway/manual-gateway';
import { somarMeses } from '@features/xgestao/lib/acesso-plano';
import { ORIGEM_MENSALIDADE_XGESTAO } from '@features/xgestao/lib/receita';
import { documentoDoUsuario } from '@features/xgestao/server/documento-antiabuso';
import { SEED_ADMIN_EMAIL, loginAs, logout } from '../helpers';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';

/**
 * XG50 — validação final do fluxo de pagamento do xgestão
 * (docs/jornadas-xgestao/50-fluxo-pagamento-validacao.md).
 *
 * Os eventos do Asaas passam pelo mesmo `aplicarEventoWebhook` do handler real,
 * no processo do teste; o servidor usa o gateway manual. Onde é preciso ver o
 * que iria ao Asaas, o service roda aqui com um gateway espião.
 */
const DIA_MS = 24 * 60 * 60_000;

function uid(rotulo: string) {
  return `xg50_${rotulo}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Data do Asaas (YYYY-MM-DD, São Paulo). */
function diaSp(data: Date): string {
  return data.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

/** Como o service lê o vencimento: meio-dia em São Paulo. */
function meioDia(dia: string): Date {
  return new Date(`${dia}T12:00:00-03:00`);
}

/** CPF válido e único por execução (o 529.982.247-25 de exemplo já está em centenas de contas do dev). */
function cpfUnico(): string {
  const base = `9${Date.now().toString().slice(-8)}`;
  const digito = (d: string) => {
    const soma = [...d].reduce((t, n, i) => t + Number(n) * (d.length + 1 - i), 0);
    const r = (soma * 10) % 11;
    return String(r === 10 ? 0 : r);
  };
  const p = digito(base);
  return `${base}${p}${digito(base + p)}`;
}

async function planoIds(request: APIRequestContext) {
  const catalogo = await (await request.get('/api/planos?persona=xgestao')).json() as Array<{ id: string; tier: string }>;
  const id = (tier: string) => catalogo.find((p) => p.tier === tier)!.id;
  return { basic: id('basic'), basic_plus: id('basic_plus'), premium: id('premium') };
}

async function linhas(userId: string) {
  return db.select().from(assinaturas).where(and(eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao')));
}

async function ativas(userId: string) {
  return (await linhas(userId)).filter((a) => a.status === 'ativa');
}

async function teste(userId: string) {
  return (await linhas(userId)).find((a) => a.gatewayProvider === 'trial')!;
}

async function caixa(userId: string) {
  return db.select().from(financeiro).where(and(
    eq(financeiro.pagadorUserId, userId), eq(financeiro.origemTipo, ORIGEM_MENSALIDADE_XGESTAO),
  ));
}

async function eventos(userId: string, tipo: string) {
  return db.select().from(assinaturaEventos).where(and(eq(assinaturaEventos.userId, userId), eq(assinaturaEventos.tipo, tipo)));
}

async function perfil(request: APIRequestContext) {
  const r = await request.get('/api/perfil/plano?persona=xgestao');
  expect(r.status(), await r.text()).toBe(200);
  return r.json();
}

async function checkout(request: APIRequestContext, planoId: string, ciclo: 'mensal' | 'anual' = 'mensal') {
  return request.post('/api/assinaturas/checkout', { data: { planoId, persona: 'xgestao', ciclo } });
}

async function cancelarHttp(request: APIRequestContext) {
  const r = await request.post('/api/assinaturas/cancelar', { data: { persona: 'xgestao' } });
  expect(r.status(), await r.text()).toBe(200);
  return r.json() as Promise<{ ok: true; acessoAte?: string }>;
}

/** Roda `fn` logado como admin e volta para a conta do assinante. */
async function comoAdmin<T>(request: APIRequestContext, emailAssinante: string, fn: () => Promise<T>): Promise<T> {
  await logout(request);
  await loginAs(request, SEED_ADMIN_EMAIL);
  try {
    return await fn();
  } finally {
    await logout(request);
    await loginAs(request, emailAssinante);
  }
}

async function detalheAdmin(request: APIRequestContext, userId: string) {
  const r = await request.get(`/api/admin/xgestao/assinantes/${userId}`);
  expect(r.status(), await r.text()).toBe(200);
  return r.json();
}

function evento(args: {
  tipo: 'PAYMENT_CREATED' | 'PAYMENT_CONFIRMED' | 'PAYMENT_RECEIVED' | 'PAYMENT_OVERDUE' | 'PAYMENT_REFUNDED';
  paymentId: string;
  sub: string;
  ref: string;
  due: string;
  valor: number;
}) {
  const type = args.tipo === 'PAYMENT_CREATED' ? 'payment_created'
    : args.tipo === 'PAYMENT_OVERDUE' ? 'payment_failed'
      : args.tipo === 'PAYMENT_REFUNDED' ? 'payment_refunded'
        : 'payment_succeeded';
  return aplicarEventoWebhook({
    eventId: `${args.tipo}:${args.paymentId}`,
    type,
    gatewaySubscriptionId: args.sub,
    externalReference: args.ref,
    dueDate: args.due,
    paymentId: args.paymentId,
    valor: args.valor,
    ...(type === 'payment_refunded' ? { motivo: 'estorno' as const } : {}),
  });
}

type Espiao = { gateway: PaymentGateway; cancelados: string[]; valores: Array<[string, number]> };

function criarEspiao(provider: 'manual' | 'asaas' = 'manual'): Espiao {
  const manual = new ManualGateway();
  const e: Espiao = { cancelados: [], valores: [], gateway: undefined as unknown as PaymentGateway };
  e.gateway = {
    provider,
    createCheckout: async (i) => {
      const r = await manual.createCheckout({ ...i, pendingMode: true });
      return { ...r, gatewaySubscriptionId: undefined };
    },
    parseWebhook: (b, h, ip) => manual.parseWebhook(b, h, ip),
    checkPaymentStatus: (id) => manual.checkPaymentStatus(id),
    cancelSubscription: async (id) => { if (id) e.cancelados.push(id); },
    atualizarValorAssinatura: async (sub, valor) => { e.valores.push([sub, valor]); },
    proximaCobrancaPendente: async () => null,
    atualizarValorCobranca: async () => undefined,
  };
  return e;
}

test.describe('XG50 — fluxo de pagamento do xgestão, validação final', () => {
  test.afterEach(() => { _overrideGatewayForTest(null); });

  test('mensal: cada pagamento libera 1 mês a partir do vencimento pago, entra uma vez no caixa, em qualquer ordem', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'xg50-mensal');
    const ids = await planoIds(request);
    const fimTeste = (await teste(userId)).renovaEm!;
    const sub = uid('sub');
    const ref = `xconstrucao|${userId}|${ids.basic}|mensal`;
    const due1 = diaSp(somarMeses(fimTeste, 1));
    const due2 = diaSp(somarMeses(meioDia(due1), 1));
    const due3 = diaSp(somarMeses(meioDia(due2), 1));
    const [p1, p2, p3] = [uid('p1'), uid('p2'), uid('p3')];

    // Assinou no teste: o Asaas cria a 1ª cobrança para depois do mês bônus.
    expect((await evento({ tipo: 'PAYMENT_CREATED', paymentId: p1, sub, ref, due: due1, valor: 99 })).processed).toBe(true);
    let viva = (await ativas(userId))[0];
    expect(viva).toMatchObject({ gatewaySubscriptionId: sub, primeiroPagamentoEm: null });
    expect(diaSp(viva.renovaEm!)).toBe(due1);
    expect(viva.fimTesteEm?.getTime()).toBe(fimTeste.getTime());
    let p = await perfil(request);
    expect(p.cobranca).toMatchObject({ ciclo: 'mensal', valor: 99, primeiraCobranca: true, diferencaPendente: 0 });
    expect(diaSp(new Date(p.cobranca.proximaEm))).toBe(due1);

    // 1ª cobrança paga: CONFIRMED, RECEIVED e o retry do mesmo evento valem 1 mês e 1 lançamento.
    await evento({ tipo: 'PAYMENT_CONFIRMED', paymentId: p1, sub, ref, due: due1, valor: 99 });
    await evento({ tipo: 'PAYMENT_RECEIVED', paymentId: p1, sub, ref, due: due1, valor: 99 });
    expect((await evento({ tipo: 'PAYMENT_CONFIRMED', paymentId: p1, sub, ref, due: due1, valor: 99 })).processed).toBe(false);
    viva = (await ativas(userId))[0];
    expect(viva.renovaEm!.getTime()).toBe(somarMeses(meioDia(due1), 1).getTime());
    expect(viva.primeiroPagamentoEm).not.toBeNull();
    expect((await caixa(userId)).filter((l) => l.origemId === p1)).toHaveLength(1);

    // 2º mês fora de ordem: RECEIVED antes do CONFIRMED e o PAYMENT_CREATED por último.
    await evento({ tipo: 'PAYMENT_RECEIVED', paymentId: p2, sub, ref, due: due2, valor: 99 });
    await evento({ tipo: 'PAYMENT_CONFIRMED', paymentId: p2, sub, ref, due: due2, valor: 99 });
    await evento({ tipo: 'PAYMENT_CREATED', paymentId: p2, sub, ref, due: due2, valor: 99 });
    viva = (await ativas(userId))[0];
    expect(viva.renovaEm!.getTime()).toBe(somarMeses(meioDia(due2), 1).getTime());
    // OVERDUE atrasado de uma cobrança já paga não deixa inadimplente.
    await evento({ tipo: 'PAYMENT_OVERDUE', paymentId: p1, sub, ref, due: due1, valor: 99 });
    expect((await ativas(userId))[0].status).toBe('ativa');

    // 3º mês recusado; um evento atrasado de um mês já pago não reativa nem avança.
    await evento({ tipo: 'PAYMENT_OVERDUE', paymentId: p3, sub, ref, due: due3, valor: 99 });
    let atual = (await linhas(userId)).find((a) => a.id === viva.id)!;
    expect(atual.status).toBe('inadimplente');
    await aplicarEventoWebhook({ eventId: `PAYMENT_RECEIVED:${p2}:atrasado`, type: 'payment_succeeded', gatewaySubscriptionId: sub, externalReference: ref, dueDate: due2, paymentId: p2, valor: 99 });
    atual = (await linhas(userId)).find((a) => a.id === viva.id)!;
    expect(atual.status).toBe('inadimplente');
    expect(atual.renovaEm!.getTime()).toBe(somarMeses(meioDia(due2), 1).getTime());
    // Pagou o 3º: volta a ativa com o período do 3º vencimento.
    await evento({ tipo: 'PAYMENT_CONFIRMED', paymentId: p3, sub, ref, due: due3, valor: 99 });
    atual = (await linhas(userId)).find((a) => a.id === viva.id)!;
    expect(atual.status).toBe('ativa');
    expect(atual.renovaEm!.getTime()).toBe(somarMeses(meioDia(due3), 1).getTime());

    const lancamentos = await caixa(userId);
    expect(lancamentos.map((l) => l.origemId).sort()).toEqual([p1, p2, p3].sort());
    expect(lancamentos.reduce((t, l) => t + Number(l.valor), 0)).toBe(297);
    expect(await ativas(userId)).toHaveLength(1);

    // Tela do empreiteiro: próxima cobrança, valor e situação.
    p = await perfil(request);
    expect(p).toMatchObject({ plano: 'basic', somenteLeitura: false, inadimplente: false, cancelamentoAgendado: false });
    expect(p.cobranca).toMatchObject({ valor: 99, primeiraCobranca: false });
    expect(diaSp(new Date(p.cobranca.proximaEm))).toBe(diaSp(atual.renovaEm!));
  });

  test('CONFIRMED antes do PAYMENT_CREATED: a assinatura nasce do pagamento e o mês bônus continua marcado', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'xg50-ordem');
    const ids = await planoIds(request);
    const fimTeste = (await teste(userId)).renovaEm!;
    const sub = uid('sub');
    const ref = `xconstrucao|${userId}|${ids.basic}|mensal`;
    const due = diaSp(somarMeses(fimTeste, 1));
    const pay = uid('pay');
    await evento({ tipo: 'PAYMENT_CONFIRMED', paymentId: pay, sub, ref, due, valor: 99 });
    await evento({ tipo: 'PAYMENT_CREATED', paymentId: pay, sub, ref, due, valor: 99 });
    await evento({ tipo: 'PAYMENT_RECEIVED', paymentId: pay, sub, ref, due, valor: 99 });
    const vivas = await ativas(userId);
    expect(vivas).toHaveLength(1);
    expect(vivas[0].renovaEm!.getTime()).toBe(somarMeses(meioDia(due), 1).getTime());
    expect(vivas[0].fimTesteEm?.getTime()).toBe(fimTeste.getTime());
    expect(await caixa(userId)).toHaveLength(1);
  });

  test('2º checkout pago com plano ativo: a assinatura duplicada sai do gateway e nada cobra em dobro', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'xg50-dup');
    const ids = await planoIds(request);
    const espiao = criarEspiao();
    _overrideGatewayForTest(espiao.gateway);
    const fimTeste = (await teste(userId)).renovaEm!;
    const ref = `xconstrucao|${userId}|${ids.basic}|mensal`;
    const due = diaSp(somarMeses(fimTeste, 1));
    const [subA, subB, subC] = [uid('subA'), uid('subB'), uid('subC')];

    // Dois checkouts abertos no teste e os dois concluídos.
    await evento({ tipo: 'PAYMENT_CREATED', paymentId: uid('pA'), sub: subA, ref, due, valor: 99 });
    await evento({ tipo: 'PAYMENT_CREATED', paymentId: uid('pB'), sub: subB, ref, due, valor: 99 });
    expect(espiao.cancelados).toContain(subB);
    expect(espiao.cancelados).not.toContain(subA);
    expect((await ativas(userId)).map((a) => a.gatewaySubscriptionId)).toEqual([subA]);

    // Pagamento de outra assinatura cobrada na hora: não substitui, não entra no caixa.
    const pC = uid('pC');
    await evento({ tipo: 'PAYMENT_CONFIRMED', paymentId: pC, sub: subC, ref, due: diaSp(new Date()), valor: 99 });
    expect(espiao.cancelados).toContain(subC);
    expect((await ativas(userId)).map((a) => a.gatewaySubscriptionId)).toEqual([subA]);
    expect((await caixa(userId)).filter((l) => l.origemId === pC)).toHaveLength(0);
    const duplicadas = await eventos(userId, 'assinatura_duplicada_cancelada');
    expect(duplicadas).toHaveLength(2);
    expect(duplicadas.some((e) => e.payloadJson.estornarPagamento === true)).toBe(true);

    // Com plano pago ativo, o checkout pede a troca de plano.
    await db.update(assinaturas).set({ primeiroPagamentoEm: new Date(), fimTesteEm: null }).where(eq(assinaturas.gatewaySubscriptionId, subA));
    const r = await checkout(request, ids.basic_plus);
    expect(r.status(), await r.text()).toBe(409);
    expect((await r.json()).code).toBe('USAR_TROCA');
  });

  test('cancelar e voltar várias vezes: reativa sem cobrar de novo, nunca duas ativas, admin marca o padrão', async ({ request }) => {
    const { userId, email } = await novoAssinanteHomologacao(request, 'xg50-volta', { iniciarTeste: false });
    const ids = await planoIds(request);
    const primeira = await checkout(request, ids.basic);
    expect(primeira.status(), await primeira.text()).toBe(201);
    const fimPago = (await ativas(userId))[0].renovaEm!;

    for (let ciclo = 1; ciclo <= 2; ciclo++) {
      const c = await cancelarHttp(request);
      expect(new Date(c.acessoAte!).getTime(), `cancelamento ${ciclo}`).toBe(fimPago.getTime());
      const volta = await checkout(request, ids.basic);
      expect(volta.status(), await volta.text()).toBe(201);
      const corpo = await volta.json();
      // Sem cobrança agora e sem perder o período pago: a 1ª cobrança é no fim dele.
      expect(new Date(corpo.primeiraCobrancaEm).getTime(), `volta ${ciclo}`).toBe(fimPago.getTime());
      const vivas = await ativas(userId);
      expect(vivas).toHaveLength(1);
      expect(vivas[0]).toMatchObject({ canceladaEm: null, fimTesteEm: null });
      expect(vivas[0].renovaEm!.getTime()).toBe(fimPago.getTime());
    }
    const p = await perfil(request);
    expect(p).toMatchObject({ cancelamentoAgendado: false, somenteLeitura: false });
    expect(diaSp(new Date(p.cobranca.proximaEm))).toBe(diaSp(fimPago));

    // Admin: voltou, 2 voltas em 90 dias, alerta; lista, detalhe e CSV.
    await comoAdmin(request, email, async () => {
      const detalhe = await detalheAdmin(request, userId);
      expect(detalhe.assinante.retorno).toMatchObject({ voltou: true, ciclos90d: 2, frequente: true });
      expect(detalhe.historico.eventos.filter((e: { tipo: string }) => e.tipo === 'cancelamento_agendado')).toHaveLength(2);
      const lista = await (await request.get('/api/admin/xgestao/assinantes')).json() as { rows: Array<{ userId: string; retorno: { frequente: boolean } }> };
      expect(lista.rows.find((l) => l.userId === userId)?.retorno.frequente).toBe(true);
      const csv = await request.get(`/api/admin/xgestao/export?tipo=assinantes&situacao=cancela_volta&q=${encodeURIComponent(email)}`);
      expect(csv.status()).toBe(200);
      const texto = await csv.text();
      expect(texto).toContain('Cancela e volta com frequência');
      expect(texto).toContain(email);
    });

    // Depois do fim do período: assinar de novo cobra na hora, sem bônus e sem teste novo.
    await cancelarHttp(request);
    await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - 60_000) })
      .where(and(eq(assinaturas.userId, userId), eq(assinaturas.status, 'ativa')));
    const depois = await checkout(request, ids.basic);
    expect(depois.status(), await depois.text()).toBe(201);
    expect((await depois.json()).primeiraCobrancaEm).toBeUndefined();
    expect(await ativas(userId)).toHaveLength(1);
    expect((await linhas(userId)).filter((a) => a.gatewayProvider === 'trial')).toHaveLength(0);
  });

  test('mês bônus uma vez: cancelar no teste e assinar de novo não dá outro mês', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'xg50-bonus');
    const ids = await planoIds(request);
    const fimTeste = (await teste(userId)).renovaEm!;
    const r1 = await checkout(request, ids.basic);
    expect(r1.status(), await r1.text()).toBe(201);
    expect(new Date((await r1.json()).primeiraCobrancaEm).getTime()).toBe(somarMeses(fimTeste, 1).getTime());
    const c = await cancelarHttp(request);
    expect(new Date(c.acessoAte!).getTime()).toBe(fimTeste.getTime() + DIA_MS);
    const r2 = await checkout(request, ids.basic);
    expect(r2.status(), await r2.text()).toBe(201);
    expect(new Date((await r2.json()).primeiraCobrancaEm).getTime()).toBe(fimTeste.getTime() + DIA_MS);
    const vivas = await ativas(userId);
    expect(vivas).toHaveLength(1);
    expect(vivas[0].fimTesteEm).toBeNull();
  });

  test('teste e mês bônus uma vez por CPF/CNPJ: outra conta com o mesmo documento não ganha de novo', async ({ request }) => {
    const a = await novoAssinanteHomologacao(request, 'xg50-docA');
    const ids = await planoIds(request);
    expect((await checkout(request, ids.basic)).status()).toBe(201);
    const docA = (await documentoDoUsuario(a.userId))!;
    expect(docA).toMatch(/^\d{11,14}$/);

    // Conta B com o mesmo documento antes do 1º acesso: sem teste.
    const b = await novoAssinanteHomologacao(request, 'xg50-docB', { iniciarTeste: false });
    await db.update(users).set({ cpfCnpj: docA }).where(eq(users.id, b.userId));
    await db.update(empreiteiras).set({ cnpj: docA }).where(eq(empreiteiras.userId, b.userId));
    for (let i = 0; i < 2; i++) expect((await request.get('/xgestao/dashboard')).status()).toBe(200);
    expect(await linhas(b.userId)).toHaveLength(0);
    expect(await eventos(b.userId, 'teste_negado')).toHaveLength(1);
    expect((await perfil(request)).teste).toMatchObject({ elegivel: false, emTeste: false });
    const manual = await request.post('/api/xgestao/teste', { data: {} });
    expect(manual.status()).toBe(409);

    // Conta C no teste que passa a usar o documento de A: sem o +1 mês.
    const c = await novoAssinanteHomologacao(request, 'xg50-docC');
    const fimC = (await teste(c.userId)).renovaEm!;
    await db.update(users).set({ cpfCnpj: docA }).where(eq(users.id, c.userId));
    await db.update(empreiteiras).set({ cnpj: docA }).where(eq(empreiteiras.userId, c.userId));
    const pc = await perfil(request);
    expect(pc.teste).toMatchObject({ emTeste: true, bonusDisponivel: false, primeiraCobrancaComBonus: null });
    const r = await checkout(request, ids.basic);
    expect(r.status(), await r.text()).toBe(201);
    expect(new Date((await r.json()).primeiraCobrancaEm).getTime()).toBe(fimC.getTime());
    expect(await eventos(c.userId, 'bonus_negado')).toHaveLength(1);
    expect((await ativas(c.userId))[0].fimTesteEm).toBeNull();

    await comoAdmin(request, c.email, async () => {
      for (const id of [b.userId, c.userId]) {
        const d = await detalheAdmin(request, id);
        expect(d.assinante.retorno).toMatchObject({ tentativasBloqueadas: 1, frequente: true });
        expect(d.historico.eventos.some((e: { tipo: string }) => e.tipo === 'teste_negado' || e.tipo === 'bonus_negado')).toBe(true);
      }
    });
  });

  test('inadimplente e estorno voltam sem a assinatura antiga seguir viva', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'xg50-inad', { iniciarTeste: false });
    const ids = await planoIds(request);
    expect((await checkout(request, ids.basic)).status()).toBe(201);
    const antiga = (await ativas(userId))[0];
    await db.update(assinaturas).set({ status: 'inadimplente', renovaEm: new Date(Date.now() - 2 * DIA_MS) }).where(eq(assinaturas.id, antiga.id));
    const volta = await checkout(request, ids.basic);
    expect(volta.status(), await volta.text()).toBe(201);
    expect((await linhas(userId)).find((a) => a.id === antiga.id)?.status).toBe('cancelada');
    const nova = (await ativas(userId))[0];
    expect(nova.id).not.toBe(antiga.id);

    // Estorno encerra na hora; assinar de novo cobra na hora, sem teste nem bônus.
    const sub = uid('sub');
    await db.update(assinaturas).set({ gatewaySubscriptionId: sub }).where(eq(assinaturas.id, nova.id));
    await evento({ tipo: 'PAYMENT_REFUNDED', paymentId: uid('pay'), sub, ref: `xconstrucao|${userId}|${ids.basic}|mensal`, due: diaSp(new Date()), valor: 99 });
    expect(await ativas(userId)).toHaveLength(0);
    expect((await perfil(request)).somenteLeitura).toBe(true);
    const deNovo = await checkout(request, ids.basic);
    expect(deNovo.status(), await deNovo.text()).toBe(201);
    expect((await deNovo.json()).primeiraCobrancaEm).toBeUndefined();
    expect(await ativas(userId)).toHaveLength(1);
    expect((await linhas(userId)).filter((a) => a.gatewayProvider === 'trial')).toHaveLength(0);
  });

  test('REV-09: cancelar e trocar ao mesmo tempo terminam num estado coerente', async ({ request }) => {
    for (const ordem of ['cancelar_primeiro', 'trocar_primeiro'] as const) {
      const { userId } = await novoAssinanteHomologacao(request, `xg50-corrida-${ordem}`);
      const ids = await planoIds(request);
      expect((await checkout(request, ids.basic)).status()).toBe(201);
      const viva = (await ativas(userId))[0];
      const sub = uid('sub');
      await db.update(assinaturas).set({
        primeiroPagamentoEm: new Date(Date.now() - 15 * DIA_MS), fimTesteEm: null,
        renovaEm: new Date(Date.now() + 15 * DIA_MS), gatewaySubscriptionId: sub,
      }).where(eq(assinaturas.id, viva.id));
      const espiao = criarEspiao();
      _overrideGatewayForTest(espiao.gateway);

      const cancelar = () => cancelarAssinatura(userId, 'xgestao');
      const trocar = () => confirmarTroca(userId, { planoId: ids.basic_plus, chave: uid('chave') });
      const [r1, r2] = ordem === 'cancelar_primeiro'
        ? await Promise.all([cancelar(), trocar()])
        : (await Promise.all([trocar(), cancelar()])).reverse() as [Awaited<ReturnType<typeof cancelar>>, Awaited<ReturnType<typeof trocar>>];
      expect(r1.ok || r1.code === 'TROCA_EM_ANDAMENTO', `${ordem}: cancelar`).toBe(true);
      void r2;
      // Se o cancelamento esperou a troca, tenta de novo (como a tela faria).
      if (!r1.ok) expect((await cancelarAssinatura(userId, 'xgestao')).ok).toBe(true);

      const final = (await linhas(userId)).find((a) => a.id === viva.id)!;
      expect(final.status, ordem).toBe('ativa');
      expect(final.canceladaEm, ordem).not.toBeNull();
      // Subida não paga é revertida no cancelamento: nunca fica no plano maior cancelado.
      expect(final.planoId, ordem).toBe(ids.basic);
      const trocas = await db.select().from(assinaturaTrocas).where(eq(assinaturaTrocas.userId, userId));
      expect(trocas.filter((t) => t.status === 'pendente_gateway'), ordem).toHaveLength(0);
      expect(trocas.filter((t) => t.status === 'aplicada' && !t.quitadaEm), ordem).toHaveLength(0);
      expect(await ativas(userId)).toHaveLength(1);
      expect(espiao.cancelados).toContain(sub);
      _overrideGatewayForTest(null);
    }
  });

  test('checkout no servidor: CPF/CNPJ obrigatório e válido para o gateway real; bônus no retorno', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'xg50-doc');
    const ids = await planoIds(request);
    const fimTeste = (await teste(userId)).renovaEm!;
    _overrideGatewayForTest(criarEspiao('asaas').gateway);
    await db.update(users).set({ cpfCnpj: '11111111111' }).where(eq(users.id, userId));
    await db.update(empreiteiras).set({ cnpj: '123' }).where(eq(empreiteiras.userId, userId));
    const semDoc = await iniciarCheckout({ userId, planoId: ids.basic, persona: 'xgestao' });
    expect(semDoc).toMatchObject({ ok: false, code: 'PERFIL_INCOMPLETO' });
    const valido = (await documentoDoUsuario(userId)) ?? null;
    expect(valido).toBeNull();
    // CPF válido na conta (pessoa física, PAG-14).
    await db.update(users).set({ cpfCnpj: cpfUnico() }).where(eq(users.id, userId));
    const ok = await iniciarCheckout({ userId, planoId: ids.basic, persona: 'xgestao' });
    expect(ok).toMatchObject({ ok: true, kind: 'redirect' });
    if (ok.ok) expect(new Date(ok.primeiraCobrancaEm!).getTime()).toBe(somarMeses(fimTeste, 1).getTime());
    // O teste continua ligado ao documento com que começou; o novo fica na conta e
    // trava teste e bônus em outra conta do mesmo jeito.
    expect((await teste(userId)).documentoFiscal).toMatch(/^\d{11,14}$/);
    await db.update(users).set({ cpfCnpj: null }).where(eq(users.id, userId));
    await db.update(assinaturas).set({ documentoFiscal: null }).where(eq(assinaturas.userId, userId));
  });

  test('anual preparado e desligado; ligado, cobra o ano, libera 12 meses, 1 lançamento, MRR /12, troca e cancelamento no ciclo anual', async ({ request }) => {
    // O catálogo exige sessão: entra com a 1ª conta antes de ler os planos.
    const u1 = await novoAssinanteHomologacao(request, 'xg50-anual1', { iniciarTeste: false });
    const ids = await planoIds(request);
    const originais = await db.select({ id: planos.id, valorAnual: planos.valorAnual }).from(planos).where(inArray(planos.id, [ids.basic, ids.basic_plus]));
    const [settingOriginal] = await db.select().from(platformSettings).where(eq(platformSettings.chave, 'xgestao'));
    const ligar = async (ativo: boolean) => {
      const valor = { ...((settingOriginal?.valor as Record<string, unknown>) ?? {}), anualAtivo: ativo };
      await db.insert(platformSettings).values({ chave: 'xgestao', valor })
        .onConflictDoUpdate({ target: platformSettings.chave, set: { valor } });
    };
    try {
      await db.update(planos).set({ valorAnual: '990.00' }).where(eq(planos.id, ids.basic));
      await db.update(planos).set({ valorAnual: '1790.00' }).where(eq(planos.id, ids.basic_plus));

      // Desligado (padrão): não aparece nem é aceito, mesmo com preço anual.
      await ligar(false);
      expect((await perfil(request)).anualDisponivel).toBe(false);
      const recusado = await checkout(request, ids.basic, 'anual');
      expect(recusado.status()).toBe(400);
      expect((await recusado.json()).code).toBe('CICLO_INVALIDO');

      // Ligado: cobra o ano e libera 12 meses.
      await ligar(true);
      expect((await perfil(request)).anualDisponivel).toBe(true);
      const antes = new Date();
      const aceito = await checkout(request, ids.basic, 'anual');
      expect(aceito.status(), await aceito.text()).toBe(201);
      const anual = (await ativas(u1.userId))[0];
      expect(anual.ciclo).toBe('anual');
      const meses = (anual.renovaEm!.getTime() - antes.getTime()) / DIA_MS;
      expect(meses).toBeGreaterThan(364);
      expect(meses).toBeLessThan(367);
      const p1 = await perfil(request);
      expect(p1.cobranca).toMatchObject({ ciclo: 'anual', valor: 990 });
      // Cancelamento vale até o fim do ano pago.
      const c = await cancelarHttp(request);
      expect(new Date(c.acessoAte!).getTime()).toBe(anual.renovaEm!.getTime());

      // Webhook anual: 12 meses a partir do vencimento e 1 lançamento "Anuidade".
      const u2 = await novoAssinanteHomologacao(request, 'xg50-anual2', { iniciarTeste: false });
      const sub = uid('sub');
      const ref = `xconstrucao|${u2.userId}|${ids.basic}|anual`;
      const due = diaSp(new Date());
      const pay = uid('pay');
      await evento({ tipo: 'PAYMENT_CONFIRMED', paymentId: pay, sub, ref, due, valor: 990 });
      await evento({ tipo: 'PAYMENT_RECEIVED', paymentId: pay, sub, ref, due, valor: 990 });
      const viva = (await ativas(u2.userId))[0];
      expect(viva.ciclo).toBe('anual');
      expect(viva.renovaEm!.getTime()).toBe(somarMeses(meioDia(due), 12).getTime());
      const lanc = await caixa(u2.userId);
      expect(lanc).toHaveLength(1);
      expect(Number(lanc[0].valor)).toBe(990);
      expect(lanc[0].descricao).toMatch(/^Anuidade xgestão/);

      // Troca no ciclo anual: proporcional sobre o ano e valor anual do plano novo.
      const previa = await previaTroca(u2.userId, ids.basic_plus);
      expect(previa.ok).toBe(true);
      if (previa.ok) {
        expect(previa.previa).toMatchObject({ acao: 'subir', valorDepois: 1790 });
        expect(previa.previa.diasCiclo).toBeGreaterThanOrEqual(365);
        expect(previa.previa.planoAtual.valor).toBe(990);
      }

      // MRR do admin: valor anual / 12.
      await comoAdmin(request, u2.email, async () => {
        const d = await detalheAdmin(request, u2.userId);
        expect(d.assinante.plano.valorMensal).toBe(82.5);
        expect(d.assinante.situacao.codigo).toBe('pago');
      });
    } finally {
      for (const o of originais) await db.update(planos).set({ valorAnual: o.valorAnual }).where(eq(planos.id, o.id));
      if (settingOriginal) {
        await db.update(platformSettings).set({ valor: settingOriginal.valor }).where(eq(platformSettings.chave, 'xgestao'));
      } else {
        await db.delete(platformSettings).where(eq(platformSettings.chave, 'xgestao'));
      }
    }
  });
});
