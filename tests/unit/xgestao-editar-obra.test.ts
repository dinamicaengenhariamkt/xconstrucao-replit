import { test } from 'node:test';
import assert from 'node:assert/strict';
import { payloadInformacoes, validarInformacoes, type CamposInformacoes } from '../../features/xgestao/hooks/use-editar-obra';

const base: CamposInformacoes = {
  nome: 'Obra de teste', tipo: '', descricao: '', areaM2: '', valorTotal: '',
  dataInicio: '', dataPrevisao: '', status: 'planejamento',
};

for (const [entrada, esperado] of [
  ['1.200,50', '1200.50'], ['1200,50', '1200.50'], ['120.5', '120.50'],
  ['1200.50', '1200.50'], ['99.999.999,99', '99999999.99'],
] as const) {
  test(`XG42 área "${entrada}" vira ${esperado}, sem perder a vírgula`, () => {
    validarInformacoes({ ...base, areaM2: entrada });
    assert.equal(payloadInformacoes({ ...base, areaM2: entrada }).areaM2, esperado);
  });
}

for (const entrada of ['abc', '-5', '1,234', '100000000']) {
  test(`XG42 área inválida "${entrada}" é recusada antes de salvar`, () => {
    assert.throws(() => validarInformacoes({ ...base, areaM2: entrada }));
  });
}

test('XG42 campos opcionais vazios: área limpa e orçamento zerado de forma explícita', () => {
  const payload = payloadInformacoes(base);
  assert.equal(payload.areaM2, null);
  assert.equal(payload.valorTotal, '0');
});

for (const [entrada, esperado] of [
  ['500,00', '500.00'], ['500,01', '500.01'], ['1.000.000,00', '1000000.00'],
  ['10.000.000,50', '10000000.50'], ['1000000', '1000000.00'],
] as const) {
  test(`XG42 orçamento "${entrada}" vira ${esperado}`, () => {
    assert.equal(payloadInformacoes({ ...base, valorTotal: entrada }).valorTotal, esperado);
  });
}

test('XG42 nome curto e previsão antes do início são recusados', () => {
  assert.throws(() => validarInformacoes({ ...base, nome: 'ab' }));
  assert.throws(() => validarInformacoes({ ...base, dataInicio: '2026-12-01', dataPrevisao: '2026-11-01' }));
});
