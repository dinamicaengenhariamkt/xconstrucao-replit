import type { ObraStatus } from '@features/shared/types';
import type { HealthStatus } from '@features/shared/health';

/**
 * Dados mínimos para renderizar um card de obra.
 * Shared entre empreiteiro (`MinhaObraCard`) e contratante (`ObraContratanteCard`).
 */
export interface ObraCardProps {
  obraId: string;
  titulo: string;
  endereco: string;
  imagemUrl: string;
  status: ObraStatus;
  progresso: number;
  orcamento: number;
  dataInicio: string;
  dataPrevisaoFim: string;
  tipo: string;
  /** A "outra parte" do contrato (contratante, na visão empreiteiro; e vice-versa). */
  parteContraria: {
    nome: string;
    iniciais: string;
    cor: string;
  };
  parteContrariaRole: 'Contratante' | 'Empreiteiro';
  /** Prefixo da URL de detalhe (ex: `/contratante/minhas-obras` ou `/empreiteiro/minhas-obras`). */
  basePath: string;
  /** Como exibir as datas no rodapé. */
  dateMode: 'range' | 'end-only';
  /** Quando informado e > 0, exibe um badge "N candidaturas" no canto superior direito. */
  candidaturas?: number;
  /** Visibilidade no marketplace (rascunho/publicada/pausada/arquivada). Quando informado, renderiza badge. */
  visibilidade?: 'rascunho' | 'publicada' | 'pausada' | 'arquivada';
  /** Status da moderação admin (Task #86). Quando obra está publicada+pendente/rejeitada, renderiza badge extra com o estado de revisão (e tooltip com motivo, no caso de rejeição). */
  statusModeracao?: 'pendente' | 'aprovada' | 'rejeitada' | null;
  /** Motivo da rejeição, usado como tooltip no badge "Rejeitada". */
  motivoModeracao?: string | null;
  /** Saúde real da obra (J17). Quando informada, renderiza o HealthBadge.
   *  Vem do mapa `useObrasHealthMap` carregado pela grid. Ausente → sem badge. */
  healthStatus?: HealthStatus;
}
