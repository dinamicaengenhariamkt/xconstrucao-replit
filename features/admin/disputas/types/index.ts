export type DisputaStatus =
  | 'aberta'
  | 'em_analise'
  | 'aguardando_partes'
  | 'resolvida'
  | 'escalada';

export type DisputaCategoria =
  | 'pagamento_atrasado'
  | 'medicao_rejeitada'
  | 'qualidade_obra'
  | 'descumprimento_prazo'
  | 'escopo_contrato'
  | 'outros';

export type DisputaPrioridade = 'alta' | 'media' | 'baixa';

export type DisputaParte = 'cliente' | 'empreiteira';

export interface Disputa {
  id: string;
  /** Código curto exibido nas listagens (ex: DSP-2025-001). */
  codigo: string;
  obraId: string;
  obraNome: string;
  /** Identificação das partes envolvidas. */
  cliente: { id: string; nome: string };
  empreiteira: { id: string; nome: string };
  /** Quem abriu a disputa. */
  abertaPor: DisputaParte;
  categoria: DisputaCategoria;
  status: DisputaStatus;
  prioridade: DisputaPrioridade;
  titulo: string;
  descricao: string;
  /** Valor financeiro envolvido (opcional — só para disputas com impacto $). */
  valorEnvolvido?: number;
  /** ISO `YYYY-MM-DD`. */
  dataAbertura: string;
  /** ISO `YYYY-MM-DD` (preenchida quando `status === 'resolvida'`). */
  dataResolucao?: string;
  /** Resumo da resolução tomada pelo admin. */
  resolucao?: string;
  /** Admin responsável pela investigação. */
  responsavelAdmin?: string;
  /** SLA: dias úteis abertos sem resolução. Calculado em runtime no mock. */
  diasAberta: number;
}

export interface DisputasKPI {
  totalAbertas: number;
  emAnalise: number;
  resolvidasUltimos30d: number;
  prioridadeAlta: number;
  /** Tempo médio de resolução (dias) das disputas já resolvidas. */
  prazoMedioResolucaoDias: number;
}
