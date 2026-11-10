import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  compararSemUso,
  DIAS_SEM_USO,
  engajamentoAssinante,
  resumirEngajamento,
  semUsoComRisco,
} from '@features/xgestao/admin/lib/engajamento';
import {
  calcularHistoricoMensal,
  fimDoMesSaoPaulo,
  periodosPagos,
  ultimosMeses,
} from '@features/xgestao/admin/lib/historico-mensal';
import { motivosAtencao, type SituacaoAssinante, type UsoPlanoAdmin } from '@features/xgestao/admin/lib/situacao-assinante';
import type { AssinaturaHistorica } from '@features/xgestao/admin/lib/metricas-comerciais';

/** XG46 — engajamento e histórico mês a mês, sem banco. */

const DIA = 24 * 60 * 60 * 1000;
const AGORA = new Date('2026-11-15T15:00:00Z');
const antes = (dias: number) => new Date(AGORA.getTime() - dias * DIA);
const sinais = (p: Partial<Parameters<typeof engajamentoAssinante>[0]> = {}) => ({
  usoTitular: null, usoEquipe: null, registro: null, registros30d: 0, ...p,
});

describe('engajamento do assinante', () => {
  it('vale o sinal mais recente entre responsável, equipe e registro', () => {
    const e = engajamentoAssinante(sinais({ usoTitular: antes(40), usoEquipe: antes(3), registro: antes(10), registros30d: 4 }), AGORA);
    assert.equal(e.nivel, 'ativo_7d');
    assert.equal(e.diasSemUso, 3);
    assert.equal(e.ultimoSinalEm, antes(3).toISOString());
    assert.equal(e.ultimoUsoTitularEm, antes(40).toISOString());
    assert.equal(e.registros30d, 4);
  });

  it('limites de 7 e 30 dias e "nunca"', () => {
    assert.equal(engajamentoAssinante(sinais({ usoTitular: antes(6.9) }), AGORA).nivel, 'ativo_7d');
    assert.equal(engajamentoAssinante(sinais({ usoTitular: antes(7) }), AGORA).nivel, 'ativo_30d');
    assert.equal(engajamentoAssinante(sinais({ registro: antes(29.9) }), AGORA).nivel, 'ativo_30d');
    assert.equal(engajamentoAssinante(sinais({ registro: antes(30) }), AGORA).nivel, 'inativo');
    const nunca = engajamentoAssinante(sinais(), AGORA);
    assert.equal(nunca.nivel, 'nunca');
    assert.equal(nunca.diasSemUso, null);
    assert.equal(nunca.ultimoSinalEm, null);
  });

  it('data no futuro não vira dia negativo', () => {
    assert.equal(engajamentoAssinante(sinais({ usoTitular: new Date(AGORA.getTime() + DIA) }), AGORA).diasSemUso, 0);
  });

  it('sem uso só é risco para quem paga ou está no teste, a partir de 14 dias', () => {
    const parado = engajamentoAssinante(sinais({ usoTitular: antes(DIAS_SEM_USO) }), AGORA);
    const quase = engajamentoAssinante(sinais({ usoTitular: antes(DIAS_SEM_USO - 1) }), AGORA);
    assert.equal(semUsoComRisco('pago', parado), true);
    assert.equal(semUsoComRisco('em_teste', parado), true);
    assert.equal(semUsoComRisco('pago', quase), false);
    assert.equal(semUsoComRisco('cancelamento_agendado', parado), false);
    assert.equal(semUsoComRisco('somente_leitura', parado), false);
    assert.equal(semUsoComRisco('pago', engajamentoAssinante(sinais(), AGORA)), true);
  });

  it('ordena do mais parado ao menos, quem nunca usou primeiro', () => {
    const lista = [antes(20), null, antes(50)].map((d) => engajamentoAssinante(sinais({ usoTitular: d }), AGORA));
    assert.deepEqual(lista.sort(compararSemUso).map((e) => e.diasSemUso), [null, 50, 20]);
  });

  it('resumo por grupo: pagantes incluem quem cancelou e ainda usa; teste inclui a tolerância', () => {
    const e = (dias: number | null) => engajamentoAssinante(sinais({ usoTitular: dias === null ? null : antes(dias) }), AGORA);
    const s = (codigo: string) => ({ codigo }) as { codigo: never };
    const r = resumirEngajamento([
      { situacao: s('pago'), engajamento: e(1) },
      { situacao: s('pago'), engajamento: e(20) },
      { situacao: s('cancelamento_agendado'), engajamento: e(40) },
      { situacao: s('em_teste'), engajamento: e(null) },
      { situacao: s('teste_tolerancia'), engajamento: e(2) },
      { situacao: s('somente_leitura'), engajamento: e(100) },
    ]);
    assert.equal(r.todos.total, 6);
    assert.deepEqual(r.pagantes.porNivel, { ativo_7d: 1, ativo_30d: 1, inativo: 1, nunca: 0 });
    assert.equal(r.pagantes.taxaAtivos7d, 33.3);
    assert.equal(r.pagantes.taxaAtivos30d, 66.7);
    assert.equal(r.emTeste.total, 2);
    assert.equal(r.emTeste.porNivel.nunca, 1);
    // pago há 20 dias e em_teste que nunca usou; cancelado e somente leitura não.
    assert.equal(r.semUso, 2);
    assert.equal(resumirEngajamento([]).todos.taxaAtivos7d, null);
  });

  it('o motivo "sem uso" entra na atenção com o número de dias', () => {
    const situacao = { codigo: 'pago', rotulo: 'Pago', ate: null, diasRestantes: null, motivo: null } as unknown as SituacaoAssinante;
    const livre = { usado: 0, limite: 1, nivel: 'livre', percentual: 0 } as const;
    const uso: UsoPlanoAdmin = { obras: livre, pessoas: livre, links: livre };
    const motivos = motivosAtencao(situacao, uso, 1, engajamentoAssinante(sinais({ usoTitular: antes(21) }), AGORA));
    assert.deepEqual(motivos.map((m) => [m.codigo, m.severidade, m.texto]), [['sem_uso', 'atencao', 'Sem usar há 21 dias']]);
    assert.equal(motivosAtencao(situacao, uso, 1, engajamentoAssinante(sinais(), AGORA))[0].texto, 'Nenhum uso registrado');
    // Sem engajamento (chamadas antigas), nada muda.
    assert.deepEqual(motivosAtencao(situacao, uso, 1), []);
  });
});

