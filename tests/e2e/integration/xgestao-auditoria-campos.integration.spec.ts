import { expect, test, type APIRequestContext } from '@playwright/test';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturas, atividades, auditLogs, financeiro, legalDocuments, obras, obraShareLinks } from '@shared/db/schema';
import { getPlanCatalog, type PlanoTier } from '@shared/lib/plans-catalog';
import { SECOES_PADRAO } from '@features/xgestao/obra-publica/secoes';
import { fetchCapturedEmails, loginAs, logout, SEED_ADMIN_EMAIL, SEED_CONTRATANTE_EMAIL, uniqueEmail } from '../helpers';
import { criarObraVinculadaE2E, limparObraVinculadaE2E } from '../helpers-marketplace';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';

const HOJE = '2026-11-03';
const SENHA = 'Xconstr@E2E2026!';

async function novaObra(request: APIRequestContext, nome: string): Promise<string> {
  const r = await request.post('/api/xgestao/obras', { data: { nome, endereco: 'Rua de Auditoria, 42' } });
  expect(r.status(), await r.text()).toBe(201);
  return (await r.json()).id;
}

/** A exclusão recusa obra com recebimentos: limpa só os lançamentos da descartável. */
async function apagarObras(ids: string[]) {
  for (const id of ids) {
    await db.delete(financeiro).where(eq(financeiro.obraId, id));
    await db.delete(obras).where(eq(obras.id, id));
  }
}

async function contratar(request: APIRequestContext, tier: string) {
  const catalogo = await (await request.get('/api/planos?persona=xgestao')).json();
  const r = await request.post('/api/assinaturas/checkout', {
    data: { planoId: catalogo.find((p: { tier: string }) => p.tier === tier).id, persona: 'xgestao', ciclo: 'mensal' },
  });
  expect(r.status(), await r.text()).toBe(201);
}

test('XG42 valores altos persistem em todos os campos e os totais batem em cada visão', async ({ request }) => {
  await novoAssinanteHomologacao(request, 'auditoria-valores');
  const id = await novaObra(request, 'E2E auditoria valores');
  try {
    for (const valor of ['500.00', '500.01', '1000000.00', '1234567890123.45', '10000000.50']) {
      const r = await request.patch(`/api/obras/${id}`, { data: { valorTotal: valor } });
      expect(r.status(), `${valor}: ${await r.text()}`).toBe(200);
      expect((await (await request.get(`/api/obras/${id}`)).json()).valorTotal).toBe(valor);
    }
    const lancar = (data: Record<string, unknown>) => request.post(`/api/obras/${id}/financeiro`, {
      data: { data: HOJE, ...data },
    });
    for (const dados of [
      { tipo: 'entrada', descricao: 'Entrada acima de 500', valor: 500.01 },
      { tipo: 'entrada', descricao: 'Entrada de 1 milhão', valor: 1_000_000 },
      { tipo: 'saida', categoria: 'material', descricao: 'Material caro', valor: 750_000.5 },
      { tipo: 'saida', categoria: 'mao_de_obra', descricao: 'Mão de obra', valor: 1234.56 },
    ]) {
      const r = await lancar(dados);
      expect(r.status(), await r.text()).toBe(201);
    }
    const aditivo = await request.post(`/api/obras/${id}/aditivos`, {
      data: { descricao: 'Aditivo grande', valor: 1_000_000.55, data: HOJE },
    });
    expect(aditivo.status(), await aditivo.text()).toBe(201);
    const supressao = await request.post(`/api/obras/${id}/aditivos`, {
      data: { descricao: 'Supressão', valor: -500.25, data: HOJE },
    });
    expect(supressao.status(), await supressao.text()).toBe(201);
    const prestador = await request.post(`/api/obras/${id}/equipe`, {
      data: { nome: 'Prestador', papel: 'Pedreiro', valorContrato: 2_500_000.75 },
    });
    expect(prestador.status(), await prestador.text()).toBe(201);

    const { financeiro: resumo } = await (await request.get(`/api/empreiteiro/minhas-obras/${id}`)).json();
    expect(resumo.valorContratado).toBeCloseTo(10_000_000.5, 2);
    expect(resumo.aditivos).toBeCloseTo(1_000_000.55 - 500.25, 2);
    expect(resumo.valorTotal).toBeCloseTo(10_999_500.8, 2);
    expect(resumo.receitaTotal).toBeCloseTo(1_000_500.01, 2);
    expect(resumo.custoTotal).toBeCloseTo(751_235.06, 2);
    expect(resumo.saldoReceber).toBeCloseTo(9_999_000.79, 2);
    expect(resumo.custoPrevistoEquipe).toBeCloseTo(2_500_000.75, 2);

    const lista = await (await request.get('/api/empreiteiro/minhas-obras')).json();
    const naLista = lista.find((o: { id: string }) => o.id === id);
    expect(naLista.orcamento).toBeCloseTo(10_000_000.5, 2);
    expect(naLista.custoReal).toBeCloseTo(751_235.06, 2);
  } finally {
    await apagarObras([id]);
  }
});

