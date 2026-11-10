import { expect, test, type APIRequestContext } from '@playwright/test';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturas, atividades, auditLogs, financeiro, obraOcorrencias, obras, userFiles } from '@shared/db/schema';
import { SECOES_PADRAO } from '@features/xgestao/obra-publica/secoes';
import { fetchCapturedEmails, loginAs, uniqueEmail } from '../helpers';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';

/** XG43 — o teste só vira somente leitura 24h após o fim; aqui venceu há 24h + 1 min. */
const FIM_TESTE_MAIS_TOLERANCIA_MS = 24 * 60 * 60_000 + 60_000;
const SENHA = 'Xconstr@E2E2026!';

async function novaObra(request: APIRequestContext, nome: string): Promise<string> {
  const r = await request.post('/api/xgestao/obras', { data: { nome, endereco: 'Rua das Ocorrências, 10' } });
  expect(r.status(), await r.text()).toBe(201);
  return (await r.json()).id;
}

async function apagarObras(ids: string[]) {
  for (const id of ids) {
    await db.delete(financeiro).where(eq(financeiro.obraId, id));
    await db.delete(obras).where(eq(obras.id, id));
  }
}

async function novaOcorrencia(request: APIRequestContext, obraId: string, titulo: string): Promise<string> {
  const r = await request.post(`/api/obras/${obraId}/ocorrencias`, {
    data: { titulo, descricao: 'Descrição inicial do problema', gravidade: 'medio' },
  });
  expect(r.status(), await r.text()).toBe(201);
  return (await r.json()).id;
}

/** Convida e ativa um membro; devolve um contexto de request já logado como ele. */
async function convidarMembro(
  dono: APIRequestContext,
  novoContexto: () => Promise<APIRequestContext>,
  label: string,
  dados: { papel: 'gestor' | 'colaborador'; obras: Array<{ obraId: string; permissao: 'visualizar' | 'editar' }> },
): Promise<APIRequestContext> {
  const email = uniqueEmail(`ocorr-${label}`);
  const convite = await dono.post('/api/xgestao/membros', { data: { nome: `Membro ${label}`, email, ...dados } });
  expect(convite.status(), await convite.text()).toBe(201);
  const capturados = await fetchCapturedEmails(dono, email);
  const setupUrl = capturados.find((item) => item.meta?.kind === 'password-setup')?.meta?.setupUrl as string;
  const ctx = await novoContexto();
  const setup = await ctx.post('/api/auth/definir-senha-inicial', {
    data: { token: new URL(setupUrl).searchParams.get('token'), password: SENHA, confirmPassword: SENHA },
  });
  expect(setup.status(), await setup.text()).toBe(200);
  await loginAs(ctx, email, SENHA);
  return ctx;
}

