'use client';

import { RiQuestionLine } from 'react-icons/ri';

interface FAQEmptyStateProps {
  message?: string;
}

export function FAQEmptyState({ message = 'Tente alterar os filtros ou a busca.' }: FAQEmptyStateProps) {
  return (
    <div className="text-center py-16">
      <RiQuestionLine className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">Nenhuma pergunta encontrada</h3>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{message}</p>
    </div>
  );
}
