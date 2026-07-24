import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface SurveyPendente {
  id: string;
  tipo: 'nps' | 'csat';
  persona: 'contratante' | 'empreiteiro';
  obraId: string | null;
  enviadoEm: string;
}

/** Convites de pesquisa pendentes do usuário logado (J20). */
export function useSurveysPendentes() {
  return useQuery<SurveyPendente[]>({
    queryKey: ['surveys', 'pendentes'],
    queryFn: async () => {
      const res = await fetch('/api/surveys/pendentes');
      if (!res.ok) throw new Error('Erro ao buscar pesquisas pendentes');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/** Responde um convite. Invalida a lista de pendentes ao concluir. */
export function useResponderSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { surveyId: string; nota: number; comentario?: string }) => {
      const res = await fetch(`/api/surveys/${args.surveyId}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota: args.nota, comentario: args.comentario || undefined }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Erro ao responder pesquisa');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['surveys', 'pendentes'] });
    },
  });
}