test('XG42 valores fora da regra são recusados e nada é gravado', async ({ request }) => {
  await novoAssinanteHomologacao(request, 'auditoria-recusas');
  const id = await novaObra(request, 'E2E auditoria recusas');
  try {
    expect((await request.patch(`/api/obras/${id}`, { data: { valorTotal: '1500.50' } })).status()).toBe(200);
    for (const valor of ['12345678901234.00', '-1', '1.234', '1.000,00', 'abc']) {
      expect((await request.patch(`/api/obras/${id}`, { data: { valorTotal: valor } })).status(), valor).toBe(400);
    }
    expect((await (await request.get(`/api/obras/${id}`)).json()).valorTotal).toBe('1500.50');

    for (const valor of [0, -5, 0.001, 1_000_000_000]) {
      const r = await request.post(`/api/obras/${id}/financeiro`, {
        data: { tipo: 'entrada', descricao: 'Inválido', valor, data: HOJE },
      });
      expect(r.status(), String(valor)).toBe(400);
    }
    const semCategoria = await request.post(`/api/obras/${id}/financeiro`, {
      data: { tipo: 'saida', descricao: 'Sem categoria', valor: 10, data: HOJE },
    });
    expect(semCategoria.status()).toBe(400);
    expect((await (await request.get(`/api/obras/${id}/financeiro`)).json()).rows).toHaveLength(0);

    for (const valor of [0, 0.001, 1_000_000_000]) {
      const r = await request.post(`/api/obras/${id}/aditivos`, { data: { descricao: 'Inválido', valor, data: HOJE } });
      expect(r.status(), String(valor)).toBe(400);
    }
    expect((await (await request.get(`/api/obras/${id}/aditivos`)).json()).rows).toHaveLength(0);

    for (const [campo, valor] of [
      ['nome', ''], ['nome', 'ab'], ['areaM2', '100000000'], ['areaM2', '-1'], ['areaM2', 'abc'],
      ['cep', '123'], ['uf', 'XXX'],
    ]) {
      const r = await request.patch(`/api/obras/${id}`, { data: { [campo]: valor } });
      expect(r.status(), `${campo}=${valor}`).toBe(400);
    }
    expect((await (await request.get(`/api/obras/${id}`)).json()).nome).toBe('E2E auditoria recusas');
  } finally {
    await apagarObras([id]);
  }
});

test('XG42 informações e endereço da obra voltam iguais depois de salvar', async ({ request }) => {
  await novoAssinanteHomologacao(request, 'auditoria-campos');
  const id = await novaObra(request, 'E2E auditoria campos');
  try {
    const dados = {
      nome: 'E2E auditoria editada', tipo: 'Reforma', descricao: 'Escopo', areaM2: '1200.50',
      dataInicio: '2026-11-01', dataPrevisao: '2027-06-30', cep: '01310-100',
      endereco: 'Av. Paulista', numero: '1000', complemento: 'Sala 2', cidade: 'São Paulo', uf: 'SP',
    };
    const r = await request.patch(`/api/obras/${id}`, { data: dados });
    expect(r.status(), await r.text()).toBe(200);
    expect(await (await request.get(`/api/obras/${id}`)).json()).toMatchObject(dados);
    const limpar = await request.patch(`/api/obras/${id}`, { data: { areaM2: null, complemento: null } });
    expect(limpar.status(), await limpar.text()).toBe(200);
    expect(await (await request.get(`/api/obras/${id}`)).json()).toMatchObject({ areaM2: null, complemento: null });
  } finally {
    await apagarObras([id]);
  }
});

