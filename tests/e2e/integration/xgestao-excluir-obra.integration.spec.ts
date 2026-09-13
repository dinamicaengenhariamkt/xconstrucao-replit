import { expect, test, type APIRequestContext } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import {
  financeiro,
  obraDiario,
  obraEquipe,
  obraEtapas,
  obras,
  obraTarefas,
} from '@shared/db/schema';
import {
  completarPerfilOperacional,
  loginAs,
  logout,
  SEED_ADMIN_EMAIL,
  SEED_EMPREITEIRO_EMAIL,
  uniqueEmail,
  uniqueUsername,
} from '../helpers';

/**
 * XG10 — exclusão da obra do xgestão.
 *
 * O DELETE existia mas rejeitava todo empreiteiro com 403, e o dono da obra no
 * xgestão É um empreiteiro. A liberação vale só para obra própria; obra de
 * marketplace pertence ao contratante e segue protegida.
 */

const ANTI_BOT = { website: '', mountedAt: Date.now() - 5_000 };
let cnpjSequence = 1100;

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
      name: 'empreiteiro E2E excluir',
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
}

async function criarAssinanteComObra(request: APIRequestContext, label: string) {
  const email = await registrar(request, label);
  await loginAs(request, email);
  await completarPerfilOperacional(request, 'empreiteiro');
  await logout(request);
  await concederXGestao(request, email);
  await loginAs(request, email);

  const criada = await request.post('/api/xgestao/obras', {
    data: { nome: `Obra E2E excluir ${label}`, endereco: 'Rua da Exclusão, 10' },
  });
  expect(criada.status(), await criada.text()).toBe(201);
  const obra = (await criada.json()) as { id: string };
  return { email, obraId: obra.id };
}

const HOJE = new Date().toISOString().slice(0, 10);

test.describe('XG10 — excluir obra', () => {
  test('o dono exclui a própria obra, com tudo que está dentro dela', async ({ request }) => {
    const { obraId } = await criarAssinanteComObra(request, 'xg10-del-feliz');

    // Popula a obra: é o cenário real, não uma obra vazia. `financeiro` não
    // tem cascade, então este é justamente o caso que quebraria o DELETE.
    const etapa = await request.post(`/api/obras/${obraId}/etapas`, {
      data: { nome: 'Fundação' },
    });
    expect(etapa.status()).toBe(201);

    const tarefa = await request.post(`/api/obras/${obraId}/tarefas`, {
      data: { titulo: 'Escavação', etapa: 'Fundação' },
    });
    expect(tarefa.status()).toBe(201);

    const lancamento = await request.post(`/api/obras/${obraId}/financeiro`, {
      data: { tipo: 'entrada', descricao: 'Entrada do cliente', valor: 500, data: HOJE },
    });
    expect(lancamento.status()).toBe(201);

    const diario = await request.post(`/api/obras/${obraId}/diario`, {
      data: { texto: 'Concretagem concluída no térreo — registro E2E.' },
    });
    expect(diario.status()).toBe(201);

    const membro = await request.post(`/api/obras/${obraId}/equipe`, {
      data: { nome: 'Jefferson', papel: 'Hidráulica', telefone: '11988887777' },
    });
    expect(membro.status()).toBe(201);

    const excluida = await request.delete(`/api/obras/${obraId}`);
    expect(excluida.status(), await excluida.text()).toBe(200);

    // Tudo foi embora: a obra e os filhos, por cascade ou limpeza explícita.
    expect(await db.select().from(obras).where(eq(obras.id, obraId))).toHaveLength(0);
    expect(
      await db.select().from(obraEtapas).where(eq(obraEtapas.obraId, obraId)),
      'etapas removidas',
    ).toHaveLength(0);
    expect(
      await db.select().from(obraTarefas).where(eq(obraTarefas.obraId, obraId)),
      'tarefas removidas',
    ).toHaveLength(0);
    expect(
      await db.select().from(financeiro).where(eq(financeiro.obraId, obraId)),
      'lançamentos removidos (FK com NO ACTION)',
    ).toHaveLength(0);
    // Estas três não têm FK alguma no banco real: sem limpeza explícita,
    // ficariam órfãs e invisíveis depois que a obra sumisse.
    expect(
      await db.select().from(obraDiario).where(eq(obraDiario.obraId, obraId)),
      'diário removido (tabela sem FK)',
    ).toHaveLength(0);
    expect(
      await db.select().from(obraEquipe).where(eq(obraEquipe.obraId, obraId)),
      'equipe removida (tabela sem FK)',
    ).toHaveLength(0);

    await logout(request);
  });

  test('obra de outro assinante não pode ser excluída', async ({ request }) => {
    const dono = await criarAssinanteComObra(request, 'xg10-del-dono');
    await logout(request);

    const semSessao = await request.delete(`/api/obras/${dono.obraId}`);
    expect(semSessao.status(), 'sem sessão → 401').toBe(401);

    await criarAssinanteComObra(request, 'xg10-del-intruso');
    const idor = await request.delete(`/api/obras/${dono.obraId}`);
    expect(idor.status(), 'obra alheia → 404').toBe(404);
    await logout(request);

    // A obra continua lá.
    expect(await db.select().from(obras).where(eq(obras.id, dono.obraId))).toHaveLength(1);
  });

  test('REGRESSÃO: empreiteiro segue barrado em obra de marketplace', async ({ request }) => {
    // O empreiteiro do seed é vinculado a obras com contratante. Apagar uma
    // delas destruiria o histórico da outra parte — a liberação do XG10 vale
    // apenas para a obra própria, sem contratante.
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);

    const lista = await request.get('/api/empreiteiro/minhas-obras');
    expect(lista.status()).toBe(200);
    const rows = (await lista.json()) as Array<{ id: string; isObraPropria?: boolean }>;
    const doMarketplace = rows.find((o) => o.isObraPropria === false);

    if (doMarketplace) {
      const tentativa = await request.delete(`/api/obras/${doMarketplace.id}`);
      expect(tentativa.status(), 'obra com contratante → 403').toBe(403);
      expect(
        await db.select().from(obras).where(eq(obras.id, doMarketplace.id)),
        'a obra do marketplace continua existindo',
      ).toHaveLength(1);
    } else {
      test.skip(true, 'seed sem obra de marketplace vinculada a este empreiteiro');
    }

    await logout(request);
  });
});
