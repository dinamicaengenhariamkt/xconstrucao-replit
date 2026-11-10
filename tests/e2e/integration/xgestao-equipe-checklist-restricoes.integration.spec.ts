import { expect, test, type APIRequestContext } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { financeiro, obraChecklists, obras } from '@shared/db/schema';
import { fetchCapturedEmails, loginAs, uniqueEmail } from '../helpers';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';

const SENHA = 'Xconstr@E2E2026!';

async function apagarObras(ids: string[]) {
  for (const id of ids) {
    await db.delete(financeiro).where(eq(financeiro.obraId, id));
    await db.delete(obras).where(eq(obras.id, id));
  }
}

async function novaObra(request: APIRequestContext, nome: string): Promise<string> {
  const r = await request.post('/api/xgestao/obras', { data: { nome, endereco: 'Rua da Equipe, 7' } });
  expect(r.status(), await r.text()).toBe(201);
  return (await r.json()).id;
}

async function membroRestrito(
  dono: APIRequestContext,
  ctx: APIRequestContext,
  label: string,
  obraId: string,
  restricao: { areasPermitidas?: string[] | null; categoriasFinanceiroPermitidas?: string[] | null },
) {
  const email = uniqueEmail(`emp06-${label}`);
  const convite = await dono.post('/api/xgestao/membros', {
    data: { nome: `Membro ${label}`, email, papel: 'colaborador', obras: [{ obraId, permissao: 'editar' }], ...restricao },
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

test('EMP-06: membro sem acesso ao contrato não recebe PIX, valor nem contrato da equipe', async ({ request, playwright, baseURL }) => {
  await novoAssinanteHomologacao(request, 'emp06', { assinar: 'premium' });
  const obraId = await novaObra(request, 'E2E EMP-06');
  const semFinanceiro = await playwright.request.newContext({ baseURL });
  const soMaoDeObra = await playwright.request.newContext({ baseURL });
  try {
    const criado = await request.post(`/api/obras/${obraId}/equipe`, {
      data: { nome: 'Pedreiro E2E', papel: 'Pedreiro', tipo: 'equipe', pixChave: 'pix-secreto@e2e.test', valorContrato: 12345.67, contratoLinkUrl: 'https://example.com/contrato-e2e' },
    });
    expect(criado.status(), await criado.text()).toBe(201);

    // Dono vê tudo.
    const doDono = (await (await request.get(`/api/obras/${obraId}/equipe`)).json()).rows[0];
    expect(doDono).toMatchObject({ pixChave: 'pix-secreto@e2e.test', contratoLinkUrl: 'https://example.com/contrato-e2e' });
    expect(Number(doDono.valorContrato)).toBe(12345.67);

    await membroRestrito(request, semFinanceiro, 'semfin', obraId, { areasPermitidas: ['equipe', 'cronograma'] });
    await membroRestrito(request, soMaoDeObra, 'maodeobra', obraId, {
      areasPermitidas: null, categoriasFinanceiroPermitidas: ['mao_de_obra'],
    });

    for (const ctx of [semFinanceiro, soMaoDeObra]) {
      const lista = await ctx.get(`/api/obras/${obraId}/equipe`);
      expect(lista.status(), await lista.text()).toBe(200);
      const texto = await lista.text();
      expect((await lista.json()).rows[0]).toMatchObject({ nome: 'Pedreiro E2E' });
      for (const vazamento of ['pix-secreto', '12345', 'contrato-e2e', 'pixChave', 'valorContrato']) expect(texto, vazamento).not.toContain(vazamento);

      const detalhe = await ctx.get(`/api/empreiteiro/minhas-obras/${obraId}`);
      expect(detalhe.status(), await detalhe.text()).toBe(200);
      const corpo = await detalhe.json();
      expect(corpo.equipe.some((m: { nome: string }) => m.nome === 'Pedreiro E2E')).toBe(true);
      const membro = corpo.equipe.find((m: { nome: string }) => m.nome === 'Pedreiro E2E');
      for (const campo of ['pixChave', 'valorContrato', 'contratoLinkUrl', 'contratoUrl']) expect(membro, campo).not.toHaveProperty(campo);
    }

    // O detalhe do dono segue completo.
    const detalheDono = await (await request.get(`/api/empreiteiro/minhas-obras/${obraId}`)).json();
    expect(detalheDono.equipe.find((m: { nome: string }) => m.nome === 'Pedreiro E2E')).toMatchObject({ pixChave: 'pix-secreto@e2e.test', valorContrato: 12345.67 });
  } finally {
    await semFinanceiro.dispose();
    await soMaoDeObra.dispose();
    await apagarObras([obraId]);
  }
});

test('EMP-08: assinatura e conclusão do checklist usam o relógio do servidor e o usuário logado', async ({ request }) => {
  const { userId } = await novoAssinanteHomologacao(request, 'emp08');
  const obraId = await novaObra(request, 'E2E EMP-08');
  try {
    const criado = await request.post(`/api/obras/${obraId}/checklists`, {
      data: { nome: 'Checklist EPI E2E', itens: [{ titulo: 'Capacete' }, { titulo: 'Luva' }] },
    });
    expect(criado.status(), await criado.text()).toBe(201);
    const checklistId = (await criado.json()).id as string;
    const url = `/api/obras/${obraId}/checklists/${checklistId}`;

    const antes = Date.now();
    const assinado = await request.patch(url, {
      data: { status: 'completo', assinadoPor: 'Eng. Ana E2E', assinadoEm: '01/01/2000 00:00', completadoEm: '00:00', registroProfissional: 'CREA 123', markAllItens: true },
    });
    expect(assinado.status(), await assinado.text()).toBe(200);
    const corpo = await assinado.json();
    expect(corpo.assinadoPor).toBe('Eng. Ana E2E');
    for (const campo of ['assinadoEm', 'completadoEm'] as const) {
      expect(corpo[campo], campo).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      const t = new Date(corpo[campo]).getTime();
      expect(t).toBeGreaterThanOrEqual(antes - 5_000);
      expect(t).toBeLessThanOrEqual(Date.now() + 5_000);
    }
    const [noBanco] = await db.select().from(obraChecklists).where(eq(obraChecklists.id, checklistId));
    expect(noBanco.assinadoPorUserId).toBe(userId);

    // Reabrir limpa a assinatura e o usuário.
    const reaberto = await request.patch(url, {
      data: { status: 'em_andamento', assinadoPor: null, assinadoEm: null, registroProfissional: null, completadoEm: null, reabrir: true },
    });
    expect(reaberto.status(), await reaberto.text()).toBe(200);
    const [limpo] = await db.select().from(obraChecklists).where(eq(obraChecklists.id, checklistId));
    expect(limpo).toMatchObject({ assinadoPor: null, assinadoEm: null, completadoEm: null, assinadoPorUserId: null });

    // Dado antigo ("HH:MM") continua sendo lido sem erro.
    await db.update(obraChecklists).set({ status: 'completo', completadoEm: '21:14' }).where(eq(obraChecklists.id, checklistId));
    const detalhe = await request.get(`/api/empreiteiro/minhas-obras/${obraId}`);
    expect(detalhe.status()).toBe(200);
    const ck = (await detalhe.json()).checklists.find((c: { id: string }) => c.id === checklistId);
    expect(ck.completadoEm).toBe('21:14');
  } finally {
    await apagarObras([obraId]);
  }
});
