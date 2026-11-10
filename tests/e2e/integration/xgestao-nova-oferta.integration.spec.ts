import { expect, test } from '@playwright/test';
import { and, eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturaTrocas, assinaturas, empreiteiras, financeiro, obras, users } from '@shared/db/schema';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';
import { SECOES_PADRAO } from '@features/xgestao/obra-publica/secoes';
import { loginAs, SEED_ADMIN_EMAIL } from '../helpers';

/** XG43 — o teste só vira somente leitura 24h após o fim; aqui ele venceu há 24h + 1 min. */
const FIM_TESTE_MAIS_TOLERANCIA_MS = 24 * 60 * 60_000 + 60_000;

for (const oferta of [
  { tier: 'basic', nome: 'Basic', preco: 99, obras: 1, pessoas: 2, links: 1 },
  { tier: 'basic_plus', nome: 'Basic Plus', preco: 179, obras: 3, pessoas: 5, links: 3 },
  { tier: 'premium', nome: 'Premium', preco: 299, obras: 10, pessoas: 15, links: -1 },
]) {
  test(`XG42 ${oferta.tier}: catálogo, checkout, cotas atômicas e isolamento`, async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, `oferta-${oferta.tier}`);
    const [empresa] = await db.select({ id: empreiteiras.id }).from(empreiteiras).where(eq(empreiteiras.userId, userId));
    const antesMarketplace = await (await request.get('/api/perfil/plano')).json();
    const catalogo = await (await request.get('/api/planos?persona=xgestao')).json();
    expect(catalogo.map((p: { tier: string }) => p.tier)).toEqual(['basic', 'basic_plus', 'premium']);
    const plano = catalogo.find((p: { tier: string }) => p.tier === oferta.tier);
    expect(Number(plano.valorMensal)).toBe(oferta.preco);
    const anual = await request.post('/api/assinaturas/checkout', {
      data: { planoId: plano.id, persona: 'xgestao', ciclo: 'anual' },
    });
    // XG48 — o xgestão só tem ciclo mensal.
    expect(anual.status(), await anual.text()).toBe(400);
    expect(await anual.json()).toMatchObject({ code: 'CICLO_INVALIDO' });
    const checkout = await request.post('/api/assinaturas/checkout', {
      data: { planoId: plano.id, persona: 'xgestao', ciclo: 'mensal' },
    });
    expect(checkout.status(), await checkout.text()).toBe(201);
    expect(await checkout.json()).toMatchObject({ kind: 'activated' });
    const perfil = await (await request.get('/api/perfil/plano?persona=xgestao')).json();
    expect(perfil).toMatchObject({
      plano: oferta.tier, somenteLeitura: false, assinaturaStatus: 'ativa',
      catalogo: { nome: oferta.nome, precoMensal: oferta.preco },
    });
    expect((await (await request.get('/api/perfil/plano')).json()).catalogo).toEqual(antesMarketplace.catalogo);
    const [u] = await db.select({ plano: users.plano }).from(users).where(eq(users.id, userId));
    expect(u.plano).toBe('free');
    const ids: string[] = [];
    try {
      // Pré-preenche só a empresa descartável, sem alterar catálogo global e
      // sem confundir o rate limit de criação com a cota comercial.
      for (let i = 0; i < oferta.obras - 1; i++) {
        const [row] = await db.insert(obras).values({
          nome: `E2E cota ${i}`, endereco: 'Rua de Teste, 42',
          empreiteiraId: empresa.id, clienteId: null, visibilidade: 'rascunho',
        }).returning({ id: obras.id });
        ids.push(row.id);
      }
      const concorrentes = await Promise.all([0, 1].map(i => request.post('/api/xgestao/obras', {
        data: { nome: `E2E última vaga ${i}`, endereco: 'Rua de Teste, 42' },
      })));
      for (const resposta of concorrentes.filter(r => r.status() === 201)) ids.push((await resposta.json()).id);
      expect(concorrentes.map(r => r.status()).sort()).toEqual([201, 402]);
      const criada = await concorrentes.find(r => r.status() === 201)!.json();
      ids.push(criada.id);
      const obraId = criada.id;
      const limiteLinks = oferta.links < 0 ? 6 : oferta.links;
      for (let i = 0; i < limiteLinks; i++) {
        const link = await request.post(`/api/xgestao/obras/${obraId}/share`, { data: { nome: `Cliente ${i}` } });
        expect(link.status(), await link.text()).toBe(201);
      }
      const estadoLinks = await (await request.get(`/api/xgestao/obras/${obraId}/share`)).json();
      expect(estadoLinks).toMatchObject({ limite: oferta.links, valoresPublicos: oferta.tier !== 'basic' });
      if (oferta.links >= 0) {
        const extra = await request.post(`/api/xgestao/obras/${obraId}/share`, { data: { nome: 'Excedente' } });
        expect(extra.status(), await extra.text()).toBe(409);
      }
      const alterarSecoes = await request.patch(`/api/xgestao/obras/${obraId}/share/${estadoLinks.shares[0].id}`, {
        data: { secoes: { ...SECOES_PADRAO, pagamentos: true } },
      });
      expect(alterarSecoes.status(), await alterarSecoes.text()).toBe(oferta.tier === 'basic' ? 403 : 200);
      for (let i = 0; i < oferta.pessoas - 2; i++) {
        const convite = await request.post('/api/xgestao/membros', {
          data: { nome: `Membro ${i}`, email: `cota-${oferta.tier}-${userId}-${i}@teste.xconstrucao.com`, papel: 'colaborador', obras: [] },
        });
        expect(convite.status(), await convite.text()).toBe(201);
      }
      const emailsUltimaVaga = [0, 1].map(i => `ultima-${oferta.tier}-${userId}-${i}@teste.xconstrucao.com`);
      const ultimaVaga = await Promise.all(emailsUltimaVaga.map(email => request.post('/api/xgestao/membros', {
        data: { nome: 'Última vaga', email, papel: 'colaborador', obras: [] },
      })));
      expect(ultimaVaga.map(r => r.status()).sort()).toEqual([201, 409]);
      const emailRecusado = emailsUltimaVaga[ultimaVaga.findIndex(r => r.status() === 409)];
      expect(await db.select({ id: users.id }).from(users).where(eq(users.email, emailRecusado))).toHaveLength(0);
      const excedente = await request.post('/api/xgestao/membros', {
        data: { nome: 'Sem vaga', email: `excedente-${userId}@teste.xconstrucao.com`, papel: 'gestor', obras: [] },
      });
      expect(excedente.status(), await excedente.text()).toBe(409);
      const equipe = await (await request.get('/api/xgestao/membros')).json();
      expect(equipe.usoEquipe).toMatchObject({
        utilizadas: oferta.pessoas, limite: oferta.pessoas, convitesPendentes: oferta.pessoas - 1,
      });
      expect((await request.patch(`/api/obras/${obraId}`, { data: { status: 'concluida' } })).status()).toBe(200);
      const nova = await request.post('/api/xgestao/obras', { data: { nome: 'E2E ocupa vaga liberada', endereco: 'Rua 42' } });
      expect(nova.status(), await nova.text()).toBe(201);
      ids.push((await nova.json()).id);
      const reabrir = await request.patch(`/api/obras/${obraId}`, { data: { status: 'planejamento' } });
      expect(reabrir.status(), await reabrir.text()).toBe(409);
    } finally {
      for (const id of ids) await db.delete(obras).where(eq(obras.id, id));
    }
  });
}

