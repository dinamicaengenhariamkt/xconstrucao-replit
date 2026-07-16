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
  /** Adiciona uma mensagem optimista e retorna o localId gerado. */
  sendMessage: (conversationId: string, content: string, attachment?: MessageAttachment) => string;
  /** Remove apenas a mensagem com o localId especificado (evita race condition ao enviar em sequência). */
  clearLocalMessage: (conversationId: string, localId: string) => void;
  /** Remove todas as mensagens locais da conversa (mantido para compatibilidade). */
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
       * Adiciona uma mensagem local imediata e retorna o localId gerado.
       * Usado para:
       *  1) Conversas efêmeras (sem thread real ainda) — fluxo "Iniciar conversa"
       *  2) Optimistic update enquanto o POST real não confirma — limpado por `clearLocalMessage`
       */
      sendMessage: (conversationId, content, attachment) => {
        const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const now = new Date();
        const newMessage: Message = {
          id: localId,
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

        return localId;
      },

      /** Remove apenas a mensagem com o localId especificado. */
      clearLocalMessage: (conversationId, localId) =>
        set((state) => {
          const msgs = state.localMessages[conversationId];
          if (!msgs) return state;
          const filtered = msgs.filter((m) => m.id !== localId);
          if (filtered.length === msgs.length) return state;
          if (filtered.length === 0) {
            const { [conversationId]: _removed, ...rest } = state.localMessages;
            return { localMessages: rest };
          }
          return { localMessages: { ...state.localMessages, [conversationId]: filtered } };
        }),

      clearLocalMessages: (conversationId) =>
        set((state) => {
          if (!state.localMessages[conversationId]) return state;
          const { [conversationId]: _removed, ...rest } = state.localMessages;
          return { localMessages: rest };
        }),
    };
  });
}
