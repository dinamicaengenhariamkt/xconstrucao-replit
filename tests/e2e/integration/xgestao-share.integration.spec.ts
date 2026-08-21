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
let cnpjSequence = 1;

function proximoCnpjValido() {
  const base = `11222333${String(cnpjSequence++).padStart(4, '0')}`;
  const digito = (digits: string, pesos: number[]) => {
    const soma = [...digits].reduce((total, digit, index) => total + Number(digit) * pesos[index], 0);
    const resto = soma % 11;
    return String(resto < 2 ? 0 : 11 - resto);
  };
  const primeiro = digito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const segundo = digito(`${base}${primeiro}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${base}${primeiro}${segundo}`;
}

async function registrarEmpreiteiro(request: APIRequestContext, label: string) {
  const email = uniqueEmail(label);
  const response = await request.post('/api/auth/register', {
    data: {
      name: `Empreiteiro ${label}`,
      email,
      username: uniqueUsername(label.replace(/[^a-zA-Z0-9_.]/g, '')),
      password: 'Xconstr@E2E2026!',
      role: 'empreiteiro',
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
  const response = await request.patch(`/api/admin/usuarios/${payload.rows[0].id}`, {
    data: { xgestao: true },
  });
  expect(response.status(), await response.text()).toBe(200);
  await logout(request);
  return payload.rows[0].id;
}

function tokenFromPath(path: string) {
  const token = path.split('/').pop() ?? '';
  expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  return token;
}

test.describe('xgestão — link público de obra', () => {
  test('emite, reexibe, limita, expira, revoga e invalida links de obra própria', async ({ request }) => {
    const ownerEmail = await registrarEmpreiteiro(request, 'xgestao-share-owner');
    await loginAs(request, ownerEmail);
    await completarPerfilOperacional(request, 'empreiteiro');
    await logout(request);
    const ownerId = await concederXGestao(request, ownerEmail);
    await loginAs(request, ownerEmail);

    const obraResponse = await request.post('/api/xgestao/obras', {
      data: {
        nome: 'Obra pública E2E',
        endereco: 'Rua que não deve aparecer, 123',
        cidade: 'São Paulo',
        uf: 'SP',
      },
    });
    expect(obraResponse.status(), await obraResponse.text()).toBe(201);
    const obra = (await obraResponse.json()) as { id: string };

    const etapa = await request.post(`/api/obras/${obra.id}/etapas`, {
      data: { nome: 'Fundação E2E', descricao: 'Preparação controlada' },
    });
    expect(etapa.status(), await etapa.text()).toBe(201);
    const ocorrencia = await request.post(`/api/obras/${obra.id}/ocorrencias`, {
      data: { titulo: 'Vistoria E2E', descricao: 'Acompanhamento da execução', gravidade: 'baixo' },
    });
    expect(ocorrencia.status(), await ocorrencia.text()).toBe(201);

    const criada = await request.post(`/api/xgestao/obras/${obra.id}/share`, { data: {} });
    expect(criada.status(), await criada.text()).toBe(201);
    const first = (await criada.json()) as { share: { path: string } };
    expect(first.share.path).toMatch(/^\/publico\/obra\/[A-Za-z0-9_-]{43}$/);
    tokenFromPath(first.share.path);

    const reexibida = await request.get(`/api/xgestao/obras/${obra.id}/share`);
    expect(reexibida.status()).toBe(200);
    expect(await reexibida.json()).toMatchObject({ share: { path: first.share.path } });

    await logout(request);
    const publica = await request.get(first.share.path);
    expect(publica.status(), await publica.text()).toBe(200);
    const html = await publica.text();
    expect(html).toContain('Obra pública E2E');
    expect(html).toContain('Fundação E2E');
    expect(html).toContain('Vistoria E2E');
    expect(html).toMatch(/noindex/i);
    expect(publica.headers()['cache-control'] ?? '').toMatch(/no-store|no-cache/i);
    for (const proibido of [
      // Valores reais são a asserção útil aqui: o HTML de desenvolvimento do
      // Next inclui código de runtime com palavras genéricas como "email".
      'Rua que não deve aparecer', 'clienteId', 'empreiteiraId',
    ]) {
      expect(html).not.toContain(proibido);
    }
    const invalido = await request.get('/publico/obra/token-invalido');
    expect(invalido.status()).toBe(404);

    // Outra conta não pode criar nem revogar a capability da obra de terceiro.
    const otherEmail = await registrarEmpreiteiro(request, 'xgestao-share-other');
    await loginAs(request, otherEmail);
    await completarPerfilOperacional(request, 'empreiteiro');
    await logout(request);
    await concederXGestao(request, otherEmail);
    await loginAs(request, otherEmail);
    const outroPost = await request.post(`/api/xgestao/obras/${obra.id}/share`, { data: {} });
    const outroDelete = await request.delete(`/api/xgestao/obras/${obra.id}/share`);
    expect(outroPost.status()).toBe(404);
    expect(outroDelete.status()).toBe(404);
    await logout(request);

    // A rotação revoga imediatamente a capability anterior.
    await loginAs(request, ownerEmail);
    const rotacionada = await request.post(`/api/xgestao/obras/${obra.id}/share`, { data: {} });
    expect(rotacionada.status()).toBe(201);
    const second = (await rotacionada.json()) as { share: { path: string } };
    expect(second.share.path).not.toBe(first.share.path);
    await logout(request);
    expect((await request.get(first.share.path)).status()).toBe(404);
    expect((await request.get(second.share.path)).status()).toBe(200);

    // Expiração é indistinguível de um token inexistente.
    await loginAs(request, ownerEmail);
    const expirada = await request.post(`/api/xgestao/obras/${obra.id}/share`, {
      data: { expiraEm: new Date(Date.now() - 60_000).toISOString() },
    });
    expect(expirada.status()).toBe(201);
    const expiredPath = ((await expirada.json()) as { share: { path: string } }).share.path;
    await logout(request);
    expect((await request.get(expiredPath)).status()).toBe(404);

    // Revogação mantém histórico, mas torna o token público indisponível.
    await loginAs(request, ownerEmail);
    const ativa = await request.post(`/api/xgestao/obras/${obra.id}/share`, { data: {} });
    const activePath = ((await ativa.json()) as { share: { path: string } }).share.path;
    const revogada = await request.delete(`/api/xgestao/obras/${obra.id}/share`);
    expect(revogada.status()).toBe(200);
    expect(await revogada.json()).toEqual({ revoked: true });
    await logout(request);
    expect((await request.get(activePath)).status()).toBe(404);

    // Uma assinatura/entitlement revogada não deixa uma capability já emitida
    // ativa e impossível de administrar pelo dono.
    await loginAs(request, ownerEmail);
    const paraRevogarEntitlement = await request.post(`/api/xgestao/obras/${obra.id}/share`, { data: {} });
    const entitlementPath = ((await paraRevogarEntitlement.json()) as { share: { path: string } }).share.path;
    await logout(request);
    await loginAs(request, SEED_ADMIN_EMAIL);
    const entitlementRevogado = await request.patch(`/api/admin/usuarios/${ownerId}`, { data: { xgestao: false } });
    expect(entitlementRevogado.status(), await entitlementRevogado.text()).toBe(200);
    await logout(request);
    expect((await request.get(entitlementPath)).status()).toBe(404);

    // Cascata ao remover a obra evita que um link órfão passe a resolver dados.
    await loginAs(request, SEED_ADMIN_EMAIL);
    const entitlementRestaurado = await request.patch(`/api/admin/usuarios/${ownerId}`, { data: { xgestao: true } });
    expect(entitlementRestaurado.status(), await entitlementRestaurado.text()).toBe(200);
    await logout(request);
    await loginAs(request, ownerEmail);
    const paraExcluir = await request.post(`/api/xgestao/obras/${obra.id}/share`, { data: {} });
    const deletedPath = ((await paraExcluir.json()) as { share: { path: string } }).share.path;
    await logout(request);
    await loginAs(request, SEED_ADMIN_EMAIL);
    const excluida = await request.delete(`/api/obras/${obra.id}`);
    expect(excluida.status(), await excluida.text()).toBe(200);
    await logout(request);
    expect((await request.get(deletedPath)).status()).toBe(404);
  });
});