import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getAnuncianteFAQItems } from '../api/faq-service';
import { QUERY_CONFIG } from '../constants';
import type { AnuncianteFAQItem } from '../types';

export function useAnuncianteFAQ(): UseQueryResult<AnuncianteFAQItem[], Error> {
  return useQuery({
    queryKey: ['anunciante', 'faq'],
    queryFn: getAnuncianteFAQItems,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
