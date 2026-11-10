/**
 * XG50 — quem cancela e volta. Regras puras (servidor, tela e testes com `tsx`).
 *
 * - Saída: pedido de cancelamento (`cancelamento_agendado`/`cancelamento`) ou
 *   estorno/chargeback (`payment_refunded`) de uma assinatura paga.
 * - Volta: a 1ª assinatura paga criada depois de uma saída. Cada par saída →
 *   volta é um ciclo.
 * - "Cancela e volta com frequência": 2 ou mais ciclos em 90 dias, ou alguma
 *   tentativa bloqueada de 2º teste ou 2º mês bônus (`teste_negado`, `bonus_negado`).
 */
export const JANELA_CICLOS_DIAS = 90;
export const CICLOS_PARA_ALERTA = 2;
const DIA_MS = 24 * 60 * 60 * 1000;

export type RetornoAssinante = {
  voltou: boolean;
  /** Quando voltou pela última vez (ISO). */
  voltouEm: string | null;
  /** Ciclos saída → volta nos últimos 90 dias. */
  ciclos90d: number;
  ciclosTotal: number;
  /** `teste_negado` + `bonus_negado`. */
  tentativasBloqueadas: number;
  frequente: boolean;
};

export const SEM_RETORNO: RetornoAssinante = {
  voltou: false, voltouEm: null, ciclos90d: 0, ciclosTotal: 0, tentativasBloqueadas: 0, frequente: false,
};

export function retornoDoAssinante(args: {
  /** Criação das assinaturas pagas (sem o teste). */
  assinaturasPagas: ReadonlyArray<Date>;
  /** Datas das saídas (pedido de cancelamento ou estorno). */
  saidas: ReadonlyArray<Date>;
  tentativasBloqueadas: number;
}, agora = new Date()): RetornoAssinante {
  const pagas = [...args.assinaturasPagas].sort((a, b) => a.getTime() - b.getTime());
  const saidas = [...args.saidas].sort((a, b) => a.getTime() - b.getTime());
  const voltas: Date[] = [];
  let i = 0;
  for (const saida of saidas) {
    // Várias saídas antes da mesma volta contam uma vez.
    if (voltas.length > 0 && saida.getTime() < voltas[voltas.length - 1].getTime()) continue;
    while (i < pagas.length && pagas[i].getTime() <= saida.getTime()) i++;
    if (i >= pagas.length) break;
    voltas.push(pagas[i]);
    i++;
  }
  const desde = agora.getTime() - JANELA_CICLOS_DIAS * DIA_MS;
  const ciclos90d = voltas.filter((v) => v.getTime() >= desde).length;
  const tentativas = Math.max(0, args.tentativasBloqueadas);
  return {
    voltou: voltas.length > 0,
    voltouEm: voltas.length > 0 ? voltas[voltas.length - 1].toISOString() : null,
    ciclos90d,
    ciclosTotal: voltas.length,
    tentativasBloqueadas: tentativas,
    frequente: ciclos90d >= CICLOS_PARA_ALERTA || tentativas > 0,
  };
}
