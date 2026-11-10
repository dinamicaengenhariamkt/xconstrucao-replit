import { expect, test, type APIRequestContext } from '@playwright/test';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import {
  assinaturaTrocas,
  assinaturas,
  auditLogs,
  empreiteiras,
  financeiro,
  obraOcorrencias,
  obraShareLinks,
  obras,
  planos,
  users,
  xgestaoMembros,
} from '@shared/db/schema';
import { loginAs, SEED_ADMIN_EMAIL, uniqueEmail } from '../helpers';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';
import { contribuicaoDaConta } from '../helpers-admin-xgestao';

/**
 * XG44 — admin xgestão por assinante: situação comercial, uso dos três limites
 * do plano, consolidado das obras e a página de detalhe. Os números vêm de
 * dados descartáveis com valores conhecidos e são conferidos um a um.
 */
const DIA_MS = 24 * 60 * 60_000;
type Linha = Record<string, any>;

async function admin(playwright: { request: { newContext: (o: { baseURL?: string }) => Promise<APIRequestContext> } }, baseURL?: string) {
  const ctx = await playwright.request.newContext({ baseURL });
  await loginAs(ctx, SEED_ADMIN_EMAIL);
  return ctx;
}

async function linhaDoAssinante(adminCtx: APIRequestContext, userId: string): Promise<Linha> {
  const r = await adminCtx.get('/api/admin/xgestao/assinantes');
  expect(r.status(), await r.text()).toBe(200);
  const linha = (await r.json()).rows.find((item: Linha) => item.userId === userId);
  expect(linha, `assinante ${userId} na lista`).toBeTruthy();
  return linha;
}

async function detalhe(adminCtx: APIRequestContext, userId: string): Promise<Linha> {
  const r = await adminCtx.get(`/api/admin/xgestao/assinantes/${userId}`);
  expect(r.status(), await r.text()).toBe(200);
  return r.json();
}

