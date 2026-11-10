import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calcularCancelamentos,
  calcularFunil,
  calcularReceitaPorPlano,
  fimDoAcessoPago,
  inicioDoMesSaoPaulo,
  jornadaDoTeste,
  MAX_COORTES,
  mesSaoPaulo,
  type AssinaturaHistorica,
} from '@features/xgestao/admin/lib/metricas-comerciais';

/** XG45 — regras puras do funil do teste, cancelamentos e receita por plano. */

const DIA = 24 * 60 * 60 * 1000;
const AGORA = new Date('2026-11-15T15:00:00Z');
const dia = (iso: string) => new Date(iso);
const mais = (d: Date, dias: number) => new Date(d.getTime() + dias * DIA);

let seq = 0;
function ass(parcial: Partial<AssinaturaHistorica> & { userId: string }): AssinaturaHistorica {
  seq += 1;
  return {
    id: `a-${seq}`,
    status: 'ativa',
    provider: 'asaas',
    tier: 'basic',
    plano: 'Basic',
    preco: '99.90',
    createdAt: dia('2026-09-01T12:00:00Z'),
    renovaEm: null,
    canceladaEm: null,
    ...parcial,
  };
}

function teste(userId: string, inicio: Date, dias = 90, status = 'ativa'): AssinaturaHistorica {
  return ass({ userId, provider: 'trial', preco: '0', status, createdAt: inicio, renovaEm: mais(inicio, dias) });
}

describe('datas no fuso de São Paulo', () => {
  it('mês e início do mês usam o horário de São Paulo, não o UTC', () => {
    // 01/12 às 01:00 UTC ainda é 30/11 em São Paulo.
    assert.equal(mesSaoPaulo(dia('2026-12-01T01:00:00Z')), '2026-11');
    assert.equal(mesSaoPaulo(dia('2026-12-01T03:00:00Z')), '2026-12');
    assert.equal(inicioDoMesSaoPaulo(AGORA).toISOString(), '2026-11-01T03:00:00.000Z');
  });
});

describe('jornada do teste grátis', () => {
  it('sem teste não entra no funil', () => {
    assert.equal(jornadaDoTeste([], AGORA), null);
    assert.equal(jornadaDoTeste([ass({ userId: 'u' })], AGORA), null);
  });

  it('teste vigente fica em_teste; vencido além das 24h vira perdido', () => {
    const vigente = jornadaDoTeste([teste('u', mais(AGORA, -30))], AGORA)!;
    assert.equal(vigente.estado, 'em_teste');
    // Venceu há 12h: ainda está na tolerância de 24h, não perdeu.
    const tolerancia = jornadaDoTeste([teste('u', mais(AGORA, -90.5))], AGORA)!;
    assert.equal(tolerancia.estado, 'em_teste');
    const perdido = jornadaDoTeste([teste('u', mais(AGORA, -92))], AGORA)!;
    assert.equal(perdido.estado, 'perdido');
    assert.equal(perdido.assinouEm, null);
  });

  it('assinar durante o teste (ou nas 24h) dá o bônus; depois disso não', () => {
    const inicio = dia('2026-06-01T12:00:00Z');
    const t = teste('u', inicio);
    const noTeste = jornadaDoTeste([t, ass({ userId: 'u', createdAt: mais(inicio, 10), plano: 'Basic Plus' })], AGORA)!;
    assert.equal(noTeste.estado, 'convertido');
    assert.equal(noTeste.comBonus, true);
    assert.equal(noTeste.diasAteAssinar, 10);
    assert.equal(noTeste.planoAssinado, 'Basic Plus');

    const naTolerancia = jornadaDoTeste([t, ass({ userId: 'u', createdAt: mais(inicio, 90.9) })], AGORA)!;
    assert.equal(naTolerancia.comBonus, true);

    const depois = jornadaDoTeste([t, ass({ userId: 'u', createdAt: mais(inicio, 100) })], AGORA)!;
    assert.equal(depois.estado, 'convertido');
    assert.equal(depois.comBonus, false);
  });

  it('assinatura paga anterior ao teste não conta como conversão', () => {
    const inicio = mais(AGORA, -20);
    const j = jornadaDoTeste([ass({ userId: 'u', createdAt: mais(inicio, -5) }), teste('u', inicio)], AGORA)!;
    assert.equal(j.estado, 'em_teste');
  });

  it('a conversão é a 1ª paga; troca de plano depois não muda a data', () => {
    const inicio = dia('2026-06-01T12:00:00Z');
    const j = jornadaDoTeste([
      teste('u', inicio),
      ass({ userId: 'u', createdAt: mais(inicio, 40), plano: 'Premium', tier: 'premium' }),
      ass({ userId: 'u', createdAt: mais(inicio, 20), plano: 'Basic', status: 'cancelada', canceladaEm: mais(inicio, 40) }),
    ], AGORA)!;
    assert.equal(j.planoAssinado, 'Basic');
    assert.equal(j.diasAteAssinar, 20);
  });

  it('plano de valor zero que não é teste não é conversão', () => {
    const inicio = dia('2026-06-01T12:00:00Z');
    const j = jornadaDoTeste([teste('u', inicio), ass({ userId: 'u', preco: '0', createdAt: mais(inicio, 5) })], AGORA)!;
    assert.equal(j.estado, 'perdido');
  });
});

