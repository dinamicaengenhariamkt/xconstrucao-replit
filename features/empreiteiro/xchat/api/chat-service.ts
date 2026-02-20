import { ENABLE_MOCK } from '../constants';
import { mockConversations, mockMessages } from '../mocks/chat.mock';
import type { Conversation, Message } from '../types';

export async function getConversations(): Promise<Conversation[]> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockConversations;
  }
  const response = await fetch('/api/empreiteiro/chat/conversations');
  if (!response.ok) throw new Error('Erro ao buscar conversas');
  return response.json();
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockMessages[conversationId] || [];
  }
  const response = await fetch(`/api/empreiteiro/chat/${conversationId}/messages`);
  if (!response.ok) throw new Error('Erro ao buscar mensagens');
  return response.json();
}