async function trialDe(userId: string) {
  const [linha] = await db.select().from(assinaturas)
    .where(and(eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao'), eq(assinaturas.gatewayProvider, 'trial')));
  return linha;
}

async function apagarObra(id: string | undefined) {
  if (!id) return;
  await db.delete(financeiro).where(eq(financeiro.obraId, id));
  await db.delete(obraOcorrencias).where(eq(obraOcorrencias.obraId, id));
  await db.delete(obraShareLinks).where(eq(obraShareLinks.obraId, id));
  await db.delete(obras).where(eq(obras.id, id));
}

test('XG44 assinante em teste: uso dos 3 limites, consolidado das obras, detalhe e CSV batem com os dados', async ({ request, playwright, baseURL }) => {
  test.setTimeout(120_000);
  const { email, userId } = await novoAssinanteHomologacao(request, 'xg44-uso');
  const adminCtx = await admin(playwright, baseURL);
  let obraId: string | undefined;
  try {
    // Recém-criado no teste Basic: nada usado, nada a fazer.
    const inicial = await linhaDoAssinante(adminCtx, userId);
    const fimTeste = (await trialDe(userId)).renovaEm!;
    expect(inicial.situacao).toMatchObject({ codigo: 'em_teste', ate: fimTeste.toISOString(), diasRestantes: 90, motivo: null });
    expect(inicial.plano).toMatchObject({ tier: 'basic', emTeste: true });
    expect(inicial.usoPlano).toEqual({
      obras: { usado: 0, limite: 1, nivel: 'livre', percentual: 0 },
      pessoas: { usado: 1, limite: 2, nivel: 'livre', percentual: 50 },
      links: { usado: 0, limite: 1, nivel: 'livre', percentual: 0 },
    });
    expect(inicial.atencao).toEqual([]);
    expect(inicial.consolidado).toEqual({
      orcamento: 0, custoReal: 0, obrasAtrasadas: 0, obrasParadas: 0, ocorrenciasAbertas: 0, pagamentosAtrasados: 0, recebimentosAtrasados: 0, contasAPagarAtrasadas: 0, linksAtivos: 0,
    });

    // Uma obra, um link e um convite: o Basic chega ao limite nos três recursos.
    const nome = `E2E XG44 obra ${Date.now()}`;
    const criar = await request.post('/api/xgestao/obras', { data: { nome, endereco: 'Rua do Admin, 44' } });
    expect(criar.status(), await criar.text()).toBe(201);
    obraId = (await criar.json()).id as string;
    const link = await request.post(`/api/xgestao/obras/${obraId}/share`, { data: { nome: 'Cliente' } });
    expect(link.status(), await link.text()).toBe(201);
    const convite = await request.post('/api/xgestao/membros', {
      data: { nome: 'Membro XG44', email: uniqueEmail('xg44-membro'), papel: 'colaborador', obras: [] },
    });
    expect(convite.status(), await convite.text()).toBe(201);

    // Valores conhecidos: obra antiga, prazo vencido, R$ 1000 de orçamento,
    // R$ 321 pagos, R$ 50 atrasados e uma ocorrência aberta — tudo com data
    // antiga, para a obra também contar como parada.
    const antiga = new Date(Date.now() - 400 * DIA_MS);
    const previsao = new Date(Date.now() - 5 * DIA_MS).toISOString().slice(0, 10);
    await db.update(obras).set({ status: 'em_andamento', createdAt: antiga, dataPrevisao: previsao, valorTotal: '1000' })
      .where(eq(obras.id, obraId));
    await db.insert(financeiro).values([
      { obraId, tipo: 'saida', descricao: 'E2E XG44 pago', valor: '321', data: antiga.toISOString().slice(0, 10), status: 'pago', createdAt: antiga, pagadorUserId: userId },
      { obraId, tipo: 'saida', descricao: 'E2E XG44 atrasado', valor: '50', data: antiga.toISOString().slice(0, 10), status: 'atrasado', createdAt: antiga },
    ]);
    const ocorrencia = await request.post(`/api/obras/${obraId}/ocorrencias`, {
      data: { titulo: 'E2E XG44 problema', descricao: 'Aberta', gravidade: 'baixo' },
    });
    expect(ocorrencia.status(), await ocorrencia.text()).toBe(201);
    await db.update(obraOcorrencias).set({ createdAt: antiga }).where(eq(obraOcorrencias.obraId, obraId));

    const depois = await linhaDoAssinante(adminCtx, userId);
    expect(depois.usoPlano).toEqual({
      obras: { usado: 1, limite: 1, nivel: 'no_limite', percentual: 100 },
      pessoas: { usado: 2, limite: 2, nivel: 'no_limite', percentual: 100 },
      links: { usado: 1, limite: 1, nivel: 'no_limite', percentual: 100 },
    });
    expect(depois.consolidado).toEqual({
      orcamento: 1000, custoReal: 321, obrasAtrasadas: 1, obrasParadas: 1, ocorrenciasAbertas: 1, pagamentosAtrasados: 1, recebimentosAtrasados: 0, contasAPagarAtrasadas: 1, linksAtivos: 1,
    });
    expect(depois.atencao.map((m: Linha) => m.texto)).toEqual([
      'No limite de obras (1 de 1)',
      'No limite de pessoas na equipe (2 de 2)',
      'No limite de links por obra (1 de 1)',
    ]);
    // O contrato antigo continua igual para quem já o lê.
    expect(depois.uso).toEqual({ obrasEmAberto: 1, limiteObras: 1 });

    // Detalhe: obras com situação, custo e links; lucro; histórico sem payload do gateway.
    const pagina = await detalhe(adminCtx, userId);
    expect(pagina.assinante.userId).toBe(userId);
    expect(pagina.assinante.consolidado).toEqual(depois.consolidado);
    expect(pagina.limites).toEqual({ obras: 1, pessoas: 2, linksPorObra: 1 });
    expect(pagina.obras).toHaveLength(1);
    expect(pagina.obras[0]).toMatchObject({
      id: obraId, nome, status: 'em_andamento', situacao: 'atrasada', valorTotal: 1000, custoReal: 321, linksAtivos: 1, dataPrevisao: previsao,
    });
    expect(pagina.lucro.totalObras).toBe(1);
    expect(pagina.historico.assinaturas[0]).toMatchObject({ teste: true, tier: 'basic', status: 'ativa' });
    expect(pagina.historico.eventos.map((e: Linha) => e.tipo)).toContain('teste_iniciado');
    for (const evento of pagina.historico.eventos) expect(Object.keys(evento).sort()).toEqual(['criadoEm', 'id', 'tipo']);

    // Da obra (micro) para o assinante.
    const obraDetalhe = await adminCtx.get(`/api/admin/xgestao/obras/${obraId}`);
    expect((await obraDetalhe.json()).assinante.userId).toBe(userId);

    // CSV: colunas novas com os mesmos números.
    const csv = await (await adminCtx.get('/api/admin/xgestao/export?tipo=assinantes')).text();
    const cabecalho = csv.replace(/^﻿/, '').split('\r\n')[0].split(';');
    const celulas = csv.split('\r\n').find((l) => l.includes(email))!.split(';');
    const col = (nomeCol: string) => celulas[cabecalho.indexOf(nomeCol)];
    expect(col('Situação')).toBe('Em teste grátis');
    expect(col('Pessoas na equipe')).toBe('2 de 2');
    expect(col('Links na obra com mais links')).toBe('1 de 1');
    expect(col('Orçamento gerenciado (R$)')).toBe('1000');
    expect(col('Custo real (R$)')).toBe('321');
    expect(col('Obras atrasadas')).toBe('1');
    expect(col('Obras paradas')).toBe('1');
    expect(col('Ocorrências abertas')).toBe('1');
    expect(col('Pagamentos atrasados')).toBe('1');
    expect(col('Atenção')).toContain('No limite de obras (1 de 1)');

    // Home: o resumo é coerente consigo mesmo e a atenção traz só o necessário.
    const home = await (await adminCtx.get('/api/admin/xgestao')).json();
    const { resumo, atencao } = home.assinaturas;
    expect(Object.values(resumo.porSituacao as Record<string, number>).reduce((a, b) => a + b, 0)).toBe(resumo.total);
    expect(resumo.precisamAtencao).toBeGreaterThanOrEqual(1);
    expect(atencao.length).toBeLessThanOrEqual(6);
    for (const item of atencao) {
      expect(Object.keys(item).sort()).toEqual(['atencao', 'empreiteiraNome', 'nome', 'situacao', 'tier', 'userId']);
      expect(item.atencao.length).toBeGreaterThan(0);
    }
  } finally {
    await apagarObra(obraId);
    await adminCtx.dispose();
  }
});

test('XG44 situação acompanha teste, tolerância, somente leitura, pagamento, cancelamento e inadimplência', async ({ request, playwright, baseURL }) => {
  test.setTimeout(120_000);
  const { userId } = await novoAssinanteHomologacao(request, 'xg44-situacao');
  const adminCtx = await admin(playwright, baseURL);
  let obraId: string | undefined;
  try {
    const criar = await request.post('/api/xgestao/obras', { data: { nome: `E2E XG44 situação ${Date.now()}`, endereco: 'Rua 44' } });
    expect(criar.status(), await criar.text()).toBe(201);
    obraId = (await criar.json()).id as string;
    const teste = await trialDe(userId);

    // Teste acabando: entra na atenção com o prazo.
    await db.update(assinaturas).set({ renovaEm: new Date(Date.now() + 3 * DIA_MS - 60_000) }).where(eq(assinaturas.id, teste.id));
    let linha = await linhaDoAssinante(adminCtx, userId);
    expect(linha.situacao).toMatchObject({ codigo: 'em_teste', diasRestantes: 3 });
    expect(linha.atencao[0]).toMatchObject({ codigo: 'teste_acabando', texto: 'Teste grátis termina em 3 dias' });

    // Venceu há 2h: tolerância, ainda vigente, bloqueio 24h após o fim.
    const fim = new Date(Date.now() - 2 * 60 * 60_000);
    await db.update(assinaturas).set({ renovaEm: fim }).where(eq(assinaturas.id, teste.id));
    linha = await linhaDoAssinante(adminCtx, userId);
    expect(linha.situacao).toMatchObject({ codigo: 'teste_tolerancia', ate: new Date(fim.getTime() + DIA_MS).toISOString() });
    expect(linha.usoPlano.obras.nivel).toBe('no_limite');
    expect(linha.atencao[0].codigo).toBe('teste_tolerancia');

    // Venceu há 2 dias: a própria leitura expira o teste e a conta fica em somente leitura.
    await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - 2 * DIA_MS) }).where(eq(assinaturas.id, teste.id));
    linha = await linhaDoAssinante(adminCtx, userId);
    expect(linha.situacao).toMatchObject({ codigo: 'somente_leitura', motivo: 'Teste grátis encerrado sem assinatura', ate: null });
    expect(linha.plano.tier).toBe('free');
    expect(linha.usoPlano.obras).toEqual({ usado: 1, limite: 0, nivel: 'bloqueado', percentual: null });
    expect(linha.atencao.map((m: Linha) => m.codigo)).toEqual(['somente_leitura_com_obras']);
    expect((await trialDe(userId)).status).toBe('expirada');

    // Assina o Basic Plus: pago, com a próxima cobrança e folga nos limites.
    const catalogo = await (await request.get('/api/planos?persona=xgestao')).json() as Array<{ id: string; tier: string }>;
    const checkout = await request.post('/api/assinaturas/checkout', {
      data: { planoId: catalogo.find((p) => p.tier === 'basic_plus')!.id, persona: 'xgestao', ciclo: 'mensal' },
    });
    expect(checkout.status(), await checkout.text()).toBe(201);
    const [paga] = await db.select().from(assinaturas)
      .where(and(eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao'), eq(assinaturas.status, 'ativa')));
    linha = await linhaDoAssinante(adminCtx, userId);
    expect(linha.situacao).toMatchObject({ codigo: 'pago', ate: paga.renovaEm!.toISOString() });
    expect(linha.plano).toMatchObject({ tier: 'basic_plus', valorMensal: 179, emTeste: false });
    expect(linha.usoPlano.obras).toMatchObject({ usado: 1, limite: 3, nivel: 'livre' });
    expect(linha.atencao).toEqual([]);

    // Cancela: o acesso segue até o fim do período pago.
    expect((await request.post('/api/assinaturas/cancelar', { data: { persona: 'xgestao' } })).status()).toBe(200);
    linha = await linhaDoAssinante(adminCtx, userId);
    expect(linha.situacao).toMatchObject({ codigo: 'cancelamento_agendado', ate: paga.renovaEm!.toISOString() });
    expect(linha.atencao[0].codigo).toBe('cancelamento_agendado');

    // Pagamento recusado: carência de 7 dias a partir do vencimento.
    const vencimento = new Date(Date.now() - DIA_MS);
    await db.update(assinaturas).set({ status: 'inadimplente', canceladaEm: null, renovaEm: vencimento }).where(eq(assinaturas.id, paga.id));
    linha = await linhaDoAssinante(adminCtx, userId);
    expect(linha.situacao).toMatchObject({ codigo: 'inadimplente', ate: new Date(vencimento.getTime() + 7 * DIA_MS).toISOString(), diasRestantes: 6 });
    expect(linha.atencao[0]).toMatchObject({ codigo: 'inadimplente', severidade: 'critica' });

    // Carência esgotada: somente leitura com o motivo certo.
    await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - 8 * DIA_MS) }).where(eq(assinaturas.id, paga.id));
    linha = await linhaDoAssinante(adminCtx, userId);
    expect(linha.situacao).toMatchObject({ codigo: 'somente_leitura', motivo: 'Pagamento não regularizado na carência' });

    // O histórico do detalhe conta a jornada inteira.
    const pagina = await detalhe(adminCtx, userId);
    const tipos = pagina.historico.eventos.map((e: Linha) => e.tipo);
    for (const tipo of ['teste_iniciado', 'teste_expirado', 'checkout', 'cancelamento_agendado']) expect(tipos).toContain(tipo);
    expect(pagina.historico.assinaturas.map((a: Linha) => a.teste)).toEqual([false, true]);
    expect(pagina.limites).toEqual({ obras: 0, pessoas: 0, linksPorObra: 0 });
  } finally {
    await apagarObra(obraId);
    await adminCtx.dispose();
  }
});

