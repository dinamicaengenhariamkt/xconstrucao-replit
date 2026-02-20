'use client';

import { ConversationList } from '@features/empreiteiro/xchat/components/ConversationList';
import { ChatHeader } from '@features/empreiteiro/xchat/components/ChatHeader';
import { MessageArea } from '@features/empreiteiro/xchat/components/MessageArea';
import { ChatInput } from '@features/empreiteiro/xchat/components/ChatInput';
import { EmptyChat } from '@features/empreiteiro/xchat/components/EmptyChat';
import { useConversations, useMessages } from '@features/empreiteiro/xchat/hooks/use-chat';
import { useChatStore } from '@features/empreiteiro/xchat/store/chat-store';

export default function ChatPage() {
  const { data: conversations, isLoading: convLoading } = useConversations();
  const { selectedConversationId } = useChatStore();
  const { data: messages, isLoading: msgLoading } = useMessages(selectedConversationId);

  const selectedConversation = conversations?.find((c) => c.id === selectedConversationId) || null;

  const handleSend = (message: string) => {
    console.log('Send message:', message);
  };

  if (convLoading) {
    return (
      <div className="flex h-[calc(100vh-80px)] animate-pulse">
        <div className="w-96 border-r border-gray-100 dark:border-gray-800 p-4 space-y-3">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-32" />
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full" />
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
    <div className="flex h-[calc(100vh-80px)] bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden m-6">
      <div className="w-96 flex-shrink-0">
        <ConversationList conversations={conversations || []} />
      </div>
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <ChatHeader conversation={selectedConversation} />
            <MessageArea messages={messages || []} isLoading={msgLoading} />
            <ChatInput onSend={handleSend} />
          </>
        ) : (
          <EmptyChat />
        )}
      </div>
    </div>
  );
}
