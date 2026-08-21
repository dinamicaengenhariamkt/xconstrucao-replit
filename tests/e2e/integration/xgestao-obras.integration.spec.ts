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

async function registrar(
  request: APIRequestContext,
  role: 'contratante' | 'empreiteiro',
  label: string,
) {
  const email = uniqueEmail(label);
  const response = await request.post('/api/auth/register', {
    data: {
      name: `${role} teste xgestão`,
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
  expect(response.status()).toBeGreaterThanOrEqual(200);
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

test.describe('xgestão — obras próprias', () => {
  test('cria, gerencia e edita obra própria sem liberar edição de obra marketplace', async ({
    request,
  }) => {
    const empreiteiroEmail = await registrar(request, 'empreiteiro', 'xgestao-obras-emp');

    // A role base não basta: nem mesmo o empreendedor com perfil completo usa
    // o endpoint sem o entitlement administrativo.
    await loginAs(request, empreiteiroEmail);
    await completarPerfilOperacional(request, 'empreiteiro');
    const semEntitlement = await request.post('/api/xgestao/obras', {
      data: { nome: 'Obra bloqueada', endereco: 'Rua Sem Acesso, 10' },
    });
    expect(semEntitlement.status()).toBe(403);
    await logout(request);

    await concederXGestao(request, empreiteiroEmail);
    await loginAs(request, empreiteiroEmail);

    const criada = await request.post('/api/xgestao/obras', {
      data: {
        nome: 'Reforma da sede xgestão',
        endereco: 'Rua das Obras, 123',
        // Campos de ownership/publicação são ignorados pelo servidor.
        clienteId: 'tentativa-de-forjar-cliente',
        visibilidade: 'publicada',
      },
    });
    expect(criada.status(), await criada.text()).toBe(201);
    const obra = (await criada.json()) as {
      id: string;
      clienteId: string | null;
      empreiteiraId: string | null;
      visibilidade: string;
    };
    expect(obra.clienteId).toBeNull();
    expect(obra.empreiteiraId).toBeTruthy();
    expect(obra.visibilidade).toBe('rascunho');

    const listagem = await request.get('/api/empreiteiro/minhas-obras');
    expect(listagem.status()).toBe(200);
    expect(await listagem.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: obra.id,
          temContratante: false,
          isObraPropria: true,
        }),
      ]),
    );

    const detalhe = await request.get(`/api/empreiteiro/minhas-obras/${obra.id}`);
    expect(detalhe.status()).toBe(200);
    expect(await detalhe.json()).toMatchObject({
      id: obra.id,
      temContratante: false,
      isObraPropria: true,
    });

    const editada = await request.patch(`/api/obras/${obra.id}`, {
      data: { nome: 'Reforma da sede xgestão — atualizada', endereco: 'Rua das Obras, 321' },
    });
    expect(editada.status(), await editada.text()).toBe(200);

    const etapa = await request.post(`/api/obras/${obra.id}/etapas`, {
      data: { nome: 'Preparação', descricao: 'Organizar o canteiro' },
    });
    expect(etapa.status(), await etapa.text()).toBe(201);
    const etapaBody = (await etapa.json()) as { id: string };

    const tarefa = await request.post(`/api/obras/${obra.id}/tarefas`, {
      data: { titulo: 'Comprar materiais', etapaId: etapaBody.id, status: 'pendente', prioridade: 'media' },
    });
    expect(tarefa.status(), await tarefa.text()).toBe(201);

    const ocorrencia = await request.post(`/api/obras/${obra.id}/ocorrencias`, {
      data: { titulo: 'Acesso ao canteiro', descricao: 'Confirmar chave de acesso com a equipe.', gravidade: 'baixo' },
    });
    expect(ocorrencia.status(), await ocorrencia.text()).toBe(201);
    const etapasDaObraPropria = await request.get(`/api/obras/${obra.id}/etapas`);
    expect(etapasDaObraPropria.status()).toBe(200);
    expect((await etapasDaObraPropria.json()) as { rows: Array<{ id: string }> }).toMatchObject({
      rows: expect.arrayContaining([expect.objectContaining({ id: etapaBody.id })]),
    });
    const ocorrenciasDaObraPropria = await request.get(`/api/obras/${obra.id}/ocorrencias`);
    expect(ocorrenciasDaObraPropria.status()).toBe(200);
    await logout(request);

    const contratanteEmail = await registrar(request, 'contratante', 'xgestao-obras-cli');
    await loginAs(request, contratanteEmail);
    await completarPerfilOperacional(request, 'contratante');

    // Contratante não recebe acesso ao endpoint do produto, mesmo autenticado.
    const contratanteBloqueado = await request.post('/api/xgestao/obras', {
      data: { nome: 'Tentativa contratante', endereco: 'Rua do Marketplace, 1' },
    });
    expect(contratanteBloqueado.status()).toBe(403);

    const marketplaceCriada = await request.post('/api/obras', {
      data: {
        nome: 'Obra marketplace protegida',
        endereco: 'Av. Marketplace',
        numero: '123',
        visibilidade: 'publicada',
        tipo: 'Reforma',
        descricao: 'Obra criada para provar o bloqueio de edição pelo empreiteiro.',
        cep: '01310-100',
        cidade: 'São Paulo',
        uf: 'SP',
        modalidade: 'empreitada_global',
        materiaisPor: 'contratante',
      },
    });
    expect(marketplaceCriada.status(), await marketplaceCriada.text()).toBe(201);
    const marketplace = (await marketplaceCriada.json()) as { id: string };
    await logout(request);

    await loginAs(request, empreiteiroEmail);
    const candidatura = await request.post('/api/empreiteiro/candidaturas', {
      data: {
        obraId: marketplace.id,
        valorProposta: 50000,
        prazoEstimado: 4,
        descricao: 'Proposta para a obra marketplace de regressão.',
      },
    });
    expect(candidatura.status(), await candidatura.text()).toBe(201);
    const candidaturaBody = (await candidatura.json()) as { id: string };
    await logout(request);

    await loginAs(request, contratanteEmail);
    const aceita = await request.post(`/api/contratante/candidaturas/${candidaturaBody.id}/aceitar`, {
      data: {},
    });
    expect(aceita.status(), await aceita.text()).toBe(200);
    const etapaMarketplace = await request.post(`/api/obras/${marketplace.id}/etapas`, {
      data: { nome: 'Fundação', descricao: 'Preparar a primeira etapa do cronograma.' },
    });
    expect(etapaMarketplace.status(), await etapaMarketplace.text()).toBe(201);
    const ocorrenciaMarketplace = await request.post(`/api/obras/${marketplace.id}/ocorrencias`, {
      data: { titulo: 'Visita técnica', descricao: 'Registrar a vistoria inicial com a equipe.', gravidade: 'baixo' },
    });
    expect(ocorrenciaMarketplace.status(), await ocorrenciaMarketplace.text()).toBe(201);
    const etapasMarketplace = await request.get(`/api/obras/${marketplace.id}/etapas`);
    expect(etapasMarketplace.status()).toBe(200);
    const ocorrenciasMarketplace = await request.get(`/api/obras/${marketplace.id}/ocorrencias`);
    expect(ocorrenciasMarketplace.status()).toBe(200);
    await logout(request);

    await loginAs(request, empreiteiroEmail);
    const marketplaceBloqueada = await request.patch(`/api/obras/${marketplace.id}`, {
      data: { nome: 'Tentativa de editar marketplace' },
    });
    expect(marketplaceBloqueada.status()).toBe(403);
    await logout(request);
  });
});