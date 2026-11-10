import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturas, financeiro, obras, userFiles } from '@shared/db/schema';
import { novoAssinanteHomologacao } from './helpers-xgestao-homologacao';

/**
 * E2E-05 — conta vencida (somente leitura) abre a obra e percorre todas as
 * abas sem ver nenhum botão de escrita. A matriz de API
 * (`xgestao-somente-leitura-matriz.integration.spec.ts`) garante o 403; aqui
 * fica a tela: botão que aparece e só falha no clique é bug (E2E-02).
 *
 * Um login pela tela por rodada (limite de 10 por 15 min por IP).
 */
const origemUI = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '';
const HOJE = '2026-11-03';

/** Rótulos de ação de escrita: criar, editar, excluir, enviar arquivo. */
const ESCRITA = /^\s*\+?\s*(adicionar|novo|nova|editar|excluir|remover|enviar|registrar|lançar|upload|trocar capa|gerar link|nova entrada|nova saída)\b/i;

const ABAS = [
  'Etapas', 'Cronograma', 'Fotos', 'Diário', 'Ocorrências',
  'Checklists', 'Documentos', 'Timeline', 'Financeiro',
];

async function criado(request: APIRequestContext, url: string, data: Record<string, unknown>) {
  const r = await request.post(url, { data });
  expect(r.status(), `${url}: ${await r.text()}`).toBe(201);
}

async function entrar(page: Page, email: string, destino: string) {
  await page.addInitScript(() => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function (chave: string) {
      return chave.startsWith('xgestao-tour-') ? '1' : original.call(this, chave);
    };
  });
  await page.goto(`${origemUI}/login?perfil=xgestao&next=${encodeURIComponent(destino)}`);
  await page.getByTestId('input-email').fill(email);
  await page.getByTestId('input-password').fill('Xconstr@E2E2026!');
  await page.waitForTimeout(3500);
  const login = page.waitForResponse(r => r.url().includes('/api/auth/login') && r.request().method() === 'POST');
  await page.getByTestId('button-login').click();
  expect((await login).status()).toBe(200);
  await page.waitForURL('**/xgestao/**');
}

async function dispensarAvisos(page: Page) {
  const legal = page.getByRole('dialog', { name: 'Atualizamos nossos documentos' });
  await legal.waitFor({ state: 'visible', timeout: 3000 }).catch(() => undefined);
  if (await legal.isVisible()) await legal.getByRole('button', { name: 'Agora não' }).click();
  const free = page.getByTestId('button-continuar-free');
  if (await free.isVisible().catch(() => false)) await free.click();
  const oferta = page.getByTestId('button-oferta-agora-nao');
  if (await oferta.isVisible().catch(() => false)) await oferta.click();
}

/** Botões visíveis com rótulo de escrita dentro do escopo. */
async function botoesDeEscrita(page: Page, escopo: string, ignorarDesabilitados = false) {
  const botoes = page.locator(`${escopo} button, ${escopo} a[role="button"]`);
  const rotulos: string[] = [];
  for (const botao of await botoes.all()) {
    if (!(await botao.isVisible())) continue;
    if (ignorarDesabilitados && (await botao.isDisabled())) continue;
    const rotulo = ((await botao.getAttribute('aria-label')) ?? (await botao.innerText())).trim();
    if (ESCRITA.test(rotulo)) rotulos.push(rotulo);
  }
  return rotulos;
}

