import { expect, test, type APIRequestContext } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import {
  financeiro,
  obraAditivos,
  obraAnexos,
  obraChecklists,
  obraEquipe,
  obraEtapas,
  obraFotos,
  obraOcorrencias,
  obras,
  obraTarefas,
  userFiles,
} from '@shared/db/schema';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';

/**
 * TST-04 — IDOR entre obras nos subitens.
 *
 * `PATCH`/`DELETE /api/obras/{minhaObra}/X/{idDoItemDaObraB}`: a rota autoriza
 * pela obra da URL, então o item precisa ser procurado DENTRO dessa obra. Se a
 * busca for só pelo id, quem tem acesso à obra A altera item da obra B — de
 * outra empresa ou de outra obra da mesma empresa. Esperado: 404 e o item
 * intacto no banco.
 */

const HOJE = '2026-11-03';

const ABAS = ['financeiro', 'etapas', 'tarefas', 'checklists', 'fotos', 'anexos', 'aditivos', 'equipe', 'ocorrencias'] as const;
type Aba = (typeof ABAS)[number];

const PATCH_POR_ABA: Record<Aba, Record<string, unknown> | null> = {
  financeiro: { descricao: 'Alterado por IDOR' },
  etapas: { nome: 'Alterado por IDOR' },
  tarefas: { titulo: 'Alterado por IDOR' },
  checklists: { nome: 'Alterado por IDOR' },
  fotos: { enviadaAoContratante: false },
  anexos: null, // a rota de anexo não tem PATCH
  aditivos: { descricao: 'Alterado por IDOR' },
  equipe: { papel: 'Alterado por IDOR' },
  ocorrencias: { titulo: 'Alterado por IDOR' },
};

/**
 * Bug conhecido (ver `test.fixme` no fim): DELETE de item de outra obra responde
 * 200 `{ ok: true }` em vez de 404. O banco não muda (o DELETE filtra por obra),
 * mas a resposta mente e a auditoria grava uma exclusão que não houve. Nestas
 * abas o teste principal confere só o banco intacto; o fixme cobra o 404.
 */
const DELETE_SEM_404 = new Set<Aba>(['etapas', 'checklists', 'equipe']);

async function novaObra(request: APIRequestContext, nome: string): Promise<string> {
  const r = await request.post('/api/xgestao/obras', { data: { nome, endereco: 'Rua do IDOR, 4' } });
  expect(r.status(), await r.text()).toBe(201);
  return (await r.json()).id;
}

async function criado(request: APIRequestContext, url: string, data: Record<string, unknown>): Promise<string> {
  const r = await request.post(url, { data });
  expect(r.status(), `${url}: ${await r.text()}`).toBe(201);
  return ((await r.json()) as { id: string }).id;
}

async function arquivoFoto(ownerUserId: string): Promise<string> {
  const key = `e2e/idor/${crypto.randomUUID()}.png`;
  const [f] = await db.insert(userFiles).values({
    ownerUserId, kind: 'obra_foto', visibility: 'private', bucketKey: key,
    originalName: 'E2E idor.png', mime: 'image/png', sizeBytes: 1024,
  }).returning({ id: userFiles.id });
  return f!.id;
}

/** Um item de cada aba na obra, criado pelo dono dela. */
async function popular(request: APIRequestContext, obraId: string, userId: string): Promise<Record<Aba, string>> {
  const base = `/api/obras/${obraId}`;
  return {
    financeiro: await criado(request, `${base}/financeiro`, { tipo: 'saida', categoria: 'material', descricao: 'Material B', valor: 100, data: HOJE }),
    etapas: await criado(request, `${base}/etapas`, { nome: 'Etapa B', dataInicio: '2026-11-03T12:00:00.000Z', prazo: '2026-12-03T12:00:00.000Z' }),
    tarefas: await criado(request, `${base}/tarefas`, { titulo: 'Tarefa B', prioridade: 'alta' }),
    checklists: await criado(request, `${base}/checklists`, { nome: 'Checklist B', itens: [{ titulo: 'Item' }] }),
    fotos: await criado(request, `${base}/fotos`, { fileId: await arquivoFoto(userId) }),
    anexos: await criado(request, `${base}/anexos`, { linkUrl: 'https://example.com/b.pdf', titulo: 'Anexo B', tipo: 'contrato' }),
    aditivos: await criado(request, `${base}/aditivos`, { descricao: 'Aditivo B', valor: 100, data: HOJE }),
    equipe: await criado(request, `${base}/equipe`, { nome: 'Pessoa B', papel: 'Mestre' }),
    ocorrencias: await criado(request, `${base}/ocorrencias`, { titulo: 'Problema B', descricao: 'Detalhe', gravidade: 'baixo' }),
  };
}

async function linha(aba: Aba, id: string) {
  const tabela = {
    financeiro, etapas: obraEtapas, tarefas: obraTarefas, checklists: obraChecklists, fotos: obraFotos,
    anexos: obraAnexos, aditivos: obraAditivos, equipe: obraEquipe, ocorrencias: obraOcorrencias,
  }[aba];
  const [row] = await db.select().from(tabela).where(eq(tabela.id, id));
  return row ?? null;
}