test('XG44 detalhe do assinante: só admin, só responsável xgestão, id validado', async ({ request, playwright, baseURL }) => {
  const { userId } = await novoAssinanteHomologacao(request, 'xg44-acesso');
  const adminCtx = await admin(playwright, baseURL);
  try {
    // O próprio assinante não entra na área administrativa.
    expect((await request.get(`/api/admin/xgestao/assinantes/${userId}`)).status()).toBe(403);

    expect((await adminCtx.get(`/api/admin/xgestao/assinantes/${userId}`)).status()).toBe(200);
    expect((await adminCtx.get('/api/admin/xgestao/assinantes/00000000-0000-4000-8000-000000000000')).status()).toBe(404);
    expect((await adminCtx.get('/api/admin/xgestao/assinantes/nao-e-um-id')).status()).toBe(404);
    expect((await adminCtx.get(`/api/admin/xgestao/assinantes/${encodeURIComponent("' or 1=1 --")}`)).status()).toBe(404);

    // Conta sem xgestão (o admin) e membro de equipe não são assinantes.
    const [adminUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, SEED_ADMIN_EMAIL));
    expect((await adminCtx.get(`/api/admin/xgestao/assinantes/${adminUser.id}`)).status()).toBe(404);
    const convite = await request.post('/api/xgestao/membros', {
      data: { nome: 'Membro XG44 acesso', email: uniqueEmail('xg44-acesso-membro'), papel: 'colaborador', obras: [] },
    });
    expect(convite.status(), await convite.text()).toBe(201);
    const [membro] = await db.select({ userId: xgestaoMembros.userId }).from(xgestaoMembros)
      .where(eq(xgestaoMembros.convidadoPor, userId));
    expect((await adminCtx.get(`/api/admin/xgestao/assinantes/${membro.userId}`)).status()).toBe(404);
  } finally {
    await adminCtx.dispose();
  }
});

