import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminFAQItem, FAQVisao } from '../types';
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

export interface FaqMutationInput {
  question: string;
  answer: string;
  category: string;
  visao: FAQVisao;
  ordem: number;
  ativo: boolean;
}

async function readError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return (data as { message?: string }).message ?? 'Erro ao salvar pergunta';
}

/** J32 — cria uma pergunta de FAQ e invalida a listagem. */
export function useCriarFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: FaqMutationInput) => {
      const res = await fetch('/api/admin/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await readError(res));
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'faq'] }),
  });
}

/** J32 — edita uma pergunta de FAQ e invalida a listagem. */
export function useEditarFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: FaqMutationInput & { id: string }) => {
      const res = await fetch(`/api/admin/faq/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await readError(res));
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'faq'] }),
  });
}

/** J32 — exclui uma pergunta de FAQ e invalida a listagem. */
export function useDeletarFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/faq/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await readError(res));
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'faq'] }),
  });
}
