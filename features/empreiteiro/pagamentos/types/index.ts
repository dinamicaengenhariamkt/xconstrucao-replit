export type MedicaoStatus = 'recebido' | 'aguardando_aprovacao' | 'pendente' | 'rejeitado';

export interface MedicaoEmpreiteiro {
  id: string;
  obraId: string;
  obraNome: string;
  numero: number;
  periodo: string;
  valor: number;
  status: MedicaoStatus;
  /** Formato ISO `YYYY-MM-DD` para permitir filtragem por intervalo de datas. */
  dataEnvio: string;
  /** Formato ISO `YYYY-MM-DD` quando o status for `recebido`. */
  dataRecebimento?: string;
  descricao: string;
}

export interface PagamentosEmpreiteiroKPI {
  totalContratado: number;
  totalRecebido: number;
  aguardandoAprovacao: number;
  aLiberar: number;
  /** Soma das medições com status `rejeitado` (precisam ser refeitas). */
  rejeitado: number;
  /** Média de dias entre `dataEnvio` e `dataRecebimento` para medições recebidas. */
  prazoMedioRecebimentoDias: number;
  /** Quantidade de medições com status `rejeitado`. */
  medicoesRejeitadasCount: number;
  /** Total de medições enviadas para análise (excluindo as ainda em rascunho/`pendente`). */
  medicoesEnviadasCount: number;
  /** Percentual de rejeição (0-100). 0 quando `medicoesEnviadasCount` é 0. */
  taxaRejeicaoPercent: number;
}