test('ADM-02 conta interna sai do MRR, do funil, do engajamento e do histórico; marcar fica no audit_logs', async ({ request, playwright, baseURL }) => {
  test.setTimeout(180_000);
  const { userId } = await novoAssinanteHomologacao(request, 'adm02-interna', { assinar: 'basic_plus' });
  const adminCtx = await admin(playwright, baseURL);
  const mesAtual = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).slice(0, 7);
  try {
    const presente = async () => {
      const [lista, internas, home, fin, conv, eng, hist, csv] = await Promise.all([
        adminCtx.get('/api/admin/xgestao/assinantes').then((r) => r.json()),
        adminCtx.get('/api/admin/xgestao/assinantes?internas=1').then((r) => r.json()),
        adminCtx.get('/api/admin/xgestao').then((r) => r.json()),
        adminCtx.get('/api/admin/xgestao/financeiro').then((r) => r.json()),
        adminCtx.get('/api/admin/xgestao/conversao').then((r) => r.json()),
        adminCtx.get('/api/admin/xgestao/engajamento').then((r) => r.json()),
        adminCtx.get('/api/admin/xgestao/historico').then((r) => r.json()),
        adminCtx.get('/api/admin/xgestao/export?tipo=assinantes').then((r) => r.text()),
      ]);
      return {
        lista: lista.rows.some((a: Linha) => a.userId === userId),
        internas: internas.rows.some((a: Linha) => a.userId === userId),
        home: home.assinantes.some((a: Linha) => a.id === userId),
        engajamento: eng.assinantes.some((a: Linha) => a.userId === userId),
        convertido: conv.recentes.convertidos.some((a: Linha) => a.userId === userId),
        csv: csv.includes(userId) || csv.includes((lista.rows.find((a: Linha) => a.userId === userId) ?? internas.rows.find((a: Linha) => a.userId === userId))?.email ?? '#'),
        _mrr: fin.receita.mrr,
        _mes: hist.meses.find((m: Linha) => m.mes === mesAtual),
      };
    };
    const antes = await presente();
    expect(antes).toMatchObject({ lista: true, internas: false, home: true, engajamento: true, csv: true });

    // O peso no MRR, no funil e no mês corrente é exatamente o da conta (some ao marcar).
    const peso = await contribuicaoDaConta(adminCtx, userId, async () => {
      const [fin, conv, hist, eng] = await Promise.all([
        adminCtx.get('/api/admin/xgestao/financeiro').then((r) => r.json()),
        adminCtx.get('/api/admin/xgestao/conversao').then((r) => r.json()),
        adminCtx.get('/api/admin/xgestao/historico').then((r) => r.json()),
        adminCtx.get('/api/admin/xgestao/engajamento').then((r) => r.json()),
      ]);
      const mes = hist.meses.find((m: Linha) => m.mes === mesAtual);
      return {
        mrr: fin.receita.mrr,
        aguardando: fin.receita.aguardandoPrimeiroPagamento,
        convertidos: conv.funil.convertidos,
        iniciados: conv.funil.iniciados,
        pagantesMes: mes.pagantesFimMes,
        testesMes: mes.testesIniciados,
        engajamento: eng.assinantes.length,
      };
    });
    // CRM-04 — assinou no teste e ainda não pagou: fora do MRR (aparece em "aguardando").
    expect(peso).toEqual({ mrr: 0, aguardando: 1, convertidos: 1, iniciados: 1, pagantesMes: 1, testesMes: 1, engajamento: 1 });

    // Marcar: some de tudo e aparece só na lista "Contas internas"; o detalhe continua abrindo.
    const marcar = await adminCtx.patch(`/api/admin/xgestao/assinantes/${userId}`, { data: { contaInterna: true } });
    expect(marcar.status(), await marcar.text()).toBe(200);
    expect(await marcar.json()).toEqual({ contaInterna: true, alterou: true });
    const marcada = await presente();
    expect(marcada).toMatchObject({ lista: false, internas: true, home: false, engajamento: false, convertido: false, csv: false });
    const det = await detalhe(adminCtx, userId);
    expect(det.assinante.contaInterna).toBe(true);
    const [registro] = await db.select().from(auditLogs)
      .where(and(eq(auditLogs.targetUserId, userId), eq(auditLogs.action, 'admin.xgestao.conta_interna')))
      .orderBy(desc(auditLogs.createdAt)).limit(1);
    expect(registro.payload).toEqual({ de: false, para: true });

    // Corpo inválido é 400; desmarcar volta tudo.
    expect((await adminCtx.patch(`/api/admin/xgestao/assinantes/${userId}`, { data: { contaInterna: 'sim' } })).status()).toBe(400);
    expect((await adminCtx.patch(`/api/admin/xgestao/assinantes/${userId}`, { data: { contaInterna: false } })).status()).toBe(200);
    expect(await presente()).toMatchObject({ lista: true, internas: false, home: true });

    // Só admin: o próprio assinante não consegue se marcar.
    expect((await request.patch(`/api/admin/xgestao/assinantes/${userId}`, { data: { contaInterna: true } })).status()).toBe(403);
  } finally {
    await db.update(users).set({ contaInterna: false }).where(eq(users.id, userId));
    await adminCtx.dispose();
  }
});