test('XG43 teste Basic por 90 dias vence em somente leitura, preserva dados e permite contratar', async ({ request }) => {
  const { userId, email } = await novoAssinanteHomologacao(request, 'trial-leitura');
  const perfil = await (await request.get('/api/perfil/plano?persona=xgestao')).json();
  expect(perfil).toMatchObject({
    plano: 'basic', somenteLeitura: false,
    teste: { emTeste: true, duracaoDias: 90, tierTeste: 'basic' },
  });
  const criada = await request.post('/api/xgestao/obras', { data: { nome: 'E2E preservada', endereco: 'Rua 42' } });
  expect(criada.status(), await criada.text()).toBe(201);
  const { id } = await criada.json();
  try {
    await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - FIM_TESTE_MAIS_TOLERANCIA_MS) }).where(and(
      eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao'), eq(assinaturas.gatewayProvider, 'trial'),
    ));
    for (const endpoint of [
      `/api/obras/${id}/etapas`, `/api/obras/${id}/financeiro`,
      `/api/obras/${id}/fotos`, `/api/obras/${id}/anexos`, '/api/xgestao/membros', '/api/xgestao/obras',
    ]) {
      const bloqueada = await request.post(endpoint, { data: {} });
      expect(bloqueada.status(), `${endpoint}: ${await bloqueada.text()}`).toBe(403);
      expect(await bloqueada.json()).toMatchObject({ code: 'XGESTAO_SOMENTE_LEITURA' });
    }
    expect((await request.patch(`/api/obras/${id}`, { data: { nome: 'Não pode salvar' } })).status()).toBe(403);
    expect((await request.delete(`/api/obras/${id}`)).status()).toBe(403);
    const detalhe = await request.get(`/api/obras/${id}`);
    expect(detalhe.status(), await detalhe.text()).toBe(200);
    const [preservada] = await db.select({ nome: obras.nome }).from(obras).where(eq(obras.id, id));
    expect(preservada.nome).toBe('E2E preservada');
    expect(await (await request.get('/api/perfil/plano?persona=xgestao')).json()).toMatchObject({
      somenteLeitura: true, catalogo: { nome: 'Somente leitura', precoMensal: 0 },
    });
    const catalogo = await (await request.get('/api/planos?persona=xgestao')).json();
    const checkout = await request.post('/api/assinaturas/checkout', {
      data: { planoId: catalogo.find((p: { tier: string }) => p.tier === 'basic').id, persona: 'xgestao', ciclo: 'mensal' },
    });
    expect(checkout.status(), await checkout.text()).toBe(201);
    expect((await request.patch(`/api/obras/${id}`, { data: { nome: 'E2E retomada' } })).status()).toBe(200);
    await loginAs(request, SEED_ADMIN_EMAIL);
    const admin = await request.get('/api/admin/xgestao/assinantes');
    expect(admin.status(), await admin.text()).toBe(200);
    await loginAs(request, email);
  } finally {
    await db.delete(obras).where(eq(obras.id, id));
  }
});

