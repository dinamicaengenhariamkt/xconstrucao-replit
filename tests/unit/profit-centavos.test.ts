import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeProfitFromObra } from '../../features/shared/profit/compute-from-obra';

test('resultado usa centavos pagos, sem arredondar a obra para reais inteiros', () => {
  assert.deepEqual(computeProfitFromObra({
    financeiro: { receitaTotal: 40000.03, custoTotal: 36086.08 },
  }), {
    receitaTotal: 40000.03,
    custoTotal: 36086.08,
    lucroEstimado: 3913.95,
    margem: 9.8,
  });
  assert.deepEqual(computeProfitFromObra({
    financeiro: { receitaTotal: 0, custoTotal: 0.03 },
  }), {
    receitaTotal: 0,
    custoTotal: 0.03,
    lucroEstimado: -0.03,
    margem: 0,
  });
});