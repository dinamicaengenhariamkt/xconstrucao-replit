import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { semaforoFinanceiro, semaforoPrazo, situacaoObra } from './indicadores-obra';

/**
 * XG27 — as fronteiras das faixas são a parte que silenciosamente erra: um
 * `>` no lugar de `>=` move o aviso um ponto percentual e ninguém nota até a
 * obra estourar sem ter ficado âmbar.
 */

test('financeiro — abaixo de 80% é verde', () => {
  assert.equal(semaforoFinanceiro(0), 'ok');
  assert.equal(semaforoFinanceiro(45), 'ok');
  assert.equal(semaforoFinanceiro(79), 'ok');
});

test('financeiro — 80% já é o aviso', () => {
  // A fronteira: 79 tranquilo, 80 avisa. Inclusivo no âmbar de propósito.
  assert.equal(semaforoFinanceiro(80), 'atencao');
});

test('financeiro — 100% ainda é aviso, não estouro', () => {
  // Gastar exatamente o orçado não é estourar; é o fim da folga.
  assert.equal(semaforoFinanceiro(100), 'atencao');
});

test('financeiro — acima de 100% é vermelho', () => {
  assert.equal(semaforoFinanceiro(101), 'critico');
  assert.equal(semaforoFinanceiro(112), 'critico');
});

test('financeiro — sem orçamento lançado não é verde, é sem dado', () => {
  // Verde afirmaria uma folga que ninguém verificou.
  assert.equal(semaforoFinanceiro(null), 'sem_dado');
});

test('prazo — sem atraso é verde, um dia já é vermelho', () => {
  assert.equal(semaforoPrazo(0), 'ok');
  assert.equal(semaforoPrazo(1), 'critico');
  assert.equal(semaforoPrazo(12), 'critico');
});

test('situação — o pior dos dois sinais vence', () => {
  assert.equal(situacaoObra('ok', 'ok'), 'ok');
  assert.equal(situacaoObra('critico', 'ok'), 'critico');
  assert.equal(situacaoObra('ok', 'critico'), 'critico');
  assert.equal(situacaoObra('ok', 'atencao'), 'atencao');
  assert.equal(situacaoObra('critico', 'atencao'), 'critico');
});

test('situação — não saber o orçamento não torna a obra problemática', () => {
  // `sem_dado` é ausência de informação, não sintoma: uma obra no prazo sem
  // orçamento lançado não pode subir ao topo da tabela como se tivesse algo
  // errado.
  assert.equal(situacaoObra('ok', 'sem_dado'), 'sem_dado');
  assert.equal(situacaoObra('critico', 'sem_dado'), 'critico');
});
