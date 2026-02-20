import { create } from 'zustand';

interface ChatStore {
  selectedConversationId: string | null;
  searchQuery: string;
  setSelectedConversation: (id: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  selectedConversationId: null,
  searchQuery: '',
  setSelectedConversation: (id) => set({ selectedConversationId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
