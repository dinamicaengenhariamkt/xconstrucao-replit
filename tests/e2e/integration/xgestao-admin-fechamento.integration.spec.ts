import { expect, test } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { financeiro, obras } from '@shared/db/schema';
import { loginAs, SEED_ADMIN_EMAIL } from '../helpers';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';

test('XG36 indicadores, custo pago, prazo, trial e CSV correspondem aos dados descartáveis', async ({ request, playwright, baseURL }) => {
  const { email, userId } = await novoAssinanteHomologacao(request, 'admin-fechamento');
  const admin = await playwright.request.newContext({ baseURL });
  let obraId: string | undefined;
  try {
    await loginAs(admin, SEED_ADMIN_EMAIL);
    const antesResponse = await admin.get('/api/admin/xgestao');
    expect(antesResponse.status(), await antesResponse.text()).toBe(200);
    const antes = (await antesResponse.json()).indicadores;
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
    const depoisResponse = await admin.get('/api/admin/xgestao');
    expect(depoisResponse.status(), await depoisResponse.text()).toBe(200);
    const depois = (await depoisResponse.json()).indicadores;
    expect(depois.obrasAtrasadas - antes.obrasAtrasadas).toBe(1);
    expect(depois.obrasParadas - antes.obrasParadas).toBe(1);
    expect(depois.valorPago - antes.valorPago).toBeCloseTo(321);
    expect(depois).not.toHaveProperty('progressoMedio');

    const listaResponse = await admin.get(`/api/admin/xgestao/obras?q=${encodeURIComponent(nome)}`);
    expect(listaResponse.status(), await listaResponse.text()).toBe(200);
    const lista = await listaResponse.json();
    const row = lista.rows.find((item: { id: string }) => item.id === obraId);
    expect(row).toMatchObject({ valorPago: 321, dataPrevisao: previsao });
    expect(row).not.toHaveProperty('progresso');
    const detalheResponse = await admin.get(`/api/admin/xgestao/obras/${obraId}`);
    expect(detalheResponse.status(), await detalheResponse.text()).toBe(200);
    expect((await detalheResponse.json()).obra).toMatchObject({ valorPago: 321, dataPrevisao: previsao });

    expect((await request.post('/api/xgestao/teste')).status()).toBe(201);
    const plano = await request.get('/api/perfil/plano?persona=xgestao');
    const fim = new Date((await plano.json()).teste.fimTeste);
    const detalheAssinanteResponse = await admin.get(`/api/admin/xgestao/assinantes?q=${encodeURIComponent(email)}`);
    expect(detalheAssinanteResponse.status(), await detalheAssinanteResponse.text()).toBe(200);
    const assinantes = await detalheAssinanteResponse.json();
    const assinante = assinantes.rows.find((item: { email: string }) => item.email === email);
    expect(assinante.plano).toMatchObject({ emTeste: true, tier: 'enterprise' });
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