import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import { useToast } from '@shared/hooks/use-toast';
import {
  addObraSalva,
  getObrasSalvas,
  getObrasSalvasIds,
  removeObraSalva,
  type GetObrasSalvasParams,
  type ObrasSalvasResponse,
} from '../api/obras-salvas-service';

const QUERY_KEY = ['empreiteiro', 'obras-salvas'] as const;
const IDS_QUERY_KEY = ['empreiteiro', 'obras-salvas', 'ids'] as const;

export function useObrasSalvas(params: GetObrasSalvasParams = {}) {
  return useQuery<ObrasSalvasResponse>({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => getObrasSalvas(params),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useObrasSalvasInfinite(
  params: Omit<GetObrasSalvasParams, 'page'> = {},
): UseInfiniteQueryResult<
  { pages: ObrasSalvasResponse[]; pageParams: number[] },
  Error
> {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEY, 'infinite', params],
    queryFn: ({ pageParam }) => getObrasSalvas({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/** Hook auxiliar: retorna Set<string> dos ids salvos para checagem O(1). */
export function useObrasSalvasIds(): Set<string> {
  const { data } = useQuery({
    queryKey: IDS_QUERY_KEY,
    queryFn: getObrasSalvasIds,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  return useMemo(() => new Set(data ?? []), [data]);
}

export function useToggleObraSalva() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ obraId, isSaved }: { obraId: string; isSaved: boolean; obra?: import('@features/empreiteiro/novas-obras/types').NovaObra }) => {
      if (isSaved) await removeObraSalva(obraId);
      else await addObraSalva(obraId);
      return { obraId, wasSaved: isSaved };
    },
    onMutate: async ({ obraId, isSaved }) => {
      await qc.cancelQueries({ queryKey: IDS_QUERY_KEY });
      const prevIds = qc.getQueryData<string[]>(IDS_QUERY_KEY);
      if (prevIds) {
        const nextIds = isSaved
          ? prevIds.filter((id) => id !== obraId)
          : prevIds.includes(obraId)
            ? prevIds
            : [obraId, ...prevIds];
        qc.setQueryData(IDS_QUERY_KEY, nextIds);
      }
      return { prevIds };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prevIds) qc.setQueryData(IDS_QUERY_KEY, ctx.prevIds);
      toast({
        title: 'Falha ao atualizar favoritos',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
