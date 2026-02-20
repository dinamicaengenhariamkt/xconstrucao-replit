'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@shared/lib/utils';
import { useContratanteConversations, useContratanteMessages } from '@features/contratante/xchat/hooks/use-chat';
import { useContratanteChatStore } from '@features/contratante/xchat/store/chat-store';
import { Input } from '@shared/components/ui/input';
import { Button } from '@shared/components/ui/button';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Badge } from '@shared/components/ui/badge';
import { RiSearchLine, RiSendPlaneFill, RiAttachmentLine, RiChat1Line } from 'react-icons/ri';
import type { ContratanteConversation, ContratanteMessage } from '@features/contratante/xchat/types';

export default function ContratanteChatPage() {
  const { data: conversations, isLoading: convLoading } = useContratanteConversations();
  const { selectedConversationId, setSelectedConversation, searchQuery, setSearchQuery } = useContratanteChatStore();
  const { data: messages, isLoading: msgLoading } = useContratanteMessages(selectedConversationId);

  const selectedConversation = conversations?.find((c) => c.id === selectedConversationId) || null;

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) => c.participantName.toLowerCase().includes(q) || c.obraNome.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  if (convLoading) {
    return (
      <div className="flex h-[calc(100vh-80px)] m-6 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="w-96 border-r border-gray-100 dark:border-gray-800 p-4 space-y-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 rounded-xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden m-6" data-testid="chat-contratante-page">
      <div className="w-96 flex-shrink-0 border-r border-gray-100 dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">xchat</h2>
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm"
              data-testid="chat-search-input"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={conv.id === selectedConversationId}
              onClick={() => setSelectedConversation(conv.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <ChatHeader conversation={selectedConversation} />
            <MessageArea messages={messages || []} isLoading={msgLoading} />
            <ChatInputBar />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8" data-testid="empty-chat">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <RiChat1Line className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-400 dark:text-gray-500">Selecione uma conversa</h3>
            <p className="text-sm text-gray-400 mt-1">Escolha uma conversa ao lado para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({ conversation, isSelected, onClick }: { conversation: ContratanteConversation; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
        isSelected && 'bg-primary/5 dark:bg-primary/10 border-r-2 border-primary'
      )}
      data-testid={`conversation-${conversation.id}`}
    >
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0', conversation.participantColor)}>
        {conversation.participantInitials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{conversation.participantName}</p>
          <span className="text-[10px] text-gray-400 shrink-0">{conversation.lastMessageTime}</span>
        </div>
        <p className="text-[11px] text-primary font-medium truncate">{conversation.obraNome}</p>
        <p className="text-xs text-gray-500 truncate mt-0.5">{conversation.lastMessage}</p>
      </div>
      {conversation.unreadCount > 0 && (
        <Badge className="h-5 w-5 flex items-center justify-center p-0 bg-primary text-white text-[10px] rounded-full shrink-0 self-center">
          {conversation.unreadCount}
        </Badge>
      )}
    </button>
  );
}

function ChatHeader({ conversation }: { conversation: ContratanteConversation }) {
  return (
    <div className="h-16 px-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold', conversation.participantColor)}>
        {conversation.participantInitials}
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900 dark:text-white">{conversation.participantName}</p>
        <p className="text-[10px] text-gray-500">{conversation.obraNome}</p>
      </div>
    </div>
  );
}

function MessageArea({ messages, isLoading }: { messages: ContratanteMessage[]; isLoading: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
            <Skeleton className="h-12 w-64 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-3" data-testid="message-area">
      {messages.map((msg) => (
        <div key={msg.id} className={cn('flex', msg.isOwn ? 'justify-end' : 'justify-start')}>
          <div className={cn(
            'max-w-[70%] px-4 py-2.5 rounded-2xl',
            msg.isOwn
              ? 'bg-primary text-white rounded-br-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
          )}>
            <p className="text-sm leading-relaxed">{msg.content}</p>
            <p className={cn(
              'text-[10px] mt-1',
              msg.isOwn ? 'text-white/60' : 'text-gray-400'
            )}>{msg.timestamp}</p>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function ChatInputBar() {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) return;
    setMessage('');
  };

  return (
    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="shrink-0 text-gray-400 hover:text-gray-600">
          <RiAttachmentLine className="w-5 h-5" />
        </Button>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Digite sua mensagem..."
          className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm"
          data-testid="chat-message-input"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!message.trim()}
          className="shrink-0 bg-primary text-white rounded-xl"
          data-testid="chat-send-button"
        >
          <RiSendPlaneFill className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
