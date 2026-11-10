import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  acessoAteAoCancelar,
  assinaturaXgestaoVigente,
  primeiraCobrancaAoAssinar,
  somarMeses,
} from '../../features/xgestao/lib/acesso-plano';
import { documentoXgestaoValido } from '../../features/xgestao/lib/documento-fiscal';

/**
 * Regra do dono (10/11/2026): o mês bônus de quem assina no teste só vale com
 * o 1º pagamento e uma vez por conta.
 */
const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;
const fimTeste = new Date('2026-12-01T12:00:00Z');
const primeiraCobranca = somarMeses(fimTeste, 1);

test('assinar no teste: 1ª cobrança 1 mês após o fim do teste, com bônus', () => {
  const agora = new Date(fimTeste.getTime() - 10 * DIA);
  assert.deepEqual(primeiraCobrancaAoAssinar({ fimTeste, bonusJaUsado: false }, agora), {
    primeiraCobrancaEm: primeiraCobranca, comBonus: true,
  });
});

test('cancelar no teste, antes do 1º pagamento: acesso até o fim do teste + 24h', () => {
  const agora = new Date(fimTeste.getTime() - 10 * DIA);
  const ate = acessoAteAoCancelar({ renovaEm: primeiraCobranca, fimTesteEm: fimTeste, primeiroPagamentoEm: null }, agora);
  assert.equal(ate?.toISOString(), new Date(fimTeste.getTime() + DIA).toISOString());
  // Depois disso, a regra de vigência leva a somente leitura.
  const cancelada = { status: 'ativa', provider: 'asaas', preco: 99, renovaEm: ate, canceladaEm: agora };
  assert.equal(assinaturaXgestaoVigente(cancelada, new Date(ate!.getTime() - 1)), true);
  assert.equal(assinaturaXgestaoVigente(cancelada, ate!), false);
});

test('cancelar já no mês bônus, antes do 1º pagamento: 24h a partir do cancelamento', () => {
  const agora = new Date(fimTeste.getTime() + 5 * DIA);
  const ate = acessoAteAoCancelar({ renovaEm: primeiraCobranca, fimTesteEm: fimTeste, primeiroPagamentoEm: null }, agora);
  assert.equal(ate?.toISOString(), new Date(agora.getTime() + DIA).toISOString());
  // Às vésperas da 1ª cobrança: nunca passa de `renovaEm`.
  const vespera = new Date(primeiraCobranca.getTime() - HORA);
  assert.equal(
    acessoAteAoCancelar({ renovaEm: primeiraCobranca, fimTesteEm: fimTeste, primeiroPagamentoEm: null }, vespera)?.toISOString(),
    primeiraCobranca.toISOString(),
  );
});

test('cancelar depois do 1º pagamento: acesso até o fim do período pago', () => {
  const renovaEm = somarMeses(primeiraCobranca, 1);
  const agora = new Date(primeiraCobranca.getTime() + 3 * DIA);
  const ate = acessoAteAoCancelar({ renovaEm, fimTesteEm: fimTeste, primeiroPagamentoEm: primeiraCobranca }, agora);
  assert.equal(ate?.toISOString(), renovaEm.toISOString());
  // Assinatura sem bônus: igual ao XG43.
  assert.equal(acessoAteAoCancelar({ renovaEm }, agora)?.toISOString(), renovaEm.toISOString());
  // Período já vencido: cancela na hora.
  assert.equal(acessoAteAoCancelar({ renovaEm: new Date(agora.getTime() - 1) }, agora), null);
});

test('reassinar com o bônus já usado: sem novo mês grátis', () => {
  // Ainda no teste: cobra no fim do teste, sem +1 mês.
  const noTeste = new Date(fimTeste.getTime() - 10 * DIA);
  assert.deepEqual(primeiraCobrancaAoAssinar({ fimTeste, bonusJaUsado: true }, noTeste), {
    primeiraCobrancaEm: fimTeste, comBonus: false,
  });
  // Teste já acabou: cobra agora.
  assert.deepEqual(primeiraCobrancaAoAssinar({ fimTeste, bonusJaUsado: true }, new Date(fimTeste.getTime() + HORA)), {
    primeiraCobrancaEm: null, comBonus: false,
  });
  // Cancelou o bônus e assina de novo nas 24h restantes: 1ª cobrança no fim do acesso.
  const corte = new Date(fimTeste.getTime() + DIA);
  assert.deepEqual(primeiraCobrancaAoAssinar({ bonusJaUsado: true, acessoAte: corte }, noTeste), {
    primeiraCobrancaEm: corte, comBonus: false,
  });
  // Sem teste e sem período em aberto: cobra agora.
  assert.deepEqual(primeiraCobrancaAoAssinar({ bonusJaUsado: true }, noTeste), { primeiraCobrancaEm: null, comBonus: false });
});

test('PAG-14 documento: CPF ou CNPJ com dígito verificador', () => {
  assert.equal(documentoXgestaoValido('529.982.247-25'), '52998224725');
  assert.equal(documentoXgestaoValido('11.222.333/0001-81'), '11222333000181');
  assert.equal(documentoXgestaoValido('529.982.247-24'), undefined);
  assert.equal(documentoXgestaoValido('11222333000182'), undefined);
  assert.equal(documentoXgestaoValido('111.111.111-11'), undefined);
  assert.equal(documentoXgestaoValido('123'), undefined);
  // 1º candidato inválido, 2º válido.
  assert.equal(documentoXgestaoValido('', null, '52998224725'), '52998224725');
});
