'use client';

import { MinhaObraCard } from './MinhaObraCard';
import type { MinhasObrasGridProps } from '../types';

export function MinhasObrasGrid({ obras }: MinhasObrasGridProps) {
  if (obras.length === 0) {
    return (
      <div className="text-center py-20" data-testid="empty-state-minhas-obras">
        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">construction</span>
        <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">Nenhuma obra encontrada</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente alterar os filtros de busca.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {obras.map((obra) => (
        <MinhaObraCard key={obra.id} obra={obra} />
      ))}
    </div>
  );
}
