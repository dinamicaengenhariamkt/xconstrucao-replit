import { expect, test, type APIRequestContext } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { medicoes } from '@shared/db/schema';
import {
  completarPerfilOperacional,
  loginAs,
  logout,
  SEED_ADMIN_EMAIL,
  uniqueEmail,
  uniqueUsername,
} from '../helpers';

/**
 * XG12 — `GET /api/obras/[id]/medicoes`, a lista que alimenta a aba
 * "Atualizações".
 *
 * O dado já era gravado pela J06; o que não existia era uma rota que o
 * console pudesse ler. Sem ela, o empreiteiro registrava percentual,
 * descrição e fotos e só o cliente final via o resultado, pelo link público.
 *
 * Cobre também o fail-closed: sem `allowDiscovery`, empreiteiro sem vínculo
 * recebe 404 — não confirmamos que a obra existe para quem não a alcança.
 */

const ANTI_BOT = { website: '', mountedAt: Date.now() - 5_000 };
let cnpjSequence = 900;

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

async function registrar(request: APIRequestContext, label: string, nome: string) {
  const email = uniqueEmail(label);
  const response = await request.post('/api/auth/register', {
    data: {
      name: nome,
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

async function criarAssinanteComObra(request: APIRequestContext, label: string, nome: string) {
  const email = await registrar(request, label, nome);
  await loginAs(request, email);
  await completarPerfilOperacional(request, 'empreiteiro');
  await logout(request);
  await concederXGestao(request, email);
  await loginAs(request, email);

  const criada = await request.post('/api/xgestao/obras', {
    data: { nome: `Obra E2E atualizacoes ${label}`, endereco: 'Rua das Medições, 250' },
  });
  expect(criada.status(), await criada.text()).toBe(201);
  const obra = (await criada.json()) as { id: string };
  return { email, obraId: obra.id };
}

type AtualizacaoApi = {
  id: string;
  etapa: string;
  descricao: string;
  percentual: number;
  valor: number;
  fotos: string[];
  status: string;
  dataEnvio: string;
  autorNome: string;
  autorId: string | null;
  empreiteiroNome: string;
};

async function registrarAtualizacao(
  request: APIRequestContext,
  obraId: string,
  data: { etapa: string; descricao?: string; percentual: number; valor?: number },
) {
  const response = await request.post('/api/empreiteiro/medicoes', {
    data: { obraId, requestId: crypto.randomUUID(), ...data },
  });
  expect(response.status(), await response.text()).toBeLessThan(300);
  return response;
}

test.describe('XG12 — atualizações da obra', () => {
  test('o dono lê as atualizações que registrou, com descrição, autor e percentual', async ({
    request,
  }) => {
    const NOME_DONO = 'Guilherme E2E atualizacoes';
    const { obraId } = await criarAssinanteComObra(request, 'xg12-atu-feliz', NOME_DONO);

    await registrarAtualizacao(request, obraId, {
      etapa: 'Fundação',
      descricao: 'Sapatas concretadas e curadas.',
      percentual: 15,
      valor: 250,
    });

    const resposta = await request.get(`/api/obras/${obraId}/medicoes`);
    expect(resposta.status(), await resposta.text()).toBe(200);
    const { rows } = (await resposta.json()) as { rows: AtualizacaoApi[] };

    expect(rows, 'a atualização registrada aparece na lista').toHaveLength(1);
    const [atualizacao] = rows;

    // Os campos que a aba mostra e que a Timeline não guarda: descrição e fotos.
    expect(atualizacao.etapa).toBe('Fundação');
    expect(atualizacao.descricao, 'a descrição é o que a Timeline perde').toBe(
      'Sapatas concretadas e curadas.',
    );
    expect(atualizacao.percentual).toBe(15);
    expect(atualizacao.valor).toBe(250);

    // Obra própria não passa por aprovação: nasce aprovada.
    expect(atualizacao.status, 'own work é aprovada na origem').toBe('aprovada');

    // `autorNome` é a pessoa. No xgestão `empreiteiroNome` traria o nome da
    // empreiteira, idêntico em todas as linhas — inútil para saber quem foi.
    expect(atualizacao.autorNome, 'autor é a pessoa que registrou').toBe(NOME_DONO);
    expect(atualizacao.autorId).toBeTruthy();

    // Estado no banco, não só o status HTTP.
    const linhas = await db.select().from(medicoes).where(eq(medicoes.obraId, obraId));
    expect(linhas, 'persistiu de fato').toHaveLength(1);
    expect(linhas[0].etapa).toBe('Fundação');

    // O progresso da obra é derivado da medição — a fonte única da XG09 D6.
    const detalhe = await request.get(`/api/empreiteiro/minhas-obras/${obraId}`);
    expect((await detalhe.json()).progresso, 'progresso veio da atualização').toBe(15);

    await logout(request);
  });

  test('a lista vem da mais recente para a mais antiga', async ({ request }) => {
    const { obraId } = await criarAssinanteComObra(
      request,
      'xg12-atu-ordem',
      'Dedé E2E atualizacoes',
    );

    await registrarAtualizacao(request, obraId, { etapa: 'Fundação', percentual: 10 });
    // Segundos distintos: `createdAt` é a chave da ordenação.
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await registrarAtualizacao(request, obraId, { etapa: 'Alvenaria', percentual: 20 });

    const resposta = await request.get(`/api/obras/${obraId}/medicoes`);
    expect(resposta.status()).toBe(200);
    const { rows } = (await resposta.json()) as { rows: AtualizacaoApi[] };

    expect(rows).toHaveLength(2);
    expect(rows[0].etapa, 'a mais recente encabeça o feed').toBe('Alvenaria');
    expect(rows[1].etapa).toBe('Fundação');

    await logout(request);
  });

  test('sem sessão devolve 401 e obra inexistente devolve 404', async ({ request }) => {
    const semSessao = await request.get(
      '/api/obras/00000000-0000-0000-0000-000000000001/medicoes',
    );
    expect(semSessao.status(), 'conteúdo da obra exige sessão').toBe(401);

    const { obraId } = await criarAssinanteComObra(
      request,
      'xg12-atu-404',
      'Terceiro E2E atualizacoes',
    );
    expect(obraId).toBeTruthy();

    const inexistente = await request.get(
      '/api/obras/00000000-0000-0000-0000-000000000001/medicoes',
    );
    expect(inexistente.status(), 'obra que não existe').toBe(404);

    await logout(request);
  });

  /**
   * XG12 — o anexo de nota fiscal ativou `comprovanteFileId`, que a API aceitava
   * desde a XG10 sem nenhuma UI preenchendo. Sem checagem de posse, dava para
   * referenciar arquivo alheio no próprio lançamento: não vazaria o conteúdo
   * (a rota de assinatura checa o dono), mas criaria FK entre tenants.
   */
  test('lançamento recusa comprovante que não é do autor', async ({ request }) => {
    const dono = await criarAssinanteComObra(request, 'xg12-comp-dono', 'Dono E2E comprovante');
    await logout(request);

    // Arquivo de outra pessoa, do tipo certo.
    const alheio = await registrar(request, 'xg12-comp-alheio', 'Alheio E2E comprovante');
    const arquivo = await request.post('/api/test/file-setup', {
      data: { email: alheio, kind: 'comprovante_pagamento', originalName: 'nota-alheia.pdf' },
    });
    // O helper só existe com E2E_TEST_AUTH=1; sem ele não há o que testar aqui.
    test.skip(arquivo.status() === 404, 'helper de arquivo indisponível neste ambiente');
    expect(arquivo.status(), await arquivo.text()).toBe(200);
    const { fileId } = (await arquivo.json()) as { fileId: string };

    await loginAs(request, dono.email);
    const recusado = await request.post(`/api/obras/${dono.obraId}/financeiro`, {
      data: {
        tipo: 'saida',
        categoria: 'material',
        descricao: 'Tentando anexar nota de terceiro',
        valor: 100,
        data: new Date().toISOString().slice(0, 10),
        comprovanteFileId: fileId,
      },
    });
    expect(recusado.status(), 'comprovante de outro dono é recusado').toBe(400);

    // E o lançamento sem comprovante continua passando — a validação não pode
    // ter quebrado o caminho normal.
    const aceito = await request.post(`/api/obras/${dono.obraId}/financeiro`, {
      data: {
        tipo: 'saida',
        categoria: 'material',
        descricao: 'Compra sem nota anexada',
        valor: 100,
        data: new Date().toISOString().slice(0, 10),
      },
    });
    expect(aceito.status(), await aceito.text()).toBe(201);

    await logout(request);
  });

  test('empreiteiro sem vínculo recebe 404, não a lista alheia', async ({ request }) => {
    const { obraId } = await criarAssinanteComObra(
      request,
      'xg12-atu-dono',
      'Dono E2E atualizacoes',
    );
    await registrarAtualizacao(request, obraId, {
      etapa: 'Cobertura',
      descricao: 'Conteúdo que o intruso não pode ver.',
      percentual: 30,
    });
    await logout(request);

    // Outro assinante xgestão, sem relação alguma com a obra acima.
    const intruso = await registrar(request, 'xg12-atu-intruso', 'Intruso E2E atualizacoes');
    await loginAs(request, intruso);
    await completarPerfilOperacional(request, 'empreiteiro');
    await logout(request);
    await concederXGestao(request, intruso);
    await loginAs(request, intruso);

    const resposta = await request.get(`/api/obras/${obraId}/medicoes`);
    expect(
      resposta.status(),
      'fail-closed: 404 em vez de 403 não confirma que a obra existe',
    ).toBe(404);

    await logout(request);
  });
});
