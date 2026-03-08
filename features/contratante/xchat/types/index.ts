export interface ContratanteObraRefAttachment {
  type: 'obra_ref';
  obraId: string;
  obraNome: string;
  obraStatus: string;
  progresso: number;
  endereco: string;
}

export type ContratanteMessageAttachment = ContratanteObraRefAttachment;

export interface ContratanteChatInputProps {
  onSend: (content: string, attachment?: ContratanteMessageAttachment) => void;
  disabled?: boolean;
  obras?: ContratanteObraPickerItem[];
}

export interface ContratanteObraPickerItem {
  id: string;
  titulo: string;
  endereco: string;
  status: string;
  progresso: number;
}

export interface ContratanteConversation {
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

export interface ContratanteMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  type: 'text' | 'file' | 'image';
  fileName?: string;
  status?: 'sent' | 'delivered' | 'read';
  attachment?: ContratanteMessageAttachment;
}
