import { expect, test, type APIRequestContext } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { financeiro, obraChecklists, obras, obraTarefas } from '@shared/db/schema';
import { fetchCapturedEmails, loginAs, uniqueEmail } from '../helpers';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';

/**
 * TST-08 — `tarefas/[tarefaId]` e `checklists/[checklistId]`: corpo inválido
 * 400, membro sem a área "cronograma" 403 (e nada muda), id inexistente 404.
 */

const SENHA = 'Xconstr@E2E2026!';
const INEXISTENTE = '00000000-0000-4000-8000-0000000000ff';

async function novaObra(request: APIRequestContext, nome: string): Promise<string> {
  const r = await request.post('/api/xgestao/obras', { data: { nome, endereco: 'Rua do Cronograma, 8' } });
  expect(r.status(), await r.text()).toBe(201);
  return (await r.json()).id;
}

async function membroSemCronograma(dono: APIRequestContext, ctx: APIRequestContext, obraId: string) {
  const email = uniqueEmail('tst08-sem-cronograma');
  const convite = await dono.post('/api/xgestao/membros', {
    data: {
      nome: 'Membro sem cronograma', email, papel: 'colaborador',
      obras: [{ obraId, permissao: 'editar' }], areasPermitidas: ['diario', 'equipe'],
    },
  });
  expect(convite.status(), await convite.text()).toBe(201);
  const setupUrl = (await fetchCapturedEmails(dono, email))
    .find((item) => item.meta?.kind === 'password-setup')?.meta?.setupUrl as string;
  const setup = await ctx.post('/api/auth/definir-senha-inicial', {
    data: { token: new URL(setupUrl).searchParams.get('token'), password: SENHA, confirmPassword: SENHA },
  });
  expect(setup.status(), await setup.text()).toBe(200);
  await loginAs(ctx, email, SENHA);
}

test('TST-08 tarefas/[id] e checklists/[id]: 400 no corpo inválido, 403 sem cronograma, 404 no id inexistente', async ({ request, playwright, baseURL }) => {
  test.setTimeout(180_000);
  await novoAssinanteHomologacao(request, 'tst08', { assinar: 'premium' });
  const obraId = await novaObra(request, 'E2E TST-08 cronograma');
  const membro = await playwright.request.newContext({ baseURL });
  try {
    const tarefa = await request.post(`/api/obras/${obraId}/tarefas`, { data: { titulo: 'Tarefa TST-08', prioridade: 'alta', progresso: 10 } });
    expect(tarefa.status(), await tarefa.text()).toBe(201);
    const tarefaId = (await tarefa.json()).id as string;
    const checklist = await request.post(`/api/obras/${obraId}/checklists`, { data: { nome: 'Checklist TST-08', itens: [{ titulo: 'Item' }] } });
    expect(checklist.status(), await checklist.text()).toBe(201);
    const checklistId = (await checklist.json()).id as string;

    const tarefaUrl = `/api/obras/${obraId}/tarefas/${tarefaId}`;
    const checklistUrl = `/api/obras/${obraId}/checklists/${checklistId}`;
    const [tarefaAntes] = await db.select().from(obraTarefas).where(eq(obraTarefas.id, tarefaId));
    const [checklistAntes] = await db.select().from(obraChecklists).where(eq(obraChecklists.id, checklistId));

    // 400 — corpo inválido.
    for (const invalido of [{ titulo: 'x' }, { progresso: 101 }, { progresso: -1 }, { status: 'feito' }, { prioridade: 'urgente' }, { descricao: 'a'.repeat(2001) }]) {
      const r = await request.patch(tarefaUrl, { data: invalido });
      expect(r.status(), `tarefa ${JSON.stringify(invalido).slice(0, 60)}: ${await r.text()}`).toBe(400);
    }
    for (const invalido of [{ nome: 'x' }, { tipo: 'outro' }, { recorrencia: 'mensal' }, { recorrenciaDiaSemana: 7 }, { status: 'feito' }, { itens: [{ titulo: '' }] }]) {
      const r = await request.patch(checklistUrl, { data: invalido });
      expect(r.status(), `checklist ${JSON.stringify(invalido)}: ${await r.text()}`).toBe(400);
    }
    expect((await db.select().from(obraTarefas).where(eq(obraTarefas.id, tarefaId)))[0]).toEqual(tarefaAntes);
    expect((await db.select().from(obraChecklists).where(eq(obraChecklists.id, checklistId)))[0]).toEqual(checklistAntes);

    // 404 — id inexistente na obra certa.
    for (const [aba, corpo] of [['tarefas', { titulo: 'Inexistente' }], ['checklists', { nome: 'Inexistente' }]] as const) {
      const url = `/api/obras/${obraId}/${aba}/${INEXISTENTE}`;
      const p = await request.patch(url, { data: corpo });
      expect(p.status(), `PATCH ${aba} inexistente: ${await p.text()}`).toBe(404);
      // Checklist: ver o test.fixme abaixo (DELETE de id inexistente responde 200).
      if (aba === 'checklists') continue;
      const d = await request.delete(url);
      expect(d.status(), `DELETE ${aba} inexistente: ${await d.text()}`).toBe(404);
    }

    // 403 — membro com edição na obra, mas sem a área "cronograma".
    await membroSemCronograma(request, membro, obraId);
    for (const [url, corpo] of [[tarefaUrl, { titulo: 'Pelo membro' }], [checklistUrl, { nome: 'Pelo membro' }]] as const) {
      const p = await membro.patch(url, { data: corpo });
      expect(p.status(), `PATCH sem cronograma ${url}: ${await p.text()}`).toBe(403);
      const d = await membro.delete(url);
      expect(d.status(), `DELETE sem cronograma ${url}: ${await d.text()}`).toBe(403);
    }
    expect((await db.select().from(obraTarefas).where(eq(obraTarefas.id, tarefaId)))[0]).toEqual(tarefaAntes);
    expect((await db.select().from(obraChecklists).where(eq(obraChecklists.id, checklistId)))[0]).toEqual(checklistAntes);

    // Controle: o dono ainda edita (o 403 acima não é efeito colateral).
    const ok = await request.patch(tarefaUrl, { data: { progresso: 50 } });
    expect(ok.status(), await ok.text()).toBe(200);
  } finally {
    await membro.dispose();
    await db.delete(financeiro).where(eq(financeiro.obraId, obraId));
    await db.delete(obras).where(eq(obras.id, obraId));
  }
});

// bug: DELETE /api/obras/{obra}/checklists/{idInexistente} responde 200 { ok: true }
// (app/api/obras/[id]/checklists/[checklistId]/route.ts:225-252): apaga com filtro
// id+obra sem conferir se a linha existia, e grava `obras.checklist.delete` na
// auditoria. O PATCH da mesma rota já responde 404. Esperado: 404.
test("TST-08 DELETE de checklist inexistente responde 404", async ({ request }) => {
  await novoAssinanteHomologacao(request, 'tst08-404');
  const obraId = await novaObra(request, 'E2E TST-08 checklist 404');
  try {
    const d = await request.delete(`/api/obras/${obraId}/checklists/${INEXISTENTE}`);
    expect(d.status(), await d.text()).toBe(404);
  } finally {
    await db.delete(obras).where(eq(obras.id, obraId));
  }
});
