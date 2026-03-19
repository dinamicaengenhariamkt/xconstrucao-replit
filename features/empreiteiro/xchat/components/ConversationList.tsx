'use client';

import { ConversationList as SharedList } from '@features/shared/xchat/components/ConversationList';
import { useChatStore } from '../store/chat-store';
import type { Conversation } from '../types';

interface Props {
  conversations: Conversation[];
}

export function ConversationList({ conversations }: Props) {
  const {
    selectedConversationId,
    searchQuery,
    filterTab,
    ephemeralConversations,
    setSelectedConversation,
    setSearchQuery,
    setFilterTab,
  } = useChatStore();

  return (
    <SharedList
      conversations={conversations}
      ephemeralConversations={ephemeralConversations}
      selectedConversationId={selectedConversationId}
      searchQuery={searchQuery}
      filterTab={filterTab}
      onSelect={setSelectedConversation}
      onSearchChange={setSearchQuery}
      onFilterChange={setFilterTab}
    />
  );
}
