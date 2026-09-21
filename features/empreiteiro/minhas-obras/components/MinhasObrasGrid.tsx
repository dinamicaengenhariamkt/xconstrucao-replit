'use client';

import { MinhaObraCard } from './MinhaObraCard';
import type { MinhasObrasGridProps } from '../types';
import { IconConstruction } from '@shared/components/icons';
import { useObrasHealthMap } from '@features/shared/health';

export function MinhasObrasGrid({ obras, basePath, xgestao = false }: MinhasObrasGridProps) {
  // XG29 — no xgestão a Saúde não é exibida desde a XG17, mas este hook
  // continuava buscando o mapa para jogá-lo fora. `enabled` corta o request e,
  // com ele, o `computeHealthMapForObras` que rodava no servidor por nada.
  const { data: healthMap } = useObrasHealthMap('empreiteiro', { enabled: !xgestao });

  if (obras.length === 0) {
    return (
      <div className="text-center py-20" data-testid="empty-state-minhas-obras">
        <IconConstruction className="text-5xl text-gray-300 mb-4 block" />
        <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">Nenhuma obra encontrada</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente alterar os filtros de busca.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {obras.map((obra) => (
        // XG29 — sem `healthStatus` o `ObraCard` não renderiza o badge; é o que
        // tira o "SAUDÁVEL/RISCO" do card do xgestão, fechando a decisão da
        // XG17 ("Saúde sai do xgestão inteiro") que parou antes desta tela.
        <MinhaObraCard
          key={obra.id}
          obra={obra}
          healthStatus={xgestao ? undefined : healthMap?.[obra.id]?.status}
          basePath={basePath}
        />
      ))}
    </div>
  );
}
