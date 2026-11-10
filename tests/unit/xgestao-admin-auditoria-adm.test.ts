import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { montarCsv } from '@features/xgestao/admin/server/csv';
import { formatarLimite, limiteSemTeto, usoRecurso } from '@features/xgestao/admin/lib/situacao-assinante';
import { hojeSaoPaulo, lancamentoAtrasadoEm, mesCivilSaoPaulo, obraAtrasadaEm } from '@features/xgestao/admin/lib/data-sp';
import { calcularCancelamentos, type AssinaturaHistorica } from '@features/xgestao/admin/lib/metricas-comerciais';
import { ROTULO_PROBLEMA_COBRANCA, TIPOS_PROBLEMA_COBRANCA } from '@features/xgestao/admin/lib/cobranca-rotulos';

/** Auditoria do admin xgestão (ADM-08, ADM-09, ADM-11, TST-11, sentinela 9999). */

describe('sentinela de limite: -1, null e 9999 legado são "sem limite"', () => {
  it('formatarLimite', () => {
    assert.equal(formatarLimite(-1), 'sem limite');
    assert.equal(formatarLimite(null), 'sem limite');
    assert.equal(formatarLimite(undefined), 'sem limite');
    assert.equal(formatarLimite(9999), 'sem limite');
    assert.equal(formatarLimite(100000), 'sem limite');
    assert.equal(formatarLimite(3), '3');
    assert.equal(formatarLimite(0), '0');
    assert.equal(formatarLimite(9998), '9998');
  });
  it('limiteSemTeto e usoRecurso usam a mesma regra', () => {
    assert.equal(limiteSemTeto(Number.POSITIVE_INFINITY), true);
    assert.equal(limiteSemTeto(5), false);
    assert.deepEqual(usoRecurso(4, -1, false), { usado: 4, limite: null, nivel: 'sem_limite', percentual: null });
    assert.equal(usoRecurso(4, 5, false).nivel, 'perto');
  });
});

describe('montarCsv (TST-11)', () => {
  const BOM = '﻿';
  it('BOM, separador ; e CRLF entre linhas', () => {
    const csv = montarCsv(['A', 'B'], [['x', 'y']]);
    assert.ok(csv.startsWith(BOM));
    assert.equal(csv, `${BOM}A;B\r\nx;y`);
  });
  it('aspas, ponto e vírgula e quebra de linha vão entre aspas, com aspas dobradas', () => {
    assert.equal(montarCsv(['c'], [['a;b']]), `${BOM}c\r\n"a;b"`);
    assert.equal(montarCsv(['c'], [['diz "oi"']]), `${BOM}c\r\n"diz ""oi"""`);
    assert.equal(montarCsv(['c'], [['linha1\nlinha2']]), `${BOM}c\r\n"linha1\nlinha2"`);
  });
  it('número com vírgula decimal e vazio para null/undefined', () => {
    assert.equal(montarCsv(['n', 'v', 'u'], [[1234.5, null, undefined]]), `${BOM}n;v;u\r\n1234,5;;`);
    // Número negativo não é fórmula: não ganha apóstrofo.
    assert.equal(montarCsv(['n'], [[-10.25]]), `${BOM}n\r\n-10,25`);
  });
  it('neutraliza fórmula: =, +, -, @, Tab e CR no início', () => {
    assert.equal(montarCsv(['c'], [['=1+1']]), `${BOM}c\r\n'=1+1`);
    assert.equal(montarCsv(['c'], [['+55']]), `${BOM}c\r\n'+55`);
    assert.equal(montarCsv(['c'], [['-2']]), `${BOM}c\r\n'-2`);
    assert.equal(montarCsv(['c'], [['@SOMA(A1)']]), `${BOM}c\r\n'@SOMA(A1)`);
    assert.equal(montarCsv(['c'], [['\t=HYPERLINK("x")']]), `${BOM}c\r\n"'\t=HYPERLINK(""x"")"`);
    assert.equal(montarCsv(['c'], [['\r=1+1']]), `${BOM}c\r\n"'\r=1+1"`);
  });
});

describe('fuso de São Paulo (ADM-08), relógio às 22h de Brasília', () => {
  // 22h de 09/11 em Brasília = 01h de 10/11 em UTC.
  const AS_22H = new Date('2026-11-10T01:00:00Z');
  it('hoje e mês são os de São Paulo, não os de UTC', () => {
    assert.equal(AS_22H.toISOString().slice(0, 10), '2026-11-10');
    assert.equal(hojeSaoPaulo(AS_22H), '2026-11-09');
    assert.equal(mesCivilSaoPaulo(new Date('2026-12-01T02:30:00Z')), '2026-11');
  });
  it('obra com previsão "hoje" (SP) ainda não está atrasada às 22h', () => {
    assert.equal(obraAtrasadaEm({ dataPrevisao: '2026-11-09', status: 'em_andamento' }, AS_22H), false);
    assert.equal(obraAtrasadaEm({ dataPrevisao: '2026-11-08', status: 'em_andamento' }, AS_22H), true);
    assert.equal(obraAtrasadaEm({ dataPrevisao: '2026-11-08', status: 'concluida' }, AS_22H), false);
    assert.equal(obraAtrasadaEm({ dataPrevisao: 'sem data', status: 'em_andamento' }, AS_22H), false);
  });
});

