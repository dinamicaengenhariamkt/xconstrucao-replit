'use client';

import { useMemo } from 'react';
import { ConversationList } from '@features/contratante/xchat/components/ConversationList';
import { ChatHeader } from '@features/contratante/xchat/components/ChatHeader';
import { MessageArea } from '@features/contratante/xchat/components/MessageArea';
import { ChatInput } from '@features/contratante/xchat/components/ChatInput';
import { EmptyChat } from '@features/contratante/xchat/components/EmptyChat';
import { useContratanteConversations, useContratanteMessages } from '@features/contratante/xchat/hooks/use-chat';
import { useContratanteChatStore } from '@features/contratante/xchat/store/chat-store';
import type { ContratanteMessageAttachment } from '@features/contratante/xchat/types';

export default function ContratanteChatPage() {
  const { data: conversations, isLoading: convLoading } = useContratanteConversations();
  const { selectedConversationId, localMessages, sendMessage } = useContratanteChatStore();
  const { data: serverMessages, isLoading: msgLoading } = useContratanteMessages(selectedConversationId);

  const selectedConversation = conversations?.find((c) => c.id === selectedConversationId) ?? null;

  // Merge server messages with locally sent messages
  const allMessages = useMemo(() => {
    const server = serverMessages ?? [];
    const local = selectedConversationId ? (localMessages[selectedConversationId] ?? []) : [];
    return [...server, ...local];
  }, [serverMessages, localMessages, selectedConversationId]);

  const handleSend = (content: string, attachment?: ContratanteMessageAttachment) => {
    if (!selectedConversationId) return;
    sendMessage(selectedConversationId, content, attachment);
  };

  if (convLoading) {
    return (
      <div className="flex h-[calc(100vh-80px)] animate-pulse m-6 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="w-80 border-r border-gray-100 dark:border-gray-800 p-4 space-y-3 flex-shrink-0">
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
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden m-6" data-testid="chat-contratante-page">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0">
        <ConversationList conversations={conversations ?? []} />
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <>
            <ChatHeader conversation={selectedConversation} />
            <MessageArea messages={allMessages} isLoading={msgLoading} />
            <ChatInput onSend={handleSend} />
          </>
        ) : (
          <EmptyChat />
        )}
      </div>
    </div>
  );
}
