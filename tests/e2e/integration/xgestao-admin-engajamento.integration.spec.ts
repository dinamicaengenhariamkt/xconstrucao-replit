import { expect, test, type APIRequestContext } from '@playwright/test';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturas, financeiro, obraOcorrencias, obras, sessions, users, xgestaoMembros } from '@shared/db/schema';
import { aplicarEventoWebhook } from '@features/planos/assinatura-service';
import { ORIGEM_MENSALIDADE_XGESTAO } from '@features/xgestao/lib/receita';
import { loginAs, SEED_ADMIN_EMAIL, uniqueEmail } from '../helpers';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';
import { contribuicaoDaConta, leiturasBatem } from '../helpers-admin-xgestao';

/**
 * XG46 — engajamento (uso do responsável e da equipe, registros nas obras) e o
 * histórico mês a mês. Os sinais de uso são movidos no banco para datas
 * conhecidas e cada número é conferido na API.
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

/** Move todos os sinais de uso de uma pessoa para `dias` atrás. */
async function usouHa(userId: string, dias: number) {
  const quando = new Date(Date.now() - dias * DIA_MS);
  await db.update(users).set({ lastLoginAt: quando }).where(eq(users.id, userId));
  await db.update(sessions).set({ lastUsedAt: quando }).where(eq(sessions.userId, userId));
  return quando;
}

async function doAssinante(adminCtx: APIRequestContext, userId: string) {
  return (await getJson(adminCtx, `/api/admin/xgestao/assinantes/${userId}`)).assinante as Linha;
}

