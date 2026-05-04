export type MedicaoContratanteStatus =
  | 'aguardando_aprovacao'
  | 'aprovada'
  | 'rejeitada'
  | 'paga';

/**
 * Medição visualizada da perspectiva do contratante (cliente que aprova).
 *
 * Espelha {@link import('@features/empreiteiro/pagamentos/types').MedicaoEmpreiteiro}
 * mas troca os status para refletir o lado de quem aprova.
 */
export interface MedicaoContratante {
  id: string;
  obraId: string;
  obraNome: string;
  empreiteiroNome: string;
  numero: number;
  periodo: string;
  valor: number;
  status: MedicaoContratanteStatus;
  /** ISO `YYYY-MM-DD`. */
  dataEnvio: string;
  /** ISO `YYYY-MM-DD` (preenchida quando status === 'aprovada' | 'rejeitada' | 'paga'). */
  dataAvaliacao?: string;
  descricao: string;
  /** Motivo registrado pelo contratante ao rejeitar uma medição. */
  motivoRejeicao?: string;
}

export interface MedicoesContratanteKPI {
  totalContratado: number;
  totalAprovado: number;
  aguardandoMinhaAprovacao: number;
  rejeitado: number;
  /** Quantidade de medições aguardando aprovação (não em valor). */
  countAguardando: number;
  /** Tempo médio (dias) entre envio e aprovação/rejeição do contratante. */
  prazoMedioAvaliacaoDias: number;
}
