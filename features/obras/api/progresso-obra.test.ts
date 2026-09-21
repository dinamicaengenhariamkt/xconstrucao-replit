import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { mediaProgressoEtapas, resolverProgressoObra } from './progresso-obra';

/**
 * XG27 — esta regra existe porque o dashboard mostrou 0% para uma obra em
 * andamento. O que ela protege é a separação entre os dois produtos: se o
 * marketplace começar a ler a média das etapas, o percentual que o contratante
 * aprovou (e que libera pagamento) passa a ser sobrescrito por um número
 * digitado sem aprovação nenhuma.
 */

test('obra própria — o progresso vem da média das etapas, não da coluna morta', () => {
  // O caso exato do banco de dev: "Reforma da sede xgestão" tem a coluna em 0
  // e as etapas somando 15. Era o 0% do print do cliente.
  assert.equal(
    resolverProgressoObra({ clienteId: null, progressoColuna: 0, mediaEtapas: 15 }),
    15,
  );
});

test('obra própria — a coluna é ignorada mesmo quando tem valor antigo', () => {
  // O outro número do print: 100% congelado de uma medição de antes da XG23.
  // Sem este caso, o valor velho continuaria vencendo o dado real.
  assert.equal(
    resolverProgressoObra({ clienteId: null, progressoColuna: 100, mediaEtapas: 15 }),
    15,
  );
});

test('obra própria sem etapa — null, nunca 0', () => {
  // 0 afirmaria "não avançou"; o que se sabe é "não há cronograma para medir".
  // Devolver 0 aqui recriaria o defeito com outra fonte.
  assert.equal(
    resolverProgressoObra({ clienteId: null, progressoColuna: 0, mediaEtapas: null }),
    null,
  );
});

test('marketplace — a coluna manda, mesmo com etapas preenchidas', () => {
  // A não-regressão que importa: lá a coluna tem escritor e peso contratual.
  assert.equal(
    resolverProgressoObra({ clienteId: 'cli-1', progressoColuna: 42, mediaEtapas: 90 }),
    42,
  );
});

test('marketplace — coluna nula vira 0, e não a média das etapas', () => {
  assert.equal(
    resolverProgressoObra({ clienteId: 'cli-1', progressoColuna: null, mediaEtapas: 90 }),
    0,
  );
});

test('média — simples, sem peso por etapa', () => {
  assert.equal(mediaProgressoEtapas([{ progresso: 10 }, { progresso: 20 }]), 15);
});

test('média — etapa sem valor conta como 0, não some da conta', () => {
  // Uma etapa cadastrada e ainda não iniciada faz parte da obra: ignorá-la
  // inflaria o avanço (duas etapas, uma em 100% → diria 100%).
  assert.equal(mediaProgressoEtapas([{ progresso: 100 }, { progresso: null }]), 50);
  assert.equal(mediaProgressoEtapas([{ progresso: 100 }, {}]), 50);
});

test('média — arredonda para inteiro', () => {
  // 10+20+30 = 60/7 = 8.57… O dashboard não mostra casa decimal.
  assert.equal(mediaProgressoEtapas([{ progresso: 10 }, { progresso: 20 }, { progresso: 1 }]), 10);
});

test('média — lista vazia é null', () => {
  assert.equal(mediaProgressoEtapas([]), null);
});
