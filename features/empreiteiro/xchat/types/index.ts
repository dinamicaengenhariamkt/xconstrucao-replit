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

export interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

export interface MessageBubbleProps {
  message: Message;
}

/** Minimal shape needed by ObraPickerSheet — compatible with MinhaObra */
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
}
