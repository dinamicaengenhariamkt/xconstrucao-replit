export interface ContratanteConversation {
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

export interface ContratanteMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  type: 'text' | 'file' | 'image';
  fileName?: string;
}
