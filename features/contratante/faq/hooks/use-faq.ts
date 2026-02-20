import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getContratanteFAQItems } from '../api/faq-service';
import { QUERY_CONFIG } from '../constants';
import type { ContratanteFAQItem } from '../types';

export function useContratanteFAQ(): UseQueryResult<ContratanteFAQItem[], Error> {
  return useQuery({
    queryKey: ['contratante', 'faq'],
    queryFn: getContratanteFAQItems,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
