import { expect, test, type APIRequestContext } from '@playwright/test';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturas, clientes, empreiteiras, medicoes, obraDiario, obraEquipe, obraFotos, obras, userFiles, users } from '@shared/db/schema';
import {
  completarPerfilOperacional,
  fetchCapturedEmails,
  iniciarTesteOperacionalXgestao,
  loginAs,
  logout,
  SEED_ADMIN_EMAIL,
  SEED_CONTRATANTE_EMAIL,
  SEED_EMPREITEIRO_EMAIL,
  uniqueEmail,
  uniqueUsername,
} from '../helpers';

/**
 * Uploads e arquivos das obras do xgestão (EMP-01, 02, 03, 04, 05, 07, 12).
 *
 * Usa o caminho real presign -> PUT no R2 -> commit, sem rota de teste que
 * pule o presign: o defeito do comprovante (EMP-01) só aparecia ali.
 */

const ANTI_BOT = { website: '', mountedAt: Date.now() - 5_000 };
const SENHA = 'Xconstr@E2E2026!';
let cnpjSequence = 4100 + Math.floor(Math.random() * 400);
// XG50: o teste grátis e o mês bônus valem uma vez por CPF/CNPJ; prefixo por execução evita repetir documento entre rodadas.
const CNPJ_PREFIXO_EXECUCAO = Date.now().toString().slice(-8);

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

