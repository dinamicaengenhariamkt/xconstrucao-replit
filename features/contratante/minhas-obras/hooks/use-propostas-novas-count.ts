import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_CONFIG } from '@features/contratante/xchat/constants';

async function getPropostasNovasCount(): Promise<number> {
  const res = await fetch('/api/contratante/candidaturas/novas-count');
  if (!res.ok) throw new Error('Erro ao buscar contagem de propostas novas');
  const data = (await res.json()) as { total: number };
  return data.total ?? 0;
}

/**
 * Total de propostas PENDENTES nas obras do contratante (J57). Fica montado na
 * sidebar (presente em todo o layout da persona), então o polling roda em
 * qualquer tela — habilita o badge "propostas novas" no menu Minhas Obras.
 * Reusa o QUERY_CONFIG do chat (mesmo intervalo de polling, 5s).
 */
export function usePropostasNovasCount(): UseQueryResult<number, Error> {
  return useQuery({
    queryKey: ['contratante', 'candidaturas', 'novas-count'],
    queryFn: getPropostasNovasCount,
    staleTime: QUERY_CONFIG.staleTime,
    refetchInterval: QUERY_CONFIG.refetchInterval,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
