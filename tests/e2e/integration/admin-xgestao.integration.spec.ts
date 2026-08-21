import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  completarPerfilOperacional,
  loginAs,
  logout,
  SEED_ADMIN_EMAIL,
  uniqueEmail,
  uniqueUsername,
} from '../helpers';

const ANTI_BOT = { website: '', mountedAt: Date.now() - 5_000 };
let cnpjSequence = 9_000;

type Dashboard = {
  indicadores: {
    assinantes: number;
    obrasGerenciadas: number;
    distribuicaoPlanos: { free: number; pro: number; enterprise: number };
    linksPublicosAtivos: number;
  };
  assinantes: Array<{
    id: string;
    email: string;
    obrasGerenciadas: number;
    plano: { tier: string };
    fimTeste: string | null;
  }>;
};

function proximoCnpjValido() {
  const base = `11222333${String(cnpjSequence++).padStart(4, '0')}`;
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
}

test.describe('XG06 — visão administrativa do xgestão', () => {
  test('conta assinantes, obras, planos e links persistidos e separa obras por produto', async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const antes = (await (await request.get('/api/admin/xgestao')).json()) as Dashboard;
    await logout(request);

    const tag = `XG06 ${Date.now()}`;
    const empreiteiroEmail = await registrar(request, 'empreiteiro', 'admin-xgestao-emp');
    await loginAs(request, empreiteiroEmail);
    await completarPerfilOperacional(request, 'empreiteiro');
    await logout(request);
    await concederXGestao(request, empreiteiroEmail);

    await loginAs(request, empreiteiroEmail);
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

    await loginAs(request, SEED_ADMIN_EMAIL);
    const aposExpirar = (await (await request.get('/api/admin/xgestao')).json()) as Dashboard;
    expect(aposExpirar.indicadores.linksPublicosAtivos).toBe(antes.indicadores.linksPublicosAtivos);
    await logout(request);

    await loginAs(request, empreiteiroEmail);
    const share = await request.post(`/api/xgestao/obras/${obraXgestaoBody.id}/share`, { data: {} });
    expect(share.status(), await share.text()).toBe(201);

    const planos = await request.get('/api/planos?persona=xgestao');
    const pro = ((await planos.json()) as Array<{ id: string; tier: string }>).find((plano) => plano.tier === 'pro');
    expect(pro).toBeTruthy();
    const checkout = await request.post('/api/assinaturas/checkout', {
      data: { planoId: pro!.id, ciclo: 'mensal', persona: 'xgestao' },
    });
    expect(checkout.status(), await checkout.text()).toBe(201);
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
      plano: { tier: 'pro' },
      fimTeste: null,
    });
    expect(dashboard.indicadores.assinantes).toBe(antes.indicadores.assinantes + 1);
    expect(dashboard.indicadores.obrasGerenciadas).toBe(antes.indicadores.obrasGerenciadas + 1);
    expect(dashboard.indicadores.linksPublicosAtivos).toBe(antes.indicadores.linksPublicosAtivos + 1);
    expect(dashboard.indicadores.distribuicaoPlanos.pro).toBe(antes.indicadores.distribuicaoPlanos.pro + 1);

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
    await logout(request);
  });
});