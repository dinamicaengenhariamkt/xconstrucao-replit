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
let cnpjSequence = 7_000;

function proximoCnpjValido() {
  const base = `11222333${String(cnpjSequence++).padStart(4, '0')}`;
  const digito = (digits: string, pesos: number[]) => {
    const soma = [...digits].reduce((total, digit, index) => total + Number(digit) * pesos[index], 0);
    const resto = soma % 11;
    return String(resto < 2 ? 0 : 11 - resto);
  };
  return `${base}${digito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])}${digito(
    `${base}${digito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])}`,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  )}`;
}

async function registrar(request: APIRequestContext, role: 'empreiteiro' | 'contratante', label: string) {
  const email = uniqueEmail(label);
  const response = await request.post('/api/auth/register', {
    data: {
      name: `${role} planos xgestão`,
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
  expect(usuarios.status()).toBe(200);
  const payload = (await usuarios.json()) as { rows: Array<{ id: string }> };
  expect(payload.rows).toHaveLength(1);
  const response = await request.patch(`/api/admin/usuarios/${payload.rows[0].id}`, { data: { xgestao: true } });
  expect(response.status(), await response.text()).toBe(200);
  await logout(request);
}

function obra(nome: string) {
  return { nome, endereco: 'Rua dos Planos, 123' };
}

test.describe('xgestão — planos e limites', () => {
  test('Freemium limita uma obra, conclusão libera vaga e Basic limita três', async ({ request }) => {
    const empreiteiroEmail = await registrar(request, 'empreiteiro', 'xgestao-planos-emp');
    await loginAs(request, empreiteiroEmail);
    await completarPerfilOperacional(request, 'empreiteiro');
    await logout(request);
    await concederXGestao(request, empreiteiroEmail);
    await loginAs(request, empreiteiroEmail);

    const perfilFree = await request.get('/api/perfil/plano?persona=xgestao');
    expect(perfilFree.status(), await perfilFree.text()).toBe(200);
    expect((await perfilFree.json()) as { persona: string; plano: string }).toMatchObject({
      persona: 'xgestao',
      plano: 'free',
    });

    const primeira = await request.post('/api/xgestao/obras', { data: obra('Obra Freemium') });
    expect(primeira.status(), await primeira.text()).toBe(201);
    const primeiraBody = (await primeira.json()) as { id: string };

    const bloqueadaFree = await request.post('/api/xgestao/obras', { data: obra('Obra bloqueada Freemium') });
    expect(bloqueadaFree.status(), await bloqueadaFree.text()).toBe(402);
    expect((await bloqueadaFree.json()) as { code: string }).toMatchObject({ code: 'LIMITE_PLANO' });

    const concluida = await request.patch(`/api/obras/${primeiraBody.id}`, { data: { status: 'concluida' } });
    expect(concluida.status(), await concluida.text()).toBe(200);
    const concorrentes = await Promise.all([
      request.post('/api/xgestao/obras', { data: obra('Obra concorrente A') }),
      request.post('/api/xgestao/obras', { data: obra('Obra concorrente B') }),
    ]);
    const statusesConcorrentes = concorrentes.map((response) => response.status()).sort();
    expect(statusesConcorrentes).toEqual([201, 402]);

    const planos = await request.get('/api/planos?persona=xgestao');
    expect(planos.status(), await planos.text()).toBe(200);
    const basic = ((await planos.json()) as Array<{ id: string; tier: string }>).find((plano) => plano.tier === 'pro');
    expect(basic).toBeTruthy();

    // O ID de um plano xgestão não basta: fora do contexto do produto, a rota
    // resolve a persona pelo plano e exige o entitlement antes do checkout.
    await logout(request);
    const semEntitlement = await registrar(request, 'empreiteiro', 'xgestao-planos-sem-direito');
    await loginAs(request, semEntitlement);
    await completarPerfilOperacional(request, 'empreiteiro');
    const checkoutSemEntitlement = await request.post('/api/assinaturas/checkout', {
      data: { planoId: basic!.id, ciclo: 'mensal' },
    });
    expect(checkoutSemEntitlement.status(), await checkoutSemEntitlement.text()).toBe(403);
    await logout(request);
    await loginAs(request, empreiteiroEmail);

    const checkout = await request.post('/api/assinaturas/checkout', {
      data: { planoId: basic!.id, ciclo: 'mensal', persona: 'xgestao' },
    });
    expect(checkout.status(), await checkout.text()).toBe(201);
    expect((await checkout.json()) as { kind: string }).toMatchObject({ kind: 'activated' });

    // O upgrade do produto adicional não altera as cotas de propostas/obras do
    // marketplace, ainda governadas pelo tier legado da conta.
    const perfilMarketplace = await request.get('/api/perfil/plano');
    expect(perfilMarketplace.status()).toBe(200);
    expect((await perfilMarketplace.json()) as { plano: string }).toMatchObject({ plano: 'free' });

    const perfilBasic = await request.get('/api/perfil/plano?persona=xgestao');
    expect(perfilBasic.status()).toBe(200);
    expect((await perfilBasic.json()) as { plano: string; uso: Array<{ current: number; max: number }> }).toMatchObject({
      plano: 'pro',
      uso: [expect.objectContaining({ current: 1, max: 3 })],
    });

    const planosMarketplace = await request.get('/api/planos');
    expect(planosMarketplace.status()).toBe(200);
    const planoMarketplace = ((await planosMarketplace.json()) as Array<{ id: string; tier: string }>).find(
      (plano) => plano.tier === 'pro',
    );
    const checkoutComPersonaForjada = await request.post('/api/assinaturas/checkout', {
      data: { planoId: planoMarketplace!.id, ciclo: 'mensal', persona: 'xgestao' },
    });
    expect(checkoutComPersonaForjada.status(), await checkoutComPersonaForjada.text()).toBe(404);

    expect((await request.post('/api/xgestao/obras', { data: obra('Basic dois') })).status()).toBe(201);
    expect((await request.post('/api/xgestao/obras', { data: obra('Basic três') })).status()).toBe(201);
    const bloqueadaBasic = await request.post('/api/xgestao/obras', { data: obra('Basic quatro') });
    expect(bloqueadaBasic.status(), await bloqueadaBasic.text()).toBe(402);
    expect((await bloqueadaBasic.json()) as { code: string }).toMatchObject({ code: 'LIMITE_PLANO' });
    await logout(request);
  });

  test('o endpoint marketplace preserva seu limite de obras abertas', async ({ request }) => {
    const contratanteEmail = await registrar(request, 'contratante', 'xgestao-planos-ctr');
    await loginAs(request, contratanteEmail);
    await completarPerfilOperacional(request, 'contratante');

    const criada = await request.post('/api/obras', {
      data: {
        ...obra('Marketplace continua independente'),
        visibilidade: 'rascunho',
      },
    });
    expect(criada.status(), await criada.text()).toBe(201);
    const bloqueada = await request.post('/api/obras', {
      data: {
        ...obra('Segunda marketplace limitada'),
        visibilidade: 'rascunho',
      },
    });
    expect(bloqueada.status(), await bloqueada.text()).toBe(402);
    expect((await bloqueada.json()) as { code: string }).toMatchObject({ code: 'LIMITE_PLANO' });
    await logout(request);
  });
});