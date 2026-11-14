import type { Page } from '@playwright/test';

/**
 * PRD 55 — medições do tema do painel feitas dentro do navegador.
 *
 * O projeto não tem axe instalado; em vez de acrescentar dependência, a regra
 * de contraste do WCAG (AA: 4,5 para texto comum, 3 para texto grande) é
 * calculada aqui. As cores são convertidas por um canvas, que entende oklch e
 * color-mix (o Tailwind v4 usa oklch).
 */
export interface ProblemaContraste {
  texto: string;
  razao: number;
  minimo: number;
  cor: string;
  fundo: string;
  onde: string;
}

export interface SuperficieClara {
  onde: string;
  fundo: string;
  largura: number;
  altura: number;
}

export async function medirTema(page: Page): Promise<{
  contraste: ProblemaContraste[];
  superficiesClaras: SuperficieClara[];
}> {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const cache = new Map<string, [number, number, number, number]>();
    const rgba = (css: string): [number, number, number, number] => {
      const salvo = cache.get(css);
      if (salvo) return salvo;
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#000';
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      const valor: [number, number, number, number] = [r, g, b, a / 255];
      cache.set(css, valor);
      return valor;
    };
    const lum = ([r, g, b]: number[]) => {
      const c = [r, g, b].map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const sobre = (cima: number[], baixo: number[]) => {
      const a = cima[3];
      return [0, 1, 2].map((i) => cima[i] * a + baixo[i] * (1 - a)).concat(1);
    };
    const descrever = (el: Element) => {
      const id = el.getAttribute('data-testid');
      const classe = (el.getAttribute('class') ?? '').split(/\s+/).slice(0, 6).join('.');
      return `${el.tagName.toLowerCase()}${id ? `[data-testid=${id}]` : ''}${classe ? `.${classe}` : ''}`;
    };
    const visivel = (el: Element) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      const st = getComputedStyle(el);
      return st.visibility !== 'hidden' && st.display !== 'none';
    };
    /** Fundo efetivo; `null` quando há imagem ou gradiente no caminho (não dá para medir). */
    const fundoDe = (el: Element): number[] | null => {
      const camadas: number[][] = [];
      let atual: Element | null = el;
      while (atual) {
        const st = getComputedStyle(atual);
        if (st.backgroundImage !== 'none') return null;
        if (Number(st.opacity) < 1 && atual !== document.body) return null;
        const cor = rgba(st.backgroundColor);
        if (cor[3] > 0) {
          camadas.push(cor);
          if (cor[3] >= 1) break;
        }
        atual = atual.parentElement;
      }
      let base = [255, 255, 255, 1];
      for (const camada of camadas.reverse()) base = sobre(camada, base);
      return base;
    };
    const dentroDeExcecao = (el: Element) =>
      Boolean(el.closest('[data-tema-papel], img, svg, video, canvas, [aria-hidden="true"], [disabled], [aria-disabled="true"], .sr-only'));

    const contraste: ProblemaContraste[] = [];
    const vistos = new Set<string>();
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      const temTexto = Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim().length > 0);
      if (!temTexto || !visivel(el) || dentroDeExcecao(el)) continue;
      const st = getComputedStyle(el);
      const fundo = fundoDe(el);
      if (!fundo) continue;
      const corTexto = sobre(rgba(st.color), fundo);
      const l1 = lum(corTexto);
      const l2 = lum(fundo);
      const razao = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const px = parseFloat(st.fontSize);
      const negrito = Number(st.fontWeight) >= 700;
      const minimo = px >= 24 || (negrito && px >= 18.66) ? 3 : 4.5;
      if (razao + 0.01 < minimo) {
        const texto = el.textContent!.trim().replace(/\s+/g, ' ').slice(0, 40);
        const chave = `${descrever(el)}|${texto}`;
        if (vistos.has(chave)) continue;
        vistos.add(chave);
        contraste.push({
          texto,
          razao: Math.round(razao * 100) / 100,
          minimo,
          cor: `rgb(${corTexto.slice(0, 3).map(Math.round).join(',')})`,
          fundo: `rgb(${fundo.slice(0, 3).map(Math.round).join(',')})`,
          onde: descrever(el),
        });
      }
    }

    // Botão primário no escuro é claro de propósito (branco com texto escuro, como no site).
    const sonda = document.createElement('div');
    sonda.style.background = 'hsl(var(--primary))';
    document.body.appendChild(sonda);
    const primario = rgba(getComputedStyle(sonda).backgroundColor).slice(0, 3).join(',');
    sonda.remove();
    const superficiesClaras: SuperficieClara[] = [];
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      if (!visivel(el) || dentroDeExcecao(el)) continue;
      const cor = rgba(getComputedStyle(el).backgroundColor);
      // Selo colorido (amarelo do "Mais popular", por exemplo) não é cartão esquecido: só cinza/branco conta.
      const saturado = Math.max(cor[0], cor[1], cor[2]) - Math.min(cor[0], cor[1], cor[2]) > 40;
      if (cor[3] < 0.9 || lum(cor) < 0.5 || saturado || cor.slice(0, 3).join(',') === primario) continue;
      const r = el.getBoundingClientRect();
      if (r.width * r.height < 1500) continue;
      superficiesClaras.push({
        onde: descrever(el),
        fundo: `rgb(${cor.slice(0, 3).join(',')})`,
        largura: Math.round(r.width),
        altura: Math.round(r.height),
      });
    }
    return { contraste, superficiesClaras };
  });
}