test('ocorrências: editar, excluir, reabrir, resolver com observação, IDOR e permissões', async ({ request, playwright, baseURL }) => {
  await novoAssinanteHomologacao(request, 'ocorrencias-edicao', { assinar: 'premium' });
  const obraA = await novaObra(request, 'E2E ocorrências A');
  const obraB = await novaObra(request, 'E2E ocorrências B');
  const contextos: APIRequestContext[] = [];
  const novoContexto = async () => {
    const ctx = await playwright.request.newContext({ baseURL });
    contextos.push(ctx);
    return ctx;
  };
  try {
    const id = await novaOcorrencia(request, obraA, 'Vazamento na laje');
    const url = `/api/obras/${obraA}/ocorrencias/${id}`;

    // Validação zod.
    for (const invalido of [{}, { titulo: 'ab' }, { gravidade: 'alta' }, { status: 'resolvida' }, { fotoFileId: 'x' }]) {
      expect((await request.patch(url, { data: invalido })).status(), JSON.stringify(invalido)).toBe(400);
    }
    // Observação só em ocorrência resolvida.
    expect((await request.patch(url, { data: { observacaoResolucao: 'cedo demais' } })).status()).toBe(400);

    // IDOR: id real, obra errada (do mesmo dono) responde 404 e não altera nada.
    expect((await request.patch(`/api/obras/${obraB}/ocorrencias/${id}`, { data: { titulo: 'Outra obra' } })).status()).toBe(404);
    expect((await request.delete(`/api/obras/${obraB}/ocorrencias/${id}`)).status()).toBe(404);
    expect((await request.post(`/api/obras/${obraB}/ocorrencias/${id}/reabrir`)).status()).toBe(404);

    const editada = await request.patch(url, {
      data: { titulo: '  Vazamento na laje do 2º andar ', descricao: 'Infiltração na junta de dilatação', gravidade: 'critico' },
    });
    expect(editada.status(), await editada.text()).toBe(200);
    const [noBanco] = await db.select().from(obraOcorrencias).where(eq(obraOcorrencias.id, id));
    expect(noBanco).toMatchObject({ titulo: 'Vazamento na laje do 2º andar', gravidade: 'critico', obraId: obraA });
    expect(noBanco.atualizadoEm).not.toBeNull();
    const auditoria = await db.select().from(auditLogs).where(and(
      eq(auditLogs.action, 'obras.ocorrencia.update'), sql`${auditLogs.payload}->>'ocorrenciaId' = ${id}`,
    ));
    expect(auditoria[0]?.payload).toMatchObject({ anterior: { titulo: 'Vazamento na laje', gravidade: 'medio' } });
    // O feed não guarda o título antigo.
    const feed = await db.select().from(atividades).where(and(
      eq(atividades.obraId, obraA), sql`${atividades.payload}->>'ocorrenciaId' = ${id}`,
    ));
    for (const a of feed) expect(a.payload).toMatchObject({ titulo: 'Vazamento na laje do 2º andar' });

    const lista = await (await request.get(`/api/obras/${obraA}/ocorrencias`)).json();
    expect(lista.rows[0]).toMatchObject({ id, podeGerenciar: true, observacaoResolucao: null });

    // Resolver com observação, reabrir (limpa), resolver de novo.
    const resolvida = await request.post(`${url}/resolver`, { data: { observacaoResolucao: '  Manta trocada  ' } });
    expect(resolvida.status(), await resolvida.text()).toBe(200);
    expect(await resolvida.json()).toMatchObject({ status: 'resolvida', observacaoResolucao: 'Manta trocada' });
    expect((await request.post(`${url}/resolver`, { data: {} })).status()).toBe(409);
    const obsEditada = await request.patch(url, { data: { observacaoResolucao: 'Manta trocada e testada' } });
    expect(obsEditada.status(), await obsEditada.text()).toBe(200);

    const reaberta = await request.post(`${url}/reabrir`);
    expect(reaberta.status(), await reaberta.text()).toBe(200);
    expect(await reaberta.json()).toMatchObject({ status: 'aberta', resolvidoPorId: null, resolvidoEm: null, observacaoResolucao: null });
    expect((await request.post(`${url}/reabrir`)).status()).toBe(409);
    const auditReabrir = await db.select().from(auditLogs).where(and(
      eq(auditLogs.action, 'obras.ocorrencia.reabrir'), sql`${auditLogs.payload}->>'ocorrenciaId' = ${id}`,
    ));
    expect(auditReabrir[0]?.payload).toMatchObject({ observacaoResolucaoAnterior: 'Manta trocada e testada' });
    // Resolver sem corpo continua funcionando (clientes antigos, marketplace).
    expect((await request.post(`${url}/resolver`)).status()).toBe(200);
    await request.post(`${url}/reabrir`);
    expect((await request.post(`${url}/resolver`, { data: { observacaoResolucao: 'Impermeabilização refeita' } })).status()).toBe(200);

    // Link do cliente com Ocorrências ligada mostra a observação.
    const link = await request.post(`/api/xgestao/obras/${obraA}/share`, {
      data: { nome: 'Cliente', secoes: { ...SECOES_PADRAO, ocorrencias: true } },
    });
    expect(link.status(), await link.text()).toBe(201);
    const pagina = await (await request.get((await link.json()).share.path)).text();
    expect(pagina).toContain('Impermeabilização refeita');

    // Membro só com visualização: lê, mas não edita, exclui nem reabre.
    const leitor = await convidarMembro(request, novoContexto, 'leitor', {
      papel: 'colaborador', obras: [{ obraId: obraA, permissao: 'visualizar' }],
    });
    const listaLeitor = await leitor.get(`/api/obras/${obraA}/ocorrencias`);
    expect(listaLeitor.status()).toBe(200);
    expect((await listaLeitor.json()).rows[0]).toMatchObject({ id, podeGerenciar: false });
    expect((await leitor.patch(url, { data: { titulo: 'Leitor editando' } })).status()).toBe(403);
    expect((await leitor.delete(url)).status()).toBe(403);
    expect((await leitor.post(`${url}/reabrir`)).status()).toBe(403);

    // Colaborador com edição: só gerencia as próprias.
    const colaborador = await convidarMembro(request, novoContexto, 'colab', {
      papel: 'colaborador', obras: [{ obraId: obraA, permissao: 'editar' }],
    });
    expect((await colaborador.patch(url, { data: { titulo: 'Colaborador editando' } })).status()).toBe(403);
    expect((await colaborador.delete(url)).status()).toBe(403);
    const daColab = await novaOcorrencia(colaborador, obraA, 'Material atrasado');
    expect((await colaborador.patch(`/api/obras/${obraA}/ocorrencias/${daColab}`, { data: { gravidade: 'baixo' } })).status()).toBe(200);
    // Colaborador não tem acesso à obra B: 404, sem revelar a ocorrência.
    expect((await colaborador.patch(`/api/obras/${obraB}/ocorrencias/${daColab}`, { data: { gravidade: 'baixo' } })).status()).toBe(404);

    // Gestor e dono gerenciam as de qualquer autor.
    const gestor = await convidarMembro(request, novoContexto, 'gestor', { papel: 'gestor', obras: [] });
    expect((await gestor.patch(`/api/obras/${obraA}/ocorrencias/${daColab}`, { data: { titulo: 'Material atrasado (gestor)' } })).status()).toBe(200);
    expect((await request.patch(`/api/obras/${obraA}/ocorrencias/${daColab}`, { data: { titulo: 'Material atrasado (dono)' } })).status()).toBe(200);

    // Excluir: some da lista e do banco, com o conteúdo na auditoria.
    const excluida = await request.delete(`/api/obras/${obraA}/ocorrencias/${daColab}`);
    expect(excluida.status(), await excluida.text()).toBe(200);
    expect(await db.select().from(obraOcorrencias).where(eq(obraOcorrencias.id, daColab))).toHaveLength(0);
    expect(JSON.stringify((await (await request.get(`/api/obras/${obraA}/ocorrencias`)).json()).rows)).not.toContain(daColab);
    expect((await request.delete(`/api/obras/${obraA}/ocorrencias/${daColab}`)).status()).toBe(404);
  } finally {
    for (const ctx of contextos) await ctx.dispose();
    await apagarObras([obraA, obraB]);
  }
});

