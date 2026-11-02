import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  OFERTA_XGESTAO, TESTE_NOVA_OFERTA, VALORES_PUBLICOS_APROVADOS, contarPessoasEmpresa,
} from '../../features/xgestao/lib/oferta-comercial';

test('XG41 oferta aprovada tem preços e cotas separados do catálogo legado', () => {
  assert.deepEqual(Object.values(OFERTA_XGESTAO).map(p => [p.mensal, p.obrasAtivas, p.pessoasEmpresa, p.linksPorObra]), [
    [99, 1, 2, 1], [179, 3, 5, 3], [299, 10, 15, null],
  ]);
  assert.equal(OFERTA_XGESTAO.basic.sinapi, false);
  assert.equal(OFERTA_XGESTAO.basic.valoresPublicos, false);
  assert.equal(OFERTA_XGESTAO.basic_plus.sinapi, true);
  assert.equal(OFERTA_XGESTAO.premium.valoresPublicos, true);
});
test('XG41 teste Premium por 90 dias termina somente em leitura', () => {
  assert.deepEqual(TESTE_NOVA_OFERTA, { dias: 90, plano: 'premium', aoVencer: 'somente_leitura' });
  assert.deepEqual(VALORES_PUBLICOS_APROVADOS, ['contrato', 'recebimentos', 'saldo']);
});
test('XG41 titular e pessoa em várias obras não duplicam vagas', () => {
  assert.equal(contarPessoasEmpresa('titular', ['titular', 'a', 'a', 'b']), 3);
});
