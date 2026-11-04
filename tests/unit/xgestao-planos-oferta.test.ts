import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { OFERTA_XGESTAO } from '../../features/xgestao/lib/oferta-comercial';
import { tierLabel } from '../../features/xgestao/admin/plano-label';
import { getPlanCatalog, PLANS_CATALOG, type PlanoTier } from '../../shared/lib/plans-catalog';
import { SECOES_OFERECIDAS, SECOES_PUBLICAS } from '../../features/xgestao/obra-publica/secoes';

test('XG42 admin dá nome a todo plano do xgestão, nunca o identificador cru', () => {
  for (const tier of Object.keys(PLANS_CATALOG.xgestao)) {
    assert.notEqual(tierLabel(tier), tier, tier);
  }
  assert.equal(tierLabel('basic_plus'), 'Basic Plus');
  assert.equal(tierLabel('free'), 'Somente leitura');
});

test('XG42 oferta vendida bate com a imagem de monetização', () => {
  const esperado = {
    basic: { mensal: 99, obras: 1, pessoas: 2, links: 1, valores: 0 },
    basic_plus: { mensal: 179, obras: 3, pessoas: 5, links: 3, valores: 1 },
    premium: { mensal: 299, obras: 10, pessoas: 15, links: -1, valores: 1 },
  } as const;
  for (const [tier, plano] of Object.entries(esperado)) {
    const catalogo = getPlanCatalog('xgestao', tier as PlanoTier);
    assert.equal(catalogo.precoMensal, plano.mensal);
    assert.deepEqual(catalogo.limites, {
      obrasAtivas: plano.obras, pessoasEmpresa: plano.pessoas,
      linksPorObra: plano.links, valoresPublicos: plano.valores,
    });
    assert.ok(!catalogo.features.some((f) => /sinapi/i.test(f)), 'SINAPI segue congelado');
  }
});

test('XG42 catálogo do marketplace não recebe os planos do xgestão', () => {
  for (const persona of ['empreiteiro', 'contratante'] as const) {
    assert.deepEqual(Object.keys(PLANS_CATALOG[persona]).sort(), ['enterprise', 'free', 'pro']);
  }
});

test('XG42 bootstrap cria os valores do enum antes do seed, também no ambiente publicado', () => {
  const fonte = readFileSync('server/bootstrap-planos.ts', 'utf8');
  const seed = fonte.indexOf('INSERT INTO planos');
  for (const tier of Object.keys(OFERTA_XGESTAO)) {
    const posicao = fonte.indexOf(`ALTER TYPE plano ADD VALUE IF NOT EXISTS '${tier}'`);
    assert.ok(posicao >= 0 && posicao < seed, tier);
  }
});

test('XG42 planos mostram exatamente o texto da imagem, sem SINAPI e sem tarefas', () => {
  assert.deepEqual(getPlanCatalog('xgestao', 'basic').features, [
    '1 obra ativa', 'Equipe: você + 1 convidado', '1 link público por obra',
    'Dashboard, filtros e busca de obras', 'Etapas e cronograma', 'Fotos, Diário e Ocorrências',
    'Checklists e Timeline', 'Documentos', 'Financeiro (gasto x orçamento)',
  ]);
  assert.deepEqual(getPlanCatalog('xgestao', 'basic_plus').features, [
    'Tudo do Basic', 'Até 3 obras ativas', 'Equipe: até 5 pessoas', 'Até 3 links públicos por obra',
    'Link público com valores (Pagamentos ligado)',
  ]);
  assert.deepEqual(getPlanCatalog('xgestao', 'premium').features, [
    'Tudo do Basic Plus', 'Até 10 obras ativas', 'Equipe: até 15 pessoas', 'Links públicos ilimitados por obra',
    'Link público com valores (Pagamentos ligado)',
  ]);
  for (const tier of Object.keys(OFERTA_XGESTAO) as PlanoTier[]) {
    assert.ok(!getPlanCatalog('xgestao', tier).features.join(' ').match(/sinapi|tarefa/i), tier);
  }
});

for (const arquivo of [
  'app/xgestao-inteligente/page.tsx', 'app/xgestao-inteligente/layout.tsx', 'app/layout.tsx',
  'features/landing/seo/seo-utils.ts', 'server/legal-seed/privacidade-v1.md', 'server/legal-seed/privacidade-v2.md',
]) {
  test(`XG42 ${arquivo} não promete SINAPI`, () => {
    assert.doesNotMatch(readFileSync(arquivo, 'utf8'), /sinapi/i);
  });
}

test('XG42 minutas legais seguem a oferta nova', () => {
  const termos = readFileSync('server/legal-seed/termos-v2.md', 'utf8');
  assert.match(termos, /90 dias no plano Premium/);
  assert.match(termos, /automaticamente para somente leitura/);
  assert.doesNotMatch(termos, /plano Pro\b|plano Free|plano gratuito/);
  for (const texto of [termos, readFileSync('server/legal-seed/privacidade-v2.md', 'utf8')]) {
    assert.doesNotMatch(texto, /tarefas?/i);
  }
});

test('XG42 link público deixa de oferecer Tarefas e mantém as demais seções', () => {
  assert.deepEqual(SECOES_OFERECIDAS, SECOES_PUBLICAS.filter((secao) => secao !== 'tarefas'));
  assert.ok(SECOES_OFERECIDAS.includes('pagamentos') && SECOES_OFERECIDAS.includes('diario'));
});
