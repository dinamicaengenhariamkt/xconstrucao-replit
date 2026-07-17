import type { ReactNode } from 'react';

export interface ObraRefAttachment {
  type: 'obra_ref';
  obraId: string;
  obraNome: string;
  obraStatus: string;
  progresso: number;
  endereco: string;
}

export interface FileAttachment {
  type: 'file';
  url: string;
  nome: string;
  mime: string;
}

export type MessageAttachment = ObraRefAttachment | FileAttachment;

export interface Conversation {
  id: string;
  participantName: string;
  participantInitials: string;
  participantColor: string;
  /** Foto real da contraparte; quando ausente, usa iniciais+cor como fallback. */
  avatarUrl?: string;
  obraNome: string;
  obraId?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isActive: boolean;
}

export interface Message {
  id: string;
  /**
   * Id real do backend depois que a mensagem otimista é confirmada.
   * Preenchido só no cliente (reconciliation): quando a versão do servidor
   * chega com esse mesmo id, a otimista é descartada do merge sem flicker.
   */
  serverId?: string;
  senderId: string;
  senderName: string;
  /** Foto real do autor; quando ausente, usa iniciais como fallback. */
  senderAvatarUrl?: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  type: 'text' | 'file' | 'image';
  fileName?: string;
  fileUrl?: string;
  fileMime?: string;
  status?: 'sent' | 'delivered' | 'read';
  attachment?: MessageAttachment;
}

export interface ObraPickerItem {
  id: string;
  titulo: string;
  endereco: string;
  status: string;
  progresso: number;
}

export interface ChatInputProps {
  onSend: (content: string, attachment?: MessageAttachment) => void;
  disabled?: boolean;
  obras?: ObraPickerItem[];
  /** ID da thread atual; necessário para habilitar upload de arquivos. */
  threadId?: string;
}

export interface ChatHeaderProps {
  conversation: Conversation | null;
  basePath: string;
  /** Quando presente, renderiza um botão "voltar" (visível apenas em mobile). */
  onBack?: () => void;
  /** Quando true, mostra "digitando..." em vez de "online". */
  isTyping?: boolean;
}

export interface MessageBubbleProps {
  message: Message;
  basePath: string;
}

export interface ConversationListProps {
  conversations: Conversation[];
  ephemeralConversations: Conversation[];
  selectedConversationId: string | null;
  searchQuery: string;
  filterTab: 'all' | 'unread';
  onSelect: (id: string) => void;
  onSearchChange: (query: string) => void;
  onFilterChange: (tab: 'all' | 'unread') => void;
  /** Renderizado dentro do sidebar, entre o cabeçalho e a lista de conversas. */
  headerSlot?: ReactNode;
  /** Renderizado dentro do sidebar, fixado abaixo da lista (fora do scroll). */
  footerSlot?: ReactNode;
}
