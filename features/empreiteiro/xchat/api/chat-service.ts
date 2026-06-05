import type { Conversation, Message } from '../types';

export async function getConversations(): Promise<Conversation[]> {
  const response = await fetch('/api/empreiteiro/chat/conversations');
  if (!response.ok) throw new Error('Erro ao buscar conversas');
  return response.json();
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const response = await fetch(`/api/empreiteiro/chat/${conversationId}/messages`);
  if (!response.ok) throw new Error('Erro ao buscar mensagens');
  return response.json();
}