test('XG42 link antigo perde valores no downgrade sem perder a obra e os recebimentos', async ({ request }) => {
  const { userId } = await novoAssinanteHomologacao(request, 'privacidade-downgrade');
  // XG43 — o teste agora é Basic, sem valores no link: parte do Premium pago.
  const planos = await (await request.get('/api/planos?persona=xgestao')).json();
  const premium = await request.post('/api/assinaturas/checkout', {
    data: { planoId: planos.find((p: { tier: string }) => p.tier === 'premium').id, persona: 'xgestao', ciclo: 'mensal' },
  });
  expect(premium.status(), await premium.text()).toBe(201);
  const criada = await request.post('/api/xgestao/obras', { data: { nome: 'E2E privacidade XG42', endereco: 'Rua 42' } });
  expect(criada.status(), await criada.text()).toBe(201);
  const { id } = await criada.json();
  try {
    expect((await request.patch(`/api/obras/${id}`, { data: { valorTotal: '1500.50' } })).status()).toBe(200);
    const descricao = `Recebimento reservado XG42 ${id}`;
    const entrada = await request.post(`/api/obras/${id}/financeiro`, {
      data: { tipo: 'entrada', descricao, valor: 350.25, data: '2026-11-02', status: 'pago' },
    });
    expect(entrada.status(), await entrada.text()).toBe(201);
    const link = await request.post(`/api/xgestao/obras/${id}/share`, {
      data: { nome: 'Cliente autorizado', secoes: { ...SECOES_PADRAO, pagamentos: true } },
    });
    expect(link.status(), await link.text()).toBe(201);
    const { share } = await link.json();
    const antes = await request.get(share.path);
    expect(antes.status(), await antes.text()).toBe(200);
    expect(await antes.text()).toContain(descricao);
    // XG48 — com assinatura paga, a descida é pela troca: agendada para `renovaEm`
    // e efetivada na primeira leitura do plano depois da data.
    const [viva] = await db.select({ id: assinaturas.id }).from(assinaturas).where(and(
      eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao'), eq(assinaturas.status, 'ativa'),
    ));
    await db.update(assinaturas).set({
      primeiroPagamentoEm: new Date(Date.now() - 15 * 24 * 60 * 60_000), fimTesteEm: null,
      renovaEm: new Date(Date.now() + 15 * 24 * 60 * 60_000),
      gatewaySubscriptionId: `xg42_sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    }).where(eq(assinaturas.id, viva.id));
    const downgrade = await request.post('/api/assinaturas/trocar', {
      data: {
        planoId: planos.find((p: { tier: string }) => p.tier === 'basic').id, persona: 'xgestao',
        chave: `xg42_descer_${Date.now().toString(36)}`, ciente: true,
      },
    });
    expect(downgrade.status(), await downgrade.text()).toBe(200);
    expect((await downgrade.json()).status).toBe('agendada');
    // Até a data efetiva o link segue com os valores.
    expect(await (await request.get(share.path)).text()).toContain(descricao);
    await db.update(assinaturaTrocas).set({ efetivaEm: new Date(Date.now() - 60_000) })
      .where(and(eq(assinaturaTrocas.userId, userId), eq(assinaturaTrocas.status, 'agendada')));
    expect((await (await request.get('/api/perfil/plano?persona=xgestao')).json()).plano).toBe('basic');
    const depois = await request.get(share.path);
    expect(depois.status()).toBe(200);
    expect(await depois.text()).not.toContain(descricao);
    expect(await depois.text()).not.toContain('1.500,50');
    const lancamentos = await request.get(`/api/obras/${id}/financeiro`);
    expect(lancamentos.status()).toBe(200);
    expect(await lancamentos.text()).toContain(descricao);
    const [preservada] = await db.select({ valor: obras.valorTotal }).from(obras).where(eq(obras.id, id));
    expect(Number(preservada.valor)).toBe(1500.5);
  } finally {
    await db.delete(financeiro).where(eq(financeiro.obraId, id));
    await db.delete(obras).where(eq(obras.id, id));
  }
});