test('XG42 abas operacionais: criar, ler, editar e excluir persistem de verdade', async ({ request }) => {
  await novoAssinanteHomologacao(request, 'auditoria-abas');
  const id = await novaObra(request, 'E2E auditoria abas');
  const casos: Array<{ aba: string; criar: Record<string, unknown>; editar?: Record<string, unknown>; excluir: boolean }> = [
    { aba: 'etapas', criar: { nome: 'Etapa', dataInicio: '2026-11-03T12:00:00.000Z', prazo: '2026-12-03T12:00:00.000Z' }, editar: { nome: 'Etapa editada' }, excluir: true },
    { aba: 'tarefas', criar: { titulo: 'Tarefa', prioridade: 'alta', progresso: 10 }, editar: { progresso: 55, status: 'em_andamento' }, excluir: true },
    { aba: 'diario', criar: { texto: 'Registro do dia' }, excluir: true },
    { aba: 'checklists', criar: { nome: 'Checklist', itens: [{ titulo: 'Item 1' }, { titulo: 'Item 2' }] }, editar: { nome: 'Checklist editado' }, excluir: true },
    { aba: 'anexos', criar: { linkUrl: 'https://example.com/a.pdf', titulo: 'Documento', tipo: 'contrato' }, excluir: true },
    { aba: 'ocorrencias', criar: { titulo: 'Problema', descricao: 'Detalhe', gravidade: 'baixo' }, excluir: false },
    { aba: 'equipe', criar: { nome: 'Pessoa', papel: 'Mestre' }, editar: { papel: 'Encarregado' }, excluir: true },
  ];
  try {
    for (const caso of casos) {
      const criado = await request.post(`/api/obras/${id}/${caso.aba}`, { data: caso.criar });
      expect(criado.status(), `${caso.aba}: ${await criado.text()}`).toBe(201);
      const itemId = (await criado.json()).id as string;
      expect(await (await request.get(`/api/obras/${id}/${caso.aba}`)).text(), caso.aba).toContain(itemId);
      if (caso.editar) {
        const editado = await request.patch(`/api/obras/${id}/${caso.aba}/${itemId}`, { data: caso.editar });
        expect(editado.status(), `${caso.aba}: ${await editado.text()}`).toBe(200);
        expect(await editado.json(), caso.aba).toMatchObject(caso.editar);
      }
      if (caso.excluir) {
        const excluido = await request.delete(`/api/obras/${id}/${caso.aba}/${itemId}`);
        expect([200, 204], caso.aba).toContain(excluido.status());
        expect(await (await request.get(`/api/obras/${id}/${caso.aba}`)).text(), caso.aba).not.toContain(itemId);
      }
    }
    const { rows } = await (await request.get(`/api/obras/${id}/ocorrencias`)).json();
    const resolvida = await request.post(`/api/obras/${id}/ocorrencias/${rows[0].id}/resolver`, { data: {} });
    expect(resolvida.status(), await resolvida.text()).toBe(200);
    const depois = await (await request.get(`/api/obras/${id}/ocorrencias`)).json();
    expect(depois.rows[0].status).not.toBe('aberta');

    for (const [aba, invalido] of [
      ['etapas', { nome: 'x' }], ['tarefas', { titulo: '' }], ['diario', { texto: 'x' }],
      ['ocorrencias', { titulo: 'a', descricao: 'b' }], ['checklists', { nome: 'ck', itens: [] }],
      ['anexos', { titulo: 'x' }], ['equipe', { nome: '' }],
    ] as const) {
      expect((await request.post(`/api/obras/${id}/${aba}`, { data: invalido })).status(), aba).toBe(400);
    }
  } finally {
    await apagarObras([id]);
  }
});