describe('pagamento atrasado calculado na hora (ADM-09)', () => {
  const AS_22H = new Date('2026-11-10T01:00:00Z');
  it('vencimento antes de hoje (SP) e não pago', () => {
    assert.equal(lancamentoAtrasadoEm({ status: 'pendente', dataVencimento: '2026-11-08' }, AS_22H), true);
    // Marcado "atrasado" (pelo job ou à mão) continua atrasado, mesmo sem vencimento.
    assert.equal(lancamentoAtrasadoEm({ status: 'atrasado', dataVencimento: '2026-11-08' }, AS_22H), true);
    assert.equal(lancamentoAtrasadoEm({ status: 'atrasado', dataVencimento: null }, AS_22H), true);
    // Vence hoje em SP (já é amanhã em UTC): ainda não atrasou.
    assert.equal(lancamentoAtrasadoEm({ status: 'pendente', dataVencimento: '2026-11-09' }, AS_22H), false);
    assert.equal(lancamentoAtrasadoEm({ status: 'pago', dataVencimento: '2026-11-01' }, AS_22H), false);
    assert.equal(lancamentoAtrasadoEm({ status: 'cancelado', dataVencimento: '2026-11-01' }, AS_22H), false);
    assert.equal(lancamentoAtrasadoEm({ status: 'pendente', dataVencimento: null }, AS_22H), false);
  });
});

describe('reativação conta como entrada no mês (ADM-11)', () => {
  const DIA = 24 * 60 * 60 * 1000;
  const AGORA = new Date('2026-11-15T15:00:00Z');
  let seq = 0;
  const ass = (p: Partial<AssinaturaHistorica> & { userId: string }): AssinaturaHistorica => ({
    id: `r-${++seq}`, status: 'ativa', provider: 'asaas', tier: 'basic', plano: 'Basic', preco: 99,
    createdAt: new Date(AGORA.getTime() - 10 * DIA), renovaEm: new Date(AGORA.getTime() + 20 * DIA), canceladaEm: null, ...p,
  });

  it('quem saiu no mês passado e voltou neste mês entra; pagantes no início não contam a volta', () => {
    const porUsuario = new Map<string, AssinaturaHistorica[]>([
      ['volta', [
        ass({ userId: 'volta', status: 'cancelada', createdAt: new Date('2026-08-01T12:00:00Z'), canceladaEm: new Date('2026-10-10T12:00:00Z'), renovaEm: new Date('2026-10-10T12:00:00Z') }),
        ass({ userId: 'volta', createdAt: new Date('2026-11-05T12:00:00Z'), preco: 149 }),
      ]],
      ['fiel', [ass({ userId: 'fiel', createdAt: new Date('2026-06-01T12:00:00Z') })]],
      ['nova', [ass({ userId: 'nova', createdAt: new Date('2026-11-03T12:00:00Z') })]],
    ]);
    const c = calcularCancelamentos(porUsuario, 0, AGORA);
    assert.deepEqual(c.novasNoMes, { quantidade: 2, mrr: 248 });
    assert.equal(c.reativacoesNoMes, 1);
    // Antes: vigentes(3) - novas(1, só a 1ª da vida) + saídas(0) = 2, contando "volta" como pagante no início.
    assert.equal(c.pagantesInicioMes, 1);
  });

  it('troca de plano sem interrupção não é entrada nem reativação', () => {
    const porUsuario = new Map<string, AssinaturaHistorica[]>([
      ['troca', [
        ass({ userId: 'troca', status: 'cancelada', createdAt: new Date('2026-09-01T12:00:00Z'), canceladaEm: new Date('2026-11-04T12:00:00Z'), renovaEm: new Date('2026-12-01T12:00:00Z') }),
        ass({ userId: 'troca', createdAt: new Date('2026-11-04T12:00:00Z'), tier: 'premium', preco: 299 }),
      ]],
    ]);
    const c = calcularCancelamentos(porUsuario, 0, AGORA);
    assert.deepEqual(c.novasNoMes, { quantidade: 0, mrr: 0 });
    assert.equal(c.reativacoesNoMes, 0);
    assert.equal(c.pagantesInicioMes, 1);
  });
});

describe('rótulos da cobrança com problema (ADM-03)', () => {
  it('todo tipo tem rótulo', () => {
    for (const tipo of TIPOS_PROBLEMA_COBRANCA) assert.ok(ROTULO_PROBLEMA_COBRANCA[tipo]);
    assert.equal(TIPOS_PROBLEMA_COBRANCA.length, Object.keys(ROTULO_PROBLEMA_COBRANCA).length);
  });
});
