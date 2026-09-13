import { expect, test, type APIRequestContext } from '@playwright/test';
import { and, eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { financeiro, obraAditivos } from '@shared/db/schema';
import {
  completarPerfilOperacional,
  loginAs,
  logout,
  SEED_ADMIN_EMAIL,
  uniqueEmail,
  uniqueUsername,
} from '../helpers';

/**
 * XG10 — lançamentos financeiros da obra do xgestão.
 *
 * Cobre o que a reunião de 2026-09-12 pediu: lançar entrada e saída, separar
 * mão de obra de material, e ver receita/custo refletidos no detalhe da obra.
 * Inclui o IDOR que a auditoria encontrou: `POST /api/financeiro` aceitava
 * lançamento em obra de terceiro.
 */

const ANTI_BOT = { website: '', mountedAt: Date.now() - 5_000 };
let cnpjSequence = 500;

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

async function registrar(request: APIRequestContext, label: string) {
  const email = uniqueEmail(label);
  const response = await request.post('/api/auth/register', {
    data: {
      name: 'empreiteiro E2E financeiro',
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

/** Assinante xgestão com uma obra própria pronta para receber lançamentos. */
async function criarAssinanteComObra(request: APIRequestContext, label: string) {
  const email = await registrar(request, label);
  await loginAs(request, email);
  await completarPerfilOperacional(request, 'empreiteiro');
  await logout(request);
  await concederXGestao(request, email);
  await loginAs(request, email);

  const criada = await request.post('/api/xgestao/obras', {
    data: { nome: `Obra E2E financeiro ${label}`, endereco: 'Rua dos Lançamentos, 100' },
  });
  expect(criada.status(), await criada.text()).toBe(201);
  const obra = (await criada.json()) as { id: string };
  return { email, obraId: obra.id };
}

const HOJE = new Date().toISOString().slice(0, 10);

test.describe('XG10 — lançamentos financeiros da obra', () => {
  test('entrada e saída somam receita e custo no detalhe da obra', async ({ request }) => {
    const { obraId } = await criarAssinanteComObra(request, 'xg10-fin-feliz');

    const entrada = await request.post(`/api/obras/${obraId}/financeiro`, {
      data: {
        tipo: 'entrada',
        descricao: '30% referente à entrada',
        valor: 250,
        data: HOJE,
      },
    });
    expect(entrada.status(), await entrada.text()).toBe(201);

    const saida = await request.post(`/api/obras/${obraId}/financeiro`, {
      data: {
        tipo: 'saida',
        categoria: 'mao_de_obra',
        descricao: 'Pagamento para o Jefferson (hidráulica)',
        valor: 100,
        data: HOJE,
      },
    });
    expect(saida.status(), await saida.text()).toBe(201);
    const saidaCriada = (await saida.json()) as { id: string };

    // Estado no banco, não só o status HTTP: é o preenchimento de
    // recebedor/pagador que faz os totais somarem na tela.
    const linhas = await db.select().from(financeiro).where(eq(financeiro.obraId, obraId));
    expect(linhas, 'dois lançamentos persistidos').toHaveLength(2);
    const linhaEntrada = linhas.find((l) => l.tipo === 'entrada');
    const linhaSaida = linhas.find((l) => l.tipo === 'saida');
    expect(linhaEntrada?.recebedorUserId, 'entrada credita o dono da obra').toBeTruthy();
    expect(linhaEntrada?.status, 'lançamento manual nasce pago').toBe('pago');
    expect(linhaSaida?.pagadorUserId, 'saída debita o dono da obra').toBeTruthy();
    expect(linhaSaida?.categoria).toBe('mao_de_obra');

    // A tela: receita e custo precisam refletir o que foi lançado — era
    // exatamente isto que não acontecia ("receita total não está puxando").
    const detalhe = await request.get(`/api/empreiteiro/minhas-obras/${obraId}`);
    expect(detalhe.status(), await detalhe.text()).toBe(200);
    const corpo = (await detalhe.json()) as {
      financeiro: { receitaTotal: number; custoTotal: number };
    };
    expect(corpo.financeiro.receitaTotal, 'receita soma a entrada').toBe(250);
    expect(corpo.financeiro.custoTotal, 'custo soma a saída').toBe(100);

    // Listagem da aba
    const lista = await request.get(`/api/obras/${obraId}/financeiro`);
    expect(lista.status()).toBe(200);
    expect((await lista.json()).rows, 'lista devolve os dois').toHaveLength(2);

    // Edição na própria aba
    const editado = await request.patch(`/api/obras/${obraId}/financeiro/${saidaCriada.id}`, {
      data: { valor: 180, descricao: 'Pagamento Jefferson — 2ª parcela' },
    });
    expect(editado.status(), await editado.text()).toBe(200);

    const apos = await request.get(`/api/empreiteiro/minhas-obras/${obraId}`);
    expect((await apos.json()).financeiro.custoTotal, 'custo reflete a edição').toBe(180);

    // Exclusão
    const excluido = await request.delete(`/api/obras/${obraId}/financeiro/${saidaCriada.id}`);
    expect(excluido.status(), await excluido.text()).toBe(200);
    const restantes = await db.select().from(financeiro).where(eq(financeiro.obraId, obraId));
    expect(restantes, 'sobrou só a entrada').toHaveLength(1);

    await logout(request);
  });

  test('valida o payload: tipo inválido, saída sem categoria e entrada com categoria', async ({
    request,
  }) => {
    const { obraId } = await criarAssinanteComObra(request, 'xg10-fin-validacao');

    const tipoInvalido = await request.post(`/api/obras/${obraId}/financeiro`, {
      data: { tipo: 'transferencia', descricao: 'x', valor: 10, data: HOJE },
    });
    expect(tipoInvalido.status(), 'tipo fora do vocabulário → 400').toBe(400);

    const saidaSemCategoria = await request.post(`/api/obras/${obraId}/financeiro`, {
      data: { tipo: 'saida', descricao: 'Compra de cimento', valor: 10, data: HOJE },
    });
    expect(saidaSemCategoria.status(), 'saída exige categoria → 400').toBe(400);

    const entradaComCategoria = await request.post(`/api/obras/${obraId}/financeiro`, {
      data: {
        tipo: 'entrada',
        categoria: 'material',
        descricao: 'Entrada',
        valor: 10,
        data: HOJE,
      },
    });
    expect(entradaComCategoria.status(), 'entrada não tem categoria → 400').toBe(400);

    const valorNegativo = await request.post(`/api/obras/${obraId}/financeiro`, {
      data: { tipo: 'entrada', descricao: 'Estorno', valor: -50, data: HOJE },
    });
    expect(valorNegativo.status(), 'valor precisa ser positivo → 400').toBe(400);

    const dataInvalida = await request.post(`/api/obras/${obraId}/financeiro`, {
      data: { tipo: 'entrada', descricao: 'Entrada', valor: 10, data: '13/09/2026' },
    });
    expect(dataInvalida.status(), 'data precisa ser ISO → 400').toBe(400);

    await logout(request);
  });

  test('authz: sem sessão → 401; obra de outro assinante → 404 (IDOR)', async ({ request }) => {
    const dono = await criarAssinanteComObra(request, 'xg10-fin-dono');
    await logout(request);

    const semSessao = await request.post(`/api/obras/${dono.obraId}/financeiro`, {
      data: { tipo: 'entrada', descricao: 'Sem sessão', valor: 10, data: HOJE },
    });
    expect(semSessao.status(), 'sem sessão → 401').toBe(401);

    // Um segundo assinante não pode lançar na obra do primeiro.
    const intruso = await criarAssinanteComObra(request, 'xg10-fin-intruso');

    const naRotaAninhada = await request.post(`/api/obras/${dono.obraId}/financeiro`, {
      data: { tipo: 'saida', categoria: 'material', descricao: 'IDOR', valor: 999, data: HOJE },
    });
    expect(naRotaAninhada.status(), 'obra alheia → 404').toBe(404);

    // Regressão da falha encontrada na auditoria: a rota legada aceitava
    // qualquer `obraId` de quem estivesse apenas autenticado.
    const naRotaLegada = await request.post('/api/financeiro', {
      data: {
        obraId: dono.obraId,
        tipo: 'saida',
        descricao: 'IDOR pela rota legada',
        valor: '999',
        data: HOJE,
        status: 'pendente',
      },
    });
    expect(naRotaLegada.status(), 'rota legada também barra obra alheia').toBe(404);

    const vazou = await db
      .select()
      .from(financeiro)
      .where(and(eq(financeiro.obraId, dono.obraId), eq(financeiro.valor, '999.00')));
    expect(vazou, 'nada foi gravado na obra do outro').toHaveLength(0);

    expect(intruso.obraId).toBeTruthy();
    await logout(request);
  });
});

test.describe('XG10 — aditivos de contrato', () => {
  test('aditivo soma ao valor total da obra e aceita supressão', async ({ request }) => {
    const { obraId } = await criarAssinanteComObra(request, 'xg10-aditivo-feliz');

    // Sem aditivo, valorTotal é o contratado puro.
    const antes = await request.get(`/api/empreiteiro/minhas-obras/${obraId}`);
    const financeiroAntes = (await antes.json()).financeiro as {
      valorContratado: number;
      aditivos: number;
      valorTotal: number;
    };
    expect(financeiroAntes.aditivos, 'começa zerado').toBe(0);
    const contratado = financeiroAntes.valorContratado;

    const acrescimo = await request.post(`/api/obras/${obraId}/aditivos`, {
      data: { descricao: 'Acréscimo de churrasqueira', valor: 5000, data: HOJE },
    });
    expect(acrescimo.status(), await acrescimo.text()).toBe(201);
    const criado = (await acrescimo.json()) as { id: string };

    // Supressão de escopo: valor negativo é aceito de propósito.
    const supressao = await request.post(`/api/obras/${obraId}/aditivos`, {
      data: { descricao: 'Supressão do deck', valor: -1500, data: HOJE },
    });
    expect(supressao.status(), await supressao.text()).toBe(201);

    const linhas = await db.select().from(obraAditivos).where(eq(obraAditivos.obraId, obraId));
    expect(linhas, 'dois aditivos persistidos').toHaveLength(2);

    // O que o card mostra: aditivos somados e refletidos no total.
    const depois = await request.get(`/api/empreiteiro/minhas-obras/${obraId}`);
    const financeiroDepois = (await depois.json()).financeiro as {
      aditivos: number;
      valorTotal: number;
    };
    expect(financeiroDepois.aditivos, '5000 − 1500').toBe(3500);
    expect(financeiroDepois.valorTotal, 'total = contratado + aditivos').toBe(contratado + 3500);

    // Exclusão recalcula.
    const excluido = await request.delete(`/api/obras/${obraId}/aditivos/${criado.id}`);
    expect(excluido.status(), await excluido.text()).toBe(200);
    const final = await request.get(`/api/empreiteiro/minhas-obras/${obraId}`);
    expect((await final.json()).financeiro.aditivos, 'sobra só a supressão').toBe(-1500);

    await logout(request);
  });

  test('valida payload e authz do aditivo', async ({ request }) => {
    const dono = await criarAssinanteComObra(request, 'xg10-aditivo-authz');

    const semDescricao = await request.post(`/api/obras/${dono.obraId}/aditivos`, {
      data: { valor: 100, data: HOJE },
    });
    expect(semDescricao.status(), 'descrição obrigatória → 400').toBe(400);

    const valorZero = await request.post(`/api/obras/${dono.obraId}/aditivos`, {
      data: { descricao: 'Aditivo vazio', valor: 0, data: HOJE },
    });
    expect(valorZero.status(), 'zero não é aditivo → 400').toBe(400);

    await logout(request);

    const semSessao = await request.post(`/api/obras/${dono.obraId}/aditivos`, {
      data: { descricao: 'Sem sessão', valor: 100, data: HOJE },
    });
    expect(semSessao.status(), 'sem sessão → 401').toBe(401);

    // Outro assinante não enxerga nem lança na obra alheia.
    await criarAssinanteComObra(request, 'xg10-aditivo-intruso');
    const idor = await request.post(`/api/obras/${dono.obraId}/aditivos`, {
      data: { descricao: 'IDOR', valor: 100, data: HOJE },
    });
    expect(idor.status(), 'obra alheia → 404').toBe(404);

    const listaAlheia = await request.get(`/api/obras/${dono.obraId}/aditivos`);
    expect(listaAlheia.status(), 'leitura de obra alheia → 404').toBe(404);

    await logout(request);
  });
});
