import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getContratanteConversations, getContratanteMessages } from '../api/chat-service';
import { QUERY_CONFIG } from '../constants';
import type { ContratanteConversation, ContratanteMessage } from '../types';

export function useContratanteConversations(): UseQueryResult<ContratanteConversation[], Error> {
  return useQuery({
    queryKey: ['contratante', 'chat', 'conversations'],
    queryFn: getContratanteConversations,
    staleTime: QUERY_CONFIG.staleTime,
    refetchInterval: QUERY_CONFIG.refetchInterval,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}

export function useContratanteMessages(conversationId: string | null): UseQueryResult<ContratanteMessage[], Error> {
  return useQuery({
    queryKey: ['contratante', 'chat', 'messages', conversationId],
    queryFn: () => getContratanteMessages(conversationId!),
    staleTime: QUERY_CONFIG.staleTime,
    refetchInterval: QUERY_CONFIG.refetchInterval,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
    enabled: !!conversationId,
  });
}
