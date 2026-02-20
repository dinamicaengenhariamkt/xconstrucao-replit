import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getConversations, getMessages } from '../api/chat-service';
import { QUERY_CONFIG } from '../constants';
import type { Conversation, Message } from '../types';

export function useConversations(): UseQueryResult<Conversation[], Error> {
  return useQuery({
    queryKey: ['empreiteiro', 'chat', 'conversations'],
    queryFn: getConversations,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}

export function useMessages(conversationId: string | null): UseQueryResult<Message[], Error> {
  return useQuery({
    queryKey: ['empreiteiro', 'chat', 'messages', conversationId],
    queryFn: () => getMessages(conversationId!),
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
    enabled: !!conversationId,
  });
}
