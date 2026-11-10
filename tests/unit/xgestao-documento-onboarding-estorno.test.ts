import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  documentoObrigatorioNoOnboarding,
  ehContaXgestao,
  validarDocumentoOnboarding,
} from '../../features/onboarding/lib/documento-onboarding';
import { decidirEstornoDuplicado } from '../../features/planos/lib/estorno-duplicado';

/** 10/11/2026 — documento no 1º passo do wizard e estorno do pagamento duplicado. */
const CPF = '52998224725';
const CNPJ = '11222333000181';
const XG = { role: 'empreiteiro', roles: ['empreiteiro', 'xgestao'] };

test('documento obrigatório só para a conta do xgestão', () => {
  assert.equal(documentoObrigatorioNoOnboarding(XG), true);
  assert.equal(ehContaXgestao(XG), true);
  assert.equal(documentoObrigatorioNoOnboarding({ role: 'empreiteiro', roles: ['empreiteiro'] }), false);
  assert.equal(documentoObrigatorioNoOnboarding({ role: 'empreiteiro' }), false);
  assert.equal(documentoObrigatorioNoOnboarding({ role: 'contratante', roles: ['contratante', 'xgestao'] }), false);
  assert.equal(documentoObrigatorioNoOnboarding({ role: 'anunciante', roles: ['anunciante'] }), false);
});

test('xgestão: vazio recusado, CPF e CNPJ válidos aceitos, formatado também', () => {
  assert.match(validarDocumentoOnboarding('', XG)!, /CPF ou CNPJ/);
  assert.match(validarDocumentoOnboarding('   ', XG)!, /CPF ou CNPJ/);
  assert.equal(validarDocumentoOnboarding(CPF, XG), null);
  assert.equal(validarDocumentoOnboarding(CNPJ, XG), null);
  assert.equal(validarDocumentoOnboarding('529.982.247-25', XG), null);
  assert.equal(validarDocumentoOnboarding('11.222.333/0001-81', XG), null);
});

test('xgestão: dígito errado, tamanho errado e repetidos recusados', () => {
  assert.match(validarDocumentoOnboarding('52998224724', XG)!, /inválido/);
  assert.match(validarDocumentoOnboarding('11222333000180', XG)!, /inválido/);
  assert.match(validarDocumentoOnboarding('1234567', XG)!, /inválido/);
  assert.match(validarDocumentoOnboarding('11111111111', XG)!, /inválido/);
});

test('marketplace sem mudança: empreiteiro opcional e só CNPJ; contratante segue o PF/PJ; anunciante livre', () => {
  const emp = { role: 'empreiteiro', roles: ['empreiteiro'] };
  assert.equal(validarDocumentoOnboarding('', emp), null);
  assert.equal(validarDocumentoOnboarding(CNPJ, emp), null);
  assert.match(validarDocumentoOnboarding(CPF, emp)!, /CNPJ/);

  const pf = { role: 'contratante', tipoContratante: 'Pessoa Física' as const };
  const pj = { role: 'contratante', tipoContratante: 'Pessoa Jurídica' as const };
  assert.equal(validarDocumentoOnboarding('', pf), null);
  assert.equal(validarDocumentoOnboarding(CPF, pf), null);
  assert.match(validarDocumentoOnboarding(CNPJ, pf)!, /Pessoa Física/);
  assert.equal(validarDocumentoOnboarding(CNPJ, pj), null);
  assert.match(validarDocumentoOnboarding(CPF, pj)!, /Pessoa Jurídica/);

  assert.equal(validarDocumentoOnboarding('', { role: 'anunciante' }), null);
});

test('estorno da duplicada: só pagamento confirmado com id estorna, e uma vez', () => {
  const limpo = { estornado: false, tentativas: 0, falhas: 0 };
  assert.equal(decidirEstornoDuplicado({ pagamentoConfirmado: true, paymentId: 'pay_1', historico: limpo }), 'estornar');
  // Só criada/pendente: cancelar a assinatura apaga a cobrança.
  assert.equal(decidirEstornoDuplicado({ pagamentoConfirmado: false, paymentId: 'pay_1', historico: limpo }), 'so_cancelar');
  assert.equal(decidirEstornoDuplicado({ pagamentoConfirmado: true, paymentId: null, historico: limpo }), 'so_cancelar');
  // RECEIVED depois do CONFIRMED já estornado.
  assert.equal(decidirEstornoDuplicado({ pagamentoConfirmado: true, paymentId: 'pay_1', historico: { estornado: true, tentativas: 1, falhas: 0 } }), 'ja_tratado');
  // Tentativa em andamento, sem desfecho.
  assert.equal(decidirEstornoDuplicado({ pagamentoConfirmado: true, paymentId: 'pay_1', historico: { estornado: false, tentativas: 1, falhas: 0 } }), 'ja_tratado');
  // Falhou antes: a próxima entrega tenta de novo.
  assert.equal(decidirEstornoDuplicado({ pagamentoConfirmado: true, paymentId: 'pay_1', historico: { estornado: false, tentativas: 1, falhas: 1 } }), 'estornar');
});
