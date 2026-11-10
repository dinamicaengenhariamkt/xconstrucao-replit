import { expect, test } from '@playwright/test';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@shared/db/db';
import {
  financeiro, obraAnexos, obraChecklistItens, obraChecklists, obraEquipe, obraOcorrencias, obras, obraShareLinks, userFiles,
} from '@shared/db/schema';
import { loginAs, SEED_ADMIN_EMAIL } from '../helpers';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';
import { contribuicaoDaConta } from '../helpers-admin-xgestao';

type Linha = Record<string, any>;

test('XG36 indicadores, custo pago, prazo, trial e CSV correspondem aos dados descartáveis', async ({ request, playwright, baseURL }) => {
  const { email, userId } = await novoAssinanteHomologacao(request, 'admin-fechamento');
  const admin = await playwright.request.newContext({ baseURL });
  let obraId: string | undefined;
  try {
    await loginAs(admin, SEED_ADMIN_EMAIL);
    const nome = `E2E ADMIN HOMOLOG ${Date.now()}`;
    const criar = await request.post('/api/xgestao/obras', { data: { nome, endereco: 'Rua de Homologação' } });
    expect(criar.status(), await criar.text()).toBe(201);
    obraId = (await criar.json()).id;
    const antiga = new Date(Date.now() - 400 * 86_400_000);
    const previsao = new Date(Date.now() - 5 * 86_400_000).toISOString().slice(0, 10);
    await db.update(obras).set({
      status: 'em_andamento', createdAt: antiga, dataPrevisao: previsao, valorTotal: '1000',
    }).where(eq(obras.id, obraId!));
    await db.insert(financeiro).values({
      obraId, tipo: 'saida', descricao: 'E2E custo pago verificável',
      valor: '321', data: antiga.toISOString().slice(0, 10),
      // Só a saída paga pelo responsável é custo da empresa no admin.
      status: 'pago', createdAt: antiga, pagadorUserId: userId,
    });
    // TST-19 — o peso desta conta nos indicadores, não "depois - antes" globais.
    const peso = await contribuicaoDaConta(admin, userId, async () => {
      const r = await admin.get('/api/admin/xgestao');
      expect(r.status(), await r.text()).toBe(200);
      const i = (await r.json()).indicadores;
      return { atrasadas: i.obrasAtrasadas, paradas: i.obrasParadas, valorPago: i.valorPago };
    });
    expect(peso).toEqual({ atrasadas: 1, paradas: 1, valorPago: 321 });
    expect((await (await admin.get('/api/admin/xgestao')).json()).indicadores).not.toHaveProperty('progressoMedio');

    const listaResponse = await admin.get(`/api/admin/xgestao/obras?q=${encodeURIComponent(nome)}`);
    expect(listaResponse.status(), await listaResponse.text()).toBe(200);
    const lista = await listaResponse.json();
    const row = lista.rows.find((item: { id: string }) => item.id === obraId);
    expect(row).toMatchObject({ valorPago: 321, dataPrevisao: previsao });
    expect(row).not.toHaveProperty('progresso');
    const detalheResponse = await admin.get(`/api/admin/xgestao/obras/${obraId}`);
    expect(detalheResponse.status(), await detalheResponse.text()).toBe(200);
    expect((await detalheResponse.json()).obra).toMatchObject({ valorPago: 321, dataPrevisao: previsao });

    expect((await request.get('/api/perfil/plano?persona=xgestao')).status()).toBe(200);
    const plano = await request.get('/api/perfil/plano?persona=xgestao');
    const fim = new Date((await plano.json()).teste.fimTeste);
    const detalheAssinanteResponse = await admin.get(`/api/admin/xgestao/assinantes?q=${encodeURIComponent(email)}`);
    expect(detalheAssinanteResponse.status(), await detalheAssinanteResponse.text()).toBe(200);
    const assinantes = await detalheAssinanteResponse.json();
    const assinante = assinantes.rows.find((item: { email: string }) => item.email === email);
    expect(assinante.plano).toMatchObject({ emTeste: true, tier: 'basic' });
    const csvResponse = await admin.get(`/api/admin/xgestao/export?tipo=assinantes&q=${encodeURIComponent(email)}`);
    expect(csvResponse.status(), await csvResponse.text()).toBe(200);
    expect(csvResponse.headers()['content-type']).toContain('text/csv');
    const csv = await csvResponse.text();
    expect(csv).toContain(email);
    expect(csv).toContain('teste grátis');
    expect(csv).toContain(String(fim.getUTCFullYear()));
    expect(csv).not.toContain('E2E ADMIN HOMOLOG'); // exportação de assinantes, não obras.
  } finally {
    if (obraId) await request.delete(`/api/obras/${obraId}`);
    await admin.dispose();
  }
});

