'use client';

import { cn } from '@shared/lib/utils';
import type { ConversationListProps } from '../types';
import { IconSearch } from '@shared/components/icons';
import { ChatAvatar } from './ChatAvatar';

export function ConversationList({
  conversations,
  ephemeralConversations,
  selectedConversationId,
  searchQuery,
  filterTab,
  onSelect,
  onSearchChange,
  onFilterChange,
  headerSlot,
  footerSlot,
}: ConversationListProps) {
  const allConversations = [
    ...ephemeralConversations,
    ...conversations.filter((c) => !ephemeralConversations.some((e) => e.id === c.id)),
  ];
  const totalUnread = allConversations.reduce((acc, c) => acc + c.unreadCount, 0);

  const filtered = allConversations
    .filter(
      (c) =>
        c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.obraNome.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((c) => filterTab === 'all' || c.unreadCount > 0);

  return (
    <div className="flex flex-col h-full border-r border-gray-100 dark:border-gray-800">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mensagens</h2>
          {totalUnread > 0 && (
            <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {totalUnread}
            </span>
          )}
        </div>

        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white placeholder-gray-400"
            data-testid="input-search-conversations"
            aria-label="Buscar conversas"
          />
        </div>

        <div className="flex gap-1 mt-3">
          {(['all', 'unread'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onFilterChange(tab)}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                filterTab === tab
                  ? 'bg-primary text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
            >
              {tab === 'all' ? 'Todos' : 'Não lidos'}
            </button>
          ))}
        </div>
      </div>

      {headerSlot}

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">
            {filterTab === 'unread' ? 'Nenhuma mensagem não lida' : 'Nenhuma conversa encontrada'}
          </div>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                'w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-50 dark:border-gray-800/50',
                selectedConversationId === conv.id &&
                  'bg-primary/5 dark:bg-primary/10 border-l-2 border-l-primary',
              )}
              data-testid={`conversation-${conv.id}`}
            >
              <div className="relative flex-shrink-0">
                <ChatAvatar
                  avatarUrl={conv.avatarUrl}
                  initials={conv.participantInitials}
                  color={conv.participantColor}
                  name={conv.participantName}
                />
                {conv.isActive && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className={cn(
                      'text-sm truncate',
                      conv.unreadCount > 0
                        ? 'font-bold text-gray-900 dark:text-white'
                        : 'font-semibold text-gray-900 dark:text-white',
                    )}
                  >
                    {conv.participantName}
                  </span>
                  <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                    {conv.lastMessageTime}
                  </span>
                </div>
                <p className="text-xs text-primary/70 font-medium mb-0.5 truncate">
                  {conv.obraNome}
                </p>
                <p
                  className={cn(
                    'text-xs truncate',
                    conv.unreadCount > 0 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400',
                  )}
                >
                  {conv.lastMessage}
                </p>
              </div>

              {conv.unreadCount > 0 && (
                <span className="flex-shrink-0 bg-primary text-white text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center mt-1">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {footerSlot}
    </div>
  );
}
