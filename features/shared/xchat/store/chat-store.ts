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
  /** IDs de conversas em que o "outro lado" está digitando (mock). */
  typingConversationIds: string[];

  setSelectedConversation: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterTab: (tab: 'all' | 'unread') => void;
  sendMessage: (conversationId: string, content: string, attachment?: MessageAttachment) => void;
  addEphemeralConversation: (conv: Conversation) => void;
  markAsRead: (conversationId: string) => void;
}

const AUTO_REPLY_TEMPLATES = [
  'Beleza, fechado!',
  'Anotado, vou providenciar.',
  'Vou verificar e te respondo já.',
  'Recebido. Logo te dou retorno.',
  'Perfeito, obrigado pelo aviso!',
  'Ok, podemos seguir assim.',
  'Combinado.',
];

function pickAutoReply(content: string): string {
  const lower = content.toLowerCase();
  if (/\?$/.test(content.trim())) return 'Vou verificar e te respondo já.';
  if (lower.includes('obrigado') || lower.includes('valeu')) return 'Disponha! 👍';
  if (lower.includes('urgente') || lower.includes('atrasad')) {
    return 'Entendi, vou priorizar isso agora.';
  }
  return AUTO_REPLY_TEMPLATES[Math.floor(Math.random() * AUTO_REPLY_TEMPLATES.length)];
}

export function createChatStore() {
  return create<ChatStore>((set, get) => {
    const updateMessageStatus = (
      conversationId: string,
      messageId: string,
      status: NonNullable<Message['status']>,
    ) => {
      set((state) => {
        const list = state.localMessages[conversationId];
        if (!list) return state;
        return {
          localMessages: {
            ...state.localMessages,
            [conversationId]: list.map((m) => (m.id === messageId ? { ...m, status } : m)),
          },
        };
      });
    };

    const setTyping = (conversationId: string, isTyping: boolean) => {
      set((state) => {
        const has = state.typingConversationIds.includes(conversationId);
        if (isTyping && !has) {
          return { typingConversationIds: [...state.typingConversationIds, conversationId] };
        }
        if (!isTyping && has) {
          return {
            typingConversationIds: state.typingConversationIds.filter((id) => id !== conversationId),
          };
        }
        return state;
      });
    };

    const appendAutoReply = (conversationId: string, originalContent: string) => {
      const now = new Date();
      const timestamp = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      // Pegar o nome do participante a partir das conversas conhecidas
      // (ephemeral + nada mais — pages têm os mocks). Como o store não tem
      // acesso direto aos mocks de conversas, usamos um nome genérico.
      const conv = get().ephemeralConversations.find((c) => c.id === conversationId);
      const senderName = conv?.participantName ?? 'Contato';
      const reply: Message = {
        id: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        senderId: conversationId,
        senderName,
        content: pickAutoReply(originalContent),
        timestamp,
        isOwn: false,
        type: 'text',
        status: 'delivered',
      };
      set((state) => ({
        localMessages: {
          ...state.localMessages,
          [conversationId]: [...(state.localMessages[conversationId] ?? []), reply],
        },
      }));
    };

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

      sendMessage: (conversationId, content, attachment) => {
        const now = new Date();
        const timestamp = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const messageId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const newMessage: Message = {
          id: messageId,
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

        // Progressão de status: sent → delivered → read
        setTimeout(() => updateMessageStatus(conversationId, messageId, 'delivered'), 600);
        setTimeout(() => updateMessageStatus(conversationId, messageId, 'read'), 1800);

        // Auto-reply: "digitando..." aparece um pouco depois, resposta chega 1.5-2s depois
        setTimeout(() => setTyping(conversationId, true), 1200);
        setTimeout(() => {
          setTyping(conversationId, false);
          appendAutoReply(conversationId, content);
        }, 3500);
      },
    };
  });
}
