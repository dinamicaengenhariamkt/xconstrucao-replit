import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const homeSource = readFileSync('app/page.tsx', 'utf8');

/**
 * 12/11/2026 — facelift da home (pedido do Ramon). Antes, com o marketplace
 * oculto, o card do xgestão ficava sozinho na 1ª coluna e a 2ª ficava vazia
 * (a versão de 01/09 que centralizava um card estreito também foi descartada).
 * Agora: marketplace oculto (produção) = card destaque de largura total com o
 * conteúdo à esquerda e as funcionalidades à direita; marketplace visível =
 * grade de 2 cards como antes.
 */
describe('grade de soluções da home', () => {
  it('com o marketplace oculto (ou carregando), o xgestão vira o card destaque de largura total', () => {
    assert.match(homeSource, /const xgestaoDestaque = isLoading \|\| !config\.marketplaceVisivel;/);
    assert.match(
      homeSource,
      /className=\{`grid grid-cols-1 gap-8 \$\{xgestaoDestaque \? "" : "md:grid-cols-2"\}`\}\s+data-testid="solutions-grid"/,
    );
    // Nada de card estreito centralizado (decisão de 01/09 mantida).
    assert.doesNotMatch(homeSource, /md:mx-auto/);
    // O card continua identificável nos dois modos.
    assert.equal(homeSource.match(/data-testid="solution-card-xgestao"/g)?.length, 2);
    assert.match(homeSource, /href="\/xgestao-inteligente#funcionalidades"/);
  });

  it('só compõe a segunda coluna quando o marketplace está carregado e visível', () => {
    assert.match(
      homeSource,
      /!isLoading && config\.marketplaceVisivel && \(\s*<Reveal[\s\S]*?data-testid="solution-card-marketplace"/,
    );
  });
});
