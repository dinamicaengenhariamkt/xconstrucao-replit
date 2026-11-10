import { expect, test, type APIRequestContext } from '@playwright/test';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturas, financeiro } from '@shared/db/schema';
import { aplicarEventoWebhook } from '@features/planos/assinatura-service';
import { ORIGEM_ESTORNO_MENSALIDADE_XGESTAO, ORIGEM_MENSALIDADE_XGESTAO } from '@features/xgestao/lib/receita';
import { somarMeses } from '@features/xgestao/lib/acesso-plano';
import { loginAs, SEED_ADMIN_EMAIL } from '../helpers';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';
import { contribuicaoDaConta, leiturasBatem } from '../helpers-admin-xgestao';

/**
 * XG45 — números comerciais do admin: cada mensalidade paga do xgestão entra
 * uma vez no caixa da plataforma (CONFIRMED e RECEIVED do mesmo pagamento não
 * dobram), e as telas de Conversão, Financeiro e do assinante mostram o funil
 * do teste, quem está saindo e quanto cada cliente já pagou.
 */
const DIA_MS = 24 * 60 * 60_000;
type Linha = Record<string, any>;

function diaSp(data: Date): string {
  return data.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

function eventoId(rotulo: string) {
  return `xg45-${rotulo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function admin(playwright: { request: { newContext: (o: { baseURL?: string }) => Promise<APIRequestContext> } }, baseURL?: string) {
  const ctx = await playwright.request.newContext({ baseURL });
  await loginAs(ctx, SEED_ADMIN_EMAIL);
  return ctx;
}

async function getJson(ctx: APIRequestContext, url: string): Promise<Linha> {
  const r = await ctx.get(url);
  expect(r.status(), await r.text()).toBe(200);
  return r.json();
}

async function assinar(request: APIRequestContext, tier: string, userId: string) {
  const catalogo = await (await request.get('/api/planos?persona=xgestao')).json() as Array<{ id: string; tier: string; valorMensal: string | number }>;
  const plano = catalogo.find((p) => p.tier === tier)!;
  const r = await request.post('/api/assinaturas/checkout', {
    data: { planoId: plano.id, persona: 'xgestao', ciclo: 'mensal' },
  });
  expect(r.status(), await r.text()).toBe(201);
  const [ativa] = await db.select().from(assinaturas)
    .where(and(eq(assinaturas.userId, userId), eq(assinaturas.status, 'ativa'), eq(assinaturas.persona, 'xgestao')));
  return { ...ativa, preco: Number(plano.valorMensal) };
}

async function mensalidades(paymentIds: string[]) {
  return db.select().from(financeiro)
    .where(and(eq(financeiro.origemTipo, ORIGEM_MENSALIDADE_XGESTAO), inArray(financeiro.origemId, paymentIds)));
}

test('XG45 mensalidades entram uma vez no caixa e aparecem na receita, no detalhe e na conversão', async ({ request, playwright, baseURL }) => {
  test.setTimeout(120_000);
  const { userId } = await novoAssinanteHomologacao(request, 'xg45-receita');
  const adminCtx = await admin(playwright, baseURL);
  const pagamentos = [`pay_xg45_a_${Date.now()}`, `pay_xg45_b_${Date.now()}`, `pay_xg45_c_${Date.now()}`];
  try {
    const detalheAntes = await getJson(adminCtx, `/api/admin/xgestao/assinantes/${userId}`);
    expect(detalheAntes.pagamentos).toEqual({ total: 0, pagamentos: 0, ultimoEm: null });
    expect(detalheAntes.jornadaTeste).toMatchObject({ estado: 'em_teste', comBonus: false, assinouEm: null });

    // Assina no teste: ganha o +1 mês (1ª cobrança adiada).
    const paga = await assinar(request, 'basic_plus', userId);
    expect(paga?.gatewaySubscriptionId, 'assinatura paga com id no gateway').toBeTruthy();
    const sub = paga.gatewaySubscriptionId!;
    const vencimento = diaSp(paga.renovaEm!);

    // CONFIRMED e RECEIVED do mesmo pagamento: um lançamento só.
    for (const rotulo of ['confirmed', 'received']) {
      await aplicarEventoWebhook({
        eventId: eventoId(rotulo), type: 'payment_succeeded', gatewaySubscriptionId: sub,
        dueDate: vencimento, valor: 149.9, paymentId: pagamentos[0],
      });
    }
    let caixa = await mensalidades(pagamentos);
    expect(caixa).toHaveLength(1);
    expect(caixa[0]).toMatchObject({ tipo: 'entrada', status: 'pago', categoria: 'assinatura', pagadorUserId: userId });
    expect(Number(caixa[0].valor)).toBe(149.9);

    // Mês seguinte: outro pagamento, outro lançamento.
    await aplicarEventoWebhook({
      eventId: eventoId('mes2'), type: 'payment_succeeded', gatewaySubscriptionId: sub,
      dueDate: diaSp(somarMeses(paga.renovaEm!, 1)), valor: 149.9, paymentId: pagamentos[1],
    });
    // Pela rota HTTP de simulação (mesmo caminho do handler): sem valor, usa o preço do plano.
    const viaRota = await request.post('/api/test/webhooks/asaas', {
      data: {
        type: 'payment_succeeded', eventId: eventoId('rota'), gatewaySubscriptionId: sub,
        dueDate: diaSp(somarMeses(paga.renovaEm!, 2)), paymentId: pagamentos[2],
      },
    });
    expect(viaRota.status(), await viaRota.text()).toBe(200);
    caixa = await mensalidades(pagamentos);
    expect(caixa).toHaveLength(3);
    const total = caixa.reduce((s, l) => s + Number(l.valor), 0);
    const esperado = Math.round((149.9 * 2 + paga.preco) * 100) / 100;
    expect(Math.round(total * 100) / 100).toBe(esperado);
    expect(caixa.filter((l) => Number(l.valor) === paga.preco && l.origemId === pagamentos[2])).toHaveLength(1);

    // Sem id do pagamento não registra (não teria como evitar o dobro).
    await aplicarEventoWebhook({
      eventId: eventoId('sem-id'), type: 'payment_succeeded', gatewaySubscriptionId: sub,
      dueDate: diaSp(somarMeses(paga.renovaEm!, 3)), valor: 149.9,
    });
    expect(await db.select().from(financeiro).where(and(eq(financeiro.origemTipo, ORIGEM_MENSALIDADE_XGESTAO), eq(financeiro.pagadorUserId, userId)))).toHaveLength(3);

    // Detalhe do assinante: quanto já pagou e como foi o teste.
    const detalhe = await getJson(adminCtx, `/api/admin/xgestao/assinantes/${userId}`);
    expect(detalhe.pagamentos).toMatchObject({ total: esperado, pagamentos: 3 });
    expect(detalhe.pagamentos.ultimoEm).toBeTruthy();
    expect(detalhe.jornadaTeste).toMatchObject({ estado: 'convertido', comBonus: true });
    expect(detalhe.assinante.situacao.codigo).toBe('pago');

    // Financeiro: a conta pesa exatamente o que pagou (TST-19: medido pela
    // própria conta, não por "depois - antes" de totais globais).
    const plus = (r: Linha) => r.receita.porPlano.find((l: Linha) => l.tier === 'basic_plus');
    const peso = await contribuicaoDaConta(adminCtx, userId, async () => {
      const r = await getJson(adminCtx, '/api/admin/xgestao/financeiro');
      return { receita: r.faturamento.receitaAcumulada, mrr: r.receita.mrr, pagantes: plus(r).pagantes, emTeste: plus(r).emTeste };
    });
    expect(peso).toEqual({ receita: esperado, mrr: paga.preco, pagantes: 1, emTeste: 0 });
    const depois = await getJson(adminCtx, '/api/admin/xgestao/financeiro');
    expect(depois.receita.ticketMedio).toBe(Math.round((depois.receita.mrr / depois.receita.pagantes) * 100) / 100);
    const top = await getJson(adminCtx, '/api/admin/xgestao/financeiro');
    const cliente = top.receita.topClientes.find((c: Linha) => c.userId === userId);
    if (top.receita.topClientes.length < 10 || cliente) expect(cliente).toMatchObject({ total: esperado, pagamentos: 3 });

    // Conversão: entre os convertidos recentes, com o mês extra.
    const conversao = await getJson(adminCtx, '/api/admin/xgestao/conversao');
    // Lista dos 10 mais recentes: com specs em paralelo pode não conter a conta (TST-19).
    const convertido = conversao.recentes.convertidos.find((c: Linha) => c.userId === userId);
    if (convertido || conversao.recentes.convertidos.length < 10) expect(convertido).toMatchObject({ comBonus: true, plano: expect.stringMatching(/Plus/) });
    expect(conversao.funil.convertidos).toBe(conversao.funil.convertidosNoTeste + conversao.funil.convertidosDepois);
    expect(conversao.funil.iniciados).toBe(conversao.funil.emTeste + conversao.funil.convertidos + conversao.funil.perdidos);

    // Home: resumo comercial coerente com as páginas (lidas na mesma janela).
    await leiturasBatem(async () => {
      const [home, fin, conv] = await Promise.all([
        getJson(adminCtx, '/api/admin/xgestao'),
        getJson(adminCtx, '/api/admin/xgestao/financeiro'),
        getJson(adminCtx, '/api/admin/xgestao/conversao'),
      ]);
      return [
        { mrr: home.comercial.mrr, taxaConversao: home.comercial.taxaConversao },
        { mrr: fin.receita.mrr, taxaConversao: conv.funil.taxaConversao },
      ];
    });
  } finally {
    await db.delete(financeiro).where(and(eq(financeiro.origemTipo, ORIGEM_MENSALIDADE_XGESTAO), eq(financeiro.pagadorUserId, userId)));
    await adminCtx.dispose();
  }
});

test('XG45 cancelamento agendado e teste perdido aparecem na conversão e no detalhe', async ({ request, playwright, baseURL }) => {
  test.setTimeout(120_000);
  const adminCtx = await admin(playwright, baseURL);
  try {
    // Assinante que cancelou: continua usando até o fim do mês pago.
    const saindo = await novoAssinanteHomologacao(request, 'xg45-saindo');
    const paga = await assinar(request, 'premium', saindo.userId);
    const cancelar = await request.post('/api/assinaturas/cancelar', { data: { persona: 'xgestao' } });
    expect(cancelar.status(), await cancelar.text()).toBe(200);
    const depois = await getJson(adminCtx, '/api/admin/xgestao/conversao');
    const saida = depois.cancelamentos.saidas.find((s: Linha) => s.userId === saindo.userId);
    // 10/11/2026 — assinou no teste e cancelou antes do 1º pagamento: o acesso
    // vai até o fim do teste + 24h, não até a 1ª cobrança (regra do bônus).
    const { acessoAte } = await cancelar.json() as { acessoAte: string };
    expect(new Date(acessoAte).getTime()).toBeLessThan(paga.renovaEm!.getTime());
    expect(saida).toMatchObject({ tipo: 'agendado', tier: 'premium', data: acessoAte });
    // Cancelar não é sair: ainda tem acesso, não conta como encerrado no mês.
    const pesoSaindo = await contribuicaoDaConta(adminCtx, saindo.userId, async () => {
      const c = (await getJson(adminCtx, '/api/admin/xgestao/conversao')).cancelamentos;
      return { agendados: c.agendados.quantidade, pedidos: c.pedidosNoMes, encerrados: c.encerradosNoMes.quantidade };
    });
    expect(pesoSaindo).toEqual({ agendados: 1, pedidos: 1, encerrados: 0 });
    const fin = await getJson(adminCtx, '/api/admin/xgestao/financeiro');
    expect(fin.receita.porPlano.find((l: Linha) => l.tier === 'premium').saindo).toBeGreaterThanOrEqual(1);
    expect((await getJson(adminCtx, `/api/admin/xgestao/assinantes/${saindo.userId}`)).assinante.situacao.codigo).toBe('cancelamento_agendado');

    // Teste vencido há mais de 24h, sem assinar: perdido, com a data do fim.
    const perdido = await novoAssinanteHomologacao(request, 'xg45-perdido');
    // Fim há 25h: passou da tolerância e é o perdido mais recente (a lista mostra os 10 últimos).
    const fim = new Date(Date.now() - 25 * 60 * 60_000);
    await db.update(assinaturas)
      .set({ createdAt: new Date(fim.getTime() - 90 * DIA_MS), renovaEm: fim })
      .where(and(eq(assinaturas.userId, perdido.userId), eq(assinaturas.gatewayProvider, 'trial')));
    const conversao = await getJson(adminCtx, '/api/admin/xgestao/conversao');
    // A lista mostra só os 10 perdidos mais recentes: com specs em paralelo a conta
    // pode ficar de fora (TST-19). Se estiver, a data tem de bater; o detalhe confere sempre.
    const naLista = conversao.recentes.perdidos.find((p: Linha) => p.userId === perdido.userId);
    if (naLista) expect(naLista).toMatchObject({ fimTeste: fim.toISOString() });
    // A conta pesa 1 nos perdidos e nos iniciados, e nada no "em teste".
    const pesoPerdido = await contribuicaoDaConta(adminCtx, perdido.userId, async () => {
      const f = (await getJson(adminCtx, '/api/admin/xgestao/conversao')).funil;
      return { perdidos: f.perdidos, emTeste: f.emTeste, iniciados: f.iniciados };
    });
    expect(pesoPerdido).toEqual({ perdidos: 1, emTeste: 0, iniciados: 1 });
    expect(conversao.funil.iniciados).toBe(conversao.funil.emTeste + conversao.funil.convertidos + conversao.funil.perdidos);
    const detalhe = await getJson(adminCtx, `/api/admin/xgestao/assinantes/${perdido.userId}`);
    expect(detalhe.jornadaTeste).toMatchObject({ estado: 'perdido', fimTeste: fim.toISOString() });
    expect(detalhe.assinante.situacao.codigo).toBe('somente_leitura');
  } finally {
    await adminCtx.dispose();
  }
});

test('XG45 conversão: só admin entra', async ({ request, playwright }) => {
  const anonimo = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  try {
    expect((await anonimo.get('/api/admin/xgestao/conversao')).status()).toBe(401);
  } finally {
    await anonimo.dispose();
  }
  await novoAssinanteHomologacao(request, 'xg45-acesso');
  expect((await request.get('/api/admin/xgestao/conversao')).status()).toBe(403);
  expect((await request.get('/api/admin/xgestao/financeiro')).status()).toBe(403);
});

test('PAG-04/ADM-03 estorno zera a receita do mês e a cobrança com problema aparece na home e no Financeiro', async ({ request, playwright, baseURL }) => {
  test.setTimeout(150_000);
  const { userId } = await novoAssinanteHomologacao(request, 'adm-estorno');
  const adminCtx = await admin(playwright, baseURL);
  const paymentId = `pay_adm_estorno_${Date.now()}`;
  const webhookId = `evt_adm03_dead_${Date.now()}`;
  try {
    const paga = await assinar(request, 'basic_plus', userId);
    const sub = paga.gatewaySubscriptionId!;
    await aplicarEventoWebhook({
      eventId: eventoId('pago'), type: 'payment_succeeded', gatewaySubscriptionId: sub,
      dueDate: diaSp(paga.renovaEm!), valor: 179, paymentId,
    });
    const mesAtual = diaSp(new Date()).slice(0, 7);
    const lerReceita = async () => {
      const [fin, hist] = await Promise.all([
        getJson(adminCtx, '/api/admin/xgestao/financeiro'),
        getJson(adminCtx, '/api/admin/xgestao/historico'),
      ]);
      return {
        receita: fin.faturamento.receitaAcumulada,
        recebidoMes: hist.meses.find((m: Linha) => m.mes === mesAtual).recebido,
      };
    };
    expect(await contribuicaoDaConta(adminCtx, userId, lerReceita)).toEqual({ receita: 179, recebidoMes: 179 });

    // Pagamento recusado no mês: cobrança com problema.
    await aplicarEventoWebhook({ eventId: eventoId('falha'), type: 'payment_failed', gatewaySubscriptionId: sub, paymentId: `${paymentId}_2` });

    // Estorno do mesmo pagamento: saída paga no caixa, mesma chave.
    await aplicarEventoWebhook({ eventId: eventoId('estorno'), type: 'payment_refunded', gatewaySubscriptionId: sub, paymentId });
    const [estorno] = await db.select().from(financeiro)
      .where(and(eq(financeiro.origemTipo, ORIGEM_ESTORNO_MENSALIDADE_XGESTAO), eq(financeiro.origemId, paymentId)));
    expect(estorno).toMatchObject({ tipo: 'saida', status: 'pago', recebedorUserId: userId });
    expect(await contribuicaoDaConta(adminCtx, userId, lerReceita)).toEqual({ receita: 0, recebidoMes: 0 });

    // Detalhe: total pago líquido zerado, 1 mensalidade, e o estorno na lista.
    const detalhe = await getJson(adminCtx, `/api/admin/xgestao/assinantes/${userId}`);
    expect(detalhe.pagamentos).toMatchObject({ total: 0, pagamentos: 1 });
    expect(detalhe.listaPagamentos.map((p: Linha) => [p.tipo, p.valor])).toEqual(expect.arrayContaining([['pagamento', 179], ['estorno', -179]]));

    // Aviso do gateway morto para a assinatura: entra como "webhook preso".
    await db.execute(sql`
      insert into webhook_delivery_log (gateway_event_id, event_type, raw_body, status, marked_dead_at)
      values (${webhookId}, 'payment_succeeded', ${JSON.stringify({ payment: { subscription: sub } })}, 'dead', now())
    `);
    const fin = await getJson(adminCtx, '/api/admin/xgestao/financeiro');
    const tipos = fin.cobranca.itens.filter((i: Linha) => i.userId === userId).map((i: Linha) => i.tipo);
    expect(tipos).toEqual(expect.arrayContaining(['pagamento_recusado', 'estorno', 'webhook_preso']));
    const home = await getJson(adminCtx, '/api/admin/xgestao');
    expect(home.cobranca.assinantes).toBeGreaterThanOrEqual(1);
    for (const tipo of ['pagamento_recusado', 'estorno', 'webhook_preso']) expect(home.cobranca.totais[tipo]).toBeGreaterThanOrEqual(1);

    // Conta interna sai da lista de cobrança.
    await adminCtx.patch(`/api/admin/xgestao/assinantes/${userId}`, { data: { contaInterna: true } });
    const semInterna = await getJson(adminCtx, '/api/admin/xgestao/financeiro');
    expect(semInterna.cobranca.itens.some((i: Linha) => i.userId === userId)).toBe(false);
    await adminCtx.patch(`/api/admin/xgestao/assinantes/${userId}`, { data: { contaInterna: false } });

    // Assinatura presa em pendente_reativacao também aparece.
    await db.update(assinaturas).set({ status: 'pendente_reativacao', pendenteReativacaoAt: new Date() }).where(eq(assinaturas.id, paga.id));
    const presa = await getJson(adminCtx, '/api/admin/xgestao/financeiro');
    expect(presa.cobranca.itens.some((i: Linha) => i.userId === userId && i.tipo === 'pendente_reativacao')).toBe(true);
  } finally {
    await db.execute(sql`delete from webhook_delivery_log where gateway_event_id = ${webhookId}`);
    await db.delete(financeiro).where(inArray(financeiro.origemId, [paymentId]));
    await adminCtx.patch(`/api/admin/xgestao/assinantes/${userId}`, { data: { contaInterna: false } }).catch(() => undefined);
    await adminCtx.dispose();
  }
});
