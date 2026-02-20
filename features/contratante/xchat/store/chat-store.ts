import { create } from 'zustand';

interface ContratanteChatStore {
  selectedConversationId: string | null;
  searchQuery: string;
  setSelectedConversation: (id: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useContratanteChatStore = create<ContratanteChatStore>((set) => ({
  selectedConversationId: null,
  searchQuery: '',
  setSelectedConversation: (id) => set({ selectedConversationId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