test('XG46 engajamento: responsável, equipe e registros nas obras definem o uso e a atenção', async ({ request, playwright, baseURL }) => {
  test.setTimeout(120_000);
  const { userId } = await novoAssinanteHomologacao(request, 'xg46-uso');
  const adminCtx = await admin(playwright, baseURL);
  let obraId: string | undefined;
  try {
    // Acabou de entrar: usou hoje, nenhum registro.
    let a = await doAssinante(adminCtx, userId);
    expect(a.engajamento).toMatchObject({ nivel: 'ativo_7d', diasSemUso: 0, ultimoRegistroEm: null, registros30d: 0, ultimoUsoEquipeEm: null });
    expect(a.atencao.map((m: Linha) => m.codigo)).not.toContain('sem_uso');

    // Sessão renovada há 2 dias e login há 20: vale a sessão (quem fica logado não faz login).
    const login = new Date(Date.now() - 20 * DIA_MS);
    const sessao = new Date(Date.now() - 2 * DIA_MS);
    await db.update(users).set({ lastLoginAt: login }).where(eq(users.id, userId));
    await db.update(sessions).set({ lastUsedAt: sessao }).where(eq(sessions.userId, userId));
    a = await doAssinante(adminCtx, userId);
    expect(a.ultimoAcessoEm).toBe(sessao.toISOString());
    expect(a.engajamento).toMatchObject({ nivel: 'ativo_7d', diasSemUso: 2 });

    // Parado há 20 dias no teste: pede atenção, entra na lista "sem uso" e no filtro.
    await usouHa(userId, 20);
    a = await doAssinante(adminCtx, userId);
    expect(a.engajamento).toMatchObject({ nivel: 'ativo_30d', diasSemUso: 20 });
    expect(a.atencao).toContainEqual({ codigo: 'sem_uso', severidade: 'atencao', texto: 'Sem usar há 20 dias' });
    let eng = await getJson(adminCtx, '/api/admin/xgestao/engajamento');
    expect(eng.semUso.find((x: Linha) => x.userId === userId)).toMatchObject({ situacao: { codigo: 'em_teste' }, engajamento: { diasSemUso: 20 } });
    expect(eng.resumo.semUso).toBe(eng.semUso.length);
    expect(eng.assinantes.find((x: Linha) => x.userId === userId).engajamento.nivel).toBe('ativo_30d');

    // A equipe usou ontem: a empresa está ativa, mesmo com o responsável parado.
    const convite = await request.post('/api/xgestao/membros', {
      data: { nome: 'Membro XG46', email: uniqueEmail('xg46-membro'), papel: 'colaborador', obras: [] },
    });
    expect(convite.status(), await convite.text()).toBe(201);
    const [membro] = await db.select({ userId: xgestaoMembros.userId }).from(xgestaoMembros).where(eq(xgestaoMembros.convidadoPor, userId));
    const usoMembro = await usouHa(membro.userId, 1);
    a = await doAssinante(adminCtx, userId);
    expect(a.engajamento).toMatchObject({ nivel: 'ativo_7d', diasSemUso: 1, ultimoUsoEquipeEm: usoMembro.toISOString() });
    expect(a.atencao.map((m: Linha) => m.codigo)).not.toContain('sem_uso');

    // Equipe parada há 45 dias e responsável há 40: inativo.
    await usouHa(membro.userId, 45);
    await usouHa(userId, 40);
    a = await doAssinante(adminCtx, userId);
    expect(a.engajamento).toMatchObject({ nivel: 'inativo', diasSemUso: 40 });

    // Um registro na obra (ocorrência) conta como uso e entra nos 30 dias.
    const criar = await request.post('/api/xgestao/obras', { data: { nome: `E2E XG46 ${Date.now()}`, endereco: 'Rua 46' } });
    expect(criar.status(), await criar.text()).toBe(201);
    obraId = (await criar.json()).id as string;
    await usouHa(userId, 40); // criar a obra não pode ter mexido nos sinais de sessão
    const ocorrencia = await request.post(`/api/obras/${obraId}/ocorrencias`, { data: { titulo: 'E2E XG46 infiltração', descricao: 'Aberta', gravidade: 'baixo' } });
    expect(ocorrencia.status(), await ocorrencia.text()).toBe(201);
    a = await doAssinante(adminCtx, userId);
    expect(a.engajamento.nivel).toBe('ativo_7d');
    expect(a.engajamento.registros30d).toBe(1);
    expect(a.engajamento.ultimoRegistroEm).toBeTruthy();

    // Registro antigo (31 dias) não entra na conta dos 30 dias.
    await db.update(obraOcorrencias).set({ createdAt: new Date(Date.now() - 31 * DIA_MS) }).where(eq(obraOcorrencias.obraId, obraId));
    const velho = new Date(Date.now() - 31 * DIA_MS);
    await db.update(obras).set({ createdAt: velho }).where(eq(obras.id, obraId));
    // O que a criação da obra possa ter gerado sozinha (etapas, diário) também envelhece.
    for (const tabela of ['obra_diario', 'obra_fotos', 'obra_anexos', 'financeiro']) {
      await db.execute(sql`update ${sql.raw(tabela)} set created_at = ${velho} where obra_id = ${obraId}`);
    }
    await db.execute(sql`update obra_etapas set updated_at = ${velho} where obra_id = ${obraId}`);
    a = await doAssinante(adminCtx, userId);
    expect(a.engajamento.registros30d).toBe(0);
    expect(a.engajamento.nivel).toBe('inativo');

    // CSV e home carregam o mesmo dado.
    const csv = await adminCtx.get('/api/admin/xgestao/export?tipo=assinantes');
    expect(csv.status()).toBe(200);
    const texto = await csv.text();
    expect(texto).toContain('Último uso da empresa');
    expect(texto).toContain('Sem uso há mais de 30 dias');
    // TST-19: home e página lidas na mesma janela (outros specs criam contas em paralelo).
    await leiturasBatem(async () => {
      const [home, pagina] = await Promise.all([
        getJson(adminCtx, '/api/admin/xgestao'),
        getJson(adminCtx, '/api/admin/xgestao/engajamento'),
      ]);
      return [home.engajamento, pagina.resumo];
    });
  } finally {
    if (obraId) {
      await db.delete(obraOcorrencias).where(eq(obraOcorrencias.obraId, obraId));
      await db.delete(financeiro).where(eq(financeiro.obraId, obraId));
      await db.delete(obras).where(eq(obras.id, obraId));
    }
    await adminCtx.dispose();
  }
});

