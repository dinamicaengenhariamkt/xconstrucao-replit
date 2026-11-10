import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calcularProporcional,
  decidirTroca,
  diasEntreSp,
  linksExcedentes,
  selecionarMantidos,
  validarEscolha,
  valorProximaFatura,
  type EstadoAssinaturaTroca,
} from '../../features/xgestao/lib/troca-plano';

/** Meio-dia em São Paulo do dia informado. */
const sp = (data: string, hora = '12:00') => new Date(`${data}T${hora}:00-03:00`);

describe('XG48 proporcional da subida', () => {
  it('exemplo do dono: 99 → 179 faltando 15 de 30 dias soma 40 (fatura de 219)', () => {
    const r = calcularProporcional({ valorAtual: 99, valorNovo: 179, renovaEm: sp('2026-12-01'), agora: sp('2026-11-16') });
    assert.deepEqual(r, { diasCiclo: 30, diasRestantes: 15, diferenca: 40 });
    assert.equal(valorProximaFatura(179, [r.diferenca]), 219);
  });

  it('mês de 31 dias (julho → agosto)', () => {
    const r = calcularProporcional({ valorAtual: 99, valorNovo: 179, renovaEm: sp('2026-08-15'), agora: sp('2026-07-25') });
    assert.equal(r.diasCiclo, 31);
    assert.equal(r.diasRestantes, 21);
    assert.equal(r.diferenca, 54.19); // 80 × 21 ÷ 31 = 54,193…
  });

  it('fevereiro com 28 dias', () => {
    const r = calcularProporcional({ valorAtual: 99, valorNovo: 179, renovaEm: sp('2027-03-10'), agora: sp('2027-02-24') });
    assert.deepEqual(r, { diasCiclo: 28, diasRestantes: 14, diferenca: 40 });
  });

  it('fevereiro bissexto com 29 dias', () => {
    const r = calcularProporcional({ valorAtual: 99, valorNovo: 179, renovaEm: sp('2028-03-10'), agora: sp('2028-02-25') });
    assert.equal(r.diasCiclo, 29);
    assert.equal(r.diasRestantes, 14);
    assert.equal(r.diferenca, 38.62); // 80 × 14 ÷ 29 = 38,620…
  });

  it('início do ciclo = renovação menos 1 mês de calendário (somarMeses)', () => {
    // Renovação em 31/03: o ciclo começa em 28/02 (não existe 31/02) e tem 31 dias.
    const marco = calcularProporcional({ valorAtual: 99, valorNovo: 299, renovaEm: sp('2027-03-31'), agora: sp('2027-03-30') });
    assert.equal(marco.diasCiclo, 31);
    assert.equal(marco.diasRestantes, 1);
    assert.equal(marco.diferenca, 6.45); // 200 × 1 ÷ 31 = 6,451…
    // Renovação em 28/02: o ciclo é contado de 28/01 (31 dias), decisão documentada no XG48.
    assert.equal(calcularProporcional({ valorAtual: 99, valorNovo: 299, renovaEm: sp('2027-02-28'), agora: sp('2027-02-27') }).diasCiclo, 31);
  });

  it('conta dias no calendário de São Paulo, não em UTC', () => {
    // 01:30 UTC de 16/11 ainda é 22:30 de 15/11 em São Paulo: faltam 16 dias.
    const r = calcularProporcional({ valorAtual: 99, valorNovo: 179, renovaEm: sp('2026-12-01'), agora: new Date('2026-11-16T01:30:00Z') });
    assert.equal(r.diasRestantes, 16);
    assert.equal(diasEntreSp(new Date('2026-11-16T02:59:00Z'), new Date('2026-11-16T03:01:00Z')), 1);
  });

  it('arredonda a centavos (meio centavo para cima)', () => {
    assert.equal(calcularProporcional({ valorAtual: 179, valorNovo: 299, renovaEm: sp('2026-08-15'), agora: sp('2026-07-25') }).diferenca, 81.29); // 120×21÷31 = 81,290…
    assert.equal(calcularProporcional({ valorAtual: 99, valorNovo: 299, renovaEm: sp('2026-08-15'), agora: sp('2026-08-14') }).diferenca, 6.45); // 200÷31 = 6,451…
    // 0,5 centavo: 1 centavo de diferença × 15 ÷ 30.
    assert.equal(calcularProporcional({ valorAtual: 99, valorNovo: 99.01, renovaEm: sp('2026-12-01'), agora: sp('2026-11-16') }).diferenca, 0.01);
  });

  it('sem dias restantes, descida ou mesmo valor: diferença 0', () => {
    assert.equal(calcularProporcional({ valorAtual: 99, valorNovo: 179, renovaEm: sp('2026-12-01'), agora: sp('2026-12-01') }).diferenca, 0);
    assert.equal(calcularProporcional({ valorAtual: 99, valorNovo: 179, renovaEm: sp('2026-12-01'), agora: sp('2026-12-05') }).diasRestantes, 0);
    assert.equal(calcularProporcional({ valorAtual: 299, valorNovo: 99, renovaEm: sp('2026-12-01'), agora: sp('2026-11-16') }).diferenca, 0);
  });

  it('subida no 1º dia do ciclo cobra o ciclo inteiro de diferença', () => {
    const r = calcularProporcional({ valorAtual: 99, valorNovo: 179, renovaEm: sp('2026-12-01'), agora: sp('2026-11-01') });
    assert.deepEqual(r, { diasCiclo: 30, diasRestantes: 30, diferenca: 80 });
  });

  it('próxima fatura soma as diferenças ainda não pagas, em centavos', () => {
    assert.equal(valorProximaFatura(299, [40, '20.10', 0.2]), 359.3);
    assert.equal(valorProximaFatura('99.00', []), 99);
  });
});

