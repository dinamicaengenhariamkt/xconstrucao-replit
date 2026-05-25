import type { ObraStatus } from '@features/shared/types';

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
}