test('XG46 mês a mês: teste, assinatura, mensalidade recebida e cancelamento mexem no mês corrente', async ({ request, playwright, baseURL }) => {
  test.setTimeout(180_000);
  const adminCtx = await admin(playwright, baseURL);
  const mesAtual = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).slice(0, 7);
  const atual = async () => (await getJson(adminCtx, '/api/admin/xgestao/historico')).meses.at(-1) as Linha;
  // TST-19 — o peso desta conta no mês corrente, sem depender do que os outros specs criam.
  const pesoNoMes = (userId: string) => contribuicaoDaConta(adminCtx, userId, async () => {
    const m = await atual();
    return {
      testes: m.testesIniciados, novos: m.novosPagantes, saidas: m.saidas,
      pagantes: m.pagantesFimMes, recorrente: m.recorrenteFimMes, recebido: m.recebido,
    };
  });
  const paymentId = `pay_xg46_${Date.now()}`;
  let userId = '';
  try {
    const historico = (await getJson(adminCtx, '/api/admin/xgestao/historico')).meses as Linha[];
    expect(historico).toHaveLength(12);
    expect(historico.at(-1)!.mes).toBe(mesAtual);

    ({ userId } = await novoAssinanteHomologacao(request, 'xg46-mes'));
    expect(await pesoNoMes(userId)).toEqual({ testes: 1, novos: 0, saidas: 0, pagantes: 0, recorrente: 0, recebido: 0 });

    const catalogo = await (await request.get('/api/planos?persona=xgestao')).json() as Array<{ id: string; tier: string; valorMensal: string }>;
    const plano = catalogo.find((p) => p.tier === 'basic_plus')!;
    const preco = Number(plano.valorMensal);
    const checkout = await request.post('/api/assinaturas/checkout', { data: { planoId: plano.id, persona: 'xgestao', ciclo: 'mensal' } });
    expect(checkout.status(), await checkout.text()).toBe(201);
    // CRM-04 — assinou no teste e ainda não pagou: entra como novo pagante, mas
    // o recorrente do mês corrente só conta depois do 1º pagamento (igual ao Financeiro).
    expect(await pesoNoMes(userId)).toEqual({ testes: 1, novos: 1, saidas: 0, pagantes: 1, recorrente: 0, recebido: 0 });
    // O recorrente do mês corrente é o mesmo do Financeiro.
    await leiturasBatem(async () => {
      const [fin, mes] = await Promise.all([getJson(adminCtx, '/api/admin/xgestao/financeiro'), atual()]);
      return [fin.receita.mrr, mes.recorrenteFimMes];
    });

    // Mensalidade paga entra no recebido do mês (dia de São Paulo, ADM-08).
    const [paga] = await db.select().from(assinaturas)
      .where(and(eq(assinaturas.userId, userId), eq(assinaturas.status, 'ativa'), eq(assinaturas.persona, 'xgestao')));
    await aplicarEventoWebhook({
      eventId: `xg46-${Date.now()}`, type: 'payment_succeeded', gatewaySubscriptionId: paga.gatewaySubscriptionId!,
      dueDate: paga.renovaEm!.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }), valor: preco, paymentId,
    });
    const [lancamento] = await db.select().from(financeiro).where(and(eq(financeiro.origemTipo, ORIGEM_MENSALIDADE_XGESTAO), eq(financeiro.origemId, paymentId)));
    expect(lancamento).toBeTruthy();
    expect(await pesoNoMes(userId)).toMatchObject({ recebido: preco, recorrente: preco });
    await leiturasBatem(async () => {
      const [fin, mes] = await Promise.all([getJson(adminCtx, '/api/admin/xgestao/financeiro'), atual()]);
      return [fin.receita.mrr, mes.recorrenteFimMes];
    });

    // Cancelar: continua pagante até o fim do período, mas sai do recorrente. Não é saída ainda.
    const cancelar = await request.post('/api/assinaturas/cancelar', { data: { persona: 'xgestao' } });
    expect(cancelar.status(), await cancelar.text()).toBe(200);
    expect(await pesoNoMes(userId)).toMatchObject({ pagantes: 1, recorrente: 0, saidas: 0 });
  } finally {
    await db.delete(financeiro).where(and(eq(financeiro.origemTipo, ORIGEM_MENSALIDADE_XGESTAO), eq(financeiro.origemId, paymentId)));
    await adminCtx.dispose();
  }
});

test('XG46 engajamento e mês a mês: só admin entra', async ({ request, playwright }) => {
  const anonimo = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  try {
    expect((await anonimo.get('/api/admin/xgestao/engajamento')).status()).toBe(401);
    expect((await anonimo.get('/api/admin/xgestao/historico')).status()).toBe(401);
  } finally {
    await anonimo.dispose();
  }
  await novoAssinanteHomologacao(request, 'xg46-acesso');
  expect((await request.get('/api/admin/xgestao/engajamento')).status()).toBe(403);
  expect((await request.get('/api/admin/xgestao/historico')).status()).toBe(403);
});
