'use client';

import { useMutation } from '@tanstack/react-query';

/**
 * J51 — marca `users.onboarding_concluido = true` (concluir OU pular). Após o
 * sucesso, o caller navega ao dashboard; o gate pós-login não reabre o wizard.
 */
export function useConcluirOnboarding() {
  return useMutation<{ ok: boolean }, Error, void>({
    mutationFn: async () => {
      const res = await fetch('/api/onboarding/concluir', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Erro ao concluir onboarding');
      return res.json();
    },
  });
}
