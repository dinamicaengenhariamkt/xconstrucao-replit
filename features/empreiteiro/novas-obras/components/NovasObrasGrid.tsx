'use client';

import { NovaObraCard } from './NovaObraCard';
import type { NovasObrasGridProps } from '../types';
import { IconSearchOff } from '@shared/components/icons';

export function NovasObrasGrid({ obras, isBlocked = false }: NovasObrasGridProps) {
  if (obras.length === 0) {
    return (
      <div className="text-center py-20" data-testid="empty-state-novas-obras">
        <IconSearchOff className="text-5xl text-gray-300 mb-4 block" />
        <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">Nenhuma obra encontrada</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente alterar os filtros de busca.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {obras.map((obra) => (
        <NovaObraCard key={obra.id} obra={obra} isBlocked={isBlocked} />
      ))}
    </div>
  );
}
