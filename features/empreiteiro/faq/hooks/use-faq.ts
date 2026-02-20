import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getFAQItems } from '../api/faq-service';
import { QUERY_CONFIG } from '../constants';
import type { FAQItem } from '../types';

export function useFAQ(): UseQueryResult<FAQItem[], Error> {
  return useQuery({
    queryKey: ['empreiteiro', 'faq'],
    queryFn: getFAQItems,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
