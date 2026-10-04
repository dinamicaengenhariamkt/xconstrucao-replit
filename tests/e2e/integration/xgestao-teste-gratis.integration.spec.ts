import { expect, test, type APIRequestContext } from '@playwright/test';
import { and, eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturaEventos, assinaturas, obraAnexos, obraEquipe, obras } from '@shared/db/schema';
import { expirarTestesVencidos } from '@features/xgestao/teste/server/teste-service';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';

async function perfil(request: APIRequestContext) {
  const resposta = await request.get('/api/perfil/plano?persona=xgestao');
  expect(resposta.status(), await resposta.text()).toBe(200);
  return resposta.json();
}

test.describe('XG35 — Pro por 90 dias, sem apagar dados ou assinatura paga', () => {
  test('início voluntário concorrente, fim persistente e retorno ao Free uma única vez', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'trial-free');
    const antes = await perfil(request);
    expect(antes.plano).toBe('free');
    expect(antes.teste).toMatchObject({
      elegivel: true, emTeste: false, duracaoDias: 90, tierTeste: 'enterprise',
    });
    expect(await db.select().from(assinaturas).where(eq(assinaturas.userId, userId))).toHaveLength(0);

    const inicio = Date.now();
    const tentativas = await Promise.all([
      request.post('/api/xgestao/teste'),
      request.post('/api/xgestao/teste'),
    ]);
    expect(tentativas.map((resposta) => resposta.status()).sort()).toEqual([201, 409]);
    const durante = await perfil(request);
    expect(durante.plano).toBe('enterprise'); // Pro comercial; "pro" interno é Basic.
    expect(durante.teste).toMatchObject({ elegivel: false, emTeste: true, avisoFimPendente: false });
    const fim = new Date(durante.teste.fimTeste).getTime();
    const noventaDias = 90 * 86_400_000;
    expect(fim).toBeGreaterThanOrEqual(inicio + noventaDias);
    expect(fim).toBeLessThanOrEqual(Date.now() + noventaDias);

    const criada = await request.post('/api/xgestao/obras', {
      data: { nome: 'E2E Homologação preservada após teste', endereco: 'Rua de Teste, 90' },
    });
    expect(criada.status(), await criada.text()).toBe(201);
    const { id: obraId } = await criada.json();
    const membro = await request.post(`/api/obras/${obraId}/equipe`, {
      data: { nome: 'E2E Equipe preservada', papel: 'Pintura' },
    });
    expect(membro.status(), await membro.text()).toBe(201);
    const documento = await request.post(`/api/obras/${obraId}/anexos`, {
      data: { linkUrl: 'https://example.com/documento-homologacao.pdf', titulo: 'E2E Documento preservado', tipo: 'outros' },
    });
    expect(documento.status(), await documento.text()).toBe(201);
    const [trial] = await db.select().from(assinaturas).where(and(
      eq(assinaturas.userId, userId), eq(assinaturas.gatewayProvider, 'trial'),
    ));
    // Viaja somente o relógio da assinatura recém-criada, nunca a configuração global.
    await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - 60_000) })
      .where(and(eq(assinaturas.id, trial.id), eq(assinaturas.userId, userId)));
    const encerrado = await perfil(request);
    expect(encerrado.plano).toBe('free');
    expect(encerrado.teste).toMatchObject({ elegivel: false, emTeste: false, avisoFimPendente: true });
    expect((await perfil(request)).teste.avisoFimPendente).toBe(true);
    expect(await db.select().from(obras).where(eq(obras.id, obraId))).toHaveLength(1);
    expect(await db.select().from(obraEquipe).where(eq(obraEquipe.obraId, obraId))).toHaveLength(1);
    expect(await db.select().from(obraAnexos).where(eq(obraAnexos.obraId, obraId))).toHaveLength(1);
    expect(await db.select().from(assinaturaEventos).where(and(
      eq(assinaturaEventos.assinaturaId, trial.id), eq(assinaturaEventos.tipo, 'teste_expirado'),
    ))).toHaveLength(1);
    const repeticao = await request.post('/api/xgestao/teste');
    expect(repeticao.status()).toBe(409);
    expect(await repeticao.json()).toMatchObject({ code: 'JA_USOU_TESTE' });
    const confirmar = await request.post('/api/xgestao/teste/continuar-free');
    expect(confirmar.status(), await confirmar.text()).toBe(200);
    expect((await perfil(request)).teste.avisoFimPendente).toBe(false);
    const marketplace = await request.get('/api/perfil/plano');
    expect((await marketplace.json()).plano).toBe('free');
    // Exclusão somente depois de comprovar preservação, restrita à obra deste teste.
    const limpar = await request.delete(`/api/obras/${obraId}`);
    expect(limpar.status(), await limpar.text()).toBe(200);
  });

  test('compra antecipada sobrevive ao prazo antigo, cancelamento volta ao Free sem novo trial', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'trial-pago');
    expect((await request.post('/api/xgestao/teste')).status()).toBe(201);
    const [trial] = await db.select().from(assinaturas).where(and(
      eq(assinaturas.userId, userId), eq(assinaturas.gatewayProvider, 'trial'),
    ));
    const catalogo = await request.get('/api/planos?persona=xgestao');
    const basic = (await catalogo.json() as Array<{ id: string; tier: string }>).find((plano) => plano.tier === 'pro')!;
    const checkout = await request.post('/api/assinaturas/checkout', {
      data: { planoId: basic.id, ciclo: 'mensal', persona: 'xgestao' },
    });
    expect(checkout.status(), await checkout.text()).toBe(201);
    expect(await checkout.json()).toMatchObject({ kind: 'activated' });
    // Este checkout é manual, NÃO comprova pagamento ou webhook do Asaas.
    await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - 60_000) })
      .where(and(eq(assinaturas.id, trial.id), eq(assinaturas.userId, userId)));
    await expirarTestesVencidos(userId);
    expect((await perfil(request)).plano).toBe('pro');
    expect((await perfil(request)).teste.avisoFimPendente).toBe(false);
    const ativas = await db.select().from(assinaturas).where(and(
      eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao'), eq(assinaturas.status, 'ativa'),
    ));
    expect(ativas).toHaveLength(1);
    expect(ativas[0].gatewayProvider).toBe('manual');
    const cancelar = await request.post('/api/assinaturas/cancelar', { data: { persona: 'xgestao' } });
    expect(cancelar.status(), await cancelar.text()).toBe(200);
    expect((await perfil(request)).plano).toBe('free');
    expect((await perfil(request)).teste.elegivel).toBe(false);
    expect((await request.post('/api/xgestao/teste')).status()).toBe(409);
    expect((await (await request.get('/api/perfil/plano')).json()).plano).toBe('free');
  });
});