test('XG42 somente leitura bloqueia toda escrita das abas e mantém a leitura', async ({ request }) => {
  const { userId } = await novoAssinanteHomologacao(request, 'auditoria-leitura');
  const id = await novaObra(request, 'E2E auditoria leitura');
  try {
    await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - 60_000) }).where(and(
      eq(assinaturas.userId, userId), eq(assinaturas.gatewayProvider, 'trial'),
    ));
    const escritas: Array<[string, string]> = [
      ['post', '/api/xgestao/obras'], ['patch', `/api/obras/${id}`], ['delete', `/api/obras/${id}`],
      ...['financeiro', 'aditivos', 'etapas', 'tarefas', 'diario', 'ocorrencias', 'checklists', 'anexos', 'equipe', 'fotos']
        .map((aba): [string, string] => ['post', `/api/obras/${id}/${aba}`]),
      ['post', `/api/xgestao/obras/${id}/share`], ['post', '/api/xgestao/membros'],
    ];
    for (const [metodo, url] of escritas) {
      const r = await request[metodo as 'post'](url, { data: {} });
      expect(r.status(), `${metodo} ${url}`).toBe(403);
      expect(await r.json()).toMatchObject({ code: 'XGESTAO_SOMENTE_LEITURA' });
    }
    const medicao = await request.post('/api/empreiteiro/medicoes', {
      data: { obraId: id, etapa: 'Etapa', percentual: 10, requestId: crypto.randomUUID() },
    });
    expect(medicao.status(), await medicao.text()).toBe(403);
    for (const url of [`/api/obras/${id}`, `/api/empreiteiro/minhas-obras/${id}`, '/api/empreiteiro/minhas-obras', `/api/obras/${id}/financeiro`, `/api/obras/${id}/aditivos`]) {
      expect((await request.get(url)).status(), url).toBe(200);
    }
    const detalhe = await (await request.get(`/api/empreiteiro/minhas-obras/${id}`)).json();
    expect(detalhe.permissoesXgestao.somenteLeitura).toBe(true);
  } finally {
    await apagarObras([id]);
  }
});

test('XG42 membro limitado a mão de obra não toca no contrato, mas edita o que pode', async ({ request, playwright, baseURL }) => {
  await novoAssinanteHomologacao(request, 'auditoria-membro');
  const id = await novaObra(request, 'E2E auditoria membro');
  const aditivoDono = await request.post(`/api/obras/${id}/aditivos`, { data: { descricao: 'Do dono', valor: 100, data: HOJE } });
  expect(aditivoDono.status(), await aditivoDono.text()).toBe(201);
  const aditivoId = (await aditivoDono.json()).id;
  expect((await request.patch(`/api/obras/${id}`, { data: { valorTotal: '9000.00' } })).status()).toBe(200);

  const email = uniqueEmail('xg42-mao-de-obra');
  const convite = await request.post('/api/xgestao/membros', {
    data: {
      nome: 'Mão de obra', email, papel: 'colaborador',
      obras: [{ obraId: id, permissao: 'editar' }],
      categoriasFinanceiroPermitidas: ['mao_de_obra'],
    },
  });
  expect(convite.status(), await convite.text()).toBe(201);
  const capturados = await fetchCapturedEmails(request, email);
  const setupUrl = capturados.find((item) => item.meta?.kind === 'password-setup')?.meta?.setupUrl as string;
  const membro = await playwright.request.newContext({ baseURL });
  try {
    const definir = await membro.post('/api/auth/definir-senha-inicial', {
      data: { token: new URL(setupUrl).searchParams.get('token'), password: SENHA, confirmPassword: SENHA },
    });
    expect(definir.status(), await definir.text()).toBe(200);
    await loginAs(membro, email, SENHA);
    expect((await (await membro.get('/api/auth/me')).json()).onboardingConcluido).toBe(true);

    expect((await membro.get(`/api/obras/${id}/aditivos`)).status()).toBe(403);
    expect((await membro.post(`/api/obras/${id}/aditivos`, { data: { descricao: 'Tentativa', valor: 1, data: HOJE } })).status()).toBe(403);
    expect((await membro.patch(`/api/obras/${id}/aditivos/${aditivoId}`, { data: { valor: 1 } })).status()).toBe(403);
    expect((await membro.delete(`/api/obras/${id}/aditivos/${aditivoId}`)).status()).toBe(403);
    expect((await membro.patch(`/api/obras/${id}`, { data: { valorTotal: '1.00' } })).status()).toBe(403);
    const obra = await (await membro.get(`/api/obras/${id}`)).json();
    expect(obra).not.toHaveProperty('valorTotal');

    // É o que o modal envia para esse membro: sem o valor, a edição funciona.
    const editar = await membro.patch(`/api/obras/${id}`, { data: { nome: 'E2E nome pelo membro', tipo: 'Reforma' } });
    expect(editar.status(), await editar.text()).toBe(200);
    const saida = await membro.post(`/api/obras/${id}/financeiro`, {
      data: { tipo: 'saida', categoria: 'mao_de_obra', descricao: 'Pagamento', valor: 100, data: HOJE },
    });
    expect(saida.status(), await saida.text()).toBe(201);
    expect((await membro.post(`/api/obras/${id}/financeiro`, {
      data: { tipo: 'entrada', descricao: 'Não pode', valor: 1, data: HOJE },
    })).status()).toBe(403);

    const doDono = await (await request.get(`/api/obras/${id}`)).json();
    expect(doDono).toMatchObject({ valorTotal: '9000.00', nome: 'E2E nome pelo membro' });
    expect((await (await request.get(`/api/obras/${id}/aditivos`)).json()).rows).toHaveLength(1);
  } finally {
    await membro.dispose();
    await apagarObras([id]);
  }
});