function proximoCnpjValido() {
  const base = `${CNPJ_PREFIXO_EXECUCAO}${String(cnpjSequence++).padStart(4, '0')}`;
  const digito = (digits: string, pesos: number[]) => {
    const soma = [...digits].reduce((total, digit, index) => total + Number(digit) * pesos[index], 0);
    const resto = soma % 11;
    return String(resto < 2 ? 0 : 11 - resto);
  };
  const primeiro = digito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const segundo = digito(`${base}${primeiro}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${base}${primeiro}${segundo}`;
}

async function criarAssinante(request: APIRequestContext, label: string) {
  const email = uniqueEmail(label);
  const registro = await request.post('/api/auth/register', {
    data: {
      name: 'empreiteiro E2E uploads',
      email,
      username: uniqueUsername(label.replace(/[^a-zA-Z0-9_.]/g, '')),
      password: SENHA,
      role: 'empreiteiro',
      phone: '11988880000',
      cpfCnpj: proximoCnpjValido(),
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  expect(registro.status(), await registro.text()).toBeLessThan(300);
  await loginAs(request, email);
  await completarPerfilOperacional(request, 'empreiteiro');
  await logout(request);

  await loginAs(request, SEED_ADMIN_EMAIL);
  const usuarios = await request.get(`/api/admin/usuarios?q=${encodeURIComponent(email)}`);
  const payload = (await usuarios.json()) as { rows: Array<{ id: string }> };
  expect(payload.rows).toHaveLength(1);
  const concede = await request.patch(`/api/admin/usuarios/${payload.rows[0].id}`, { data: { xgestao: true } });
  expect(concede.status(), await concede.text()).toBe(200);
  await iniciarTesteOperacionalXgestao(request, email);
  await logout(request);
  await loginAs(request, email);
  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  return { email, userId: u!.id };
}

async function criarObra(request: APIRequestContext, nome: string): Promise<string> {
  const criada = await request.post('/api/xgestao/obras', { data: { nome, endereco: 'Rua dos Arquivos, 12' } });
  expect(criada.status(), await criada.text()).toBe(201);
  return ((await criada.json()) as { id: string }).id;
}

interface Enviado {
  id: string;
  key: string;
  visibility: string;
  publicUrl: string | null;
  signedUrl: string | null;
}

async function enviar(
  request: APIRequestContext,
  args: { kind: string; mime: string; filename: string; data: Buffer; obraId?: string },
): Promise<Enviado> {
  const presign = await request.post('/api/uploads/presign', {
    data: { kind: args.kind, mime: args.mime, size: args.data.byteLength, filename: args.filename, obraId: args.obraId },
  });
  expect(presign.status(), await presign.text()).toBe(200);
  const { uploadUrl, key } = (await presign.json()) as { uploadUrl: string; key: string };
  const put = await request.put(uploadUrl, { headers: { 'Content-Type': args.mime }, data: args.data });
  expect(put.ok(), await put.text()).toBe(true);
  const commit = await request.post('/api/uploads/commit', {
    data: {
      kind: args.kind,
      key,
      mime: args.mime,
      size: args.data.byteLength,
      originalName: args.filename,
      obraId: args.obraId,
    },
  });
  expect(commit.status(), await commit.text()).toBe(200);
  const body = (await commit.json()) as Omit<Enviado, 'key'>;
  return { ...body, key };
}

async function excluido(fileId: string): Promise<boolean> {
  const [f] = await db.select({ deletedAt: userFiles.deletedAt }).from(userFiles).where(eq(userFiles.id, fileId));
  return Boolean(f?.deletedAt);
}

const ASSINADA = /X-Amz-Signature=/;

async function convidarMembro(
  request: APIRequestContext,
  args: {
    email: string;
    papel: 'colaborador' | 'gestor';
    obras: Array<{ obraId: string; permissao: string }>;
    areasPermitidas?: string[];
  },
) {
  const convite = await request.post('/api/xgestao/membros', {
    data: {
      nome: `Membro E2E uploads ${args.papel}`,
      email: args.email,
      papel: args.papel,
      obras: args.obras,
      ...(args.areasPermitidas ? { areasPermitidas: args.areasPermitidas } : {}),
    },
  });
  expect(convite.status(), await convite.text()).toBe(201);
  const capturados = await fetchCapturedEmails(request, args.email);
  const setupUrl = capturados.find((item) => item.meta?.kind === 'password-setup')?.meta?.setupUrl;
  expect(typeof setupUrl).toBe('string');
  const token = new URL(setupUrl as string).searchParams.get('token');
  const setup = await request.post('/api/auth/definir-senha-inicial', {
    data: { token, password: SENHA, confirmPassword: SENHA },
  });
  expect(setup.status(), await setup.text()).toBe(200);
}

test.describe('xgestão — uploads e arquivos da obra', () => {
  test('arquivos privados com URL assinada, comprovante do empreiteiro, limpeza na troca e na exclusão', async ({ request }) => {
    test.setTimeout(240_000);
    await criarAssinante(request, 'xg-uploads-priv');
    const obraId = await criarObra(request, 'Obra E2E uploads privados');

    // EMP-01 — comprovante do lançamento, como empreiteiro, pelo presign real.
    const comprovante = await enviar(request, {
      kind: 'comprovante_pagamento', mime: 'application/pdf', filename: 'nota.pdf', data: PDF, obraId,
    });
    expect(comprovante.key).toMatch(/(^|\/)private\/empreiteiro\/[^/]+\/comprovantes\//);
    expect(comprovante.visibility).toBe('private');
    const lancamento = await request.post(`/api/obras/${obraId}/financeiro`, {
      data: { tipo: 'entrada', descricao: 'Entrada E2E com comprovante', valor: 150, data: '2026-11-10', comprovanteFileId: comprovante.id },
    });
    expect(lancamento.status(), await lancamento.text()).toBe(201);
    expect((await lancamento.json()).comprovanteUrlAssinada).toMatch(ASSINADA);
    const financeiroLista = await request.get(`/api/obras/${obraId}/financeiro`);
    const linhas = (await financeiroLista.json()).rows as Array<{ comprovanteFileId: string | null; comprovanteUrlAssinada?: string }>;
    const comComprovante = linhas.find((l) => l.comprovanteFileId === comprovante.id);
    expect(comComprovante?.comprovanteUrlAssinada).toMatch(ASSINADA);
    const sign = await request.get(`/api/uploads/sign?id=${comprovante.id}`);
    expect(sign.status(), await sign.text()).toBe(200);

    // EMP-02 — documento da obra: chave privada, sem URL pública, lista assinada.
    const anexo = await enviar(request, { kind: 'obra_anexo', mime: 'application/pdf', filename: 'contrato.pdf', data: PDF, obraId });
    expect(anexo.key).toMatch(/(^|\/)private\/obras\//);
    expect(anexo.visibility).toBe('private');
    expect(anexo.publicUrl).toBeNull();
    expect(anexo.signedUrl).toMatch(ASSINADA);
    const vinculo = await request.post(`/api/obras/${obraId}/anexos`, { data: { fileId: anexo.id, tipo: 'outros' } });
    expect(vinculo.status(), await vinculo.text()).toBe(201);
    const anexos = (await (await request.get(`/api/obras/${obraId}/anexos`)).json()) as Array<{ url: string | null }>;
    expect(anexos[0].url).toMatch(ASSINADA);
    const [anexoDb] = await db.select().from(userFiles).where(eq(userFiles.id, anexo.id));
    expect(anexoDb.visibility).toBe('private');
    expect(anexoDb.publicUrl).toBeNull();

    // Foto sem obraId (tela que ainda não manda a obra): usuário do xgestão
    // recebe chave privada mesmo assim.
    const foto = await enviar(request, { kind: 'obra_foto', mime: 'image/png', filename: 'foto.png', data: PNG });
    expect(foto.key).toMatch(/(^|\/)private\/obra-fotos\//);
    const vinculoFoto = await request.post(`/api/obras/${obraId}/fotos`, { data: { fileId: foto.id, fase: 'durante' } });
    expect(vinculoFoto.status(), await vinculoFoto.text()).toBe(201);
    const galeria = (await (await request.get(`/api/obras/${obraId}/fotos`)).json()).rows as Array<{ fileId: string; url: string }>;
    expect(galeria.find((g) => g.fileId === foto.id)?.url).toMatch(ASSINADA);

    // EMP-04 — o mesmo arquivo não entra em outra obra.
    const obraB = await criarObra(request, 'Obra E2E uploads B');
    const reuso = await request.post(`/api/obras/${obraB}/fotos`, { data: { fileId: foto.id } });
    expect(reuso.status(), await reuso.text()).toBe(409);
    const reusoAnexo = await request.post(`/api/obras/${obraB}/anexos`, { data: { fileId: anexo.id, tipo: 'outros' } });
    expect(reusoAnexo.status(), await reusoAnexo.text()).toBe(409);

    // Capa privada; trocar a capa apaga a capa antiga (EMP-12).
    const capa = await enviar(request, { kind: 'obra_capa', mime: 'image/png', filename: 'capa.png', data: PNG, obraId });
    expect(capa.key).toMatch(/(^|\/)private\/obras\/[^/]+\/capa\//);
    const defineCapa = await request.patch(`/api/obras/${obraId}`, { data: { fotoCapaFileId: capa.id } });
    expect(defineCapa.status(), await defineCapa.text()).toBe(200);
    const obraLida = await (await request.get(`/api/obras/${obraId}`)).json();
    expect(obraLida.fotoCapaUrl).toMatch(ASSINADA);
    const trocaCapa = await request.patch(`/api/obras/${obraId}`, { data: { fotoCapaFileId: foto.id } });
    expect(trocaCapa.status(), await trocaCapa.text()).toBe(200);
    expect(await excluido(capa.id), 'capa antiga apagada').toBe(true);
    expect(await excluido(foto.id), 'foto da galeria usada como capa continua').toBe(false);

    // Diário: foto assinada na leitura; excluir o registro apaga a foto.
    const fotoDiario = await enviar(request, { kind: 'obra_foto', mime: 'image/png', filename: 'diario.png', data: PNG, obraId });
    const diario = await request.post(`/api/obras/${obraId}/diario`, {
      data: { texto: 'Registro E2E com foto privada', fotoFileIds: [fotoDiario.id] },
    });
    expect(diario.status(), await diario.text()).toBe(201);
    const entrada = (await diario.json()) as { id: string };
    const diarioLista = (await (await request.get(`/api/obras/${obraId}/diario`)).json()).rows as Array<{ id: string; fotos: string[] }>;
    expect(diarioLista.find((d) => d.id === entrada.id)?.fotos[0]).toMatch(ASSINADA);
    const apagaDiario = await request.delete(`/api/obras/${obraId}/diario/${entrada.id}`);
    expect(apagaDiario.status(), await apagaDiario.text()).toBe(200);
    expect(await excluido(fotoDiario.id), 'foto do diário apagada com o registro').toBe(true);

    // Contrato de prestador: trocar o arquivo apaga o antigo (EMP-12).
    const contrato1 = await enviar(request, { kind: 'obra_anexo', mime: 'application/pdf', filename: 'c1.pdf', data: PDF, obraId });
    const membro = await request.post(`/api/obras/${obraId}/equipe`, {
      data: { nome: 'Prestador E2E', contratoFileId: contrato1.id },
    });
    expect(membro.status(), await membro.text()).toBe(201);
    const membroId = ((await membro.json()) as { id: string }).id;
    const contrato2 = await enviar(request, { kind: 'obra_anexo', mime: 'application/pdf', filename: 'c2.pdf', data: PDF, obraId });
    const troca = await request.patch(`/api/obras/${obraId}/equipe/${membroId}`, { data: { contratoFileId: contrato2.id } });
    expect(troca.status(), await troca.text()).toBe(200);
    expect(await excluido(contrato1.id), 'contrato antigo apagado').toBe(true);
    expect(await excluido(contrato2.id)).toBe(false);

    // EMP-03 — excluir a obra apaga todos os arquivos dela.
    const apagaObra = await request.delete(`/api/obras/${obraId}`);
    expect(apagaObra.status(), await apagaObra.text()).toBe(200);
    for (const id of [comprovante.id, anexo.id, foto.id, contrato2.id]) {
      expect(await excluido(id), `arquivo ${id} marcado como excluído`).toBe(true);
    }
    await request.delete(`/api/obras/${obraB}`);
    await logout(request);
  });

  test('quota da obra conta foto de diário (EMP-04)', async ({ request }) => {
    test.setTimeout(180_000);
    const { userId } = await criarAssinante(request, 'xg-uploads-quota');
    const obraId = await criarObra(request, 'Obra E2E quota diário');
    const [grande] = await db.insert(userFiles).values({
      ownerUserId: userId,
      kind: 'obra_foto',
      visibility: 'private',
      bucketKey: `e2e/xg-quota/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`,
      originalName: 'E2E diario grande.png',
      mime: 'image/png',
      sizeBytes: 190_000_000,
    }).returning({ id: userFiles.id });
    await db.insert(obraDiario).values({ obraId, autorId: userId, texto: 'E2E diário com foto grande', fotoFileIds: [grande.id] });

    const presign = await request.post('/api/uploads/presign', {
      data: { kind: 'obra_anexo', mime: 'application/pdf', size: 15_000_000, filename: 'grande.pdf', obraId },
    });
    expect(presign.status(), await presign.text()).toBe(413);
    expect((await presign.json()).error).toBe('QUOTA_EXCEDIDA');

    await request.delete(`/api/obras/${obraId}`);
    expect(await excluido(grande.id)).toBe(true);
    await logout(request);
  });

  test('conta somente leitura não envia nem apaga arquivo; marketplace segue livre (EMP-05)', async ({ request }) => {
    test.setTimeout(180_000);
    const { userId } = await criarAssinante(request, 'xg-uploads-leitura');
    const obraId = await criarObra(request, 'Obra E2E somente leitura');
    const foto = await enviar(request, { kind: 'obra_foto', mime: 'image/png', filename: 'f.png', data: PNG, obraId });

    await db.update(assinaturas).set({ status: 'cancelada' })
      .where(and(eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao')));

    const presign = await request.post('/api/uploads/presign', {
      data: { kind: 'obra_foto', mime: 'image/png', size: PNG.byteLength, filename: 'x.png' },
    });
    expect(presign.status(), await presign.text()).toBe(403);
    expect((await presign.json()).code).toBe('XGESTAO_SOMENTE_LEITURA');
    const commit = await request.post('/api/uploads/commit', {
      data: { kind: 'obra_foto', key: 'x/y/z.png', mime: 'image/png', size: 10, originalName: 'z.png' },
    });
    expect(commit.status()).toBe(403);
    const apaga = await request.delete(`/api/uploads/${foto.id}`);
    expect(apaga.status(), await apaga.text()).toBe(403);
    expect(await excluido(foto.id)).toBe(false);

    // Perfil não é obra: a conta somente leitura troca o próprio avatar.
    const avatar = await enviar(request, { kind: 'avatar', mime: 'image/png', filename: 'avatar.png', data: PNG });
    expect(avatar.visibility).toBe('public');
    const apagaAvatar = await request.delete(`/api/uploads/${avatar.id}`);
    expect(apagaAvatar.status(), await apagaAvatar.text()).toBe(200);
    await logout(request);

    // Empreiteiro do marketplace não passa pelo bloqueio do xgestão.
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const marketplace = await request.post('/api/uploads/presign', {
      data: { kind: 'portfolio_imagem', mime: 'image/png', size: PNG.byteLength, filename: 'p.png' },
    });
    expect([200, 503]).toContain(marketplace.status());
    await logout(request);
  });

  test('dono da empresa exclui foto e diário de colaborador (EMP-07)', async ({ request }) => {
    test.setTimeout(240_000);
    const { email: donoEmail } = await criarAssinante(request, 'xg-uploads-dono');
    const obraId = await criarObra(request, 'Obra E2E moderação');
    const colaboradorEmail = uniqueEmail('xg-uploads-colab');
    const gestorEmail = uniqueEmail('xg-uploads-gestor');
    await convidarMembro(request, { email: colaboradorEmail, papel: 'colaborador', obras: [{ obraId, permissao: 'editar' }] });
    await loginAs(request, donoEmail);
    await convidarMembro(request, { email: gestorEmail, papel: 'gestor', obras: [] });
    await logout(request);

    await loginAs(request, colaboradorEmail);
    const foto = await enviar(request, { kind: 'obra_foto', mime: 'image/png', filename: 'colab.png', data: PNG, obraId });
    expect(foto.visibility).toBe('private');
    const vinculo = await request.post(`/api/obras/${obraId}/fotos`, { data: { fileId: foto.id } });
    expect(vinculo.status(), await vinculo.text()).toBe(201);
    const fotoId = ((await vinculo.json()) as { id: string }).id;
    const diario = await request.post(`/api/obras/${obraId}/diario`, { data: { texto: 'Registro do colaborador E2E' } });
    expect(diario.status(), await diario.text()).toBe(201);
    const entradaId = ((await diario.json()) as { id: string }).id;
    // Lançamento com comprovante enviado pelo colaborador.
    const comprovante = await enviar(request, {
      kind: 'comprovante_pagamento', mime: 'application/pdf', filename: 'nota-colab.pdf', data: PDF, obraId,
    });
    const lancamento = await request.post(`/api/obras/${obraId}/financeiro`, {
      data: { tipo: 'entrada', descricao: 'Entrada do colaborador E2E', valor: 80, data: '2026-11-10', comprovanteFileId: comprovante.id },
    });
    expect(lancamento.status(), await lancamento.text()).toBe(201);
    const lancamentoId = ((await lancamento.json()) as { id: string }).id;
    await logout(request);

    // Gestor edita o lançamento do colaborador sem trocar o comprovante: o modal
    // reenvia o mesmo id, e isso não pode virar "Comprovante inválido".
    await loginAs(request, gestorEmail);
    const edicao = await request.patch(`/api/obras/${obraId}/financeiro/${lancamentoId}`, {
      data: { descricao: 'Entrada revisada pelo gestor', comprovanteFileId: comprovante.id },
    });
    expect(edicao.status(), await edicao.text()).toBe(200);
    const assinaComprovante = await request.get(`/api/uploads/sign?id=${comprovante.id}`);
    expect(assinaComprovante.status(), await assinaComprovante.text()).toBe(200);
    // Trocar por arquivo alheio continua barrado (validação roda quando muda).
    const alheio = await request.patch(`/api/obras/${obraId}/financeiro/${lancamentoId}`, {
      data: { comprovanteFileId: foto.id },
    });
    expect(alheio.status(), await alheio.text()).toBe(400);
    await logout(request);

    await loginAs(request, donoEmail);
    // O dono abre o arquivo enviado pelo colaborador (assinatura não depende de quem enviou).
    const sign = await request.get(`/api/uploads/sign?id=${foto.id}`);
    expect(sign.status(), await sign.text()).toBe(200);
    const apagaFoto = await request.delete(`/api/obras/${obraId}/fotos/${fotoId}`);
    expect(apagaFoto.status(), await apagaFoto.text()).toBe(200);
    expect(await excluido(foto.id)).toBe(true);
    const apagaDiario = await request.delete(`/api/obras/${obraId}/diario/${entradaId}`);
    expect(apagaDiario.status(), await apagaDiario.text()).toBe(200);
    const restantes = await db.select({ id: obraDiario.id }).from(obraDiario).where(inArray(obraDiario.id, [entradaId]));
    expect(restantes).toHaveLength(0);

    await request.delete(`/api/obras/${obraId}`);
    await logout(request);
  });
  test('REV-05/06 empreiteiro com xgestão em obra do marketplace: foto de medição pública e aceita; somente leitura não bloqueia', async ({ request }) => {
    test.setTimeout(180_000);
    const { userId } = await criarAssinante(request, 'xg-uploads-mkt');
    const [contratante] = await db.select({ id: users.id }).from(users).where(eq(users.email, SEED_CONTRATANTE_EMAIL));
    const [cliente] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, contratante.id));
    const [empresa] = await db.select({ id: empreiteiras.id }).from(empreiteiras).where(eq(empreiteiras.userId, userId));
    const [obra] = await db.insert(obras).values({
      nome: 'Obra E2E marketplace medição', endereco: 'Rua E2E Marketplace, 1',
      clienteId: cliente.id, empreiteiraId: empresa.id, status: 'em_andamento',
    } as typeof obras.$inferInsert).returning({ id: obras.id });
    try {
      // Sem a obra no envio (o defeito do modal): nasce privada e a medição do marketplace recusa.
      const semObra = await enviar(request, { kind: 'obra_foto', mime: 'image/png', filename: 'sem-obra.png', data: PNG });
      expect(semObra.visibility).toBe('private');
      const recusada = await request.post('/api/empreiteiro/medicoes', {
        data: { obraId: obra.id, etapa: 'Fundação', percentual: 5, fotoFileIds: [semObra.id], requestId: crypto.randomUUID() },
      });
      expect(recusada.status(), await recusada.text()).toBe(400);

      // Com a obra (RegistrarMedicaoModal passa `obraId`): pública e aceita.
      const foto = await enviar(request, { kind: 'obra_foto', mime: 'image/png', filename: 'medicao-mkt.png', data: PNG, obraId: obra.id });
      expect(foto.visibility).toBe('public');
      const medicao = await request.post('/api/empreiteiro/medicoes', {
        data: { obraId: obra.id, etapa: 'Fundação', percentual: 5, fotoFileIds: [foto.id], requestId: crypto.randomUUID() },
      });
      expect(medicao.status(), await medicao.text()).toBeLessThan(300);

      // REV-06: com o xgestão somente leitura, a obra do marketplace segue livre.
      await db.update(assinaturas).set({ status: 'cancelada' })
        .where(and(eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao')));
      const presignMkt = await request.post('/api/uploads/presign', {
        data: { kind: 'obra_foto', mime: 'image/png', size: PNG.byteLength, filename: 'mkt.png', obraId: obra.id },
      });
      expect(presignMkt.status(), await presignMkt.text()).toBe(200);
      // Sem obra continua valendo o somente leitura da conta.
      const presignSemObra = await request.post('/api/uploads/presign', {
        data: { kind: 'obra_foto', mime: 'image/png', size: PNG.byteLength, filename: 'x.png' },
      });
      expect(presignSemObra.status()).toBe(403);
      // Exclusão decide pelas obras ligadas ao arquivo: só marketplace, não bloqueia.
      const vinculos = await db.select({ obraId: obraFotos.obraId }).from(obraFotos).where(eq(obraFotos.fileId, foto.id));
      expect(vinculos.map((v) => v.obraId)).toEqual([obra.id]);
      const apaga = await request.delete(`/api/uploads/${foto.id}`);
      const corpo = await apaga.json().catch(() => ({}));
      expect(corpo.code, JSON.stringify(corpo)).not.toBe('XGESTAO_SOMENTE_LEITURA');
      // Arquivo privado sem vínculo (conteúdo do xgestão) segue bloqueado.
      const apagaPrivado = await request.delete(`/api/uploads/${semObra.id}`);
      expect(apagaPrivado.status(), await apagaPrivado.text()).toBe(403);
    } finally {
      await db.delete(medicoes).where(eq(medicoes.obraId, obra.id));
      await db.delete(obraFotos).where(eq(obraFotos.obraId, obra.id));
      await db.delete(obras).where(eq(obras.id, obra.id));
      await logout(request);
    }
  });

  test('foto privada de medição grava referência e é lida assinada', async ({ request }) => {
    test.setTimeout(180_000);
    await criarAssinante(request, 'xg-uploads-medicao');
    const obraId = await criarObra(request, 'Obra E2E medição com foto');
    const foto = await enviar(request, { kind: 'obra_foto', mime: 'image/png', filename: 'medicao.png', data: PNG, obraId });
    expect(foto.visibility).toBe('private');
    const medicao = await request.post('/api/empreiteiro/medicoes', {
      data: { obraId, etapa: 'Fundação', percentual: 10, fotoFileIds: [foto.id], requestId: crypto.randomUUID() },
    });
    expect(medicao.status(), await medicao.text()).toBeLessThan(300);
    const [linha] = await db.select({ fotos: medicoes.fotos }).from(medicoes).where(eq(medicoes.obraId, obraId));
    expect(linha.fotos).toEqual([`xg-file:${foto.id}`]);

    const daObra = (await (await request.get(`/api/obras/${obraId}/medicoes`)).json()).rows as Array<{ fotos: string[] }>;
    expect(daObra[0].fotos[0]).toMatch(ASSINADA);
    const doEmpreiteiro = (await (await request.get('/api/empreiteiro/medicoes')).json()) as Array<{ obraId: string; fotos: string[] }>;
    expect(doEmpreiteiro.find((m) => m.obraId === obraId)?.fotos[0]).toMatch(ASSINADA);

    await request.delete(`/api/obras/${obraId}`);
    await logout(request);
  });
  test('membro sem financeiro não grava PIX, valor nem contrato do prestador (EMP-06)', async ({ request }) => {
    test.setTimeout(180_000);
    const { email: donoEmail } = await criarAssinante(request, 'xg-uploads-semfin');
    const obraId = await criarObra(request, 'Obra E2E contrato restrito');
    const prestador = await request.post(`/api/obras/${obraId}/equipe`, {
      data: { nome: 'Prestador E2E PIX', pixChave: 'pix-original@e2e.test', valorContrato: 1000 },
    });
    expect(prestador.status(), await prestador.text()).toBe(201);
    const membroId = ((await prestador.json()) as { id: string }).id;
    const semFinanceiroEmail = uniqueEmail('xg-uploads-semfin-membro');
    await convidarMembro(request, {
      email: semFinanceiroEmail,
      papel: 'colaborador',
      obras: [{ obraId, permissao: 'editar' }],
      areasPermitidas: ['equipe', 'cronograma'],
    });
    await logout(request);

    await loginAs(request, semFinanceiroEmail);
    for (const corpo of [
      { pixChave: 'pix-trocado@e2e.test' },
      { valorContrato: 1 },
      { contratoLinkUrl: 'https://exemplo.com/contrato.pdf' },
      { contratoFileId: null },
    ]) {
      const negado = await request.patch(`/api/obras/${obraId}/equipe/${membroId}`, { data: corpo });
      expect(negado.status(), JSON.stringify(corpo)).toBe(403);
    }
    const nome = await request.patch(`/api/obras/${obraId}/equipe/${membroId}`, { data: { nome: 'Prestador renomeado' } });
    expect(nome.status(), await nome.text()).toBe(200);
    const corpoResposta = (await nome.json()) as Record<string, unknown>;
    expect(corpoResposta.nome).toBe('Prestador renomeado');
    for (const campo of ['pixChave', 'valorContrato', 'contratoFileId', 'contratoLinkUrl']) {
      expect(corpoResposta, `resposta sem ${campo}`).not.toHaveProperty(campo);
    }
    const [linha] = await db.select({ pix: obraEquipe.pixChave, valor: obraEquipe.valorContrato })
      .from(obraEquipe).where(eq(obraEquipe.id, membroId));
    expect(linha.pix).toBe('pix-original@e2e.test');
    expect(Number(linha.valor)).toBe(1000);
    await logout(request);

    await loginAs(request, donoEmail);
    const dono = await request.patch(`/api/obras/${obraId}/equipe/${membroId}`, { data: { pixChave: 'pix-dono@e2e.test' } });
    expect(dono.status(), await dono.text()).toBe(200);
    expect((await dono.json()).pixChave).toBe('pix-dono@e2e.test');
    await request.delete(`/api/obras/${obraId}`);
    await logout(request);
  });
});