let seq = 0;
function ass(p: Partial<AssinaturaHistorica> & { userId: string }): AssinaturaHistorica {
  seq += 1;
  return {
    id: `h-${seq}`, status: 'ativa', provider: 'asaas', tier: 'basic', plano: 'Basic', preco: '100',
    createdAt: new Date('2026-09-10T12:00:00Z'), renovaEm: null, canceladaEm: null, ...p,
  };
}

describe('meses', () => {
  it('últimos 12 meses até o atual, atravessando o ano', () => {
    const meses = ultimosMeses(AGORA);
    assert.equal(meses.length, 12);
    assert.equal(meses[0], '2025-12');
    assert.equal(meses.at(-1), '2026-11');
    assert.deepEqual(ultimosMeses(new Date('2026-01-01T02:00:00Z'), 2), ['2025-11', '2025-12']);
  });
  it('fim do mês no horário de São Paulo', () => {
    assert.equal(fimDoMesSaoPaulo('2026-10').toISOString(), '2026-11-01T02:59:59.999Z');
  });
});

describe('períodos pagos', () => {
  it('troca de plano emenda os períodos; volta depois de sair abre outro', () => {
    const p = periodosPagos([
      ass({ userId: 'u', status: 'cancelada', createdAt: new Date('2026-06-01T12:00:00Z'), canceladaEm: new Date('2026-07-01T12:00:00Z') }),
      ass({ userId: 'u', status: 'cancelada', createdAt: new Date('2026-07-01T12:00:00Z'), canceladaEm: new Date('2026-08-01T12:00:00Z') }),
      ass({ userId: 'u', createdAt: new Date('2026-10-01T12:00:00Z') }),
      ass({ userId: 'u', provider: 'trial', preco: '0', createdAt: new Date('2026-05-01T12:00:00Z') }),
    ]);
    assert.deepEqual(p.map((i) => [i.inicio.toISOString().slice(0, 10), i.fim?.toISOString().slice(0, 10) ?? null]), [
      ['2026-06-01', '2026-08-01'],
      ['2026-10-01', null],
    ]);
  });
});

