'use client';

export function EmptyChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
      <span className="material-symbols-outlined text-6xl text-gray-200 dark:text-gray-700 mb-4">chat_bubble</span>
      <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500">Selecione uma conversa</h3>
      <p className="text-sm text-gray-300 dark:text-gray-600 mt-1">Escolha uma conversa ao lado para começar a trocar mensagens.</p>
    </div>
  );
}
