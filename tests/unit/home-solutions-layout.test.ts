import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const homeSource = readFileSync('app/page.tsx', 'utf8');

describe('grade de soluções da home', () => {
  it('mantém o xgestão na primeira coluna sem centralização condicional', () => {
    assert.match(
      homeSource,
      /className="grid grid-cols-1 gap-8 md:grid-cols-2"\s+data-testid="solutions-grid"/,
    );
    assert.match(homeSource, /data-testid="solution-card-xgestao"/);
    assert.doesNotMatch(homeSource, /md:col-span-2/);
    assert.doesNotMatch(homeSource, /md:mx-auto/);
  });

  it('só compõe a segunda coluna quando o marketplace está carregado e visível', () => {
    assert.match(
      homeSource,
      /!isLoading && config\.marketplaceVisivel && \(\s*<div[\s\S]*?data-testid="solution-card-marketplace"/,
    );
  });
});