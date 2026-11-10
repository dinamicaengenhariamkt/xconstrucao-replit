import { expect, test, type APIRequestContext } from '@playwright/test';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@shared/db/db';
import {
  assinaturas,
  financeiro,
  medicoes,
  obraAditivos,
  obraAnexos,
  obraChecklists,
  obraDiario,
  obraEquipe,
  obraEtapas,
  obraFotos,
  obraOcorrencias,
  obras,
  obraShareLinks,
  obraTarefas,
  userFiles,
  users,
  xgestaoMembros,
} from '@shared/db/schema';
import { fetchCapturedEmails, loginAs, uniqueEmail } from '../helpers';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';

/**
 * TST-03 — matriz de SOMENTE LEITURA (conta xgestão sem plano vigente).
 *
 * `auditoria-campos` já cobre os POST das abas; aqui ficam PATCH e DELETE de
 * cada subitem, as ações de ocorrência, link público, membros, uploads de obra
 * e medição. Vale para o dono e para o membro da empresa vencida. Avatar segue
 * permitido (não é conteúdo de obra).
 *
 * Toda recusa precisa ser 403 `XGESTAO_SOMENTE_LEITURA` e deixar o item intacto
 * no banco.
 */

const HOJE = '2026-11-03';
const SENHA = 'Xconstr@E2E2026!';

type Metodo = 'patch' | 'delete' | 'post';
type Escrita = { metodo: Metodo; url: string; data?: Record<string, unknown>; nome: string };

interface Cenario {
  obraId: string;
  itens: Record<string, string>;
  shareId: string;
  membroAtivoId: string;
  membroPendenteId: string;
  arquivoObraId: string;
  donoUserId: string;
}

async function criarArquivo(ownerUserId: string, kind: string): Promise<string> {
  const key = `e2e/somente-leitura/${kind}-${crypto.randomUUID()}`;
  const [f] = await db.insert(userFiles).values({
    ownerUserId,
    kind,
    visibility: 'private',
    bucketKey: key,
    originalName: `E2E ${kind}.png`,
    mime: 'image/png',
    sizeBytes: 1024,
  }).returning({ id: userFiles.id });
  return f!.id;
}

async function criado(request: APIRequestContext, url: string, data: Record<string, unknown>): Promise<string> {
  const r = await request.post(url, { data });
  expect(r.status(), `${url}: ${await r.text()}`).toBe(201);
  return ((await r.json()) as { id: string }).id;
}

async function convidar(
  dono: APIRequestContext,
  email: string,
  obraId: string,
): Promise<string> {
  const r = await dono.post('/api/xgestao/membros', {
    data: { nome: 'Membro E2E leitura', email, papel: 'gestor', obras: [{ obraId, permissao: 'editar' }] },
  });
  expect(r.status(), await r.text()).toBe(201);
  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  const [m] = await db.select({ id: xgestaoMembros.id }).from(xgestaoMembros).where(eq(xgestaoMembros.userId, u!.id));
  return m!.id;
}

async function ativarMembro(dono: APIRequestContext, ctx: APIRequestContext, email: string) {
  const setupUrl = (await fetchCapturedEmails(dono, email))
    .find((item) => item.meta?.kind === 'password-setup')?.meta?.setupUrl as string;
  const setup = await ctx.post('/api/auth/definir-senha-inicial', {
    data: { token: new URL(setupUrl).searchParams.get('token'), password: SENHA, confirmPassword: SENHA },
  });
  expect(setup.status(), await setup.text()).toBe(200);
  await loginAs(ctx, email, SENHA);
}

