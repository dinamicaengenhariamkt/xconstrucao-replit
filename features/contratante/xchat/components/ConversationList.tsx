'use client';

import { useMemo } from 'react';
import { ConversationList as SharedList } from '@features/shared/xchat/components/ConversationList';
import { AdSidebarSlot } from '@features/shared/anuncios/components/AdSidebarSlot';
import { useContratanteChatStore } from '../store/chat-store';
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
    readConversationIds,
    setSelectedConversation,
    setSearchQuery,
    setFilterTab,
  } = useContratanteChatStore();

  // Aplica override de "lida localmente" — zera unreadCount visualmente
  // para conversas que o usuário já abriu nesta sessão.
  const adjustedConversations = useMemo(
    () =>
      conversations.map((c) =>
        readConversationIds.includes(c.id) ? { ...c, unreadCount: 0 } : c,
      ),
    [conversations, readConversationIds],
  );

  return (
    <SharedList
      conversations={adjustedConversations}
      ephemeralConversations={ephemeralConversations}
      selectedConversationId={selectedConversationId}
      searchQuery={searchQuery}
      filterTab={filterTab}
      onSelect={setSelectedConversation}
      onSearchChange={setSearchQuery}
      onFilterChange={setFilterTab}
      headerSlot={<AdSidebarSlot zoneId="sidebar-sup-contratante" />}
      footerSlot={<AdSidebarSlot zoneId="sidebar-inf-contratante" />}
    />
  );
}