test('XG42 link rebaixado para Basic: tela e página pública dizem o mesmo, e as seções seguem editáveis', async ({ request }) => {
  await novoAssinanteHomologacao(request, 'auditoria-link');
  const id = await novaObra(request, 'E2E auditoria link');
  try {
    expect((await request.patch(`/api/obras/${id}`, { data: { valorTotal: '7654321.00' } })).status()).toBe(200);
    const criado = await request.post(`/api/xgestao/obras/${id}/share`, {
      data: { nome: 'Cliente', secoes: { ...SECOES_PADRAO, pagamentos: true } },
    });
    expect(criado.status(), await criado.text()).toBe(201);
    const { share } = await criado.json();
    expect(share.secoes.pagamentos).toBe(true);
    // A aba Pagamentos renderiza no cliente; o valor chega cru no payload da página.
    expect(await (await request.get(share.path)).text()).toContain('7654321');

    await contratar(request, 'basic');
    const estado = await (await request.get(`/api/xgestao/obras/${id}/share`)).json();
    expect(estado).toMatchObject({ limite: 1, valoresPublicos: false });
    expect(estado.shares[0].secoes.pagamentos).toBe(false);
    expect(await (await request.get(share.path)).text()).not.toContain('7654321');

    const alterar = await request.patch(`/api/xgestao/obras/${id}/share/${share.id}`, {
      data: { secoes: { ...estado.shares[0].secoes, fotos: false } },
    });
    expect(alterar.status(), await alterar.text()).toBe(200);
    expect((await alterar.json()).share.secoes).toMatchObject({ fotos: false, pagamentos: false });

    const forcar = await request.patch(`/api/xgestao/obras/${id}/share/${share.id}`, {
      data: { secoes: { ...estado.shares[0].secoes, pagamentos: true } },
    });
    expect(forcar.status()).toBe(403);
    await db.update(obraShareLinks).set({ secoes: { ...SECOES_PADRAO, pagamentos: true } }).where(eq(obraShareLinks.id, share.id));
    expect(await (await request.get(share.path)).text()).not.toContain('7654321');
    expect(((await (await request.get(`/api/xgestao/obras/${id}/share`)).json()).shares[0].secoes.pagamentos)).toBe(false);

    const extra = await request.post(`/api/xgestao/obras/${id}/share`, { data: { nome: 'Outro' } });
    expect(extra.status()).toBe(409);
    expect((await extra.json()).message).toContain('1 link ativo');
  } finally {
    await apagarObras([id]);
  }
});

test('XG42 admin mostra os nomes novos no CSV, na lista e receita só de quem paga', async ({ request, playwright, baseURL }) => {
  const { email, userId } = await novoAssinanteHomologacao(request, 'auditoria-admin');
  const admin = await playwright.request.newContext({ baseURL });
  try {
    await loginAs(admin, SEED_ADMIN_EMAIL);
    const linhaCsv = async () => {
      const csv = await (await admin.get('/api/admin/xgestao/export?tipo=assinantes')).text();
      return csv.split('\n').find((linha) => linha.includes(email)) ?? '';
    };
    const faturamento = async () => (await (await admin.get('/api/admin/xgestao/financeiro')).json()).faturamento;

    const noTeste = await faturamento();
    expect(await linhaCsv()).toContain(';Premium;');
    await contratar(request, 'basic_plus');
    expect(await linhaCsv()).toContain(';Basic Plus;');
    const pagando = await faturamento();
    expect(pagando.receitaRecorrenteMensal - noTeste.receitaRecorrenteMensal).toBeCloseTo(179, 2);
    expect(pagando.assinantesPagantes - noTeste.assinantesPagantes).toBe(1);

    await db.update(assinaturas).set({ status: 'cancelada', canceladaEm: new Date() }).where(and(
      eq(assinaturas.userId, userId), eq(assinaturas.status, 'ativa'),
    ));
    expect(await linhaCsv()).toContain(';Somente leitura;');
    expect((await faturamento()).receitaRecorrenteMensal).toBeCloseTo(noTeste.receitaRecorrenteMensal, 2);
  } finally {
    await admin.dispose();
  }
});

