import { useMutation, useQueryClient } from '@tanstack/react-query';

async function postMarcarLida(conversationId: string) {
  const res = await fetch(`/api/contratante/chat/${conversationId}/marcar-lida`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Falha ao marcar conversa como lida');
  return res.json() as Promise<{ marcadas: number }>;
}

export function useContratanteMarcarLida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postMarcarLida,
    onSuccess: (data) => {
      if (data.marcadas > 0) {
        void queryClient.invalidateQueries({ queryKey: ['contratante', 'chat', 'conversations'] });
        void queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
      }
    },
    onError: (err) => {
      console.error('[useContratanteMarcarLida]', err);
    },
  });
}