test('ADM-06 responsável sem empresa aparece na lista e no funil como "sem empresa", igual à home', async ({ request, playwright, baseURL }) => {
  test.setTimeout(120_000);
  const email = uniqueEmail('adm06-sem-empresa');
  const criada = await request.post('/api/auth/register', {
    data: {
      name: 'E2E ADM06 sem empresa', email, username: `adm06_${Date.now()}`, password: 'Xconstr@E2E2026!',
      role: 'empreiteiro', phone: '11988880000', cpfCnpj: cpfValido(), acceptTerms: true, website: '', mountedAt: Date.now() - 5_000,
    },
  });
  expect(criada.status(), await criada.text()).toBeLessThan(300);
  const adminCtx = await admin(playwright, baseURL);
  try {
    const consulta = await (await adminCtx.get(`/api/admin/usuarios?q=${encodeURIComponent(email)}`)).json() as { rows: Array<{ id: string }> };
    const userId = consulta.rows[0].id;
    await db.delete(empreiteiras).where(eq(empreiteiras.userId, userId));
    expect((await adminCtx.patch(`/api/admin/usuarios/${userId}`, { data: { xgestao: true } })).status()).toBe(200);

    const linha = await linhaDoAssinante(adminCtx, userId);
    expect(linha).toMatchObject({ semEmpresa: true, empreiteiraId: null, obrasGerenciadas: 0 });
    const home = await (await adminCtx.get('/api/admin/xgestao')).json() as Linha;
    expect(home.assinantes.find((a: Linha) => a.id === userId)).toMatchObject({ empreiteira: linha.empreiteiraNome });
    const peso = await contribuicaoDaConta(adminCtx, userId, async () => {
      const [h, l, c] = await Promise.all([
        adminCtx.get('/api/admin/xgestao').then((r) => r.json()),
        adminCtx.get('/api/admin/xgestao/assinantes').then((r) => r.json()),
        adminCtx.get('/api/admin/xgestao/conversao').then((r) => r.json()),
      ]);
      return { home: h.indicadores.assinantes, lista: l.rows.length, semEmpresa: c.funil.semEmpresa };
    });
    expect(peso).toEqual({ home: 1, lista: 1, semEmpresa: 1 });
    expect((await detalhe(adminCtx, userId)).obras).toEqual([]);
  } finally {
    await adminCtx.dispose();
  }
});