/** Cor de um pixel do que está NA TELA (inclui o escuro forçado do navegador, que o CSS não enxerga). */
export async function pixelNaTela(page: Page, x: number, y: number): Promise<[number, number, number]> {
  const png = (await page.screenshot({ clip: { x, y, width: 1, height: 1 } })).toString('base64');
  return page.evaluate(async (dados) => {
    const img = new Image();
    img.src = `data:image/png;base64,${dados}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b] as [number, number, number];
  }, png);
}

/** Tema e esquema de cores aplicados no documento agora. */
export async function estadoDoTema(page: Page) {
  return page.evaluate(() => ({
    escuro: document.body.classList.contains('dark'),
    painel: document.body.classList.contains('xg-painel'),
    // O navegador pode devolver "light only" para o mesmo valor; padroniza.
    colorScheme: document.documentElement.style.colorScheme.split(' ').sort().reverse().join(' ').replace('light only', 'only light'),
  }));
}

/** Pula o tour guiado e o aviso de instalar o app (mesmo recurso dos outros testes do painel). */
export async function pularTourEAvisos(page: Page) {
  await page.addInitScript(() => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function (chave: string) {
      if (chave.startsWith('xgestao-tour-') || chave === 'xgestao:instalar-app-dispensado') return '1';
      return original.call(this, chave);
    };
  });
}

export async function fecharDocumentosLegais(page: Page) {
  const legal = page.getByRole('dialog', { name: 'Atualizamos nossos documentos' });
  await legal.waitFor({ state: 'visible', timeout: 3000 }).catch(() => undefined);
  if (await legal.isVisible()) await legal.getByRole('button', { name: 'Agora não' }).click();
}

/**
 * Contraste de cada combinação de classes, desenhada de verdade na página (com o
 * CSS do app). Serve para selos e avatares que dependem do dado da obra.
 */
export async function contrasteDeClasses(page: Page, combinacoes: string[]): Promise<Array<{ classes: string; razao: number }>> {
  return page.evaluate((lista) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const rgba = (css: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#000';
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a / 255];
    };
    const lum = ([r, g, b]: number[]) => {
      const c = [r, g, b].map((v) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const base = getComputedStyle(document.body).backgroundColor;
    return lista.map((classes) => {
      const el = document.createElement('span');
      el.className = `text-[10px] font-bold ${classes}`;
      el.textContent = 'TESTE';
      document.body.appendChild(el);
      const st = getComputedStyle(el);
      const fundoEl = rgba(st.backgroundColor);
      const fundoBody = rgba(base);
      const fundo = [0, 1, 2].map((i) => fundoEl[i] * fundoEl[3] + fundoBody[i] * (1 - fundoEl[3]));
      const cor = rgba(st.color);
      el.remove();
      const l1 = lum(cor);
      const l2 = lum(fundo);
      return { classes, razao: Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100 };
    });
  }, combinacoes);
}
