import { useQuery } from '@tanstack/react-query';
import type { AdminFAQItem } from '../types';
import { QUERY_CONFIG } from '../constants';

export function useAdminFAQ() {
  return useQuery<AdminFAQItem[]>({
    queryKey: ['admin', 'faq'],
    queryFn: async () => {
      const res = await fetch('/api/admin/faq');
      if (!res.ok) throw new Error('Erro ao buscar perguntas frequentes');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