describe('funil', () => {
  it('soma estados, taxa sobre quem já decidiu, média e mediana', () => {
    const inicio = dia('2026-06-10T12:00:00Z');
    const jornadas = [
      jornadaDoTeste([teste('a', inicio), ass({ userId: 'a', createdAt: mais(inicio, 10) })], AGORA),
      jornadaDoTeste([teste('b', inicio), ass({ userId: 'b', createdAt: mais(inicio, 30) })], AGORA),
      jornadaDoTeste([teste('c', inicio), ass({ userId: 'c', createdAt: mais(inicio, 120) })], AGORA),
      jornadaDoTeste([teste('d', inicio)], AGORA),
      jornadaDoTeste([teste('e', mais(AGORA, -5))], AGORA),
      null,
    ];
    const f = calcularFunil(jornadas);
    assert.equal(f.iniciados, 5);
    assert.equal(f.emTeste, 1);
    assert.equal(f.convertidos, 3);
    assert.equal(f.convertidosNoTeste, 2);
    assert.equal(f.convertidosDepois, 1);
    assert.equal(f.perdidos, 1);
    assert.equal(f.semTeste, 1);
    assert.equal(f.taxaConversao, 75);
    assert.equal(f.taxaGeral, 60);
    assert.equal(f.mediaDiasAteAssinar, 53.3);
    assert.equal(f.medianaDiasAteAssinar, 30);
    assert.deepEqual(f.coortes.map((c) => [c.mes, c.iniciados, c.taxaConversao]), [['2026-11', 1, null], ['2026-06', 4, 75]]);
  });

  it('sem ninguém decidido a taxa é nula, não zero', () => {
    const f = calcularFunil([jornadaDoTeste([teste('a', mais(AGORA, -1))], AGORA)]);
    assert.equal(f.taxaConversao, null);
    assert.equal(f.mediaDiasAteAssinar, null);
    assert.equal(calcularFunil([]).taxaGeral, null);
  });

  it('coortes do mais recente para o mais antigo, no máximo 12', () => {
    const jornadas = Array.from({ length: 15 }, (_, i) =>
      jornadaDoTeste([teste(`u${i}`, new Date(Date.UTC(2025, i, 15, 12)))], AGORA));
    const f = calcularFunil(jornadas);
    assert.equal(f.coortes.length, MAX_COORTES);
    assert.equal(f.coortes[0].mes, '2026-03');
    assert.equal(f.coortes.at(-1)!.mes, '2025-04');
  });
});

describe('fim do acesso pago', () => {
  const renova = dia('2026-11-10T12:00:00Z');
  it('ativa sem cancelamento não tem fim; agendada vai até renovaEm', () => {
    assert.equal(fimDoAcessoPago(ass({ userId: 'u', renovaEm: renova })), null);
    assert.equal(fimDoAcessoPago(ass({ userId: 'u', renovaEm: renova, canceladaEm: dia('2026-10-20T12:00:00Z') }))?.toISOString(), renova.toISOString());
  });
  it('inadimplente ou expirada: renovaEm + 7 dias de carência', () => {
    assert.equal(fimDoAcessoPago(ass({ userId: 'u', status: 'inadimplente', renovaEm: renova }))?.toISOString(), mais(renova, 7).toISOString());
    assert.equal(fimDoAcessoPago(ass({ userId: 'u', status: 'expirada', renovaEm: renova }))?.toISOString(), mais(renova, 7).toISOString());
  });
  it('cancelada: efetivada pelo job usa renovaEm; na hora usa canceladaEm', () => {
    const a = ass({ userId: 'u', status: 'cancelada', renovaEm: renova, canceladaEm: dia('2026-10-20T12:00:00Z') });
    assert.equal(fimDoAcessoPago(a, new Set([a.id]))?.toISOString(), renova.toISOString());
    assert.equal(fimDoAcessoPago(a)?.toISOString(), '2026-10-20T12:00:00.000Z');
  });
});

