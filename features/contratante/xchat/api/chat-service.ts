import type { ContratanteConversation, ContratanteMessage } from '../types';

export async function getContratanteConversations(): Promise<ContratanteConversation[]> {
  const response = await fetch('/api/contratante/chat/conversations');
  if (!response.ok) throw new Error('Erro ao buscar conversas');
  return response.json();
}

export async function getContratanteMessages(conversationId: string): Promise<ContratanteMessage[]> {
  const response = await fetch(`/api/contratante/chat/messages/${conversationId}`);
  if (!response.ok) throw new Error('Erro ao buscar mensagens');
  return response.json();
}
