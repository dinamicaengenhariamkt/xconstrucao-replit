import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  CHAVE_PAINEL_TEMA,
  colorSchemeDoTema,
  normalizarPreferencia,
  PREFERENCIA_PADRAO,
  resolverTema,
  scriptTemaAntesDaPintura,
  type PreferenciaTema,
} from '../../features/xgestao/tema/painel-tema';

/** Documento falso, só com o que o script de antes da pintura usa. */
function documentoFalso() {
  const classes = new Set<string>();
  return {
    classes,
    body: {
      classList: {
        add: (...nomes: string[]) => nomes.forEach((n) => classes.add(n)),
        remove: (...nomes: string[]) => nomes.forEach((n) => classes.delete(n)),
        toggle: (nome: string, ligar: boolean) => (ligar ? classes.add(nome) : classes.delete(nome)),
        contains: (nome: string) => classes.has(nome),
      },
    },
    documentElement: { style: { colorScheme: '' } },
  };
}

function rodarScript(script: string, guardado: string | null, celularEscuro: boolean, storageQuebrado = false) {
  const doc = documentoFalso();
  const localStorage = {
    getItem: (chave: string) => {
      if (storageQuebrado) throw new Error('bloqueado');
      return chave === CHAVE_PAINEL_TEMA ? guardado : null;
    },
  };
  const window = { matchMedia: (q: string) => ({ matches: q.includes('dark') && celularEscuro }) };
  new Function('window', 'document', 'localStorage', script)(window, doc, localStorage);
  return { escuro: doc.classes.has('dark'), painel: doc.classes.has('xg-painel'), colorScheme: doc.documentElement.style.colorScheme };
}

describe('PRD 55 — tema do painel', () => {
  it('padrão é Automático e valores desconhecidos caem nele', () => {
    assert.equal(PREFERENCIA_PADRAO, 'automatico');
    assert.equal(normalizarPreferencia(null), 'automatico');
    assert.equal(normalizarPreferencia('dark'), 'automatico');
    assert.equal(normalizarPreferencia('escuro'), 'escuro');
  });

  it('Claro e Escuro ignoram o celular; Automático segue o celular', () => {
    assert.equal(resolverTema('claro', true), 'light');
    assert.equal(resolverTema('escuro', false), 'dark');
    assert.equal(resolverTema('automatico', true), 'dark');
    assert.equal(resolverTema('automatico', false), 'light');
  });

  it('no claro o navegador fica proibido de inverter; no escuro ele usa o nosso', () => {
    assert.equal(colorSchemeDoTema('light'), 'only light');
    assert.equal(colorSchemeDoTema('dark'), 'dark');
  });

  it('o script de antes da pintura decide igual às funções, em todas as combinações', () => {
    const preferencias: Array<PreferenciaTema | null | 'lixo'> = ['claro', 'escuro', 'automatico', null, 'lixo'];
    for (const guardado of preferencias) {
      for (const celularEscuro of [false, true]) {
        const tema = resolverTema(normalizarPreferencia(guardado), celularEscuro);
        assert.deepEqual(
          rodarScript(scriptTemaAntesDaPintura(), guardado, celularEscuro),
          { escuro: tema === 'dark', painel: true, colorScheme: colorSchemeDoTema(tema) },
          `guardado=${guardado} celularEscuro=${celularEscuro}`,
        );
      }
    }
  });

  it('link público (fixo em Automático) ignora o que estiver guardado', () => {
    assert.equal(rodarScript(scriptTemaAntesDaPintura('automatico'), 'escuro', false).escuro, false);
    assert.equal(rodarScript(scriptTemaAntesDaPintura('automatico'), 'claro', true).escuro, true);
  });

  it('sem storage o script não quebra a página e usa o padrão', () => {
    assert.deepEqual(rodarScript(scriptTemaAntesDaPintura(), null, true, true), {
      escuro: true,
      painel: true,
      colorScheme: 'dark',
    });
  });

  it('o tema só é ligado no painel, admin xgestão e link público', () => {
    for (const layout of ['app/xgestao/layout.tsx', 'app/admin/xgestao/layout.tsx', 'app/publico/layout.tsx']) {
      const fonte = readFileSync(layout, 'utf8');
      assert.match(fonte, /<ScriptTemaPainel/, layout);
      assert.match(fonte, /<PainelTemaRaiz/, layout);
      assert.match(fonte, /colorScheme: 'only light'/, layout);
    }
    assert.match(readFileSync('app/publico/layout.tsx', 'utf8'), /fixo="automatico"/);
    // O admin do marketplace e o site não ganham tema.
    assert.doesNotMatch(readFileSync('app/admin/layout.tsx', 'utf8'), /PainelTemaRaiz/);
    assert.doesNotMatch(readFileSync('app/layout.tsx', 'utf8'), /PainelTemaRaiz/);
  });

  it('a paleta escura do painel vale só com .xg-painel.dark', () => {
    const css = readFileSync('app/globals.css', 'utf8');
    const bloco = css.slice(css.indexOf('.xg-painel.dark {'));
    assert.ok(bloco.length > 0);
    assert.match(bloco, /--background: 210 9% 12%;/); // #1C1F22, o mesmo do site
    assert.match(bloco, /--card: 210 7% 18%;/); // #2A2D30
  });
});

describe('PRD 55 — preferência sem storage', () => {
  it('com o storage bloqueado a escolha vale até recarregar (memória)', async () => {
    const quebrado = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
    const g = globalThis as unknown as { window?: unknown };
    const antes = g.window;
    g.window = { localStorage: quebrado, dispatchEvent: () => true };
    try {
      const { gravarPreferencia, lerPreferencia } = await import('../../features/xgestao/tema/painel-tema');
      assert.equal(lerPreferencia(), 'automatico');
      gravarPreferencia('escuro');
      assert.equal(lerPreferencia(), 'escuro');
    } finally {
      g.window = antes;
    }
  });
});