/** Tenta alterar/excluir pela minha obra os itens de `itensB`; espera 404 e banco intacto. */
async function tentarIdor(request: APIRequestContext, minhaObra: string, itensB: Record<Aba, string>, rotulo: string) {
  for (const aba of ABAS) {
    const id = itensB[aba];
    const antes = await linha(aba, id);
    expect(antes, `${rotulo} ${aba}: item existe antes`).toBeTruthy();
    const url = `/api/obras/${minhaObra}/${aba}/${id}`;
    const patch = PATCH_POR_ABA[aba];
    if (patch) {
      const r = await request.patch(url, { data: patch });
      expect(r.status(), `${rotulo} PATCH ${aba}: ${await r.text()}`).toBe(404);
    }
    const d = await request.delete(url);
    if (!DELETE_SEM_404.has(aba)) expect(d.status(), `${rotulo} DELETE ${aba}: ${await d.text()}`).toBe(404);
    if (aba === 'ocorrencias') {
      for (const acao of ['resolver', 'reabrir']) {
        const r = await request.post(`${url}/${acao}`, { data: {} });
        expect(r.status(), `${rotulo} POST ocorrência ${acao}: ${await r.text()}`).toBe(404);
      }
    }
    expect(await linha(aba, id), `${rotulo} ${aba}: item intacto no banco`).toEqual(antes);
  }
}

async function apagarObras(ids: string[]) {
  for (const id of ids) {
    await db.delete(financeiro).where(eq(financeiro.obraId, id));
    await db.delete(obras).where(eq(obras.id, id));
  }
}

test.describe('TST-04 — IDOR entre obras nos subitens', () => {
  test('item de obra de OUTRA empresa não é alterado nem excluído pela minha obra', async ({ request, playwright, baseURL }) => {
    test.setTimeout(240_000);
    const outra = await playwright.request.newContext({ baseURL });
    const criadas: string[] = [];
    try {
      const { userId: outroId } = await novoAssinanteHomologacao(outra, 'idor-outra');
      const obraB = await novaObra(outra, 'E2E IDOR obra B outra empresa');
      criadas.push(obraB);
      const itensB = await popular(outra, obraB, outroId);

      await novoAssinanteHomologacao(request, 'idor-minha');
      const minhaObra = await novaObra(request, 'E2E IDOR minha obra');
      criadas.push(minhaObra);

      await tentarIdor(request, minhaObra, itensB, 'outra empresa');
    } finally {
      await outra.dispose();
      await apagarObras(criadas);
    }
  });

  test('item de outra obra da MESMA empresa não é alterado nem excluído pela obra errada', async ({ request }) => {
    test.setTimeout(240_000);
    const criadas: string[] = [];
    try {
      const { userId } = await novoAssinanteHomologacao(request, 'idor-mesma', { assinar: 'premium' });
      const obraA = await novaObra(request, 'E2E IDOR obra A');
      criadas.push(obraA);
      const obraB = await novaObra(request, 'E2E IDOR obra B mesma empresa');
      criadas.push(obraB);
      const itensB = await popular(request, obraB, userId);

      await tentarIdor(request, obraA, itensB, 'mesma empresa');
    } finally {
      await apagarObras(criadas);
    }
  });

  // bug: DELETE /api/obras/{minhaObra}/{etapas|checklists|equipe}/{itemDaObraB}
  // responde 200 { ok: true }: as rotas apagam com filtro id+obra sem conferir se
  // a linha existia (etapas/[etapaId]/route.ts:130-158, checklists/[checklistId]/
  // route.ts:225-252, equipe/[membroId]/route.ts:157-196). O filtro evita a perda de
  // dado, mas a resposta é 200 e a auditoria grava uma exclusão que não houve.
  // Esperado: 404, como já fazem financeiro, aditivos, tarefas, fotos e anexos.
  test("DELETE de etapa, checklist e equipe de outra obra responde 404", async ({ request }) => {
    const criadas: string[] = [];
    try {
      await novoAssinanteHomologacao(request, 'idor-etapa-404', { assinar: 'premium' });
      const obraA = await novaObra(request, 'E2E IDOR etapa A');
      criadas.push(obraA);
      const obraB = await novaObra(request, 'E2E IDOR etapa B');
      criadas.push(obraB);
      for (const aba of DELETE_SEM_404) {
        const base = `/api/obras/${obraB}`;
        const corpo: Record<string, Record<string, unknown>> = {
          etapas: { nome: 'Etapa B', dataInicio: '2026-11-03T12:00:00.000Z', prazo: '2026-12-03T12:00:00.000Z' },
          checklists: { nome: 'Checklist B', itens: [{ titulo: 'Item' }] },
          equipe: { nome: 'Pessoa B', papel: 'Mestre' },
        };
        const id = await criado(request, `${base}/${aba}`, corpo[aba]);
        const d = await request.delete(`/api/obras/${obraA}/${aba}/${id}`);
        expect(d.status(), `DELETE ${aba}: ${await d.text()}`).toBe(404);
      }
    } finally {
      await apagarObras(criadas);
    }
  });
});
