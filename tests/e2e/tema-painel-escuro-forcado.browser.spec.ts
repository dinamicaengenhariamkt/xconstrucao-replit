import { expect, test } from '@playwright/test';
import { novoAssinanteHomologacao } from './helpers-xgestao-homologacao';
import { estadoDoTema, fecharDocumentosLegais, pixelNaTela, pularTourEAvisos } from './helpers-tema-painel';

/**
 * PRD 55 — o "escuro forçado" do navegador do celular (Chrome Android, Samsung,
 * Xiaomi) invertia o painel por conta própria e a logo preta sumia
 * (`ajustes/pwa-xcon.jpeg`). Aqui o Chromium roda com essa inversão ligada.
 *
 * - Claro escolhido: o navegador não pode inverter (fundo branco de verdade).
 * - Automático com o celular escuro: entra o nosso escuro, com a logo clara.
 */
const origemUI = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '';

test.use({
  colorScheme: 'dark',
  viewport: { width: 390, height: 844 },
  // Repete o executável do config: `launchOptions` aqui substitui o do projeto inteiro.
  launchOptions: {
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    args: ['--enable-features=WebContentsForceDark', '--force-dark-mode'],
  },
});

test('escuro forçado do navegador: Claro fica claro e o Automático usa o nosso escuro com a logo visível', async ({ page }) => {
  test.setTimeout(120_000);
  await novoAssinanteHomologacao(page.request, 'tema-forcado');
  await pularTourEAvisos(page);
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('tema-forcado-preparado')) {
      localStorage.setItem('xgestao-painel-tema', 'claro');
      sessionStorage.setItem('tema-forcado-preparado', '1');
    }
  });

  await page.goto(`${origemUI}/xgestao/dashboard`);
  await fecharDocumentosLegais(page);
  await expect.poll(() => estadoDoTema(page)).toEqual({ escuro: false, painel: true, colorScheme: 'only light' });
  // Ponto no respiro à esquerda da página (fora de cartão e dos selos do Replit): branco/cinza-claro, não o 18,18,18 da inversão.
  const fundoClaro = await pixelNaTela(page, 4, 600);
  expect(Math.min(...fundoClaro), `fundo no claro: ${fundoClaro}`).toBeGreaterThan(200);

  await page.evaluate(() => localStorage.setItem('xgestao-painel-tema', 'automatico'));
  await page.reload();
  await expect.poll(() => estadoDoTema(page)).toEqual({ escuro: true, painel: true, colorScheme: 'dark' });
  const fundoEscuro = await pixelNaTela(page, 4, 600);
  // #1C1F22 = 28,31,34: o nosso escuro, não a inversão do navegador.
  expect(fundoEscuro.every((v, i) => Math.abs(v - [28, 31, 34][i]) <= 6), `fundo no escuro: ${fundoEscuro}`).toBe(true);

  // A logo fica no menu lateral (gaveta no celular): abre e confere que ela aparece clara.
  await page.locator('[data-sidebar="trigger"]').click();
  const logo = page.locator('[data-sidebar="sidebar"][data-mobile="true"] img[alt="XConstrução"]');
  await expect(logo).toBeVisible();
  expect(await logo.evaluate((img) => getComputedStyle(img).filter)).toContain('invert');
});
