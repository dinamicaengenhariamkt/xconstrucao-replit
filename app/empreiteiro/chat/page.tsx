'use client';

import { useMemo } from 'react';
import { ConversationList } from '@features/empreiteiro/xchat/components/ConversationList';
import { ChatHeader } from '@features/empreiteiro/xchat/components/ChatHeader';
import { MessageArea } from '@features/empreiteiro/xchat/components/MessageArea';
import { ChatInput } from '@features/empreiteiro/xchat/components/ChatInput';
import { EmptyChat } from '@features/empreiteiro/xchat/components/EmptyChat';
import { useConversations, useMessages } from '@features/empreiteiro/xchat/hooks/use-chat';
import { useChatStore } from '@features/empreiteiro/xchat/store/chat-store';
import { useMinhasObras } from '@features/empreiteiro/minhas-obras/hooks/use-minhas-obras';
import type { MessageAttachment } from '@features/empreiteiro/xchat/types';
import { cn } from '@shared/lib/utils';

export default function ChatPage() {
  const { data: conversations, isLoading: convLoading } = useConversations();
  const { data: obras } = useMinhasObras();
  const {
    selectedConversationId,
    localMessages,
    typingConversationIds,
    sendMessage,
    setSelectedConversation,
  } = useChatStore();
  const { data: serverMessages, isLoading: msgLoading } = useMessages(selectedConversationId);

  const selectedConversation =
    conversations?.find((c) => c.id === selectedConversationId) ?? null;

  const isTyping =
    !!selectedConversationId && typingConversationIds.includes(selectedConversationId);

  // Merge server messages with locally sent messages
  const allMessages = useMemo(() => {
    const server = serverMessages ?? [];
    const local = selectedConversationId ? (localMessages[selectedConversationId] ?? []) : [];
    return [...server, ...local];
  }, [serverMessages, localMessages, selectedConversationId]);

  const handleSend = (content: string, attachment?: MessageAttachment) => {
    if (!selectedConversationId) return;
    sendMessage(selectedConversationId, content, attachment);
  };

  if (convLoading) {
    return (
      <div className="h-full p-3 sm:p-6">
        <div className="flex h-full animate-pulse bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="w-96 border-r border-gray-100 dark:border-gray-800 p-4 space-y-3 flex-shrink-0">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-32" />
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1" />
        </div>
      </div>
    );
  }

  const hasSelection = !!selectedConversation;

  return (
    <div className="h-full p-3 sm:p-6" data-testid="chat-empreiteiro-page">
      <div className="flex h-full bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            'w-full md:w-80 flex-shrink-0 min-h-0',
            hasSelection ? 'hidden md:block' : 'block',
          )}
        >
          <ConversationList conversations={conversations ?? []} />
        </div>

        {/* Chat area */}
        <div
          className={cn(
            'flex-1 flex-col min-w-0 min-h-0',
            hasSelection ? 'flex' : 'hidden md:flex',
          )}
        >
          {selectedConversation ? (
            <>
              <ChatHeader
                conversation={selectedConversation}
                isTyping={isTyping}
                onBack={() => setSelectedConversation(null)}
              />
              <MessageArea messages={allMessages} isLoading={msgLoading} isTyping={isTyping} />
              <ChatInput onSend={handleSend} obras={obras ?? []} />
            </>
          ) : (
            <EmptyChat />
          )}
        </div>
      </div>
    </div>
  );
}