describe('histórico mês a mês', () => {
  it('testes, entradas, saídas, pagantes, recorrente e recebido por mês', () => {
    const porUsuario = new Map<string, AssinaturaHistorica[]>([
      // Testou em agosto, assinou em setembro, segue pagando.
      ['fiel', [
        ass({ userId: 'fiel', provider: 'trial', preco: '0', status: 'cancelada', createdAt: new Date('2026-08-05T12:00:00Z') }),
        ass({ userId: 'fiel', createdAt: new Date('2026-09-10T12:00:00Z') }),
      ]],
      // Assinou em setembro, trocou de plano em outubro (não é saída), cancelou em novembro e ainda usa.
      ['upgrade', [
        ass({ userId: 'upgrade', status: 'cancelada', createdAt: new Date('2026-09-20T12:00:00Z'), canceladaEm: new Date('2026-10-10T12:00:00Z') }),
        ass({ userId: 'upgrade', tier: 'premium', preco: '300', createdAt: new Date('2026-10-10T12:00:00Z'), renovaEm: new Date('2026-12-10T12:00:00Z'), canceladaEm: new Date('2026-11-05T12:00:00Z') }),
      ]],
      // Pagou em setembro e saiu em outubro (cancelamento agendado cumprido).
      ['saiu', [ass({ id: 'efetivada', userId: 'saiu', status: 'cancelada', createdAt: new Date('2026-09-01T12:00:00Z'), renovaEm: new Date('2026-10-20T12:00:00Z'), canceladaEm: new Date('2026-10-01T12:00:00Z') })]],
      // Hoje com pagamento pendente: pagante, mas fora do recorrente do mês atual.
      ['devendo', [ass({ userId: 'devendo', status: 'inadimplente', createdAt: new Date('2026-10-02T12:00:00Z'), renovaEm: antes(2) })]],
    ]);
    const recebido = new Map([['2026-09', 200], ['2026-10', 400.5], ['2025-01', 999]]);
    const h = calcularHistoricoMensal(porUsuario, recebido, AGORA, new Set(['efetivada']));
    const mes = (m: string) => h.find((x) => x.mes === m)!;
    assert.equal(h.length, 12);
    assert.deepEqual(mes('2026-08'), { mes: '2026-08', testesIniciados: 1, novosPagantes: 0, saidas: 0, pagantesFimMes: 0, recorrenteFimMes: 0, recebido: 0 });
    assert.deepEqual(mes('2026-09'), { mes: '2026-09', testesIniciados: 0, novosPagantes: 3, saidas: 0, pagantesFimMes: 3, recorrenteFimMes: 300, recebido: 200 });
    // Outubro: entra "devendo"; "saiu" sai em 20/10; "upgrade" troca de plano sem sair.
    assert.deepEqual(mes('2026-10'), { mes: '2026-10', testesIniciados: 0, novosPagantes: 1, saidas: 1, pagantesFimMes: 3, recorrenteFimMes: 500, recebido: 400.5 });
    // Novembro (hoje): upgrade cancelou (sai do recorrente), devendo está pendente.
    assert.deepEqual(mes('2026-11'), { mes: '2026-11', testesIniciados: 0, novosPagantes: 0, saidas: 0, pagantesFimMes: 3, recorrenteFimMes: 100, recebido: 0 });
    // Fora da janela de 12 meses não aparece.
    assert.equal(h.some((x) => x.mes === '2025-01'), false);
  });

  it('saída futura (fim do período pago ainda não chegou) não conta', () => {
    const porUsuario = new Map([['x', [ass({ userId: 'x', createdAt: antes(20), renovaEm: new Date(AGORA.getTime() + 5 * DIA), canceladaEm: antes(1) })]]]);
    const h = calcularHistoricoMensal(porUsuario, new Map(), AGORA);
    assert.equal(h.reduce((t, m) => t + m.saidas, 0), 0);
    assert.equal(h.at(-1)!.pagantesFimMes, 1);
    assert.equal(h.at(-1)!.recorrenteFimMes, 0);
  });
});
