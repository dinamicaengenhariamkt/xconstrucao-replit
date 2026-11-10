/**
 * XG46 — histórico mês a mês do xgestão (Lote C), reconstruído do que o banco
 * já guarda, sem tabela nova:
 * - testes e assinaturas: `createdAt`, `renovaEm`, `canceladaEm` e status de cada
 *   assinatura (a mesma leitura do funil e dos cancelamentos do XG45);
 * - dinheiro recebido: os lançamentos pagos do caixa da plataforma, pelo mês da data.
 *
 * Limite conhecido: o banco não guarda desde quando uma assinatura ficou
 * inadimplente, então no passado quem atrasou conta como pagante até perder o
 * acesso. No mês corrente a situação de hoje é usada e o recorrente bate com o
 * do Financeiro.
 */
import {
  fimDoAcessoPago,
  mesSaoPaulo,
  type AssinaturaHistorica,
} from './metricas-comerciais';

export const MESES_HISTORICO = 12;

export interface MesHistorico {
  /** `YYYY-MM`, fuso de São Paulo. */
  mes: string;
  testesIniciados: number;
  /** Começaram a pagar (inclui quem tinha saído e voltou). */
  novosPagantes: number;
  /** Perderam o acesso pago (troca de plano não conta). */
  saidas: number;
  /** Com acesso pago no fim do mês (ou agora, no mês corrente). */
  pagantesFimMes: number;
  /** Mensalidades que renovam no fim do mês: sem quem já cancelou. */
  recorrenteFimMes: number;
  /** Dinheiro que entrou no caixa no mês. */
  recebido: number;
}

const TESTE = 'trial';

function paga(a: AssinaturaHistorica): boolean {
  return a.provider !== TESTE && Number(a.preco) > 0;
}

/** Os últimos `n` meses até o de `agora`, do mais antigo para o mais recente. */
export function ultimosMeses(agora: Date, n = MESES_HISTORICO): string[] {
  const [ano, mes] = mesSaoPaulo(agora).split('-').map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(ano, mes - 1 - (n - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });
}

/** Último instante do mês em São Paulo (00:00 do mês seguinte lá = 03:00 UTC), menos 1 ms. */
export function fimDoMesSaoPaulo(mes: string): Date {
  const [ano, m] = mes.split('-').map(Number);
  return new Date(Date.UTC(ano, m, 1, 3, 0, 0) - 1);
}

interface Intervalo { inicio: Date; fim: Date | null }

/** Junta períodos pagos que se tocam ou se sobrepõem: troca de plano não vira saída. */
export function periodosPagos(assinaturas: readonly AssinaturaHistorica[], efetivadas: ReadonlySet<string> = new Set()): Intervalo[] {
  const intervalos = assinaturas
    .filter(paga)
    .map((a) => ({ inicio: a.createdAt, fim: fimDoAcessoPago(a, efetivadas) }))
    .filter((i) => i.fim === null || i.fim > i.inicio)
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  const juntos: Intervalo[] = [];
  for (const i of intervalos) {
    const ultimo = juntos.at(-1);
    if (ultimo && (ultimo.fim === null || i.inicio <= ultimo.fim)) {
      if (ultimo.fim !== null && (i.fim === null || i.fim > ultimo.fim)) ultimo.fim = i.fim;
    } else {
      juntos.push({ ...i });
    }
  }
  return juntos;
}

/**
 * A assinatura paga que cobre o instante `t` (a mais recente, se houver duas
 * no dia da troca de plano) e se ela renova ou já foi cancelada.
 */
function pagaEm(assinaturas: readonly AssinaturaHistorica[], t: Date, efetivadas: ReadonlySet<string>) {
  const cobrindo = assinaturas
    .filter((a) => paga(a) && a.createdAt <= t)
    .filter((a) => {
      const fim = fimDoAcessoPago(a, efetivadas);
      return fim === null || fim > t;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  return cobrindo ?? null;
}

export function calcularHistoricoMensal(
  porUsuario: ReadonlyMap<string, readonly AssinaturaHistorica[]>,
  recebidoPorMes: ReadonlyMap<string, number>,
  agora = new Date(),
  efetivadas: ReadonlySet<string> = new Set(),
  meses = MESES_HISTORICO,
  /**
   * CRM-04 — quem hoje está "assinou no teste, aguardando 1º pagamento": no
   * mês corrente não entra no recorrente, igual ao Financeiro.
   */
  aguardandoAgora: ReadonlySet<string> = new Set(),
): MesHistorico[] {
  const lista = ultimosMeses(agora, meses);
  const mesAtual = lista.at(-1)!;
  const porMes = new Map<string, MesHistorico>(lista.map((mes) => [mes, {
    mes, testesIniciados: 0, novosPagantes: 0, saidas: 0, pagantesFimMes: 0, recorrenteFimMes: 0,
    recebido: Math.round((recebidoPorMes.get(mes) ?? 0) * 100) / 100,
  }]));

  for (const [userId, assinaturas] of porUsuario) {
    const teste = assinaturas
      .filter((a) => a.provider === TESTE)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    if (teste) {
      const linha = porMes.get(mesSaoPaulo(teste.createdAt));
      if (linha) linha.testesIniciados += 1;
    }
    for (const p of periodosPagos(assinaturas, efetivadas)) {
      const entrada = porMes.get(mesSaoPaulo(p.inicio));
      if (entrada) entrada.novosPagantes += 1;
      if (p.fim && p.fim <= agora) {
        const saida = porMes.get(mesSaoPaulo(p.fim));
        if (saida) saida.saidas += 1;
      }
    }
    for (const linha of porMes.values()) {
      const atual = linha.mes === mesAtual;
      const t = atual ? agora : fimDoMesSaoPaulo(linha.mes);
      const a = pagaEm(assinaturas, t, efetivadas);
      if (!a) continue;
      linha.pagantesFimMes += 1;
      const cancelou = a.canceladaEm !== null && a.canceladaEm <= t;
      // Hoje se sabe quem está com pagamento pendente; no passado, não.
      const pendente = atual && (a.status !== 'ativa' || aguardandoAgora.has(userId));
      if (!cancelou && !pendente) linha.recorrenteFimMes += Number(a.preco);
    }
  }
  for (const linha of porMes.values()) linha.recorrenteFimMes = Math.round(linha.recorrenteFimMes * 100) / 100;
  return lista.map((mes) => porMes.get(mes)!);
}
