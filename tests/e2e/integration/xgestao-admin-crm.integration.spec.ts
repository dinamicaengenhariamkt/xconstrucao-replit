import { expect, test, type APIRequestContext } from '@playwright/test';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturas, assinaturaTrocas, auditLogs, financeiro, planos, xgestaoAdminContatos } from '@shared/db/schema';
import { aplicarEventoWebhook } from '@features/planos/assinatura-service';
import { ORIGEM_MENSALIDADE_XGESTAO } from '@features/xgestao/lib/receita';
import { loginAs, SEED_ADMIN_EMAIL } from '../helpers';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';
import { contribuicaoDaConta } from '../helpers-admin-xgestao';

/**
 * CRM (doc 49) — o admin vê quem cancela, quem está para expirar e quem
 * assinou no teste sem pagar, com o contato da pessoa, e exporta o recorte.
 * Cada teste usa contas descartáveis e confere a API e o banco.
 */
const DIA_MS = 24 * 60 * 60_000;
type Linha = Record<string, any>;

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

async function csv(ctx: APIRequestContext, query: string): Promise<string> {
  const r = await ctx.get(`/api/admin/xgestao/export?tipo=assinantes&${query}`);
  expect(r.status(), await r.text()).toBe(200);
  return r.text();
}

async function assinaturaAtiva(userId: string) {
  const [a] = await db.select().from(assinaturas)
    .where(and(eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao'), eq(assinaturas.status, 'ativa')))
    .orderBy(desc(assinaturas.createdAt)).limit(1);
  return a;
}

function diaSp(data: Date): string {
  return data.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

test('CRM-04/01/07/02 assinou no teste: aguardando 1º pagamento, contato, registro de contato e CSV do segmento', async ({ request, playwright, baseURL }) => {
  test.setTimeout(150_000);
  const { userId, email } = await novoAssinanteHomologacao(request, 'crm-aguardando', { assinar: 'basic_plus' });
  const adminCtx = await admin(playwright, baseURL);
  const paymentId = `pay_crm04_${Date.now()}`;
  try {
    const paga = await assinaturaAtiva(userId);
    expect(paga.fimTesteEm, 'assinou no teste: ganhou o mês bônus').toBeTruthy();
    expect(paga.primeiroPagamentoEm).toBeNull();

    // CRM-04 — situação própria, com a data da 1ª cobrança.
    const detalhe = await getJson(adminCtx, `/api/admin/xgestao/assinantes/${userId}`);
    expect(detalhe.assinante.situacao).toMatchObject({ codigo: 'aguardando_pagamento', ate: paga.renovaEm!.toISOString() });
    // CRM-01 — telefone do cadastro, CPF/CNPJ e nenhum contato ainda.
    expect(detalhe.assinante.contato.telefone).toBe('11988880000');
    expect(detalhe.assinante.contato.documento).toMatch(/^\d{11,14}$/);
    expect(detalhe.contatos).toEqual([]);
    expect(detalhe.assinante.ultimoContato).toBeNull();

    // Não conta no recorrente pago: aparece à parte.
    const peso = await contribuicaoDaConta(adminCtx, userId, async () => {
      const r = (await getJson(adminCtx, '/api/admin/xgestao/financeiro')).receita;
      const home = await getJson(adminCtx, '/api/admin/xgestao');
      return { mrr: r.mrr, aguardando: r.aguardandoPrimeiroPagamento, pagantes: r.pagantes, resumo: home.assinaturas.resumo.porSituacao.aguardando_pagamento };
    });
    expect(peso).toEqual({ mrr: 0, aguardando: 1, pagantes: 0, resumo: 1 });

    // CRM-02 — CSV do segmento: entra com telefone e situação; "nunca contatado" também.
    let arquivo = await csv(adminCtx, 'situacao=aguardando_pagamento&contato=nunca');
    const cabecalho = arquivo.split('\r\n')[0];
    for (const coluna of ['Telefone', 'CPF/CNPJ', 'Cidade', 'UF', 'Situação até', 'Dias restantes', 'Motivo do cancelamento', 'Último contato']) {
      expect(cabecalho).toContain(coluna);
    }
    // XG52 — o opt-in de marketing entrou no CSV depois da decisão do dono (doc 52).
    expect(cabecalho).toContain('Aceita e-mail de marketing;Consentimento em;Revogado em;Origem do consentimento');
    const minhaLinha = arquivo.split('\r\n').find((l) => l.includes(email));
    expect(minhaLinha).toContain('(11) 98888-0000');
    expect(minhaLinha).toContain('aguardando_pagamento');
    // Outro segmento: a conta não sai.
    expect(await csv(adminCtx, 'situacao=pago')).not.toContain(email);
    // Busca pelo telefone também é aplicada no CSV.
    expect(await csv(adminCtx, 'q=98888-0000')).toContain(email);

    // CRM-07 — registrar contato: canal inválido 400, não admin 403, admin 201 + audit.
    expect((await adminCtx.post(`/api/admin/xgestao/assinantes/${userId}/contatos`, { data: { canal: 'sms' } })).status()).toBe(400);
    expect((await adminCtx.post(`/api/admin/xgestao/assinantes/${userId}/contatos`, { data: { canal: 'outro', nota: 'x'.repeat(1001) } })).status()).toBe(400);
    expect((await request.post(`/api/admin/xgestao/assinantes/${userId}/contatos`, { data: { canal: 'whatsapp' } })).status()).toBe(403);
    expect((await adminCtx.post('/api/admin/xgestao/assinantes/00000000-0000-0000-0000-000000000000/contatos', { data: { canal: 'email' } })).status()).toBe(404);
    const criado = await adminCtx.post(`/api/admin/xgestao/assinantes/${userId}/contatos`, { data: { canal: 'whatsapp', nota: 'Lembrei da 1ª cobrança' } });
    expect(criado.status(), await criado.text()).toBe(201);
    const { contato } = await criado.json() as { contato: Linha };
    expect(contato).toMatchObject({ canal: 'whatsapp', nota: 'Lembrei da 1ª cobrança' });
    const [noBanco] = await db.select().from(xgestaoAdminContatos).where(eq(xgestaoAdminContatos.id, contato.id));
    expect(noBanco).toMatchObject({ userId, canal: 'whatsapp' });
    const [log] = await db.select().from(auditLogs)
      .where(and(eq(auditLogs.action, 'admin.xgestao.contato_registrado'), eq(auditLogs.targetUserId, userId)));
    expect(log.payload).toMatchObject({ contatoId: contato.id, canal: 'whatsapp' });
    expect(JSON.stringify(log.payload)).not.toContain('Lembrei');

    const depois = await getJson(adminCtx, `/api/admin/xgestao/assinantes/${userId}`);
    expect(depois.contatos[0]).toMatchObject({ id: contato.id, canal: 'whatsapp' });
    expect(depois.assinante.ultimoContato).toMatchObject({ canal: 'whatsapp' });
    expect((await getJson(adminCtx, `/api/admin/xgestao/assinantes/${userId}/contatos`)).contatos).toHaveLength(1);
    // Contatado: sai do "nunca contatado" e o CSV mostra o canal.
    expect(await csv(adminCtx, 'situacao=aguardando_pagamento&contato=nunca')).not.toContain(email);
    arquivo = await csv(adminCtx, 'situacao=aguardando_pagamento');
    expect(arquivo.split('\r\n').find((l) => l.includes(email))).toContain('WhatsApp');
    const [exportLog] = await db.select().from(auditLogs)
      .where(and(eq(auditLogs.action, 'admin.xgestao.export'), eq(auditLogs.actorId, noBanco.adminId!)))
      .orderBy(desc(auditLogs.createdAt)).limit(1);
    expect(exportLog.payload).toMatchObject({ tipo: 'assinantes', filtros: { situacao: 'aguardando_pagamento' } });

    // 1º pagamento: vira "Assinatura paga".
    await aplicarEventoWebhook({
      eventId: `crm04-${Date.now()}`, type: 'payment_succeeded', gatewaySubscriptionId: paga.gatewaySubscriptionId!,
      dueDate: diaSp(paga.renovaEm!), valor: 179, paymentId,
    });
    expect((await getJson(adminCtx, `/api/admin/xgestao/assinantes/${userId}`)).assinante.situacao.codigo).toBe('pago');
  } finally {
    await db.delete(financeiro).where(and(eq(financeiro.origemTipo, ORIGEM_MENSALIDADE_XGESTAO), eq(financeiro.origemId, paymentId)));
    await adminCtx.dispose();
  }
});

test('CRM-03/08 motivo do cancelamento no detalhe, na conversão e no resumo; quem saiu ganha o chip', async ({ request, playwright, baseURL }) => {
  test.setTimeout(150_000);
  const { userId, email } = await novoAssinanteHomologacao(request, 'crm-motivo', { assinar: 'basic_plus' });
  const adminCtx = await admin(playwright, baseURL);
  try {
    // Motivo fora da lista ou texto longo: 400 e nada muda.
    expect((await request.post('/api/assinaturas/cancelar', { data: { persona: 'xgestao', motivo: 'qualquer' } })).status()).toBe(400);
    expect((await request.post('/api/assinaturas/cancelar', { data: { persona: 'xgestao', motivoTexto: 'x'.repeat(501) } })).status()).toBe(400);
    expect((await assinaturaAtiva(userId)).canceladaEm).toBeNull();

    const cancelar = await request.post('/api/assinaturas/cancelar', {
      data: { persona: 'xgestao', motivo: 'preco_alto', motivoTexto: '  Ficou caro para 1 obra  ' },
    });
    expect(cancelar.status(), await cancelar.text()).toBe(200);
    const a = await assinaturaAtiva(userId);
    expect(a).toMatchObject({ motivoCancelamento: 'preco_alto', motivoCancelamentoTexto: 'Ficou caro para 1 obra' });
    expect(a.canceladaEm).toBeTruthy();

    const detalhe = await getJson(adminCtx, `/api/admin/xgestao/assinantes/${userId}`);
    expect(detalhe.assinante.situacao.codigo).toBe('cancelamento_agendado');
    expect(detalhe.assinante.cancelamento).toMatchObject({ motivo: 'preco_alto', texto: 'Ficou caro para 1 obra' });

    const conversao = await getJson(adminCtx, '/api/admin/xgestao/conversao?periodo=30d');
    expect(conversao.motivosCancelamento.periodo).toBe('30d');
    const saida = conversao.cancelamentos.saidas.find((s: Linha) => s.userId === userId);
    expect(saida).toMatchObject({ tipo: 'agendado', motivo: 'preco_alto', motivoTexto: 'Ficou caro para 1 obra' });
    const peso = await contribuicaoDaConta(adminCtx, userId, async () => {
      const m = (await getJson(adminCtx, '/api/admin/xgestao/conversao')).motivosCancelamento;
      return { total: m.total, preco: m.porMotivo.find((x: Linha) => x.motivo === 'preco_alto')?.quantidade ?? 0 };
    });
    expect(peso).toEqual({ total: 1, preco: 1 });

    // O acesso acabou: "Cancelou / saiu" com a data de saída e o motivo.
    const fim = new Date(Date.now() - DIA_MS);
    await db.update(assinaturas).set({ renovaEm: fim }).where(eq(assinaturas.id, a.id));
    const saiu = await getJson(adminCtx, `/api/admin/xgestao/assinantes/${userId}`);
    expect(saiu.assinante.situacao.codigo).toBe('somente_leitura');
    expect(saiu.assinante.saida).toMatchObject({ em: fim.toISOString() });
    expect(saiu.assinante.totalPago).toBe(0);
    expect(await csv(adminCtx, 'situacao=saiu')).toContain(email);
    expect((await csv(adminCtx, 'situacao=saiu')).split('\r\n').find((l) => l.includes(email))).toContain('Preço alto');
  } finally {
    await adminCtx.dispose();
  }
});

test('CRM-11/12 chargeback separado do estorno no Financeiro e no CSV; inadimplente com dias em atraso', async ({ request, playwright, baseURL }) => {
  test.setTimeout(150_000);
  const { userId } = await novoAssinanteHomologacao(request, 'crm-chargeback', { assinar: 'basic_plus' });
  const adminCtx = await admin(playwright, baseURL);
  const paymentId = `pay_crm11_${Date.now()}`;
  try {
    const paga = await assinaturaAtiva(userId);
    const sub = paga.gatewaySubscriptionId!;
    await aplicarEventoWebhook({ eventId: `crm11-ok-${Date.now()}`, type: 'payment_succeeded', gatewaySubscriptionId: sub, dueDate: diaSp(paga.renovaEm!), valor: 179, paymentId });
    // O evento normalizado traz `motivo`; o id neutro prova que a separação usa o campo.
    await aplicarEventoWebhook({ eventId: `crm11-cb-${Date.now()}:${paymentId}`, type: 'payment_refunded', gatewaySubscriptionId: sub, paymentId, motivo: 'chargeback' });
    const [evento] = await db.execute<{ motivo: string | null }>(sql`
      select payload_json->>'motivo' as motivo from assinatura_eventos
      where tipo = 'payment_refunded' and payload_json->>'paymentId' = ${paymentId}`).then((r) => r.rows);
    expect(evento?.motivo).toBe('chargeback');
    const fin = await getJson(adminCtx, '/api/admin/xgestao/financeiro?estornos=30d');
    expect(fin.estornos.periodo).toBe('30d');
    const item = fin.estornos.itens.find((i: Linha) => i.userId === userId);
    expect(item).toMatchObject({ tipo: 'chargeback', valor: 179 });
    expect(fin.estornos.porTipo.chargeback.quantidade).toBeGreaterThanOrEqual(1);
    const arquivo = await adminCtx.get('/api/admin/xgestao/export?tipo=estornos&periodo=90d');
    expect(arquivo.status()).toBe(200);
    expect(await arquivo.text()).toContain('Chargeback');

    // CRM-12 — inadimplente há 3 dias.
    await db.update(assinaturas)
      .set({ status: 'inadimplente', canceladaEm: null, renovaEm: new Date(Date.now() - 3 * DIA_MS - 60_000) })
      .where(eq(assinaturas.id, paga.id));
    const detalhe = await getJson(adminCtx, `/api/admin/xgestao/assinantes/${userId}`);
    expect(detalhe.assinante.situacao).toMatchObject({ codigo: 'inadimplente', diasEmAtraso: 3 });
    expect(detalhe.assinante.atencao[0].texto).toMatch(/^3 dias em atraso; carência termina em/);
  } finally {
    await db.delete(financeiro).where(eq(financeiro.origemId, paymentId));
    await adminCtx.dispose();
  }
});

test('CRM-10 descida agendada e subida recente aparecem como chips e filtros', async ({ request, playwright, baseURL }) => {
  test.setTimeout(120_000);
  const { userId, email } = await novoAssinanteHomologacao(request, 'crm-trocas', { assinar: 'premium' });
  const adminCtx = await admin(playwright, baseURL);
  const ids: string[] = [];
  try {
    const paga = await assinaturaAtiva(userId);
    const catalogo = await db.select().from(planos).where(and(eq(planos.persona, 'xgestao'), inArray(planos.tier, ['basic', 'premium'])));
    const basic = catalogo.find((p) => p.tier === 'basic')!;
    const premium = catalogo.find((p) => p.tier === 'premium')!;
    const base = {
      userId, assinaturaId: paga.id, valorDe: '0', valorPara: '0', status: 'agendada' as const,
    };
    // REV-07 — troca ainda sem resposta do gateway ou que falhou não é descida agendada.
    const semGateway = await db.insert(assinaturaTrocas).values([
      { ...base, planoDeId: premium.id, planoParaId: basic.id, tierDe: 'premium', tierPara: 'basic', tipo: 'descer' as const, status: 'pendente_gateway' as const, efetivaEm: paga.renovaEm! },
      { ...base, planoDeId: premium.id, planoParaId: basic.id, tierDe: 'premium', tierPara: 'basic', tipo: 'descer' as const, status: 'falhou' as const, efetivaEm: paga.renovaEm! },
    ]).returning({ id: assinaturaTrocas.id });
    ids.push(...semGateway.map((c) => c.id));
    const antes = await getJson(adminCtx, `/api/admin/xgestao/assinantes/${userId}`);
    expect(antes.assinante.trocas.descidaAgendada).toBeNull();
    expect(await csv(adminCtx, 'situacao=descida_agendada')).not.toContain(email);
    const criadas = await db.insert(assinaturaTrocas).values([
      { ...base, planoDeId: premium.id, planoParaId: basic.id, tierDe: 'premium', tierPara: 'basic', tipo: 'descer' as const, efetivaEm: paga.renovaEm! },
      { ...base, planoDeId: basic.id, planoParaId: premium.id, tierDe: 'basic', tierPara: 'premium', tipo: 'subir' as const, status: 'aplicada' as const, efetivaEm: new Date(), aplicadaEm: new Date(Date.now() - 2 * DIA_MS) },
    ]).returning({ id: assinaturaTrocas.id });
    ids.push(...criadas.map((c) => c.id));
    const detalhe = await getJson(adminCtx, `/api/admin/xgestao/assinantes/${userId}`);
    expect(detalhe.assinante.trocas.descidaAgendada).toMatchObject({ plano: basic.nome, em: paga.renovaEm!.toISOString() });
    expect(detalhe.assinante.trocas.subidaRecente).toMatchObject({ plano: premium.nome });
    expect(await csv(adminCtx, 'situacao=descida_agendada')).toContain(email);
    expect(await csv(adminCtx, 'situacao=subiu_30d')).toContain(email);
    // Subida antiga (mais de 30 dias) não conta.
    await db.update(assinaturaTrocas).set({ aplicadaEm: new Date(Date.now() - 40 * DIA_MS) }).where(eq(assinaturaTrocas.id, criadas[1].id));
    expect((await getJson(adminCtx, `/api/admin/xgestao/assinantes/${userId}`)).assinante.trocas.subidaRecente).toBeNull();
  } finally {
    if (ids.length) await db.delete(assinaturaTrocas).where(inArray(assinaturaTrocas.id, ids));
    await adminCtx.dispose();
  }
});

test('CRM-03 marketplace continua cancelando sem motivo (comportamento inalterado)', async () => {
  // A coluna existe e nada do marketplace a preenche.
  const [linha] = await db.execute<{ total: number }>(sql`
    select count(*)::int as total from assinaturas where persona <> 'xgestao' and motivo_cancelamento is not null
  `).then((r) => r.rows);
  expect(linha.total).toBe(0);
});