/** CNPJ válido e único (empreiteiro é pessoa jurídica). */
function cpfValido(): string {
  const base = `13${Date.now().toString().slice(-10)}`;
  const digito = (digits: string, pesos: number[]) => {
    const soma = [...digits].reduce((total, d, i) => total + Number(d) * pesos[i], 0);
    return String(soma % 11 < 2 ? 0 : 11 - soma % 11);
  };
  const primeiro = digito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${base}${primeiro}${digito(`${base}${primeiro}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])}`;
}

test('XG48 obra bloqueada, membro e link pausados pelo plano não contam no uso; troca agendada aparece no detalhe', async ({ request, playwright, baseURL }) => {
  test.setTimeout(120_000);
  const { userId } = await novoAssinanteHomologacao(request, 'xg48-admin');
  const adminCtx = await admin(playwright, baseURL);
  let obraId: string | undefined;
  let trocaId: string | undefined;
  try {
    const criar = await request.post('/api/xgestao/obras', { data: { nome: `E2E XG48 obra ${Date.now()}`, endereco: 'Rua do Plano, 48' } });
    expect(criar.status(), await criar.text()).toBe(201);
    obraId = (await criar.json()).id as string;
    const link = await request.post(`/api/xgestao/obras/${obraId}/share`, { data: { nome: 'Cliente' } });
    expect(link.status(), await link.text()).toBe(201);
    const convite = await request.post('/api/xgestao/membros', {
      data: { nome: 'Membro XG48', email: uniqueEmail('xg48-membro'), papel: 'colaborador', obras: [] },
    });
    expect(convite.status(), await convite.text()).toBe(201);

    const antes = await linhaDoAssinante(adminCtx, userId);
    expect(antes.usoPlano.obras.usado).toBe(1);
    expect(antes.usoPlano.pessoas.usado).toBe(2);
    expect(antes.usoPlano.links.usado).toBe(1);
    expect(antes.bloqueiosPlano).toEqual({ obrasBloqueadas: 0, membrosPausados: 0 });

    // O que a descida de plano marca (troca-marcas.ts), feito direto no banco.
    const [empresa] = await db.select({ id: empreiteiras.id }).from(empreiteiras).where(eq(empreiteiras.userId, userId));
    await db.update(obras).set({ xgestaoBloqueadaPorPlano: true }).where(eq(obras.id, obraId));
    await db.update(obraShareLinks).set({ pausadoPorPlano: true }).where(eq(obraShareLinks.obraId, obraId));
    await db.update(xgestaoMembros).set({ status: 'pausado' })
      .where(and(eq(xgestaoMembros.empreiteiraId, empresa.id), eq(xgestaoMembros.status, 'convidado')));

    const depois = await linhaDoAssinante(adminCtx, userId);
    expect(depois.usoPlano.obras.usado).toBe(0);
    expect(depois.usoPlano.pessoas.usado).toBe(1);
    expect(depois.usoPlano.links.usado).toBe(0);
    expect(depois.uso.obrasEmAberto).toBe(0);
    expect(depois.obrasAtivas).toBe(0);
    expect(depois.obrasGerenciadas).toBe(1);
    expect(depois.bloqueiosPlano).toEqual({ obrasBloqueadas: 1, membrosPausados: 1 });

    // Sem troca agendada, o detalhe diz null; com a descida Basic Plus -> Basic, mostra de/para, data e diferença.
    expect((await detalhe(adminCtx, userId)).trocaAgendada).toBeNull();
    const trial = await trialDe(userId);
    const [basic] = await db.select().from(planos).where(and(eq(planos.persona, 'xgestao'), eq(planos.tier, 'basic'), eq(planos.ativo, true)));
    const [plus] = await db.select().from(planos).where(and(eq(planos.persona, 'xgestao'), eq(planos.tier, 'basic_plus'), eq(planos.ativo, true)));
    const efetivaEm = new Date(Date.now() + 20 * DIA_MS);
    const [troca] = await db.insert(assinaturaTrocas).values({
      userId, empreiteiraId: empresa.id, assinaturaId: trial.id, planoDeId: plus.id, planoParaId: basic.id,
      tierDe: 'basic_plus', tierPara: 'basic', tipo: 'descer', valorDe: plus.valorMensal, valorPara: basic.valorMensal,
      status: 'agendada', efetivaEm, escolhas: { obras: [obraId], membros: [] },
    }).returning({ id: assinaturaTrocas.id });
    trocaId = troca.id;

    const pagina = await detalhe(adminCtx, userId);
    const diferenca = Math.round((Number(basic.valorMensal) - Number(plus.valorMensal)) * 100) / 100;
    expect(pagina.trocaAgendada).toEqual({
      id: trocaId, planoDe: plus.nome, planoPara: basic.nome, tierDe: 'basic_plus', tierPara: 'basic',
      valorDe: Number(plus.valorMensal), valorPara: Number(basic.valorMensal), diferencaMensal: diferenca,
      efetivaEm: efetivaEm.toISOString(), criadaEm: expect.any(String), obrasMantidas: 1, membrosMantidos: 0,
    });
    expect(diferenca).toBeLessThan(0);
    expect(pagina.obras.find((o: Linha) => o.id === obraId)).toMatchObject({ bloqueadaPorPlano: true, linksAtivos: 0 });
    expect(pagina.assinante.bloqueiosPlano).toEqual({ obrasBloqueadas: 1, membrosPausados: 1 });

    // Troca já aplicada não aparece como agendada.
    await db.update(assinaturaTrocas).set({ status: 'aplicada', aplicadaEm: new Date() }).where(eq(assinaturaTrocas.id, trocaId));
    expect((await detalhe(adminCtx, userId)).trocaAgendada).toBeNull();
  } finally {
    if (trocaId) await db.delete(assinaturaTrocas).where(eq(assinaturaTrocas.id, trocaId));
    await apagarObra(obraId);
    await adminCtx.dispose();
  }
});
