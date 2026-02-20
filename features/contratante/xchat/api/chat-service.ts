import { ENABLE_MOCK } from '../constants';
import { mockContratanteConversations, mockContratanteMessages } from '../mocks/chat.mock';
import type { ContratanteConversation, ContratanteMessage } from '../types';

export async function getContratanteConversations(): Promise<ContratanteConversation[]> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockContratanteConversations;
  }
  const response = await fetch('/api/contratante/chat/conversations');
  if (!response.ok) throw new Error('Erro ao buscar conversas');
  return response.json();
}

export async function getContratanteMessages(conversationId: string): Promise<ContratanteMessage[]> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockContratanteMessages[conversationId] || [];
  }
  const response = await fetch(`/api/contratante/chat/messages/${conversationId}`);
  if (!response.ok) throw new Error('Erro ao buscar mensagens');
  return response.json();
}
