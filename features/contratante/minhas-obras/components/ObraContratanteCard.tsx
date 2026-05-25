'use client';

import { ObraCard } from '@features/shared/components/ObraCard';
import type { ObraContratanteCardProps } from '../types';

export function ObraContratanteCard({ obra }: ObraContratanteCardProps) {
  const visibilidade = (obra as typeof obra & {
    visibilidade?: 'rascunho' | 'publicada' | 'pausada' | 'arquivada';
  }).visibilidade;
  return (
    <ObraCard
      obraId={obra.id}
      titulo={obra.titulo}
      endereco={obra.endereco}
      imagemUrl={obra.imagemUrl}
      status={obra.status}
      progresso={obra.progresso}
      orcamento={obra.orcamento}
      dataInicio={obra.dataInicio}
      dataPrevisaoFim={obra.dataPrevisaoFim}
      tipo={obra.tipo}
      parteContraria={obra.empreiteiro}
      parteContrariaRole="Empreiteiro"
      basePath="/contratante/minhas-obras"
      dateMode="end-only"
      candidaturas={obra.candidaturas}
      visibilidade={visibilidade}
    />
  );
}