/** Dia civil de São Paulo deslocado em `dias`. */
function diaSp(dias: number): string {
  return new Date(Date.now() + dias * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

test('ADM-01/05/09 detalhe administrativo da obra Basic, armazenamento e atrasos calculados na hora', async ({ request, playwright, baseURL }) => {
  test.setTimeout(150_000);
  const { userId } = await novoAssinanteHomologacao(request, 'adm01-obra');
  const admin = await playwright.request.newContext({ baseURL });
  let obraId: string | undefined;
  const arquivos: string[] = [];
  try {
    await loginAs(admin, SEED_ADMIN_EMAIL);
    const criar = await request.post('/api/xgestao/obras', { data: { nome: `E2E ADM01 ${Date.now()}`, endereco: 'Rua Admin, 1' } });
    expect(criar.status(), await criar.text()).toBe(201);
    obraId = (await criar.json()).id as string;
    await db.update(obras).set({ valorTotal: '5000' }).where(eq(obras.id, obraId));

    // Parcela a receber vencida ontem, ainda "pendente" (o job não rodou): atrasada na hora.
    // Conta a pagar vencida, com fornecedor e comprovante; e uma futura, que não atrasa.
    const [comprovante] = await db.insert(userFiles).values({
      ownerUserId: userId, kind: 'comprovante', visibility: 'private', bucketKey: `e2e/adm01/${Date.now()}-comp.pdf`,
      originalName: 'comprovante.pdf', mime: 'application/pdf', sizeBytes: 1500,
    }).returning({ id: userFiles.id });
    const [anexoArquivo] = await db.insert(userFiles).values({
      ownerUserId: userId, kind: 'obra_anexo', visibility: 'private', bucketKey: `e2e/adm01/${Date.now()}-planta.pdf`,
      originalName: 'planta.pdf', mime: 'application/pdf', sizeBytes: 2500,
    }).returning({ id: userFiles.id });
    const [apagado] = await db.insert(userFiles).values({
      ownerUserId: userId, kind: 'obra_anexo', visibility: 'private', bucketKey: `e2e/adm01/${Date.now()}-apagado.pdf`,
      originalName: 'apagado.pdf', mime: 'application/pdf', sizeBytes: 9_000_000, deletedAt: new Date(),
    }).returning({ id: userFiles.id });
    arquivos.push(comprovante.id, anexoArquivo.id, apagado.id);
    await db.insert(financeiro).values([
      { obraId, tipo: 'entrada', descricao: 'E2E parcela 1', valor: '1200', data: diaSp(-10), dataVencimento: diaSp(-1), status: 'pendente', recebedorUserId: userId },
      { obraId, tipo: 'saida', descricao: 'E2E elétrica', valor: '300', data: diaSp(-5), dataVencimento: diaSp(-2), status: 'pendente', pagadorUserId: userId, fornecedorNome: 'Jefferson da elétrica', comprovanteFileId: comprovante.id },
      { obraId, tipo: 'saida', descricao: 'E2E futura', valor: '50', data: diaSp(0), dataVencimento: diaSp(5), status: 'pendente', pagadorUserId: userId },
    ]);
    await db.insert(obraAnexos).values([
      { obraId, fileId: anexoArquivo.id, tipo: 'projeto_arquitetonico', titulo: 'Planta baixa' },
      { obraId, fileId: anexoArquivo.id, tipo: 'outros', titulo: 'Mesma planta de novo' },
      { obraId, fileId: apagado.id, tipo: 'outros', titulo: 'Apagado' },
      { obraId, linkUrl: 'https://drive.example.com/projeto', tipo: 'outros', titulo: 'Drive' },
    ]);
    await db.insert(obraEquipe).values({ obraId, nome: 'Jefferson', papel: 'Eletricista', pixChave: 'jefferson@exemplo.com.br' });
    const [checklist] = await db.insert(obraChecklists).values({ obraId, nome: 'EPIs do dia' }).returning({ id: obraChecklists.id });
    await db.insert(obraChecklistItens).values([
      { checklistId: checklist.id, titulo: 'Capacete', concluida: true, ordem: 0 },
      { checklistId: checklist.id, titulo: 'Luva', concluida: false, ordem: 1 },
    ]);
    await db.insert(obraOcorrencias).values({
      obraId, autorId: userId, titulo: 'E2E vazamento', descricao: 'Cano', gravidade: 'medio', status: 'resolvida',
      resolvidoEm: new Date(), observacaoResolucao: 'Trocado o registro',
    });
    await db.insert(obraShareLinks).values([
      { obraId, token: `e2e-adm01-a-${Date.now()}`, nome: 'Sr. João', criadoPor: userId, secoes: { etapas: true, pagamentos: true } },
      { obraId, token: `e2e-adm01-b-${Date.now()}`, nome: 'Arquiteta', criadoPor: userId, expiraEm: new Date(Date.now() - 60_000) },
      { obraId, token: `e2e-adm01-c-${Date.now()}`, nome: 'Revogado', criadoPor: userId, ativo: false },
    ]);

    const r = await admin.get(`/api/admin/xgestao/obras/${obraId}`);
    expect(r.status(), await r.text()).toBe(200);
    const d = await r.json() as Linha;
    const adm = d.administrativo as Linha;
    // ADM-01 — conta Basic no teste: a parcela aparece (sem o corte do plano), no financeiro e no acompanhamento.
    expect(adm.financeiro.map((l: Linha) => [l.descricao, l.status, l.lado])).toEqual(expect.arrayContaining([
      ['E2E parcela 1', 'atrasado', 'receita'], ['E2E elétrica', 'atrasado', 'custo'], ['E2E futura', 'pendente', 'custo'],
    ]));
    expect(adm.financeiro.find((l: Linha) => l.descricao === 'E2E elétrica').fornecedor).toBe('Jefferson da elétrica');
    expect(d.conteudo.pagamentos.parcelas.map((p: Linha) => p.descricao)).toContain('E2E parcela 1');
    expect(d.conteudo.pagamentos.valorTotal).toBe(5000);
    // PIX mascarado: só o final.
    expect(adm.equipe[0]).toMatchObject({ nome: 'Jefferson', pixMascarado: '•••• m.br' });
    expect(JSON.stringify(d)).not.toContain('jefferson@exemplo.com.br');
    expect(adm.anexos.map((a: Linha) => a.nome)).toEqual(expect.arrayContaining(['Planta baixa', 'Drive']));
    expect(adm.anexos.find((a: Linha) => a.nome === 'Drive').url).toBe('https://drive.example.com/projeto');
    expect(adm.checklists[0]).toMatchObject({ nome: 'EPIs do dia', itens: [{ titulo: 'Capacete', concluida: true }, { titulo: 'Luva', concluida: false }] });
    expect(adm.ocorrencias[0]).toMatchObject({ titulo: 'E2E vazamento', status: 'resolvida', observacaoResolucao: 'Trocado o registro' });
    const links = Object.fromEntries(d.linksPublicos.map((l: Linha) => [l.nome, l]));
    expect(links['Sr. João']).toMatchObject({ status: 'ativo', secoes: expect.arrayContaining(['etapas', 'pagamentos']) });
    expect(links['Arquiteta'].status).toBe('expirado');
    expect(links['Revogado'].status).toBe('revogado');
    expect(d.linkPublico.ativo).toBe(true);

    // ADM-05 — armazenamento: comprovante + planta (uma vez só), sem o apagado.
    const detalhe = await (await admin.get(`/api/admin/xgestao/assinantes/${userId}`)).json() as Linha;
    expect(detalhe.assinante.armazenamentoBytes).toBe(4000);
    const csv = await (await admin.get('/api/admin/xgestao/export?tipo=assinantes')).text();
    expect(csv.split('\r\n')[0]).toContain('Armazenamento (MB)');

    // ADM-09 — atrasos calculados na hora, separados por lado, no detalhe e na home.
    expect(detalhe.assinante.consolidado).toMatchObject({ pagamentosAtrasados: 2, recebimentosAtrasados: 1, contasAPagarAtrasadas: 1 });
    const peso = await contribuicaoDaConta(admin, userId, async () => {
      const t = (await (await admin.get('/api/admin/xgestao')).json()).alertas.totais;
      return { total: t.pagamentosAtrasados, receber: t.recebimentosAtrasados, pagar: t.contasAPagarAtrasadas };
    });
    expect(peso).toEqual({ total: 2, receber: 1, pagar: 1 });

    // ADM-12 — a busca de obras acha pelo nome do link do cliente.
    const busca = await (await admin.get(`/api/admin/xgestao/obras?q=${encodeURIComponent('Sr. João')}`)).json() as Linha;
    expect(busca.rows.map((o: Linha) => o.id)).toContain(obraId);
  } finally {
    if (obraId) {
      await db.delete(obraShareLinks).where(eq(obraShareLinks.obraId, obraId));
      await db.delete(obraAnexos).where(eq(obraAnexos.obraId, obraId));
      await db.delete(financeiro).where(eq(financeiro.obraId, obraId));
      await db.delete(obraOcorrencias).where(eq(obraOcorrencias.obraId, obraId));
      await db.delete(obraEquipe).where(eq(obraEquipe.obraId, obraId));
      await db.delete(obras).where(eq(obras.id, obraId));
    }
    if (arquivos.length) await db.delete(userFiles).where(inArray(userFiles.id, arquivos));
    await admin.dispose();
  }
});
