import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assinaturaXgestaoVigente } from '../../features/xgestao/lib/acesso-plano';
import { getPlanCatalog, PLANS_CATALOG } from '../../shared/lib/plans-catalog';

test('nova oferta paga não reutiliza o tier gratuito e não existe no marketplace', () => {
  for (const tier of ['basic', 'basic_plus', 'premium'] as const) {
    assert.ok(getPlanCatalog('xgestao', tier).precoMensal > 0);
    assert.throws(() => getPlanCatalog('empreiteiro', tier));
    assert.throws(() => getPlanCatalog('contratante', tier));
  }
  assert.equal(PLANS_CATALOG.empreiteiro.pro.precoMensal, 89);
  assert.equal(PLANS_CATALOG.contratante.pro.precoMensal, 99);
});
test('sem assinatura, assinatura gratuita e estados não ativos ficam em leitura', () => {
  assert.equal(assinaturaXgestaoVigente(null), false);
  for (const status of ['cancelada', 'expirada', 'inadimplente', 'pendente_reativacao']) {
    assert.equal(assinaturaXgestaoVigente({ status, provider: 'asaas', preco: 299, renovaEm: null }), false);
  }
  assert.equal(assinaturaXgestaoVigente({ status: 'ativa', provider: 'manual', preco: 0, renovaEm: null }), false);
});
test('trial é vigente até 24h depois do vencimento, sem tolerar data ausente', () => {
  const agora = new Date('2026-11-03T12:00:00Z');
  const trial = { status: 'ativa', provider: 'trial', preco: 99, renovaEm: null as Date | null };
  assert.equal(assinaturaXgestaoVigente(trial, agora), false);
  const umDia = 24 * 60 * 60 * 1000;
  for (const offset of [-1, 0, 1]) {
    const renovaEm = new Date(agora.getTime() - umDia + offset);
    assert.equal(assinaturaXgestaoVigente({ ...trial, renovaEm }, agora), offset > 0);
  }
});
test('assinatura paga ativa não é rebaixada pelo prazo do trial anterior', () => {
  assert.equal(assinaturaXgestaoVigente({
    status: 'ativa', provider: 'asaas', preco: '99.00', renovaEm: new Date('2026-10-01T00:00:00Z'),
  }), true);
});
