import { expect, test, type APIRequestContext } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturas, financeiro, obraShareLinks, obras } from '@shared/db/schema';
import { SECOES_PADRAO } from '@features/xgestao/obra-publica/secoes';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';

/** XG43 — o teste só vira somente leitura 24h após o fim; aqui venceu há 24h + 1 min. */
const FIM_TESTE_MAIS_TOLERANCIA_MS = 24 * 60 * 60_000 + 60_000;
const ENDERECO = 'Rua das Flores Secretas, 4567 - Apto 89, Vila Mariana, 04101-000';

async function apagarObras(ids: string[]) {
  for (const id of ids) {
    await db.delete(financeiro).where(eq(financeiro.obraId, id));
    await db.delete(obras).where(eq(obras.id, id));
  }
}

async function obraComLink(request: APIRequestContext, nome: string) {
  const r = await request.post('/api/xgestao/obras', { data: { nome, endereco: ENDERECO, cidade: 'São Paulo', uf: 'SP' } });
  expect(r.status(), await r.text()).toBe(201);
  const obraId = (await r.json()).id as string;
  const link = await request.post(`/api/xgestao/obras/${obraId}/share`, {
    data: { nome: 'Cliente', secoes: { ...SECOES_PADRAO, localizacao: true } },
  });
  expect(link.status(), await link.text()).toBe(201);
  const share = (await link.json()).share as { id: string; path: string };
  return { obraId, share };
}

test('PUB-01/PUB-06: endereço sem número, complemento e CEP, e headers de proteção', async ({ request }) => {
  await novoAssinanteHomologacao(request, 'link-endereco');
  const { obraId, share } = await obraComLink(request, 'E2E link endereço');
  try {
    const resposta = await request.get(share.path);
    expect(resposta.status()).toBe(200);
    const html = await resposta.text();
    expect(html).toContain('Rua das Flores Secretas');
    expect(html).toContain('Vila Mariana');
    for (const proibido of ['4567', 'Apto 89', '04101-000', '04101000']) expect(html).not.toContain(proibido);

    const headers = resposta.headers();
    expect(headers['x-robots-tag']).toContain('noindex');
    expect(headers['referrer-policy']).toBe('no-referrer');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");

    // PUB-03: token malformado é 404 e não chega ao rate limit nem ao banco.
    expect((await request.get('/publico/obra/curto')).status()).toBe(404);
    const notFound = await request.get(`/publico/obra/${'x'.repeat(43)}`);
    expect(notFound.status()).toBe(404);
    expect(notFound.headers()['x-robots-tag']).toContain('noindex');
  } finally {
    await apagarObras([obraId]);
  }
});

test('link do cliente fica fora do ar com a conta em somente leitura e volta ao regularizar', async ({ request }) => {
  const { userId } = await novoAssinanteHomologacao(request, 'link-vencido');
  const { obraId, share } = await obraComLink(request, 'E2E Obra Nome Sigiloso');
  const [trial] = await db.select().from(assinaturas).where(eq(assinaturas.userId, userId));
  try {
    expect(await (await request.get(share.path)).text()).toContain('E2E Obra Nome Sigiloso');
    const [antes] = await db.select({ v: obraShareLinks.visualizacoes }).from(obraShareLinks).where(eq(obraShareLinks.id, share.id));

    await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - FIM_TESTE_MAIS_TOLERANCIA_MS) })
      .where(eq(assinaturas.userId, userId));
    const fora = await request.get(share.path);
    expect(fora.status()).toBe(200);
    const html = await fora.text();
    expect(html).toContain('Esta obra não está disponível no momento');
    expect(html).toContain('Fale com o responsável pela obra para mais informações.');
    expect(html).toMatch(/<meta name="robots" content="noindex, ?nofollow"/);
    for (const vazamento of ['E2E Obra Nome Sigiloso', 'Rua das Flores Secretas', 'Vila Mariana', 'São Paulo']) {
      expect(html, vazamento).not.toContain(vazamento);
    }
    for (const termo of ['pagamento', 'Pagamento', 'Assine', 'vencid', 'inadimpl']) {
      expect(html, termo).not.toContain(termo);
    }
    // Aviso não conta como visualização da obra.
    await new Promise((r) => setTimeout(r, 300));
    const [durante] = await db.select({ v: obraShareLinks.visualizacoes }).from(obraShareLinks).where(eq(obraShareLinks.id, share.id));
    expect(durante.v).toBe(antes.v);

    await db.update(assinaturas).set({ renovaEm: trial.renovaEm }).where(eq(assinaturas.id, trial.id));
    const volta = await (await request.get(share.path)).text();
    expect(volta).toContain('E2E Obra Nome Sigiloso');
    expect(volta).not.toContain('Esta obra não está disponível no momento');
  } finally {
    await apagarObras([obraId]);
  }
});
