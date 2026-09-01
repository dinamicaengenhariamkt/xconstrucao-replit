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
  return payload.rows[0].id;
}

test.describe('xgestão — obras próprias', () => {
  test('permite completar pela UI todas as pendências e então criar a primeira obra', async ({ page, request }) => {
    const email = await registrar(request, 'empreiteiro', 'xgestao-ui-perfil-operacional');
    await concederXGestao(request, email);

    const login = await page.request.post('/api/test/login-as', { data: { email } });
    expect(login.status(), await login.text()).toBe(200);
    await page.goto('/xgestao/configuracoes?tab=empresa');

    await page.getByTestId('xgestao-empresa-cep').fill('01310100');
    await page.getByTestId('xgestao-empresa-endereco').fill('Avenida Paulista, 1000');
    await page.getByTestId('xgestao-empresa-cidade').fill('São Paulo');
    await page.getByTestId('xgestao-empresa-estado').fill('SP');
    await page.getByTestId('xgestao-empresa-raio-km').fill('50');
    await page.getByTestId('xgestao-especialidade-Pintura').click();

    const saved = page.waitForResponse((response) =>
      response.url().includes('/api/perfil/empreiteiro') &&
      response.request().method() === 'PATCH',
    );
    await page.getByRole('button', { name: 'Salvar empresa' }).click();
    expect((await saved).status()).toBe(200);

    const status = await page.request.get('/api/xgestao/perfil-status');
    expect(status.status(), await status.text()).toBe(200);
    expect(await status.json()).toMatchObject({ ok: true, faltando: [] });

    await page.goto('/xgestao/obras');
    await page.getByTestId('xgestao-nova-obra').click();
    await expect(page.getByRole('dialog', { name: 'Nova obra' })).toBeVisible();
    await page.getByTestId('xgestao-obra-nome').fill('Primeira obra pela interface');
    await page.getByTestId('xgestao-obra-endereco').fill('Avenida Paulista, 1000');
    const criada = page.waitForResponse((response) =>
      response.url().endsWith('/api/xgestao/obras') &&
      response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Criar obra' }).click();
    expect((await criada).status()).toBe(201);
  });

  test('informa pendências operacionais reais e valida CEP/endereço da empresa', async ({ request }) => {
    const email = await registrar(request, 'empreiteiro', 'xgestao-perfil-operacional');
    await concederXGestao(request, email);
    await loginAs(request, email);

    const statusIncompleto = await request.get('/api/xgestao/perfil-status');
    expect(statusIncompleto.status(), await statusIncompleto.text()).toBe(200);
    expect(await statusIncompleto.json()).toMatchObject({
      ok: false,
      faltando: expect.arrayContaining([
        expect.objectContaining({ campo: 'endereco' }),
        expect.objectContaining({ campo: 'cep' }),
      ]),
    });

    const bloqueada = await request.post('/api/xgestao/obras', {
      data: { nome: 'Obra preservada no formulário', endereco: 'Rua Digitada, 10' },
    });
    expect(bloqueada.status(), await bloqueada.text()).toBe(422);
    expect(await bloqueada.json()).toMatchObject({
      code: 'PERFIL_INCOMPLETO',
      faltando: expect.any(Array),
    });

    const cepInvalido = await request.patch('/api/perfil/empreiteiro', {
      data: { cep: '123', endereco: 'Rua válida, 10' },
    });
    expect(cepInvalido.status(), await cepInvalido.text()).toBe(400);

    const enderecoInvalido = await request.patch('/api/perfil/empreiteiro', {
      data: { cep: '01310100', endereco: 'x' },
    });
    expect(enderecoInvalido.status(), await enderecoInvalido.text()).toBe(400);

    await completarPerfilOperacional(request, 'empreiteiro');
    const statusCompleto = await request.get('/api/xgestao/perfil-status');
    expect(statusCompleto.status(), await statusCompleto.text()).toBe(200);
    expect(await statusCompleto.json()).toMatchObject({ ok: true, faltando: [] });
    await logout(request);
  });

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

    const empreiteiroId = await concederXGestao(request, empreiteiroEmail);
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
    const rotaDaObraPropria = await request.get(`/xgestao/obras/${obra.id}`, { maxRedirects: 0 });
    expect(rotaDaObraPropria.status()).toBe(200);
    const rotaDeEdicao = await request.get(`/xgestao/obras/${obra.id}/editar`, { maxRedirects: 0 });
    expect(rotaDeEdicao.status()).toBe(200);

    const editada = await request.patch(`/api/obras/${obra.id}`, {
      data: {
        nome: 'Reforma da sede xgestão — atualizada',
        tipo: 'Reforma comercial',
        descricao: 'Modernização progressiva da sede própria.',
        endereco: 'Rua das Obras',
        numero: '321',
        complemento: 'Galpão B',
        cep: '01310-100',
        cidade: 'São Paulo',
        uf: 'SP',
        areaM2: '420.5',
        valorTotal: '350000',
        dataInicio: '2026-09-01',
        dataPrevisao: '2027-03-31',
        status: 'em_andamento',
        progresso: 18,
      },
    });
    expect(editada.status(), await editada.text()).toBe(200);
    expect(await editada.json()).toMatchObject({
      nome: 'Reforma da sede xgestão — atualizada',
      cidade: 'São Paulo',
      uf: 'SP',
      status: 'em_andamento',
      progresso: 18,
    });

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

    const diario = await request.post(`/api/obras/${obra.id}/diario`, {
      data: { texto: 'Concretagem do pavimento concluída sem intercorrências.' },
    });
    expect(diario.status(), await diario.text()).toBe(201);

    const checklist = await request.post(`/api/obras/${obra.id}/checklists`, {
      data: {
        nome: 'Inspeção diária',
        tipo: 'seguranca',
        itens: [{ titulo: 'EPIs verificados' }, { titulo: 'Área sinalizada' }],
      },
    });
    expect(checklist.status(), await checklist.text()).toBe(201);

    // Exercita o caminho real browser/API -> presign -> R2 -> HEAD/commit ->
    // vínculo da galeria. O arquivo mínimo evita custo e tempo desnecessários.
    const imagem = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );
    const presign = await request.post('/api/uploads/presign', {
      data: {
        kind: 'obra_foto',
        mime: 'image/png',
        size: imagem.byteLength,
        filename: 'beta-xgestao.png',
      },
    });
    expect(presign.status(), await presign.text()).toBe(200);
    const presignPayload = await presign.json() as { uploadUrl: string; key: string };
    const envioR2 = await request.put(presignPayload.uploadUrl, {
      headers: { 'Content-Type': 'image/png' },
      data: imagem,
    });
    expect(envioR2.ok(), await envioR2.text()).toBe(true);
    const commit = await request.post('/api/uploads/commit', {
      data: {
        kind: 'obra_foto',
        key: presignPayload.key,
        mime: 'image/png',
        size: imagem.byteLength,
        originalName: 'beta-xgestao.png',
      },
    });
    expect(commit.status(), await commit.text()).toBe(200);
    const arquivo = await commit.json() as { id: string };
    const foto = await request.post(`/api/obras/${obra.id}/fotos`, {
      data: {
        fileId: arquivo.id,
        fase: 'durante',
        tag: 'Estrutura',
        enviadaAoContratante: true,
      },
    });
    expect(foto.status(), await foto.text()).toBe(201);
    const galeria = await request.get(`/api/obras/${obra.id}/fotos`);
    expect(galeria.status()).toBe(200);
    const galeriaPayload = await galeria.json() as { rows: Array<{ id: string; tag: string | null }> };
    expect(galeriaPayload.rows.some((item) => item.tag === 'Estrutura')).toBe(true);
    expect(galeriaPayload.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fileId: arquivo.id, url: expect.any(String) }),
      ]),
    );
    const definirCapa = await request.patch(`/api/obras/${obra.id}`, {
      data: { fotoCapaFileId: arquivo.id },
    });
    expect(definirCapa.status(), await definirCapa.text()).toBe(200);
    expect(await definirCapa.json()).toMatchObject({ fotoCapaFileId: arquivo.id });
    const detalheComCapa = await request.get(`/api/empreiteiro/minhas-obras/${obra.id}`);
    expect(detalheComCapa.status(), await detalheComCapa.text()).toBe(200);
    expect(await detalheComCapa.json()).toMatchObject({ imagemUrl: expect.any(String) });

    const presignCapa = await request.post('/api/uploads/presign', {
      data: {
        kind: 'obra_capa',
        mime: 'image/png',
        size: imagem.byteLength,
        filename: 'capa-xgestao.png',
      },
    });
    expect(presignCapa.status(), await presignCapa.text()).toBe(200);
    const presignCapaPayload = await presignCapa.json() as { uploadUrl: string; key: string };
    const envioCapa = await request.put(presignCapaPayload.uploadUrl, {
      headers: { 'Content-Type': 'image/png' },
      data: imagem,
    });
    expect(envioCapa.ok(), await envioCapa.text()).toBe(true);
    const commitCapa = await request.post('/api/uploads/commit', {
      data: {
        kind: 'obra_capa',
        key: presignCapaPayload.key,
        mime: 'image/png',
        size: imagem.byteLength,
        originalName: 'capa-xgestao.png',
      },
    });
    expect(commitCapa.status(), await commitCapa.text()).toBe(200);
    const capaArquivo = await commitCapa.json() as { id: string };
    const definirCapaNova = await request.patch(`/api/obras/${obra.id}`, {
      data: { fotoCapaFileId: capaArquivo.id },
    });
    expect(definirCapaNova.status(), await definirCapaNova.text()).toBe(200);

    const arquivoPrivado = await request.post('/api/test/file-setup', {
      data: {
        email: empreiteiroEmail,
        kind: 'empreiteiro_documento',
        mime: 'image/png',
        originalName: 'documento-privado.png',
      },
    });
    expect(arquivoPrivado.status(), await arquivoPrivado.text()).toBe(200);
    const arquivoPrivadoPayload = await arquivoPrivado.json() as { fileId: string };
    const capaPrivadaBloqueada = await request.patch(`/api/obras/${obra.id}`, {
      data: { fotoCapaFileId: arquivoPrivadoPayload.fileId },
    });
    expect(capaPrivadaBloqueada.status(), await capaPrivadaBloqueada.text()).toBe(422);
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
    const marketplaceOcultaNoProduto = await request.get(`/xgestao/obras/${marketplace.id}`, {
      maxRedirects: 0,
    });
    expect(marketplaceOcultaNoProduto.status()).toBe(404);

    const marketplaceBloqueada = await request.patch(`/api/obras/${marketplace.id}`, {
      data: { nome: 'Tentativa de editar marketplace' },
    });
    expect(marketplaceBloqueada.status()).toBe(403);
    await logout(request);

    // Revogar o produto encerra também os caminhos genéricos de leitura e
    // mutação da obra própria, sem retirar a obra marketplace já atribuída.
    await loginAs(request, SEED_ADMIN_EMAIL);
    const revogada = await request.patch(`/api/admin/usuarios/${empreiteiroId}`, {
      data: { xgestao: false },
    });
    expect(revogada.status(), await revogada.text()).toBe(200);
    await logout(request);

    await loginAs(request, empreiteiroEmail);
    expect((await request.get(`/api/obras/${obra.id}`)).status()).toBe(404);
    expect((await request.patch(`/api/obras/${obra.id}`, {
      data: { nome: 'Edição após revogação' },
    })).status()).toBe(404);
    expect((await request.get(`/api/empreiteiro/minhas-obras/${obra.id}`)).status()).toBe(404);
    const listagemRevogada = await request.get('/api/empreiteiro/minhas-obras');
    expect(listagemRevogada.status()).toBe(200);
    const obrasVisiveis = (await listagemRevogada.json()) as Array<{ id: string }>;
    expect(obrasVisiveis.some((item) => item.id === obra.id)).toBe(false);
    expect(obrasVisiveis.some((item) => item.id === marketplace.id)).toBe(true);
    await logout(request);

    await loginAs(request, SEED_ADMIN_EMAIL);
    expect((await request.patch(`/api/admin/usuarios/${empreiteiroId}`, {
      data: { xgestao: true },
    })).status()).toBe(200);
    await logout(request);
  });
});