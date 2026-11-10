'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface ConsentimentoMarketingDto {
  ativo: boolean;
  consentimentoEm: string | null;
  revogadoEm: string | null;
  origem: 'cadastro' | 'configuracoes' | 'descadastro' | null;
}

const KEY = ['xgestao', 'marketing'] as const;
const URL = '/api/xgestao/marketing';

export function useConsentimentoMarketing(opcoes: { enabled?: boolean } = {}) {
  return useQuery<ConsentimentoMarketingDto>({
    queryKey: KEY,
    enabled: opcoes.enabled ?? true,
    queryFn: async () => {
      const res = await fetch(URL, { credentials: 'include' });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
  });
}

export function useAlterarConsentimentoMarketing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (aceitar: boolean) => {
      const res = await fetch(URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ aceitar }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      return (await res.json()) as ConsentimentoMarketingDto;
    },
    onSuccess: (data) => qc.setQueryData(KEY, data),
  });
}
