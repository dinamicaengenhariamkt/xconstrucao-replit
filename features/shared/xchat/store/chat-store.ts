import { create } from 'zustand';
import type { Conversation, Message, MessageAttachment } from '../types';

interface ChatStore {
  selectedConversationId: string | null;
  searchQuery: string;
  filterTab: 'all' | 'unread';
  localMessages: Record<string, Message[]>;
  ephemeralConversations: Conversation[];
  /** IDs de conversas marcadas como lidas localmente (zera unreadCount visualmente). */
  readConversationIds: string[];
  /**
   * IDs de conversas em que o "outro lado" está digitando.
   * Hoje sempre vazio — campo mantido pra UI continuar compilando.
   * Reativar quando houver sinal real (SSE/WebSocket).
   */
  typingConversationIds: string[];

  setSelectedConversation: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterTab: (tab: 'all' | 'unread') => void;
  sendMessage: (conversationId: string, content: string, attachment?: MessageAttachment) => void;
  clearLocalMessages: (conversationId: string) => void;
  addEphemeralConversation: (conv: Conversation) => void;
  markAsRead: (conversationId: string) => void;
}

export function createChatStore() {
  return create<ChatStore>((set) => {
    return {
      selectedConversationId: null,
      searchQuery: '',
      filterTab: 'all',
      localMessages: {},
      ephemeralConversations: [],
      readConversationIds: [],
      typingConversationIds: [],

      setSelectedConversation: (id) =>
        set((state) => ({
          selectedConversationId: id,
          // ao abrir uma conversa, marca como lida automaticamente
          readConversationIds:
            id && !state.readConversationIds.includes(id)
              ? [...state.readConversationIds, id]
              : state.readConversationIds,
        })),

      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterTab: (tab) => set({ filterTab: tab }),

      markAsRead: (conversationId) =>
        set((state) =>
          state.readConversationIds.includes(conversationId)
            ? state
            : { readConversationIds: [...state.readConversationIds, conversationId] },
        ),

      addEphemeralConversation: (conv) =>
        set((state) => ({
          ephemeralConversations: [
            conv,
            ...state.ephemeralConversations.filter((c) => c.id !== conv.id),
          ],
          selectedConversationId: conv.id,
        })),

      /**
       * Adiciona uma mensagem local imediata. Usado para:
       *  1) Conversas efêmeras (sem thread real ainda) — fluxo "Iniciar conversa"
       *  2) Optimistic update enquanto o POST real não confirma — limpado por `clearLocalMessages`
       * Não dispara timers nem auto-reply.
       */
      sendMessage: (conversationId, content, attachment) => {
        const now = new Date();
        const newMessage: Message = {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          senderId: 'me',
          senderName: 'Você',
          content,
          timestamp: now.toISOString(),
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

      clearLocalMessages: (conversationId) =>
        set((state) => {
          if (!state.localMessages[conversationId]) return state;
          const { [conversationId]: _removed, ...rest } = state.localMessages;
          return { localMessages: rest };
        }),
    };
  });
}
