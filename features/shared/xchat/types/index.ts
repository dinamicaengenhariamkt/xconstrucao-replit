export interface ObraRefAttachment {
  type: 'obra_ref';
  obraId: string;
  obraNome: string;
  obraStatus: string;
  progresso: number;
  endereco: string;
}

export type MessageAttachment = ObraRefAttachment;

export interface Conversation {
  id: string;
  participantName: string;
  participantInitials: string;
  participantColor: string;
  obraNome: string;
  obraId?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isActive: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  type: 'text' | 'file' | 'image';
  fileName?: string;
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
}

export interface ChatHeaderProps {
  conversation: Conversation | null;
  basePath: string;
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
}
