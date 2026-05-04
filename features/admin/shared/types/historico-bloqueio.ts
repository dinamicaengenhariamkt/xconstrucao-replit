/**
 * Registro de bloqueio/desbloqueio de uma conta admin (empreiteira ou cliente).
 */
export interface HistoricoBloqueio {
  id: string;
  tipo: 'bloqueio' | 'desbloqueio';
  /** Motivo registrado pelo admin no momento da ação. */
  motivo?: string;
  /** ISO `YYYY-MM-DD` da data da ação. */
  data: string;
  /** Nome ou email do admin que executou a ação. */
  responsavel: string;
  /** Notas adicionais opcionais. */
  observacoes?: string;
}
