import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_CONFIG } from '../constants';

async function getUnreadCount(): Promise<number> {
  const res = await fetch('/api/contratante/chat/unread-count');
  if (!res.ok) throw new Error('Erro ao buscar contagem de não-lidas');
  const data = (await res.json()) as { total: number };
  return data.total ?? 0;
}

/**
 * Total agregado de mensagens não-lidas do contratante. Fica montado na sidebar
 * (presente em todo o layout da persona), então o polling roda independente de
 * o usuário estar ou não na tela do chat — habilitando o badge global (J41 Item 9).
 */
export function useContratanteUnreadCount(): UseQueryResult<number, Error> {
  return useQuery({
    queryKey: ['contratante', 'chat', 'unread-count'],
    queryFn: getUnreadCount,
    staleTime: QUERY_CONFIG.staleTime,
    refetchInterval: QUERY_CONFIG.refetchInterval,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
