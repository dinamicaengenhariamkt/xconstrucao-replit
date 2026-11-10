import { expect, test, type APIRequestContext } from '@playwright/test';
import { and, eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturaEventos, assinaturas, financeiro, obraAnexos, obraEquipe, obras } from '@shared/db/schema';
import { expirarTestesVencidos } from '@features/xgestao/teste/server/teste-service';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';
import { somarMeses } from '@features/xgestao/lib/acesso-plano';

async function perfil(request: APIRequestContext) {
  const resposta = await request.get('/api/perfil/plano?persona=xgestao');
  expect(resposta.status(), await resposta.text()).toBe(200);
  return resposta.json();
}

const DIA_MS = 24 * 60 * 60_000;

test.describe('XG35/XG43 — Basic por 90 dias, sem apagar dados ou assinatura paga', () => {
  test('início voluntário concorrente, fim persistente e somente leitura uma única vez', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'trial-free', { iniciarTeste: false });
    const antes = await perfil(request);
    expect(antes.plano).toBe('free');
    expect(antes.teste).toMatchObject({
      elegivel: true, emTeste: false, duracaoDias: 90, tierTeste: 'basic',
    });
    expect(await db.select().from(assinaturas).where(eq(assinaturas.userId, userId))).toHaveLength(0);

    const inicio = Date.now();
    const tentativas = await Promise.all([
      request.post('/api/xgestao/teste'),
      request.post('/api/xgestao/teste'),
    ]);
    expect(tentativas.map((resposta) => resposta.status()).sort()).toEqual([201, 409]);
    const durante = await perfil(request);
    expect(durante.plano).toBe('basic');
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
    // XG43 — 1 min depois do fim: ainda nas 24h de tolerância, segue editando.
    await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - 60_000) })
      .where(and(eq(assinaturas.id, trial.id), eq(assinaturas.userId, userId)));
    const tolerancia = await perfil(request);
    expect(tolerancia).toMatchObject({ plano: 'basic', somenteLeitura: false });
    expect(tolerancia.teste).toMatchObject({ emTeste: true, emTolerancia: true, diasRestantes: 0 });
    expect(new Date(tolerancia.teste.bloqueioEm).getTime() - new Date(tolerancia.teste.fimTeste).getTime()).toBe(DIA_MS);
    const naTolerancia = await request.patch(`/api/obras/${obraId}`, { data: { nome: 'E2E Homologação preservada após teste' } });
    expect(naTolerancia.status(), await naTolerancia.text()).toBe(200);
    // Passadas as 24h: somente leitura.
    await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - DIA_MS - 60_000) })
      .where(and(eq(assinaturas.id, trial.id), eq(assinaturas.userId, userId)));
    const encerrado = await perfil(request);
    expect(encerrado.plano).toBe('free');
    expect(encerrado.somenteLeitura).toBe(true);
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
    expect(limpar.status(), await limpar.text()).toBe(403);
    await db.delete(obras).where(eq(obras.id, obraId));
  });

  test('compra no teste ganha +1 mês, sobrevive ao prazo antigo e o cancelamento vale até o fim do período', async ({ request }) => {
    const { userId } = await novoAssinanteHomologacao(request, 'trial-pago', { iniciarTeste: false });
    expect((await request.post('/api/xgestao/teste')).status()).toBe(201);
    const [trial] = await db.select().from(assinaturas).where(and(
      eq(assinaturas.userId, userId), eq(assinaturas.gatewayProvider, 'trial'),
    ));
    const catalogo = await request.get('/api/planos?persona=xgestao');
    const basic = (await catalogo.json() as Array<{ id: string; tier: string }>).find((plano) => plano.tier === 'basic')!;
    const checkout = await request.post('/api/assinaturas/checkout', {
      data: { planoId: basic.id, ciclo: 'mensal', persona: 'xgestao' },
    });
    expect(checkout.status(), await checkout.text()).toBe(201);
    const ativado = await checkout.json();
    expect(ativado).toMatchObject({ kind: 'activated' });
    // XG43 — +1 mês: a 1ª cobrança é 1 mês de calendário após o fim do teste.
    const esperado = somarMeses(trial.renovaEm!, 1);
    expect(ativado.primeiraCobrancaEm).toBe(esperado.toISOString());
    const [paga] = await db.select().from(assinaturas).where(and(
      eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao'), eq(assinaturas.status, 'ativa'),
    ));
    expect(paga.renovaEm!.toISOString()).toBe(esperado.toISOString());
    // Nada foi cobrado agora: sem receita no caixa até a 1ª cobrança.
    expect(await db.select().from(financeiro).where(and(
      eq(financeiro.origemTipo, 'assinatura'), eq(financeiro.origemId, paga.id),
    ))).toHaveLength(0);
    expect((await db.select().from(assinaturas).where(eq(assinaturas.id, trial.id)))[0].status).toBe('cancelada');
    // Este checkout é manual, NÃO comprova pagamento ou webhook do Asaas.
    const fimTesteAntigo = new Date(Date.now() - DIA_MS - 60_000);
    await db.update(assinaturas).set({ renovaEm: fimTesteAntigo })
      .where(and(eq(assinaturas.id, trial.id), eq(assinaturas.userId, userId)));
    // A assinatura paga guarda o fim do teste de origem (regra do bônus de 10/11/2026).
    expect(paga.fimTesteEm!.toISOString()).toBe(trial.renovaEm!.toISOString());
    await db.update(assinaturas).set({ fimTesteEm: fimTesteAntigo }).where(eq(assinaturas.id, paga.id));
    await expirarTestesVencidos(userId);
    expect((await perfil(request)).plano).toBe('basic');
    expect((await perfil(request)).teste.avisoFimPendente).toBe(false);
    const ativas = await db.select().from(assinaturas).where(and(
      eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao'), eq(assinaturas.status, 'ativa'),
    ));
    expect(ativas).toHaveLength(1);
    expect(ativas[0].gatewayProvider).toBe('manual');
    // 10/11/2026 — no mês bônus e sem 1º pagamento: acesso por 24h a partir
    // do cancelamento (não até a 1ª cobrança), sem nova cobrança.
    const antesDeCancelar = Date.now();
    const cancelar = await request.post('/api/assinaturas/cancelar', { data: { persona: 'xgestao' } });
    expect(cancelar.status(), await cancelar.text()).toBe(200);
    const { acessoAte } = await cancelar.json() as { ok: boolean; acessoAte: string };
    expect(new Date(acessoAte).getTime()).toBeGreaterThanOrEqual(antesDeCancelar + DIA_MS - 1_000);
    expect(new Date(acessoAte).getTime()).toBeLessThanOrEqual(Date.now() + DIA_MS + 1_000);
    expect(new Date(acessoAte).getTime()).toBeLessThan(esperado.getTime());
    expect(await perfil(request)).toMatchObject({ plano: 'basic', somenteLeitura: false, cancelamentoAgendado: true });
    const repetido = await request.post('/api/assinaturas/cancelar', { data: { persona: 'xgestao' } });
    expect(await repetido.json()).toEqual({ ok: true, acessoAte });
    expect(await db.select().from(assinaturaEventos).where(and(
      eq(assinaturaEventos.assinaturaId, paga.id), eq(assinaturaEventos.tipo, 'cancelamento_agendado'),
    ))).toHaveLength(1);
    // Fim do período pago: somente leitura e o cancelamento é efetivado.
    await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - 60_000) }).where(eq(assinaturas.id, paga.id));
    expect(await perfil(request)).toMatchObject({ plano: 'free', somenteLeitura: true });
    expect((await db.select().from(assinaturas).where(eq(assinaturas.id, paga.id)))[0].status).toBe('cancelada');
    expect(await db.select().from(assinaturaEventos).where(and(
      eq(assinaturaEventos.assinaturaId, paga.id), eq(assinaturaEventos.tipo, 'cancelamento_efetivado'),
    ))).toHaveLength(1);
    expect((await perfil(request)).teste.elegivel).toBe(false);
    expect((await request.post('/api/xgestao/teste')).status()).toBe(409);
    expect((await (await request.get('/api/perfil/plano')).json()).plano).toBe('free');
  });
});