test('ocorrências: somente leitura do plano bloqueia editar, excluir, reabrir e resolver', async ({ request }) => {
  const { userId } = await novoAssinanteHomologacao(request, 'ocorrencias-leitura');
  const obra = await novaObra(request, 'E2E ocorrências leitura');
  try {
    const aberta = await novaOcorrencia(request, obra, 'Aberta antes de vencer');
    const resolvida = await novaOcorrencia(request, obra, 'Resolvida antes de vencer');
    expect((await request.post(`/api/obras/${obra}/ocorrencias/${resolvida}/resolver`)).status()).toBe(200);
    await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - FIM_TESTE_MAIS_TOLERANCIA_MS) })
      .where(eq(assinaturas.userId, userId));

    for (const [metodo, url, data] of [
      ['patch', `/api/obras/${obra}/ocorrencias/${aberta}`, { titulo: 'Depois de vencer' }],
      ['delete', `/api/obras/${obra}/ocorrencias/${aberta}`, undefined],
      ['post', `/api/obras/${obra}/ocorrencias/${resolvida}/reabrir`, undefined],
      ['post', `/api/obras/${obra}/ocorrencias/${aberta}/resolver`, { observacaoResolucao: 'x' }],
    ] as const) {
      const r = await request[metodo](url, data ? { data } : {});
      expect(r.status(), `${metodo} ${url}`).toBe(403);
      expect(await r.json()).toMatchObject({ code: 'XGESTAO_SOMENTE_LEITURA' });
    }
    const lista = await request.get(`/api/obras/${obra}/ocorrencias`);
    expect(lista.status()).toBe(200);
    const rows = (await lista.json()).rows as Array<{ id: string; titulo: string; podeGerenciar: boolean }>;
    expect(rows.find((r) => r.id === aberta)).toMatchObject({ titulo: 'Aberta antes de vencer', podeGerenciar: false });
  } finally {
    await apagarObras([obra]);
  }
});

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

