'use client';

import { ObraCard } from '@features/shared/components/ObraCard';
import type { MinhaObraCardProps } from '../types';

export function MinhaObraCard({ obra }: MinhaObraCardProps) {
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
      parteContraria={obra.contratante}
      parteContrariaRole="Contratante"
      basePath="/empreiteiro/minhas-obras"
      dateMode="range"
    />
  );
}
