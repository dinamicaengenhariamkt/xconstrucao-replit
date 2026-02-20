'use client';

import { ObraContratanteCard } from './ObraContratanteCard';
import type { ObrasContratanteGridProps } from '../types';
import { RiBuildingLine } from 'react-icons/ri';

export function ObrasContratanteGrid({ obras }: ObrasContratanteGridProps) {
  if (obras.length === 0) {
    return (
      <div className="text-center py-20" data-testid="empty-state-obras">
        <RiBuildingLine className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">Nenhuma obra encontrada</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente alterar os filtros de busca.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {obras.map((obra) => (
        <ObraContratanteCard key={obra.id} obra={obra} />
      ))}
    </div>
  );
}
