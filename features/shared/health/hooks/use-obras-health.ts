import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ObraHealth, HealthSummaryData } from '../types';

/**
 * Mapa real `obraId → ObraHealth` da persona (J17). Substitui `getMockHealth`
 * por obra e `getMockHealthSummary` agregado nas listas de obra.
 *
 * @param persona define o endpoint (`/api/<persona>/obras-health`).
 */
export function useObrasHealthMap(
  persona: 'contratante' | 'empreiteiro' | 'admin',
): UseQueryResult<Record<string, ObraHealth>, Error> {
  return useQuery({
    queryKey: [persona, 'obras-health'],
    queryFn: async () => {
      const res = await fetch(`/api/${persona}/obras-health`);
      if (!res.ok) throw new Error('Erro ao buscar saúde das obras');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/** Agrega um mapa de saúde em resumo (saudável/atenção/risco/total). */
export function summarizeHealthMap(map: Record<string, ObraHealth> | undefined): HealthSummaryData {
  const values = Object.values(map ?? {});
  const summary: HealthSummaryData = { saudavel: 0, atencao: 0, risco: 0, total: values.length };
  for (const h of values) summary[h.status] += 1;
  return summary;
}