const paga = (extra: Partial<EstadoAssinaturaTroca> = {}): EstadoAssinaturaTroca => ({
  status: 'ativa', provider: 'asaas', tier: 'basic', canceladaEm: null,
  primeiroPagamentoEm: sp('2026-11-01'), fimTesteEm: null, renovaEm: sp('2026-12-01'), ...extra,
});

describe('XG48 máquina de estados da troca', () => {
  it('sem assinatura, no teste sem assinatura ou com assinatura encerrada: checkout normal', () => {
    assert.deepEqual(decidirTroca({ assinatura: null, agendada: null, tierPara: 'premium' }), { acao: 'checkout' });
    assert.deepEqual(decidirTroca({ assinatura: paga({ provider: 'trial' }), agendada: null, tierPara: 'premium' }), { acao: 'checkout' });
    assert.deepEqual(decidirTroca({ assinatura: paga({ status: 'expirada' }), agendada: null, tierPara: 'premium' }), { acao: 'checkout' });
  });

  it('fatura atrasada e cancelamento agendado bloqueiam', () => {
    assert.deepEqual(decidirTroca({ assinatura: paga({ status: 'inadimplente' }), agendada: null, tierPara: 'premium' }), { acao: 'bloquear', codigo: 'INADIMPLENTE' });
    assert.deepEqual(decidirTroca({ assinatura: paga({ canceladaEm: sp('2026-11-10') }), agendada: null, tierPara: 'premium' }), { acao: 'bloquear', codigo: 'CANCELAMENTO_AGENDADO' });
  });

  it('plano inválido e mesmo plano', () => {
    assert.deepEqual(decidirTroca({ assinatura: paga(), agendada: null, tierPara: 'enterprise' }), { acao: 'bloquear', codigo: 'PLANO_INVALIDO' });
    assert.deepEqual(decidirTroca({ assinatura: paga(), agendada: null, tierPara: 'basic' }), { acao: 'bloquear', codigo: 'MESMO_PLANO' });
  });

  it('assinatura paga: subir com proporcional, descer agendado', () => {
    assert.deepEqual(decidirTroca({ assinatura: paga(), agendada: null, tierPara: 'basic_plus' }), { acao: 'subir' });
    assert.deepEqual(decidirTroca({ assinatura: paga({ tier: 'premium' }), agendada: null, tierPara: 'basic' }), { acao: 'descer' });
  });

  it('mês bônus do teste sem 1º pagamento: troca sem proporcional, descida imediata', () => {
    const bonus = paga({ primeiroPagamentoEm: null, fimTesteEm: sp('2026-10-25') });
    assert.deepEqual(decidirTroca({ assinatura: bonus, agendada: null, tierPara: 'premium' }), { acao: 'subir_sem_proporcional' });
    assert.deepEqual(decidirTroca({ assinatura: { ...bonus, tier: 'premium' }, agendada: null, tierPara: 'basic' }), { acao: 'descer_imediata' });
  });

  it('REV-04 assinatura paga antiga (sem primeiro_pagamento_em e sem fim_teste_em) conta como paga', () => {
    const antiga = paga({ primeiroPagamentoEm: null, fimTesteEm: null });
    assert.deepEqual(decidirTroca({ assinatura: antiga, agendada: null, tierPara: 'premium' }), { acao: 'subir' });
    assert.deepEqual(decidirTroca({ assinatura: { ...antiga, tier: 'premium' }, agendada: null, tierPara: 'basic' }), { acao: 'descer' });
  });

  it('com descida agendada: voltar ao plano atual desfaz; subir desfaz e sobe; outra descida bloqueia', () => {
    const atual = paga({ tier: 'basic_plus' });
    const agendada = { tierDe: 'basic_plus', tierPara: 'basic' };
    assert.deepEqual(decidirTroca({ assinatura: atual, agendada, tierPara: 'basic_plus' }), { acao: 'desfazer' });
    assert.deepEqual(decidirTroca({ assinatura: atual, agendada, tierPara: 'premium' }), { acao: 'desfazer_e_subir' });
    assert.deepEqual(decidirTroca({ assinatura: atual, agendada, tierPara: 'basic' }), { acao: 'bloquear', codigo: 'TROCA_AGENDADA' });
  });
});