test('XG42 catálogo gravado no banco mostra o texto novo, não o da oferta anterior', async ({ request }) => {
  await novoAssinanteHomologacao(request, 'auditoria-catalogo');
  const planos = await (await request.get('/api/planos?persona=xgestao')).json() as Array<{ tier: PlanoTier; features: string[] }>;
  for (const tier of ['basic', 'basic_plus', 'premium'] as const) {
    expect(planos.find((p) => p.tier === tier)?.features, tier).toEqual(getPlanCatalog('xgestao', tier).features);
  }
});

test('XG42 política de privacidade vigente no banco não cita SINAPI', async () => {
  const [doc] = await db.select({ conteudo: legalDocuments.conteudo }).from(legalDocuments).where(and(
    eq(legalDocuments.tipo, 'privacidade'), eq(legalDocuments.versao, 1),
  ));
  expect(doc.conteudo).not.toMatch(/sinapi/i);
});

test('XG42 Diário: o autor corrige o texto, e a correção chega em toda parte', async ({ request, playwright, baseURL }) => {
  await novoAssinanteHomologacao(request, 'auditoria-diario');
  const id = await novaObra(request, 'E2E auditoria diário');
  const outra = await novaObra(request, 'E2E auditoria diário outra');
  const membro = await playwright.request.newContext({ baseURL });
  try {
    const criado = await request.post(`/api/obras/${id}/diario`, { data: { texto: 'Texto com erro de digitação' } });
    expect(criado.status(), await criado.text()).toBe(201);
    const entrada = (await criado.json()).id as string;
    const url = `/api/obras/${id}/diario/${entrada}`;

    for (const invalido of [{ texto: '' }, { texto: 'x' }, { texto: '  a ' }, { texto: 'a'.repeat(2001) }, {}]) {
      expect((await request.patch(url, { data: invalido })).status(), JSON.stringify(invalido)).toBe(400);
    }
    expect((await request.patch(`/api/obras/${outra}/diario/${entrada}`, { data: { texto: 'Outra obra' } })).status()).toBe(404);

    const editado = await request.patch(url, { data: { texto: '  Texto corrigido pelo autor  ' } });
    expect(editado.status(), await editado.text()).toBe(200);
    expect(await editado.json()).toMatchObject({ id: entrada, texto: 'Texto corrigido pelo autor' });
    const { rows } = await (await request.get(`/api/obras/${id}/diario`)).json();
    expect(rows).toHaveLength(1);
    expect(rows[0].texto).toBe('Texto corrigido pelo autor');

    // O anterior fica só na auditoria; o feed e o link público mostram o corrigido.
    const auditoria = await db.select().from(auditLogs).where(and(
      eq(auditLogs.action, 'obras.diario.update'), sql`${auditLogs.payload}->>'diarioId' = ${entrada}`,
    ));
    expect(auditoria).toHaveLength(1);
    expect(auditoria[0].payload).toMatchObject({ textoAnterior: 'Texto com erro de digitação' });
    const feed = await db.select().from(atividades).where(and(eq(atividades.obraId, id), eq(atividades.tipo, 'diario_postado')));
    expect(feed.map((a) => a.payload)).toEqual([expect.objectContaining({ diarioId: entrada, preview: 'Texto corrigido pelo autor' })]);
    const link = await request.post(`/api/xgestao/obras/${id}/share`, {
      data: { nome: 'Cliente', secoes: { ...SECOES_PADRAO, diario: true } },
    });
    expect(link.status(), await link.text()).toBe(201);
    const pagina = await (await request.get((await link.json()).share.path)).text();
    expect(pagina).toContain('Texto corrigido pelo autor');
    expect(pagina).not.toContain('erro de digitação');

    // Quem não escreveu não altera, mesmo com permissão de editar a obra.
    const email = uniqueEmail('xg42-diario');
    const convite = await request.post('/api/xgestao/membros', {
      data: { nome: 'Membro', email, papel: 'colaborador', obras: [{ obraId: id, permissao: 'editar' }] },
    });
    expect(convite.status(), await convite.text()).toBe(201);
    const capturados = await fetchCapturedEmails(request, email);
    const setupUrl = capturados.find((item) => item.meta?.kind === 'password-setup')?.meta?.setupUrl as string;
    expect((await membro.post('/api/auth/definir-senha-inicial', {
      data: { token: new URL(setupUrl).searchParams.get('token'), password: SENHA, confirmPassword: SENHA },
    })).status()).toBe(200);
    await loginAs(membro, email, SENHA);
    expect((await membro.patch(url, { data: { texto: 'Tentativa do membro' } })).status()).toBe(403);
    const doMembro = await membro.post(`/api/obras/${id}/diario`, { data: { texto: 'Registro do membro' } });
    expect(doMembro.status(), await doMembro.text()).toBe(201);
    const proprio = await membro.patch(`/api/obras/${id}/diario/${(await doMembro.json()).id}`, { data: { texto: 'Registro do membro corrigido' } });
    expect(proprio.status(), await proprio.text()).toBe(200);
    expect((await request.patch(`/api/obras/${id}/diario/${(await doMembro.json()).id}`, { data: { texto: 'Dono tentando' } })).status()).toBe(403);
  } finally {
    await membro.dispose();
    await apagarObras([id, outra]);
  }
});

