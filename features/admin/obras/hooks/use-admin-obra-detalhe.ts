import { useQuery } from '@tanstack/react-query';
import { getAdminObraDetalhe } from '../api/admin-obra-detalhe-service';

export function useAdminObraDetalhe(id: string) {
  return useQuery({
    queryKey: ['admin', 'obras', id],
    queryFn: () => getAdminObraDetalhe(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}
