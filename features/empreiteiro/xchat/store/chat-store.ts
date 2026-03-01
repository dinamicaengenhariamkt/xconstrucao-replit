import { create } from 'zustand';
import type { Conversation, Message, MessageAttachment } from '../types';

interface ChatStore {
  selectedConversationId: string | null;
  searchQuery: string;
  filterTab: 'all' | 'unread';
  localMessages: Record<string, Message[]>;
  ephemeralConversations: Conversation[];
  setSelectedConversation: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setFilterTab: (tab: 'all' | 'unread') => void;
  sendMessage: (conversationId: string, content: string, attachment?: MessageAttachment) => void;
  addEphemeralConversation: (conv: Conversation) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  selectedConversationId: null,
  searchQuery: '',
  filterTab: 'all',
  localMessages: {},
  ephemeralConversations: [],
  setSelectedConversation: (id) => set({ selectedConversationId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterTab: (tab) => set({ filterTab: tab }),
  addEphemeralConversation: (conv) =>
    set((state) => ({
      ephemeralConversations: [conv, ...state.ephemeralConversations.filter((c) => c.id !== conv.id)],
      selectedConversationId: conv.id,
    })),
  sendMessage: (conversationId, content, attachment) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const newMessage: Message = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderId: 'me',
      senderName: 'Você',
      content,
      timestamp,
      isOwn: true,
      type: 'text',
      status: 'sent',
      attachment,
    };
    set((state) => ({
      localMessages: {
        ...state.localMessages,
        [conversationId]: [...(state.localMessages[conversationId] ?? []), newMessage],
      },
    }));
  },
}));