describe('XG48 escolha da descida', () => {
  const itens = [
    { id: 'c', criadoEm: sp('2026-03-01') },
    { id: 'a', criadoEm: sp('2026-01-01') },
    { id: 'b', criadoEm: sp('2026-02-01') },
  ];

  it('a escolha do dono vale primeiro; vaga que sobra fica com o mais antigo', () => {
    assert.deepEqual([...selecionarMantidos(itens, ['c'], 1)], ['c']);
    assert.deepEqual([...selecionarMantidos(itens, ['c'], 2)].sort(), ['a', 'c']);
    // Escolhida que deixou de existir (concluída): vaga vai para a mais antiga.
    assert.deepEqual([...selecionarMantidos(itens, ['x'], 1)], ['a']);
    assert.equal(selecionarMantidos(itens, [], -1).size, 3);
    assert.equal(selecionarMantidos(itens, ['a', 'b'], 0).size, 0);
  });

  it('não deixa confirmar sem escolher exatamente até o limite', () => {
    assert.equal(validarEscolha(['a', 'b', 'c'], undefined, 1), 'Escolha exatamente 1.');
    assert.equal(validarEscolha(['a', 'b', 'c'], ['a', 'b'], 1), 'Escolha exatamente 1.');
    assert.equal(validarEscolha(['a', 'b', 'c'], ['a', 'a'], 2), 'Há itens repetidos na escolha.');
    assert.match(validarEscolha(['a', 'b', 'c'], ['z'], 1) ?? '', /não pertencem/);
    assert.equal(validarEscolha(['a', 'b', 'c'], ['b'], 1), null);
    // Sem excesso não há escolha.
    assert.equal(validarEscolha(['a'], undefined, 1), null);
    assert.equal(validarEscolha(['a', 'b'], undefined, -1), null);
  });

  it('links acima do limite: pausa os mais novos de cada obra', () => {
    const links = [
      { id: 'l1', obraId: 'o1' }, { id: 'l2', obraId: 'o1' }, { id: 'l3', obraId: 'o1' },
      { id: 'l4', obraId: 'o2' },
    ];
    assert.deepEqual(linksExcedentes(links, 1), ['l2', 'l3']);
    assert.deepEqual(linksExcedentes(links, 3), []);
    assert.deepEqual(linksExcedentes(links, -1), []);
  });
});
