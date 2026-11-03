import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contarVagasEquipe, equipeLotada, limiteVagasEquipe } from '../../features/xgestao/equipe/vagas';
import { OFERTA_XGESTAO } from '../../features/xgestao/lib/oferta-comercial';

test('titular ocupa uma vaga mesmo sem membros ou prestadores com login', () => {
  assert.deepEqual(contarVagasEquipe('dono', []), {
    utilizadas: 1, membrosAtivos: 0, convitesPendentes: 0,
  });
});
test('convites pendentes reservam vaga; revogados não contam', () => {
  assert.deepEqual(contarVagasEquipe('dono', [
    { userId: 'a', status: 'ativo' }, { userId: 'b', status: 'convidado' },
    { userId: 'c', status: 'revogado' },
  ]), { utilizadas: 3, membrosAtivos: 1, convitesPendentes: 1 });
});
test('pessoas em várias obras e o titular não são duplicados', () => {
  assert.deepEqual(contarVagasEquipe('dono', [
    { userId: 'dono', status: 'ativo' }, { userId: 'a', status: 'ativo' },
    { userId: 'a', status: 'ativo' }, { userId: 'a', status: 'convidado' },
    { userId: 'b', status: 'convidado' }, { userId: 'b', status: 'convidado' },
  ]), { utilizadas: 3, membrosAtivos: 1, convitesPendentes: 1 });
});
test('aceitar convite não ocupa outra vaga; revogar libera a reserva', () => {
  const antes = contarVagasEquipe('dono', [{ userId: 'a', status: 'convidado' }]);
  const aceito = contarVagasEquipe('dono', [{ userId: 'a', status: 'ativo' }]);
  assert.equal(antes.utilizadas, aceito.utilizadas);
  assert.equal(contarVagasEquipe('dono', [{ userId: 'a', status: 'revogado' }]).utilizadas, 1);
});
test('cotas aprovadas incluem titular e bloqueiam no limite e acima', () => {
  for (const plano of Object.values(OFERTA_XGESTAO)) {
    const limite = limiteVagasEquipe({ pessoasEmpresa: plano.pessoasEmpresa })!;
    for (const utilizadas of [limite - 1, limite, limite + 1]) {
      assert.equal(equipeLotada({
        utilizadas, membrosAtivos: utilizadas - 1, convitesPendentes: 0, limite,
      }), utilizadas >= limite);
    }
  }
});
test('catálogo legado sem cota não ativa limites novos silenciosamente', () => {
  assert.equal(limiteVagasEquipe({ obrasAtivas: 9999 }), null);
  assert.equal(equipeLotada({ utilizadas: 20, membrosAtivos: 19, convitesPendentes: 0, limite: null }), false);
});
test('cota presente mas inválida falha explicitamente', () => {
  for (const pessoasEmpresa of [0, -1, 1.5, NaN, Infinity]) {
    assert.throws(() => limiteVagasEquipe({ pessoasEmpresa }));
  }
});