test.describe('E2E-05 — obra em somente leitura na tela', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('conta vencida percorre as abas sem nenhum botão de escrita', async ({ page, request }) => {
    const { email, userId } = await novoAssinanteHomologacao(request, 'leitura-ui');
    const r = await request.post('/api/xgestao/obras', {
      data: { nome: 'E2E obra somente leitura', endereco: 'Rua Somente Leitura, 1' },
    });
    expect(r.status(), await r.text()).toBe(201);
    const { id: obraId } = (await r.json()) as { id: string };
    try {
      // Um item por aba, para que ações de linha (editar, excluir) existiriam se vazassem.
      const base = `/api/obras/${obraId}`;
      const [foto] = await db.insert(userFiles).values({
        ownerUserId: userId,
        kind: 'obra_foto',
        visibility: 'private',
        bucketKey: `e2e/somente-leitura-ui/${crypto.randomUUID()}`,
        originalName: 'E2E foto.png',
        mime: 'image/png',
        sizeBytes: 1024,
      }).returning({ id: userFiles.id });
      await criado(request, `${base}/etapas`, { nome: 'Etapa E2E leitura', dataInicio: '2026-11-03T12:00:00.000Z', prazo: '2026-12-03T12:00:00.000Z' });
      await criado(request, `${base}/diario`, { texto: 'Registro E2E do dia' });
      await criado(request, `${base}/ocorrencias`, { titulo: 'Problema E2E', descricao: 'Detalhe', gravidade: 'baixo' });
      await criado(request, `${base}/checklists`, { nome: 'Checklist E2E', itens: [{ titulo: 'Item 1' }] });
      await criado(request, `${base}/anexos`, { linkUrl: 'https://example.com/a.pdf', titulo: 'Documento E2E', tipo: 'contrato' });
      await criado(request, `${base}/financeiro`, { tipo: 'saida', categoria: 'material', descricao: 'Material E2E', valor: 100, data: HOJE });
      await criado(request, `${base}/equipe`, { nome: 'Pessoa E2E', papel: 'Mestre' });
      await criado(request, `${base}/fotos`, { fileId: foto!.id });

      // Vence a conta: 24h + 1 min depois do fim do teste (XG43).
      await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - 24 * 60 * 60_000 - 60_000) })
        .where(eq(assinaturas.userId, userId));
      const perfil = await request.get('/api/perfil/plano?persona=xgestao');
      expect(await perfil.json()).toMatchObject({ somenteLeitura: true });

      await entrar(page, email, `/xgestao/obras/${obraId}`);
      await dispensarAvisos(page);
      await expect(page.getByTestId('detalhes-obra-card')).toBeVisible();

      // Cabeçalho e detalhes: nada de editar, excluir, trocar capa ou gerar link.
      for (const id of ['detalhes-editar-informacoes', 'detalhes-excluir-obra', 'xgestao-trocar-capa', 'detalhes-link-gerenciar']) {
        await expect(page.getByTestId(id), id).toHaveCount(0);
      }
      expect(await botoesDeEscrita(page, '[data-testid="detalhes-obra-card"]')).toEqual([]);

      const encontrados: Record<string, string[]> = {};
      const abas = page.locator('[data-tour="abas-obra"]');
      for (const aba of ABAS) {
        const botaoAba = abas.getByRole('button', { name: aba, exact: true });
        if ((await botaoAba.count()) === 0) continue;
        await botaoAba.click();
        const painel = page.locator('[data-tour="painel-aba"]');
        await expect(painel).toBeVisible();
        // Dá tempo às queries da aba antes de procurar botões.
        await page.waitForLoadState('networkidle').catch(() => undefined);
        const achados = await botoesDeEscrita(page, '[data-tour="painel-aba"]');
        const uploads = await painel.locator('input[type="file"]').count();
        if (achados.length || uploads) encontrados[aba] = [...achados, ...(uploads ? [`input file x${uploads}`] : [])];
      }
      // Bloco da equipe e o resto da página (o menu lateral mostra "Nova obra" desabilitado).
      const equipe = await botoesDeEscrita(page, 'main', true);
      if (equipe.length) encontrados.pagina = equipe;
      expect(encontrados).toEqual({});
    } finally {
      await db.delete(financeiro).where(eq(financeiro.obraId, obraId));
      await db.delete(obras).where(eq(obras.id, obraId));
    }
  });
});
