import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  completarPerfilOperacional,
  loginAs,
  logout,
  SEED_ADMIN_EMAIL,
  uniqueEmail,
  uniqueUsername,
} from '../helpers';
import { contribuicaoDaConta } from '../helpers-admin-xgestao';

const ANTI_BOT = { website: '', mountedAt: Date.now() - 5_000 };
let cnpjSequence = 9_000;
// XG50: o teste grátis e o mês bônus valem uma vez por CPF/CNPJ; prefixo por execução evita repetir documento entre rodadas.
const CNPJ_PREFIXO_EXECUCAO = Date.now().toString().slice(-8);

type Dashboard = {
  indicadores: {
    assinantes: number;
    empreiteirasComPerfil: number;
    obrasGerenciadas: number;
    obrasAtivas: number;
    obrasAtrasadas: number;
    orcamentoGerenciado: number;
    valorPago: number;
    distribuicaoPlanos: Record<'free' | 'pro' | 'enterprise' | 'basic' | 'basic_plus' | 'premium', number>;
    distribuicaoStatus: {
      em_andamento: number;
      concluida: number;
      pausada: number;
      planejamento: number;
    };
    linksPublicosAtivos: number;
  };
  assinantes: Array<{
    id: string;
    email: string;
    obrasGerenciadas: number;
    plano: { tier: string };
    fimTeste: string | null;
  }>;
  obras: Array<{
    id: string;
    empreiteira: string;
    status: string;
    valorTotal: number;
    valorPago: number;
    linkPublicoAtivo: boolean;
  }>;
  alertas: {
    totais: {
      ocorrenciasAbertas: number;
      pagamentosAtrasados: number;
      obrasPausadas: number;
    };
    itens: Array<{ obraId: string; tipo: string; severidade: string }>;
  };
};

