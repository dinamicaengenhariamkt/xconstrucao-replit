'use client';

import { IconChat } from '@shared/components/icons';

export function EmptyChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8" data-testid="empty-chat">
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <IconChat className="text-5xl text-gray-300 dark:text-gray-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-400 dark:text-gray-500">Selecione uma conversa</h3>
      <p className="text-sm text-gray-400 mt-1">Escolha uma conversa ao lado para começar.</p>
    </div>
  );
}
