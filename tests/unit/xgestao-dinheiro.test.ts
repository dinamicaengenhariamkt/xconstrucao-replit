import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QueryClient } from '@tanstack/react-query';
import { dinheiroDecimal, orcamentoApiValido } from '../../features/xgestao/lib/dinheiro';
import { invalidarCarteiraXgestao } from '../../features/xgestao/lib/invalidar-carteira';

for (const [entrada, esperado] of [
  ['499,99', '499.99'], ['500', '500.00'], ['500.01', '500.01'],
  ['500,01', '500.01'], ['1.500,50', '1500.50'], ['1500.50', '1500.50'],
  ['50.000,75', '50000.75'], ['1.000.000,99', '1000000.99'],
  ['R$ 1.000.000,99', '1000000.99'], ['1.500', '1500.00'],
  ['9.999.999.999.999,99', '9999999999999.99'], ['0,01', '0.01'],
]) {
  test(`XG41 moeda: ${entrada} preserva ${esperado}`, () => {
    assert.equal(dinheiroDecimal(entrada), esperado);
    assert.ok(orcamentoApiValido(esperado));
  });
}
for (const entrada of ['', '-1', 'Infinity', '1e6', '12abc', '1,234', '0.001', '10000000000000']) {
  test(`XG41 moeda inválida: ${JSON.stringify(entrada)}`, () => assert.throws(() => dinheiroDecimal(entrada)));
}
test('API não aceita formatos locais, casas extras, overflow ou tipos indevidos', () => {
  for (const valor of ['500,01', '1.500,50', '-1', '0.001', '1e6', 1e14, Infinity, {}, true]) {
    assert.equal(orcamentoApiValido(valor), false);
  }
});
test('lançamento xgestão invalida a lista usada por Minhas Obras e dashboard', async () => {
  const client = new QueryClient();
  client.setQueryData(['empreiteiro', 'minhas-obras'], [{ id: 'obra' }]);
  client.setQueryData(['empreiteiro', 'minhas-obras', 'obra'], { isObraPropria: true });
  await invalidarCarteiraXgestao(client, 'obra');
  assert.equal(client.getQueryState(['empreiteiro', 'minhas-obras'])?.isInvalidated, true);
  client.clear();
});
test('a invalidação nova não altera a lista do marketplace', async () => {
  const client = new QueryClient();
  client.setQueryData(['empreiteiro', 'minhas-obras'], [{ id: 'obra' }]);
  client.setQueryData(['empreiteiro', 'minhas-obras', 'obra'], { isObraPropria: false });
  await invalidarCarteiraXgestao(client, 'obra');
  assert.equal(client.getQueryState(['empreiteiro', 'minhas-obras'])?.isInvalidated, false);
  client.clear();
});
