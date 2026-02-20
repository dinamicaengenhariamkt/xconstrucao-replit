'use client';

import { cn } from '@shared/lib/utils';
import { useChatStore } from '../store/chat-store';
import type { Conversation } from '../types';

interface ConversationListProps {
  conversations: Conversation[];
}

export function ConversationList({ conversations }: ConversationListProps) {
  const { selectedConversationId, searchQuery, setSelectedConversation, setSearchQuery } = useChatStore();

  const filtered = conversations.filter(
    (c) =>
      c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.obraNome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full border-r border-gray-100 dark:border-gray-800">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Mensagens</h2>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white placeholder-gray-400"
            data-testid="input-search-conversations"
            aria-label="Buscar conversas"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">Nenhuma conversa encontrada</div>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv.id)}
              className={cn(
                'w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-50 dark:border-gray-800/50',
                selectedConversationId === conv.id && 'bg-primary/5 dark:bg-primary/10 border-l-2 border-l-primary'
              )}
              data-testid={`conversation-${conv.id}`}
            >
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0', conv.participantColor)}>
                {conv.participantInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">{conv.participantName}</span>
                  <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{conv.lastMessageTime}</span>
                </div>
                <p className="text-xs text-primary/70 font-medium mb-0.5 truncate">{conv.obraNome}</p>
                <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="flex-shrink-0 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center mt-1">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