function proximoCnpjValido() {
  const base = `${CNPJ_PREFIXO_EXECUCAO}${String(cnpjSequence++).padStart(4, '0')}`;
  const digito = (digits: string, pesos: number[]) => {
    const soma = [...digits].reduce((total, digit, index) => total + Number(digit) * pesos[index], 0);
    const resto = soma % 11;
    return String(resto < 2 ? 0 : 11 - resto);
  };
  const primeiro = digito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${base}${primeiro}${digito(`${base}${primeiro}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])}`;
}

async function registrar(request: APIRequestContext, role: 'empreiteiro' | 'contratante', label: string) {
  const email = uniqueEmail(label);
  const response = await request.post('/api/auth/register', {
    data: {
      name: `${role} admin xgestão`,
      email,
      username: uniqueUsername(label.replace(/[^a-zA-Z0-9_.]/g, '')),
      password: 'Xconstr@E2E2026!',
      role,
      phone: '11988880000',
      cpfCnpj: proximoCnpjValido(),
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  expect(response.status(), await response.text()).toBeLessThan(300);
  return email;
}

async function concederXGestao(request: APIRequestContext, email: string) {
  await loginAs(request, SEED_ADMIN_EMAIL);
  const usuarios = await request.get(`/api/admin/usuarios?q=${encodeURIComponent(email)}`);
  const payload = (await usuarios.json()) as { rows: Array<{ id: string }> };
  expect(payload.rows).toHaveLength(1);
  const response = await request.patch(`/api/admin/usuarios/${payload.rows[0].id}`, { data: { xgestao: true } });
  expect(response.status(), await response.text()).toBe(200);
  await logout(request);
  return payload.rows[0].id;
}

/**
 * XG41/XG43 — sem teste ou plano a conta é somente leitura: o responsável
 * recém-liberado precisa iniciar o teste (Basic, 1 obra) e, para mais obras,
 * assinar um plano da oferta atual (o antigo `pro` saiu da venda na XG41).
 */
async function iniciarTeste(request: APIRequestContext) {
  const r = await request.post('/api/xgestao/teste', { data: {} });
  expect(r.status(), await r.text()).toBe(201);
}

async function assinar(request: APIRequestContext, tier: 'basic' | 'basic_plus' | 'premium') {
  const planos = (await (await request.get('/api/planos?persona=xgestao')).json()) as Array<{ id: string; tier: string }>;
  const plano = planos.find((item) => item.tier === tier);
  expect(plano, `plano ${tier} à venda`).toBeTruthy();
  const r = await request.post('/api/assinaturas/checkout', { data: { planoId: plano!.id, ciclo: 'mensal', persona: 'xgestao' } });
  expect(r.status(), await r.text()).toBe(201);
}

test.describe('XG06 — visão administrativa do xgestão', () => {
  test('conta assinantes, obras, planos e links persistidos e separa obras por produto', async ({ request }) => {
    const tag = `XG06 ${Date.now()}`;
    const empreiteiroEmail = await registrar(request, 'empreiteiro', 'admin-xgestao-emp');
    await loginAs(request, empreiteiroEmail);
    await completarPerfilOperacional(request, 'empreiteiro');
    await logout(request);
    const empreiteiroId = await concederXGestao(request, empreiteiroEmail);

    await loginAs(request, empreiteiroEmail);
    await iniciarTeste(request);
    const obraXgestao = await request.post('/api/xgestao/obras', {
      data: { nome: `${tag} obra própria`, endereco: 'Rua xgestão, 10' },
    });
    expect(obraXgestao.status(), await obraXgestao.text()).toBe(201);
    const obraXgestaoBody = (await obraXgestao.json()) as { id: string; clienteId: string | null };
    expect(obraXgestaoBody.clienteId).toBeNull();
    const shareExpirado = await request.post(`/api/xgestao/obras/${obraXgestaoBody.id}/share`, {
      data: { expiraEm: new Date(Date.now() - 60_000).toISOString() },
    });
    expect(shareExpirado.status(), await shareExpirado.text()).toBe(201);
    await logout(request);

    // TST-19 — o peso desta conta nos números da home, medido por ela mesma
    // (outros specs criam contas em paralelo, então "depois - antes" não serve).
    const home = async () => (await (await request.get('/api/admin/xgestao')).json()) as Dashboard;
    const pesoNaHome = () => contribuicaoDaConta(request, empreiteiroId, async () => {
      const d = await home();
      return {
        assinantes: d.indicadores.assinantes,
        obras: d.indicadores.obrasGerenciadas,
        ativas: d.indicadores.obrasAtivas,
        planejamento: d.indicadores.distribuicaoStatus.planejamento,
        links: d.indicadores.linksPublicosAtivos,
        basicPlus: d.indicadores.distribuicaoPlanos.basic_plus,
      };
    });
    await loginAs(request, SEED_ADMIN_EMAIL);
    // Link vencido não conta como ativo.
    expect((await pesoNaHome()).links).toBe(0);
    await logout(request);

    await loginAs(request, empreiteiroEmail);
    const share = await request.post(`/api/xgestao/obras/${obraXgestaoBody.id}/share`, { data: {} });
    expect(share.status(), await share.text()).toBe(201);

    await assinar(request, 'basic_plus');
    await logout(request);

    const contratanteEmail = await registrar(request, 'contratante', 'admin-xgestao-cli');
    await loginAs(request, contratanteEmail);
    await completarPerfilOperacional(request, 'contratante');
    const obraMarketplace = await request.post('/api/obras', {
      data: { nome: `${tag} obra marketplace`, endereco: 'Rua Marketplace, 20', visibilidade: 'rascunho' },
    });
    expect(obraMarketplace.status(), await obraMarketplace.text()).toBe(201);
    const obraMarketplaceBody = (await obraMarketplace.json()) as { id: string };
    await logout(request);

    await loginAs(request, SEED_ADMIN_EMAIL);
    const dashboardResponse = await request.get('/api/admin/xgestao');
    expect(dashboardResponse.status()).toBe(200);
    expect(dashboardResponse.headers()['cache-control'] ?? '').toMatch(/no-store|no-cache/i);
    const dashboard = (await dashboardResponse.json()) as Dashboard;
    const assinante = dashboard.assinantes.find((item) => item.email === empreiteiroEmail);
    expect(assinante).toMatchObject({
      obrasGerenciadas: 1,
      plano: { tier: 'basic_plus' },
      // Assinou durante o teste: o teste dá lugar ao plano pago.
      fimTeste: null,
    });
    expect(await pesoNaHome()).toEqual({ assinantes: 1, obras: 1, ativas: 0, planejamento: 1, links: 1, basicPlus: 1 });
    expect(dashboard.indicadores.obrasAtrasadas).toBeGreaterThanOrEqual(0);
    // XG34 — percentual de execução não existe no admin xgestão (coluna sem escritor).
    expect(dashboard.indicadores).not.toHaveProperty('progressoMedio');
    expect(dashboard.indicadores.orcamentoGerenciado).toBeGreaterThanOrEqual(0);
    expect(dashboard.indicadores.valorPago).toBeGreaterThanOrEqual(0);
    expect(dashboard.obras).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: obraXgestaoBody.id,
        status: 'planejamento',
        valorTotal: 0,
        valorPago: 0,
        linkPublicoAtivo: true,
      }),
    ]));
    const obraNoPainel = dashboard.obras.find((obra) => obra.id === obraXgestaoBody.id);
    expect(obraNoPainel).not.toHaveProperty('progresso');
    expect(dashboard.alertas.totais).toEqual(expect.objectContaining({
      ocorrenciasAbertas: expect.any(Number),
      pagamentosAtrasados: expect.any(Number),
      obrasPausadas: expect.any(Number),
    }));

    const semFiltro = await request.get(`/api/admin/obras?q=${encodeURIComponent(tag)}`);
    const todas = (await semFiltro.json()) as { rows: Array<{ id: string }>; total: number };
    expect(todas.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: obraXgestaoBody.id }),
      expect.objectContaining({ id: obraMarketplaceBody.id }),
    ]));

    const xgestao = await request.get(`/api/admin/obras?q=${encodeURIComponent(tag)}&produto=xgestao`);
    const obrasXgestao = (await xgestao.json()) as { rows: Array<{ id: string; clienteId: string | null }>; total: number };
    expect(obrasXgestao.total).toBe(1);
    expect(obrasXgestao.rows).toEqual([expect.objectContaining({ id: obraXgestaoBody.id, clienteId: null })]);

    const marketplace = await request.get(`/api/admin/obras?q=${encodeURIComponent(tag)}&produto=marketplace`);
    const obrasMarketplace = (await marketplace.json()) as { rows: Array<{ id: string; clienteId: string | null }>; total: number };
    expect(obrasMarketplace.total).toBe(1);
    expect(obrasMarketplace.rows[0]?.clienteId).toBeTruthy();

    // Uma obra com formato técnico de obra própria não pertence ao recorte
    // administrativo depois que o entitlement xgestão é removido.
    const revogar = await request.patch(`/api/admin/usuarios/${empreiteiroId}`, {
      data: { xgestao: false },
    });
    expect(revogar.status(), await revogar.text()).toBe(200);
    const aposRevogar = (await (await request.get('/api/admin/xgestao')).json()) as Dashboard;
    expect(aposRevogar.assinantes.some((item) => item.email === empreiteiroEmail)).toBe(false);
    // Sem o entitlement a conta nem é mais marcável como interna: saiu do recorte.
    expect((await request.patch(`/api/admin/xgestao/assinantes/${empreiteiroId}`, { data: { contaInterna: true } })).status()).toBe(404);
    expect(aposRevogar.obras.some((item) => item.id === obraXgestaoBody.id)).toBe(false);
    await logout(request);
  });

  test('bloqueia anônimos e usuários comuns no dashboard administrativo', async ({ request }) => {
    await logout(request);
    expect((await request.get('/api/admin/xgestao')).status()).toBe(401);

    const email = await registrar(request, 'empreiteiro', 'admin-xgestao-negado');
    await loginAs(request, email);
    expect((await request.get('/api/admin/xgestao')).status()).toBe(403);
    await logout(request);
  });

  test('as páginas do produto listam, filtram e detalham somente obras do xgestão', async ({ request }) => {
    const tag = `XG06 lista ${Date.now()}`;

    // Assinante xgestão com obra própria.
    const empreiteiroEmail = await registrar(request, 'empreiteiro', 'admin-xgestao-lista');
    await loginAs(request, empreiteiroEmail);
    await completarPerfilOperacional(request, 'empreiteiro');
    await logout(request);
    await concederXGestao(request, empreiteiroEmail);

    await loginAs(request, empreiteiroEmail);
    await iniciarTeste(request);
    const criada = await request.post('/api/xgestao/obras', {
      data: { nome: `${tag} própria`, endereco: 'Rua da listagem, 100' },
    });
    expect(criada.status(), await criada.text()).toBe(201);
    const obraXgestao = (await criada.json()) as { id: string };
    await logout(request);

    // Obra de marketplace, que serve de controle: tem contratante e por isso
    // não pode aparecer em nenhuma rota do produto.
    const contratanteEmail = await registrar(request, 'contratante', 'admin-xgestao-mkt');
    await loginAs(request, contratanteEmail);
    await completarPerfilOperacional(request, 'contratante');
    const obraMarketplace = await request.post('/api/obras', {
      data: { nome: `${tag} marketplace`, endereco: 'Rua do marketplace, 200', tipo: 'Reforma' },
    });
    expect(obraMarketplace.status(), await obraMarketplace.text()).toBe(201);
    const obraMarketplaceBody = (await obraMarketplace.json()) as { id: string };
    await logout(request);

    await loginAs(request, SEED_ADMIN_EMAIL);

    const lista = await request.get('/api/admin/xgestao/obras?q=' + encodeURIComponent(tag));
    expect(lista.status(), await lista.text()).toBe(200);
    const listaBody = (await lista.json()) as {
      rows: Array<{ id: string; nome: string }>;
      total: number;
      empreiteiras: Array<{ id: string; nome: string }>;
    };
    const ids = listaBody.rows.map((linha) => linha.id);
    expect(ids).toContain(obraXgestao.id);
    expect(ids).not.toContain(obraMarketplaceBody.id);

    // A busca é o que substitui o corte fixo de 12 obras do painel.
    const semResultado = await request.get('/api/admin/xgestao/obras?q=inexistente-' + Date.now());
    expect(((await semResultado.json()) as { rows: unknown[] }).rows).toHaveLength(0);

    const detalhe = await request.get(`/api/admin/xgestao/obras/${obraXgestao.id}`);
    expect(detalhe.status(), await detalhe.text()).toBe(200);
    const detalheBody = (await detalhe.json()) as {
      obra: { id: string };
      assinante: { empreiteiraId: string };
      lucro: { metrics: { margem: number } };
      linkPublico: { ativo: boolean };
    };
    expect(detalheBody.obra.id).toBe(obraXgestao.id);
    expect(detalheBody.assinante.empreiteiraId).toBeTruthy();
    expect(detalheBody.lucro.metrics).toHaveProperty('margem');
    expect(detalheBody.linkPublico.ativo).toBe(false);

    // O detalhe do produto não pode virar porta lateral para o marketplace.
    expect((await request.get(`/api/admin/xgestao/obras/${obraMarketplaceBody.id}`)).status()).toBe(404);

    const assinantes = await request.get('/api/admin/xgestao/assinantes');
    expect(assinantes.status()).toBe(200);
    const assinantesBody = (await assinantes.json()) as {
      rows: Array<{ email: string; plano: { tier: string; valorMensal: number; emTeste: boolean }; situacao: { codigo: string } }>;
    };
    const assinante = assinantesBody.rows.find((linha) => linha.email === empreiteiroEmail);
    expect(assinante).toBeTruthy();
    // XG43 — no teste grátis o assinante aparece no Basic, marcado como teste,
    // e o painel mostra o valor do plano.
    expect(assinante!.plano.tier).toBe('basic');
    expect(assinante!.plano.emTeste).toBe(true);
    expect(assinante!.situacao.codigo).toBe('em_teste');
    expect(assinante!.plano).toHaveProperty('valorMensal');

    const financeiro = await request.get('/api/admin/xgestao/financeiro');
    expect(financeiro.status()).toBe(200);
    const financeiroBody = (await financeiro.json()) as {
      lucro: { metrics: { receitaTotal: number } };
      faturamento: { receitaAcumulada: number; receitaRecorrenteMensal: number };
    };
    expect(financeiroBody.lucro.metrics).toHaveProperty('receitaTotal');
    expect(financeiroBody.faturamento).toHaveProperty('receitaRecorrenteMensal');
    await logout(request);
  });

  test('lista obras de múltiplas empreiteiras xgestão com filtro, paginação e consistência do dashboard', async ({
    request,
  }) => {
    const tag = `XG06 paginação ${Date.now()}`;
    const contratadas: Array<{ email: string; empreiteiraId: string; obras: string[] }> = [];

    for (const [index, label] of ['lista-a', 'lista-b'].entries()) {
      const email = await registrar(request, 'empreiteiro', `admin-xgestao-${label}`);
      await loginAs(request, email);
      await completarPerfilOperacional(request, 'empreiteiro');
      await logout(request);
      const userId = await concederXGestao(request, email);

      await loginAs(request, SEED_ADMIN_EMAIL);
      const assinantes = await request.get('/api/admin/xgestao/assinantes');
      expect(assinantes.status(), await assinantes.text()).toBe(200);
      const payload = (await assinantes.json()) as {
        rows: Array<{ userId: string; email: string; empreiteiraId: string }>;
      };
      const assinante = payload.rows.find((row) => row.email === email);
      expect(assinante, `assinante ${email} deve aparecer no xgestão`).toBeTruthy();
      await logout(request);

      await loginAs(request, email);
      // Duas obras por empresa: o Basic do teste aceita uma; o Basic Plus, três.
      await iniciarTeste(request);
      await assinar(request, 'basic_plus');
      const obras: string[] = [];
      for (const obraIndex of [1, 2]) {
        const criada = await request.post('/api/xgestao/obras', {
          data: { nome: `${tag} empreiteira ${index + 1} obra ${obraIndex}`, endereco: 'Rua da paginação, 100' },
        });
        expect(criada.status(), await criada.text()).toBe(201);
        obras.push(((await criada.json()) as { id: string }).id);
      }
      await logout(request);
      contratadas.push({ email, empreiteiraId: assinante!.empreiteiraId, obras });
      expect(userId).toBeTruthy();
    }

    // Obra de marketplace com o mesmo termo de busca: nunca entra no escopo
    // da lista administrativa xgestão.
    const contratanteEmail = await registrar(request, 'contratante', 'admin-xgestao-lista-mkt');
    await loginAs(request, contratanteEmail);
    await completarPerfilOperacional(request, 'contratante');
    const marketplace = await request.post('/api/obras', {
      data: { nome: `${tag} controle marketplace`, endereco: 'Rua do marketplace, 200', tipo: 'Reforma' },
    });
    expect(marketplace.status(), await marketplace.text()).toBe(201);
    const marketplaceId = ((await marketplace.json()) as { id: string }).id;
    await logout(request);

    await loginAs(request, SEED_ADMIN_EMAIL);
    const listaUrl = `/api/admin/xgestao/obras?q=${encodeURIComponent(tag)}&por_pagina=1`;
    const primeira = await request.get(`${listaUrl}&pagina=1`);
    expect(primeira.status(), await primeira.text()).toBe(200);
    const pagina1 = (await primeira.json()) as {
      rows: Array<{ id: string; empreiteiraId: string }>;
      total: number;
      pagina: number;
      porPagina: number;
      totalPaginas: number;
      empreiteiras: Array<{ id: string; nome: string }>;
    };
    expect(pagina1).toMatchObject({ total: 4, pagina: 1, porPagina: 1, totalPaginas: 4 });
    expect(pagina1.rows).toHaveLength(1);
    expect(pagina1.rows[0]?.id).not.toBe(marketplaceId);
    expect(pagina1.empreiteiras.map((item) => item.id)).toEqual(
      expect.arrayContaining(contratadas.map((item) => item.empreiteiraId)),
    );

    const segunda = await request.get(`${listaUrl}&pagina=2`);
    expect(segunda.status(), await segunda.text()).toBe(200);
    const pagina2 = (await segunda.json()) as typeof pagina1;
    expect(pagina2).toMatchObject({ total: 4, pagina: 2, porPagina: 1, totalPaginas: 4 });
    expect(pagina2.rows).toHaveLength(1);
    expect(pagina2.rows[0]?.id).not.toBe(pagina1.rows[0]?.id);

    const completa = await request.get(
      `/api/admin/xgestao/obras?q=${encodeURIComponent(tag)}&por_pagina=20`,
    );
    expect(completa.status(), await completa.text()).toBe(200);
    const completaBody = (await completa.json()) as { rows: Array<{ id: string }>; total: number };
    expect(completaBody.total).toBe(4);
    expect(completaBody.rows.map((row) => row.id)).toEqual(
      expect.arrayContaining(contratadas.flatMap((item) => item.obras)),
    );
    expect(completaBody.rows.map((row) => row.id)).not.toContain(marketplaceId);

    for (const contratada of contratadas) {
      const filtrada = await request.get(
        `/api/admin/xgestao/obras?q=${encodeURIComponent(tag)}&por_pagina=20&empreiteira_id=${encodeURIComponent(contratada.empreiteiraId)}`,
      );
      expect(filtrada.status(), await filtrada.text()).toBe(200);
      const filtradaBody = (await filtrada.json()) as {
        rows: Array<{ id: string; empreiteiraId: string }>;
        total: number;
        totalPaginas: number;
      };
      expect(filtradaBody.total).toBe(2);
      expect(filtradaBody.totalPaginas).toBe(1);
      expect(filtradaBody.rows).toHaveLength(2);
      expect(filtradaBody.rows.map((row) => row.empreiteiraId)).toEqual(
        Array(2).fill(contratada.empreiteiraId),
      );
      expect(filtradaBody.rows.map((row) => row.id)).toEqual(
        expect.arrayContaining(contratada.obras),
      );
      expect(filtradaBody.rows.map((row) => row.id)).not.toContain(marketplaceId);
    }

    const dashboard = await request.get('/api/admin/xgestao');
    expect(dashboard.status(), await dashboard.text()).toBe(200);
    const dashboardBody = (await dashboard.json()) as Dashboard;
    for (const contratada of contratadas) {
      const assinante = dashboardBody.assinantes.find((item) => item.email === contratada.email);
      expect(assinante?.obrasGerenciadas).toBe(2);
    }
    expect(dashboardBody.indicadores.empreiteirasComPerfil).toBeGreaterThanOrEqual(2);
    expect(dashboardBody.indicadores.obrasGerenciadas).toBeGreaterThanOrEqual(4);
    await logout(request);
  });

  test('as rotas novas do produto exigem administrador', async ({ request }) => {
    // ADM-13/TST-06 — CSV e detalhe de obra também: exportam e mostram dado de cliente.
    const obraQualquer = '00000000-0000-4000-8000-000000000000';
    const rotas = [
      '/api/admin/xgestao/obras',
      '/api/admin/xgestao/assinantes',
      '/api/admin/xgestao/financeiro',
      '/api/admin/xgestao/export?tipo=obras',
      '/api/admin/xgestao/export?tipo=assinantes',
      `/api/admin/xgestao/obras/${obraQualquer}`,
    ];
    await logout(request);
    for (const rota of rotas) {
      expect((await request.get(rota)).status(), rota).toBe(401);
    }
    expect((await request.patch(`/api/admin/xgestao/assinantes/${obraQualquer}`, { data: { contaInterna: true } })).status()).toBe(401);

    const email = await registrar(request, 'empreiteiro', 'admin-xgestao-rotas-negadas');
    await loginAs(request, email);
    for (const rota of rotas) {
      expect((await request.get(rota)).status(), rota).toBe(403);
    }
    // ADM-02 — marcar conta interna exige admin.
    expect((await request.patch(`/api/admin/xgestao/assinantes/${obraQualquer}`, { data: { contaInterna: true } })).status()).toBe(403);
    await logout(request);
  });

  test('ADM-13 exportação: tipo inválido é 400 e tipo=obras traz cabeçalho e linhas', async ({ request }) => {
    const tag = `ADM13 ${Date.now()}`;
    const email = await registrar(request, 'empreiteiro', 'admin-xgestao-export');
    await loginAs(request, email);
    await completarPerfilOperacional(request, 'empreiteiro');
    await logout(request);
    await concederXGestao(request, email);
    await loginAs(request, email);
    await iniciarTeste(request);
    const criada = await request.post('/api/xgestao/obras', { data: { nome: `${tag} =SOMA(1)`, endereco: 'Rua CSV, 1' } });
    expect(criada.status(), await criada.text()).toBe(201);
    await logout(request);

    await loginAs(request, SEED_ADMIN_EMAIL);
    for (const tipo of ['', 'xpto', 'OBRAS']) {
      const r = await request.get(`/api/admin/xgestao/export${tipo ? `?tipo=${tipo}` : ''}`);
      expect(r.status(), tipo).toBe(400);
    }
    const r = await request.get(`/api/admin/xgestao/export?tipo=obras&q=${encodeURIComponent(tag)}`);
    expect(r.status(), await r.text()).toBe(200);
    expect(r.headers()['content-type']).toContain('text/csv');
    expect(r.headers()['content-disposition']).toMatch(/attachment; filename="xgestao-obras-\d{4}-\d{2}-\d{2}\.csv"/);
    const linhas = (await r.text()).replace(/^\uFEFF/, '').split('\r\n');
    expect(linhas[0]).toBe('Obra;Empreiteira;Status;Cidade;UF;Previsão;Orçamento (R$);Custo real (R$);Última atividade;Link público ativo');
    expect(linhas).toHaveLength(2);
    expect(linhas[1].startsWith(`${tag} =SOMA(1)`)).toBe(true);
    // ADM-12 — a busca acha a obra pelo e-mail do responsável.
    const porEmail = await request.get(`/api/admin/xgestao/obras?q=${encodeURIComponent(email)}`);
    expect(((await porEmail.json()) as { rows: Array<{ nome: string }> }).rows.map((o) => o.nome)).toEqual([`${tag} =SOMA(1)`]);
    await logout(request);
  });
});