/** presign -> PUT no R2 -> commit, o mesmo caminho da tela. */
async function enviarFoto(request: APIRequestContext, obraId?: string): Promise<{ id: string; visibility: string }> {
  const data = { kind: 'obra_foto', mime: 'image/png', size: PNG.byteLength, filename: 'ocorrencia.png', obraId };
  const presign = await request.post('/api/uploads/presign', { data });
  expect(presign.status(), await presign.text()).toBe(200);
  const { uploadUrl, key } = (await presign.json()) as { uploadUrl: string; key: string };
  const put = await request.put(uploadUrl, { headers: { 'Content-Type': 'image/png' }, data: PNG });
  expect(put.ok(), await put.text()).toBe(true);
  const commit = await request.post('/api/uploads/commit', {
    data: { kind: 'obra_foto', key, mime: 'image/png', size: PNG.byteLength, originalName: 'ocorrencia.png', obraId },
  });
  expect(commit.status(), await commit.text()).toBe(200);
  return (await commit.json()) as { id: string; visibility: string };
}

test('ocorrências: foto privada com URL assinada, troca e remoção pelo PATCH, vínculo único', async ({ request }) => {
  test.setTimeout(180_000);
  await novoAssinanteHomologacao(request, 'ocorrencias-foto', { assinar: 'premium' });
  const obraA = await novaObra(request, 'E2E ocorrências foto A');
  const obraB = await novaObra(request, 'E2E ocorrências foto B');
  try {
    const foto = await enviarFoto(request, obraA);
    expect(foto.visibility).toBe('private');
    const criada = await request.post(`/api/obras/${obraA}/ocorrencias`, {
      data: { titulo: 'Trinca na viga', descricao: 'Trinca visível na viga V3', gravidade: 'critico', fotoFileId: foto.id },
    });
    expect(criada.status(), await criada.text()).toBe(201);
    const id = (await criada.json()).id as string;
    const linha = async () => ((await (await request.get(`/api/obras/${obraA}/ocorrencias`)).json()).rows as Array<{ id: string; fotoUrl: string | null; temFoto: boolean }>)
      .find((r) => r.id === id)!;
    expect((await linha()).fotoUrl).toMatch(/X-Amz-Signature=/);
    expect((await linha()).temFoto).toBe(true);

    // A mesma foto não entra em outra ocorrência (nem de outra obra).
    const repetida = await request.post(`/api/obras/${obraB}/ocorrencias`, {
      data: { titulo: 'Reuso de foto', descricao: 'Tentando reaproveitar', fotoFileId: foto.id },
    });
    expect(repetida.status()).toBe(409);

    // Foto enviada sem obraId (tela antiga) também nasce privada.
    const nova = await enviarFoto(request);
    expect(nova.visibility).toBe('private');
    const trocada = await request.patch(`/api/obras/${obraA}/ocorrencias/${id}`, { data: { fotoFileId: nova.id } });
    expect(trocada.status(), await trocada.text()).toBe(200);
    expect((await trocada.json()).fotoFileId).toBe(nova.id);
    const excluido = async (fileId: string) =>
      Boolean((await db.select({ d: userFiles.deletedAt }).from(userFiles).where(eq(userFiles.id, fileId)))[0]?.d);
    expect(await excluido(foto.id), 'foto trocada é descartada').toBe(true);
    expect((await linha()).fotoUrl).toMatch(/X-Amz-Signature=/);
    // Reenviar o mesmo id não é "vincular de novo".
    expect((await request.patch(`/api/obras/${obraA}/ocorrencias/${id}`, { data: { fotoFileId: nova.id, titulo: 'Trinca na viga V3' } })).status()).toBe(200);
    // Foto já vinculada a outra obra é recusada na edição.
    const outra = await enviarFoto(request, obraB);
    const daB = await request.post(`/api/obras/${obraB}/ocorrencias`, {
      data: { titulo: 'Foto da obra B', descricao: 'Foto vinculada à B', fotoFileId: outra.id },
    });
    expect(daB.status(), await daB.text()).toBe(201);
    expect((await request.patch(`/api/obras/${obraA}/ocorrencias/${id}`, { data: { fotoFileId: outra.id } })).status()).toBe(409);

    const removida = await request.patch(`/api/obras/${obraA}/ocorrencias/${id}`, { data: { fotoFileId: null } });
    expect(removida.status(), await removida.text()).toBe(200);
    expect(await linha()).toMatchObject({ fotoUrl: null, temFoto: false });
    expect(await excluido(nova.id), 'foto removida é descartada').toBe(true);
    // Excluir a ocorrência descarta a foto dela.
    const idB = (await daB.json()).id as string;
    expect((await request.delete(`/api/obras/${obraB}/ocorrencias/${idB}`)).status()).toBe(200);
    expect(await excluido(outra.id), 'foto da ocorrência excluída é descartada').toBe(true);
  } finally {
    await apagarObras([obraA, obraB]);
  }
});
