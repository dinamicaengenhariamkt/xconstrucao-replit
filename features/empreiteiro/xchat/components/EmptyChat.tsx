'use client';

import { IconChatBubble } from '@shared/components/icons';

export function EmptyChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
      <IconChatBubble className="text-6xl text-gray-200 dark:text-gray-700 mb-4" />
      <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500">Selecione uma conversa</h3>
      <p className="text-sm text-gray-300 dark:text-gray-600 mt-1">Escolha uma conversa ao lado para começar a trocar mensagens.</p>
    </div>
  );
}