describe('cancelamentos do mês', () => {
  it('separa agendados, inadimplentes, encerrados e novas; troca de plano não é saída', () => {
    const porUsuario = new Map<string, AssinaturaHistorica[]>([
      // Paga e renova: conta como pagante, sem saída.
      ['fiel', [ass({ userId: 'fiel', renovaEm: mais(AGORA, 10) })]],
      // Cancelou, usa até o fim do mês pago.
      ['agendado', [ass({ userId: 'agendado', preco: '149.90', renovaEm: mais(AGORA, 5), canceladaEm: mais(AGORA, -2) })]],
      // Pagamento pendente dentro da carência.
      ['devendo', [ass({ userId: 'devendo', status: 'inadimplente', renovaEm: mais(AGORA, -3) })]],
      // Cancelamento agendado cumprido no dia 10: saiu no mês.
      ['saiu', [ass({ id: 'efetivada', userId: 'saiu', status: 'cancelada', renovaEm: dia('2026-11-10T12:00:00Z'), canceladaEm: dia('2026-10-25T12:00:00Z') })]],
      // Saiu em outubro: não entra no mês.
      ['antigo', [ass({ userId: 'antigo', status: 'cancelada', canceladaEm: dia('2026-10-05T12:00:00Z') })]],
      // Trocou de plano: a antiga foi encerrada, a nova vigora.
      ['upgrade', [
        ass({ userId: 'upgrade', status: 'cancelada', canceladaEm: mais(AGORA, -4) }),
        ass({ userId: 'upgrade', tier: 'premium', plano: 'Premium', preco: '249.90', createdAt: mais(AGORA, -4) }),
      ]],
      // Assinou neste mês.
      ['novo', [ass({ userId: 'novo', createdAt: mais(AGORA, -2) })]],
      // Só teste: fora da conta de cancelamento.
      ['so-teste', [teste('so-teste', mais(AGORA, -10))]],
    ]);
    const c = calcularCancelamentos(porUsuario, 2, AGORA, new Set(['efetivada']));
    assert.equal(c.desde, '2026-11-01T03:00:00.000Z');
    assert.deepEqual(c.agendados, { quantidade: 1, mrr: 149.9 });
    assert.deepEqual(c.inadimplentes, { quantidade: 1, mrr: 99.9 });
    assert.deepEqual(c.encerradosNoMes, { quantidade: 1, mrr: 99.9 });
    assert.deepEqual(c.novasNoMes, { quantidade: 1, mrr: 99.9 });
    assert.equal(c.pedidosNoMes, 2);
    // Vigentes agora: fiel, agendado, devendo, upgrade, novo = 5; -1 novo +1 saiu = 5.
    assert.equal(c.pagantesInicioMes, 5);
    assert.equal(c.taxaCancelamentoMes, 20);
    assert.deepEqual(c.saidas.map((s) => [s.userId, s.tipo]), [['saiu', 'encerrado'], ['devendo', 'inadimplente'], ['agendado', 'agendado']]);
    assert.equal(c.saidas.find((s) => s.userId === 'saiu')!.data, '2026-11-10T12:00:00.000Z');
  });

  it('inadimplente que passou da carência dentro do mês vira encerrado', () => {
    const porUsuario = new Map([['x', [ass({ userId: 'x', status: 'expirada', renovaEm: dia('2026-11-02T12:00:00Z') })]]]);
    const c = calcularCancelamentos(porUsuario, 0, AGORA);
    assert.equal(c.encerradosNoMes.quantidade, 1);
    assert.equal(c.saidas[0].data, '2026-11-09T12:00:00.000Z');
  });

  it('sem pagantes a taxa é nula', () => {
    assert.equal(calcularCancelamentos(new Map(), 0, AGORA).taxaCancelamentoMes, null);
  });
});

describe('receita por plano', () => {
  const a = (codigo: string, tier: string, valorMensal: number) => ({ situacao: { codigo: codigo as never }, plano: { tier, valorMensal } });
  it('recorrente só com quem paga e renova; saindo e em risco à parte', () => {
    const r = calcularReceitaPorPlano([
      a('pago', 'basic', 99.9),
      a('pago', 'basic', 99.9),
      a('pago', 'premium', 249.9),
      a('cancelamento_agendado', 'basic_plus', 149.9),
      a('inadimplente', 'premium', 249.9),
      a('em_teste', 'basic', 0),
      a('teste_tolerancia', 'basic', 0),
      a('somente_leitura', 'basic', 0),
      a('pago', 'pro', 79.9),
    ]);
    assert.deepEqual(r.porPlano.map((l) => l.tier), ['basic', 'basic_plus', 'premium', 'pro']);
    const basic = r.porPlano[0];
    assert.equal(basic.pagantes, 2);
    assert.equal(basic.emTeste, 2);
    assert.equal(r.porPlano[1].saindo, 1);
    assert.equal(r.porPlano[1].mrr, 0);
    assert.equal(r.pagantes, 4);
    assert.equal(Math.round(r.mrr * 100) / 100, 529.6);
    assert.equal(r.ticketMedio, 132.4);
    assert.equal(r.mrrSaindo, 149.9);
    assert.equal(r.mrrEmRisco, 249.9);
  });

  it('sem pagantes: ticket nulo e as três linhas atuais aparecem zeradas', () => {
    const r = calcularReceitaPorPlano([]);
    assert.equal(r.ticketMedio, null);
    assert.deepEqual(r.porPlano.map((l) => [l.tier, l.pagantes]), [['basic', 0], ['basic_plus', 0], ['premium', 0]]);
  });
});
