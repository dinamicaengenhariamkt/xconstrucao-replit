export interface Conversation {
  id: string;
  participantName: string;
  participantInitials: string;
  participantColor: string;
  obraNome: string;
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
}

export interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

export interface MessageBubbleProps {
  message: Message;
}

export interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export interface ChatHeaderProps {
  conversation: Conversation | null;
}
