'use client';

import { ObraCard } from '@features/shared/components/ObraCard';
import type { HealthStatus } from '@features/shared/health';
import type { MinhaObraCardProps } from '../types';

export function MinhaObraCard({
  obra,
  healthStatus,
  basePath = "/empreiteiro/minhas-obras",
}: MinhaObraCardProps & { healthStatus?: HealthStatus; basePath?: string }) {
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
      parteContraria={obra.temContratante ? obra.contratante : undefined}
      parteContrariaRole={obra.temContratante ? "Contratante" : undefined}
      basePath={basePath}
      dateMode="range"
      healthStatus={healthStatus}
    />
  );
}