test('XG42 Diário: somente leitura não edita, e a leitura continua', async ({ request }) => {
  const { userId } = await novoAssinanteHomologacao(request, 'auditoria-diario-leitura');
  const id = await novaObra(request, 'E2E auditoria diário leitura');
  try {
    const criado = await request.post(`/api/obras/${id}/diario`, { data: { texto: 'Registro original' } });
    const entrada = (await criado.json()).id as string;
    await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - 60_000) }).where(eq(assinaturas.userId, userId));
    const r = await request.patch(`/api/obras/${id}/diario/${entrada}`, { data: { texto: 'Não pode' } });
    expect(r.status()).toBe(403);
    expect(await r.json()).toMatchObject({ code: 'XGESTAO_SOMENTE_LEITURA' });
    expect((await (await request.get(`/api/obras/${id}/diario`)).json()).rows[0].texto).toBe('Registro original');
  } finally {
    await apagarObras([id]);
  }
});

test('XG42 Diário: a edição não existe para obra do marketplace', async ({ request }) => {
  const obra = await criarObraVinculadaE2E('xg42-diario');
  try {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const criado = await request.post(`/api/obras/${obra.obraId}/diario`, { data: { texto: 'Registro no marketplace' } });
    expect(criado.status(), await criado.text()).toBe(201);
    const entrada = (await criado.json()).id as string;
    expect((await request.patch(`/api/obras/${obra.obraId}/diario/${entrada}`, { data: { texto: 'Editado' } })).status()).toBe(403);
    const { rows } = await (await request.get(`/api/obras/${obra.obraId}/diario`)).json();
    expect(rows.find((row: { id: string }) => row.id === entrada).texto).toBe('Registro no marketplace');
    // A exclusão continua funcionando lá como antes.
    expect((await request.delete(`/api/obras/${obra.obraId}/diario/${entrada}`)).status()).toBe(200);
    await logout(request);
  } finally {
    await limparObraVinculadaE2E(obra.obraId);
  }
});

test('XG42 Tarefas não aparece no link, nem em link antigo que tinha a seção ligada', async ({ request }) => {
  await novoAssinanteHomologacao(request, 'auditoria-tarefas');
  const id = await novaObra(request, 'E2E auditoria tarefas');
  try {
    const tarefa = await request.post(`/api/obras/${id}/tarefas`, { data: { titulo: 'Pendência interna E2E', prioridade: 'alta' } });
    expect(tarefa.status(), await tarefa.text()).toBe(201);
    const link = await request.post(`/api/xgestao/obras/${id}/share`, {
      data: { nome: 'Cliente', secoes: { ...SECOES_PADRAO, tarefas: true } },
    });
    expect(link.status(), await link.text()).toBe(201);
    const { share } = await link.json();
    const pagina = await (await request.get(share.path)).text();
    expect(pagina).toContain('E2E auditoria tarefas');
    expect(pagina).not.toContain('Pendência interna E2E');
    expect(pagina).not.toContain('>Tarefas<');
  } finally {
    await apagarObras([id]);
  }
});
