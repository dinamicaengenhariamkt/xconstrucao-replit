import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  completarPerfilOperacional,
  loginAs,
  logout,
  SEED_ADMIN_EMAIL,
  uniqueEmail,
  uniqueUsername,
} from '../helpers';

/**
 * XG20 — "para quem foi o dinheiro" numa saída da obra.
 *
 * O pedido do cliente era o filtro ("depois no filtro eu posso colocar lá
 * Jefferson elétrica e eu vejo quanto eu paguei só para ele"), e o filtro só é
 * confiável se o vínculo for por id. Daí o que estes testes protegem:
 *
 * 1. a saída grava o vínculo e o snapshot do nome;
 * 2. um membro de OUTRA obra não é aceito — sem isso o id alheio criaria
 *    vínculo entre obras de donos diferentes;
 * 3. entrada não tem beneficiário, mesma regra que já vale para categoria.
 */

const ANTI_BOT = { website: '', mountedAt: Date.now() - 5_000 };
let cnpjSequence = 1;

function proximoCnpjValido() {
  const base = `44555666${String(cnpjSequence++).padStart(4, '0')}`;
  const digito = (digits: string, pesos: number[]) => {
    const soma = [...digits].reduce((total, digit, index) => total + Number(digit) * pesos[index], 0);
    const resto = soma % 11;
    return String(resto < 2 ? 0 : 11 - resto);
  };
  const primeiro = digito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const segundo = digito(`${base}${primeiro}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${base}${primeiro}${segundo}`;
}

async function registrar(request: APIRequestContext, label: string) {
  const email = uniqueEmail(label);
  const response = await request.post('/api/auth/register', {
    data: {
      name: 'E2E empreiteiro fornecedor',
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
  expect(usuarios.status()).toBe(200);
  const payload = (await usuarios.json()) as { rows: Array<{ id: string }> };
  expect(payload.rows).toHaveLength(1);
  const response = await request.patch(`/api/admin/usuarios/${payload.rows[0].id}`, {
    data: { xgestao: true },
  });
  expect(response.status(), await response.text()).toBe(200);
  await logout(request);
}

async function criarObra(request: APIRequestContext, nome: string) {
  const criada = await request.post('/api/xgestao/obras', {
    data: { nome, endereco: 'Rua do Beneficiário, 100' },
  });
  expect(criada.status(), await criada.text()).toBe(201);
  return ((await criada.json()) as { id: string }).id;
}

async function criarMembro(request: APIRequestContext, obraId: string, nome: string) {
  const membro = await request.post(`/api/obras/${obraId}/equipe`, {
    data: { nome, papel: 'Elétrica', tipo: 'equipe' },
  });
  expect(membro.status(), await membro.text()).toBeLessThan(300);
  return ((await membro.json()) as { id: string }).id;
}

/** Empreiteiro com xgestão liberado e perfil operacional completo. */
async function prepararEmpreiteiro(request: APIRequestContext, label: string) {
  const email = await registrar(request, label);
  await loginAs(request, email);
  await completarPerfilOperacional(request, 'empreiteiro');
  await logout(request);
  await concederXGestao(request, email);
  await loginAs(request, email);
  return email;
}

test.describe('XG20 — beneficiário da saída', () => {
  test('grava o vínculo com o membro da equipe e o snapshot do nome', async ({ request }) => {
    await prepararEmpreiteiro(request, 'xg20-fornecedor-ok');
    const obraId = await criarObra(request, 'E2E obra beneficiário');
    const membroId = await criarMembro(request, obraId, 'E2E Jefferson Elétrica');

    const criado = await request.post(`/api/obras/${obraId}/financeiro`, {
      data: {
        tipo: 'saida',
        categoria: 'mao_de_obra',
        descricao: 'Pagamento da segunda parcela',
        valor: 1500.5,
        data: '2026-09-16',
        fornecedorId: membroId,
      },
    });
    expect(criado.status(), await criado.text()).toBe(201);

    // O nome é copiado no servidor: o cliente mandou só o id.
    expect(await criado.json()).toMatchObject({
      fornecedorId: membroId,
      fornecedorNome: 'E2E Jefferson Elétrica',
      tipo: 'saida',
    });

    // Estado persistido, não só a resposta do POST.
    const lista = await request.get(`/api/obras/${obraId}/financeiro`);
    expect(lista.status(), await lista.text()).toBe(200);
    const { rows } = (await lista.json()) as {
      rows: Array<{ fornecedorId: string | null; fornecedorNome: string | null; valor: string }>;
    };
    const salvo = rows.find((r) => r.fornecedorId === membroId);
    expect(salvo).toBeTruthy();
    expect(salvo?.fornecedorNome).toBe('E2E Jefferson Elétrica');

    await logout(request);
  });

  test('aceita nome avulso para quem não está na equipe', async ({ request }) => {
    await prepararEmpreiteiro(request, 'xg20-fornecedor-avulso');
    const obraId = await criarObra(request, 'E2E obra avulso');

    const criado = await request.post(`/api/obras/${obraId}/financeiro`, {
      data: {
        tipo: 'saida',
        categoria: 'material',
        descricao: 'Areia e cimento',
        valor: 320,
        data: '2026-09-16',
        fornecedorNome: 'E2E Depósito da Esquina',
      },
    });
    expect(criado.status(), await criado.text()).toBe(201);
    expect(await criado.json()).toMatchObject({
      fornecedorId: null,
      fornecedorNome: 'E2E Depósito da Esquina',
    });

    await logout(request);
  });

  test('recusa membro de outra obra, os dois campos juntos e beneficiário em entrada', async ({
    request,
  }) => {
    await prepararEmpreiteiro(request, 'xg20-fornecedor-recusa');
    const obraA = await criarObra(request, 'E2E obra A');
    const obraB = await criarObra(request, 'E2E obra B');
    const membroDaB = await criarMembro(request, obraB, 'E2E Membro da obra B');

    // Membro existe e o usuário é dono das duas obras — mesmo assim não pode
    // atravessar: o vínculo é por obra.
    const cruzado = await request.post(`/api/obras/${obraA}/financeiro`, {
      data: {
        tipo: 'saida',
        categoria: 'mao_de_obra',
        descricao: 'Pagamento cruzado',
        valor: 100,
        data: '2026-09-16',
        fornecedorId: membroDaB,
      },
    });
    expect(cruzado.status(), await cruzado.text()).toBe(400);

    const membroDaA = await criarMembro(request, obraA, 'E2E Membro da obra A');
    const ambos = await request.post(`/api/obras/${obraA}/financeiro`, {
      data: {
        tipo: 'saida',
        categoria: 'mao_de_obra',
        descricao: 'Id e nome juntos',
        valor: 100,
        data: '2026-09-16',
        fornecedorId: membroDaA,
        fornecedorNome: 'Outro nome qualquer',
      },
    });
    expect(ambos.status(), await ambos.text()).toBe(400);

    const entrada = await request.post(`/api/obras/${obraA}/financeiro`, {
      data: {
        tipo: 'entrada',
        descricao: 'Entrada do cliente',
        valor: 5000,
        data: '2026-09-16',
        fornecedorNome: 'E2E Alguém',
      },
    });
    expect(entrada.status(), await entrada.text()).toBe(400);

    // Nenhuma das três tentativas pode ter deixado linha para trás.
    const lista = await request.get(`/api/obras/${obraA}/financeiro`);
    expect(lista.status()).toBe(200);
    expect(((await lista.json()) as { rows: unknown[] }).rows).toHaveLength(0);

    await logout(request);
  });

  test('troca o beneficiário pelo PATCH e permite limpá-lo', async ({ request }) => {
    await prepararEmpreiteiro(request, 'xg20-fornecedor-patch');
    const obraId = await criarObra(request, 'E2E obra patch');
    const membroId = await criarMembro(request, obraId, 'E2E Primeiro Beneficiário');

    const criado = await request.post(`/api/obras/${obraId}/financeiro`, {
      data: {
        tipo: 'saida',
        categoria: 'mao_de_obra',
        descricao: 'Pagamento a revisar',
        valor: 800,
        data: '2026-09-16',
        fornecedorId: membroId,
      },
    });
    expect(criado.status(), await criado.text()).toBe(201);
    const lancamentoId = ((await criado.json()) as { id: string }).id;

    const trocado = await request.patch(`/api/obras/${obraId}/financeiro/${lancamentoId}`, {
      data: { fornecedorNome: 'E2E Segundo Beneficiário' },
    });
    expect(trocado.status(), await trocado.text()).toBe(200);
    expect(await trocado.json()).toMatchObject({
      fornecedorId: null,
      fornecedorNome: 'E2E Segundo Beneficiário',
    });

    // Patch que não menciona o beneficiário não pode apagá-lo.
    const soValor = await request.patch(`/api/obras/${obraId}/financeiro/${lancamentoId}`, {
      data: { valor: 900 },
    });
    expect(soValor.status(), await soValor.text()).toBe(200);
    expect(await soValor.json()).toMatchObject({
      fornecedorNome: 'E2E Segundo Beneficiário',
    });

    const limpo = await request.patch(`/api/obras/${obraId}/financeiro/${lancamentoId}`, {
      data: { fornecedorId: null, fornecedorNome: null },
    });
    expect(limpo.status(), await limpo.text()).toBe(200);
    expect(await limpo.json()).toMatchObject({ fornecedorId: null, fornecedorNome: null });

    await logout(request);
  });
});