/** Empresa com Premium, uma obra com um item de cada aba, link, membro ativo e convite pendente. */
async function montarEmpresa(dono: APIRequestContext, membro: APIRequestContext, label: string): Promise<Cenario> {
  const { userId } = await novoAssinanteHomologacao(dono, label, { assinar: 'premium' });
  const obraId = await criado(dono, '/api/xgestao/obras', { nome: `E2E leitura ${label}`, endereco: 'Rua Somente Leitura, 1' });
  const base = `/api/obras/${obraId}`;
  const fotoFileId = await criarArquivo(userId, 'obra_foto');
  const itens: Record<string, string> = {
    financeiro: await criado(dono, `${base}/financeiro`, { tipo: 'saida', categoria: 'material', descricao: 'Material E2E', valor: 100, data: HOJE }),
    aditivos: await criado(dono, `${base}/aditivos`, { descricao: 'Aditivo E2E', valor: 100, data: HOJE }),
    etapas: await criado(dono, `${base}/etapas`, { nome: 'Etapa E2E', dataInicio: '2026-11-03T12:00:00.000Z', prazo: '2026-12-03T12:00:00.000Z' }),
    tarefas: await criado(dono, `${base}/tarefas`, { titulo: 'Tarefa E2E', prioridade: 'alta', progresso: 10 }),
    checklists: await criado(dono, `${base}/checklists`, { nome: 'Checklist E2E', itens: [{ titulo: 'Item 1' }] }),
    diario: await criado(dono, `${base}/diario`, { texto: 'Registro E2E do dia' }),
    fotos: await criado(dono, `${base}/fotos`, { fileId: fotoFileId }),
    anexos: await criado(dono, `${base}/anexos`, { linkUrl: 'https://example.com/a.pdf', titulo: 'Documento E2E', tipo: 'contrato' }),
    equipe: await criado(dono, `${base}/equipe`, { nome: 'Pessoa E2E', papel: 'Mestre' }),
    ocorrencias: await criado(dono, `${base}/ocorrencias`, { titulo: 'Problema E2E', descricao: 'Detalhe', gravidade: 'baixo' }),
  };
  const share = await dono.post(`/api/xgestao/obras/${obraId}/share`, { data: { nome: 'Cliente' } });
  expect(share.status(), await share.text()).toBe(201);
  const shareId = ((await share.json()) as { share: { id: string } }).share.id;

  const emailAtivo = uniqueEmail(`xg-leitura-membro-${label}`);
  const membroAtivoId = await convidar(dono, emailAtivo, obraId);
  await ativarMembro(dono, membro, emailAtivo);
  const membroPendenteId = await convidar(dono, uniqueEmail(`xg-leitura-pendente-${label}`), obraId);
  const arquivoObraId = await criarArquivo(userId, 'obra_anexo');

  // Vence a empresa: sem assinatura vigente a conta fica somente leitura (XG41).
  await db.update(assinaturas).set({ status: 'cancelada', canceladaEm: new Date() })
    .where(and(eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao')));
  const perfil = await dono.get('/api/perfil/plano?persona=xgestao');
  expect(perfil.status(), await perfil.text()).toBe(200);
  expect(await perfil.json()).toMatchObject({ somenteLeitura: true });

  return { obraId, itens, shareId, membroAtivoId, membroPendenteId, arquivoObraId, donoUserId: userId };
}

const PATCH_POR_ABA: Record<string, Record<string, unknown> | null> = {
  financeiro: { descricao: 'Alterado' },
  aditivos: { descricao: 'Alterado' },
  etapas: { nome: 'Alterado' },
  tarefas: { titulo: 'Alterado' },
  checklists: { nome: 'Alterado' },
  diario: { texto: 'Texto alterado' },
  fotos: { enviadaAoContratante: false },
  anexos: null, // a rota de anexo não tem PATCH
  equipe: { papel: 'Alterado' },
  ocorrencias: { titulo: 'Alterado' },
};

function escritasDeSubitens(c: Cenario): Escrita[] {
  const base = `/api/obras/${c.obraId}`;
  const lista: Escrita[] = [];
  for (const [aba, id] of Object.entries(c.itens)) {
    const patch = PATCH_POR_ABA[aba];
    if (patch) lista.push({ nome: `PATCH ${aba}`, metodo: 'patch', url: `${base}/${aba}/${id}`, data: patch });
    lista.push({ nome: `DELETE ${aba}`, metodo: 'delete', url: `${base}/${aba}/${id}` });
  }
  lista.push(
    { nome: 'POST ocorrência resolver', metodo: 'post', url: `${base}/ocorrencias/${c.itens.ocorrencias}/resolver`, data: {} },
    { nome: 'POST ocorrência reabrir', metodo: 'post', url: `${base}/ocorrencias/${c.itens.ocorrencias}/reabrir`, data: {} },
    { nome: 'PATCH link público', metodo: 'patch', url: `/api/xgestao/obras/${c.obraId}/share/${c.shareId}`, data: { nome: 'Outro' } },
    { nome: 'DELETE link público', metodo: 'delete', url: `/api/xgestao/obras/${c.obraId}/share/${c.shareId}` },
  );
  return lista;
}

function escritasDeMembros(c: Cenario): Escrita[] {
  return [
    {
      nome: 'PATCH membro', metodo: 'patch', url: `/api/xgestao/membros/${c.membroAtivoId}`,
      data: { papel: 'colaborador', obras: [{ obraId: c.obraId, permissao: 'visualizar' }] },
    },
    { nome: 'DELETE membro', metodo: 'delete', url: `/api/xgestao/membros/${c.membroAtivoId}` },
    { nome: 'POST reenviar convite', metodo: 'post', url: `/api/xgestao/membros/${c.membroPendenteId}/reenviar`, data: {} },
  ];
}

async function esperarSomenteLeitura(ctx: APIRequestContext, escritas: Escrita[]) {
  for (const e of escritas) {
    const r = await ctx[e.metodo](e.url, e.data ? { data: e.data } : undefined);
    const corpo = await r.text();
    expect(r.status(), `${e.nome}: ${corpo}`).toBe(403);
    expect(JSON.parse(corpo), e.nome).toMatchObject({ code: 'XGESTAO_SOMENTE_LEITURA' });
  }
}

async function esperarUploadsBloqueados(ctx: APIRequestContext, c: Cenario) {
  for (const kind of ['obra_foto', 'obra_anexo', 'obra_capa', 'comprovante_pagamento']) {
    const mime = kind === 'obra_anexo' || kind === 'comprovante_pagamento' ? 'application/pdf' : 'image/png';
    const presign = await ctx.post('/api/uploads/presign', {
      data: { kind, mime, size: 1024, filename: kind === 'obra_anexo' ? 'a.pdf' : 'a.png', obraId: c.obraId },
    });
    const corpo = await presign.text();
    expect(presign.status(), `presign ${kind}: ${corpo}`).toBe(403);
    expect(JSON.parse(corpo).code, `presign ${kind}`).toBe('XGESTAO_SOMENTE_LEITURA');
  }
  const commit = await ctx.post('/api/uploads/commit', {
    data: { kind: 'obra_foto', key: 'x/y/z.png', mime: 'image/png', size: 10, originalName: 'z.png', obraId: c.obraId },
  });
  expect(commit.status(), await commit.text()).toBe(403);
  expect((await commit.json()).code).toBe('XGESTAO_SOMENTE_LEITURA');
}

async function esperarMedicaoBloqueada(ctx: APIRequestContext, c: Cenario) {
  const r = await ctx.post('/api/empreiteiro/medicoes', {
    data: { obraId: c.obraId, etapa: 'Etapa E2E', percentual: 10, requestId: crypto.randomUUID() },
  });
  expect(r.status(), await r.text()).toBe(403);
  expect(await db.select().from(medicoes).where(eq(medicoes.obraId, c.obraId))).toHaveLength(0);
}

async function esperarAvatarPermitido(ctx: APIRequestContext) {
  const r = await ctx.post('/api/uploads/presign', {
    data: { kind: 'avatar', mime: 'image/png', size: 1024, filename: 'avatar.png' },
  });
  expect(r.status(), `avatar continua permitido: ${await r.text()}`).toBe(200);
}

/** Linha completa de cada item: compara antes e depois da matriz. */
async function fotografar(c: Cenario) {
  const por = async <T>(promessa: Promise<T[]>) => (await promessa)[0] ?? null;
  return {
    financeiro: await por(db.select().from(financeiro).where(eq(financeiro.id, c.itens.financeiro))),
    aditivos: await por(db.select().from(obraAditivos).where(eq(obraAditivos.id, c.itens.aditivos))),
    etapas: await por(db.select().from(obraEtapas).where(eq(obraEtapas.id, c.itens.etapas))),
    tarefas: await por(db.select().from(obraTarefas).where(eq(obraTarefas.id, c.itens.tarefas))),
    checklists: await por(db.select().from(obraChecklists).where(eq(obraChecklists.id, c.itens.checklists))),
    diario: await por(db.select().from(obraDiario).where(eq(obraDiario.id, c.itens.diario))),
    fotos: await por(db.select().from(obraFotos).where(eq(obraFotos.id, c.itens.fotos))),
    anexos: await por(db.select().from(obraAnexos).where(eq(obraAnexos.id, c.itens.anexos))),
    equipe: await por(db.select().from(obraEquipe).where(eq(obraEquipe.id, c.itens.equipe))),
    ocorrencias: await por(db.select().from(obraOcorrencias).where(eq(obraOcorrencias.id, c.itens.ocorrencias))),
    share: await por(db.select().from(obraShareLinks).where(eq(obraShareLinks.id, c.shareId))),
    membros: await db.select().from(xgestaoMembros)
      .where(inArray(xgestaoMembros.id, [c.membroAtivoId, c.membroPendenteId])).orderBy(xgestaoMembros.id),
    arquivos: await db.select().from(userFiles).where(eq(userFiles.ownerUserId, c.donoUserId)).orderBy(userFiles.id),
  };
}

async function apagarObra(obraId: string) {
  await db.delete(financeiro).where(eq(financeiro.obraId, obraId));
  await db.delete(obras).where(eq(obras.id, obraId));
}

test.describe('TST-03 — matriz de somente leitura do xgestão', () => {
  test('dono da empresa vencida: PATCH/DELETE de todo subitem, link, membros, uploads e medição são recusados', async ({ request, playwright, baseURL }) => {
    test.setTimeout(240_000);
    const membro = await playwright.request.newContext({ baseURL });
    let c: Cenario | null = null;
    try {
      c = await montarEmpresa(request, membro, 'matriz-dono');
      const antes = await fotografar(c);
      for (const v of Object.values(antes)) expect(v).toBeTruthy();

      await esperarSomenteLeitura(request, [...escritasDeSubitens(c), ...escritasDeMembros(c)]);
      await esperarUploadsBloqueados(request, c);
      const apagaArquivo = await request.delete(`/api/uploads/${c.arquivoObraId}`);
      expect(apagaArquivo.status(), await apagaArquivo.text()).toBe(403);
      expect((await apagaArquivo.json()).code).toBe('XGESTAO_SOMENTE_LEITURA');
      await esperarMedicaoBloqueada(request, c);

      expect(await fotografar(c), 'nenhum item mudou no banco').toEqual(antes);
      await esperarAvatarPermitido(request);
      // Leitura continua.
      for (const aba of Object.keys(c.itens)) {
        expect((await request.get(`/api/obras/${c.obraId}/${aba}`)).status(), aba).toBe(200);
      }
    } finally {
      await membro.dispose();
      if (c) await apagarObra(c.obraId);
    }
  });

  test('membro (gestor) da empresa vencida: mesmas escritas recusadas, avatar permitido', async ({ request, playwright, baseURL }) => {
    test.setTimeout(240_000);
    const membro = await playwright.request.newContext({ baseURL });
    let c: Cenario | null = null;
    try {
      c = await montarEmpresa(request, membro, 'matriz-membro');
      const antes = await fotografar(c);

      await esperarSomenteLeitura(membro, [...escritasDeSubitens(c), ...escritasDeMembros(c)]);
      // Criar também é escrita: o membro não cria nada na obra da empresa vencida.
      await esperarSomenteLeitura(membro, [
        { nome: 'POST diário', metodo: 'post', url: `/api/obras/${c.obraId}/diario`, data: { texto: 'Pelo membro' } },
        { nome: 'POST tarefa', metodo: 'post', url: `/api/obras/${c.obraId}/tarefas`, data: { titulo: 'Pelo membro' } },
        { nome: 'POST obra', metodo: 'post', url: '/api/xgestao/obras', data: { nome: 'Obra do membro', endereco: 'Rua 1' } },
      ]);
      await esperarUploadsBloqueados(membro, c);
      await esperarMedicaoBloqueada(membro, c);

      expect(await fotografar(c), 'nenhum item mudou no banco').toEqual(antes);
      await esperarAvatarPermitido(membro);
      expect((await membro.get(`/api/obras/${c.obraId}/diario`)).status()).toBe(200);
    } finally {
      await membro.dispose();
      if (c) await apagarObra(c.obraId);
    }
  });
});
