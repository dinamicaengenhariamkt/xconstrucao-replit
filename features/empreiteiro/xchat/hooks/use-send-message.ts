import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '@features/empreiteiro/xchat/store/chat-store';
import type { MessageAttachment } from '@features/empreiteiro/xchat/types';

interface SendArgs {
  conversationId: string;
  content: string;
  attachment?: MessageAttachment;
}

interface SendResponse {
  ok: true;
  id: string;
}

async function postMensagem(args: SendArgs): Promise<SendResponse> {
  const anexoObraId = args.attachment?.type === 'obra_ref' ? args.attachment.obraId : null;
  const response = await fetch(`/api/empreiteiro/chat/${args.conversationId}/messages`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto: args.content, anexoObraId }),
  });
  if (!response.ok) {
    throw new Error('Falha ao enviar mensagem');
  }
  return (await response.json()) as SendResponse;
}

export function useEmpreiteiroSendMessage() {
  const queryClient = useQueryClient();
  const sendOptimistic = useChatStore((s) => s.sendMessage);
  const clearLocal = useChatStore((s) => s.clearLocalMessages);

  return useMutation({
    mutationFn: postMensagem,
    onMutate: ({ conversationId, content, attachment }) => {
      sendOptimistic(conversationId, content, attachment);
    },
    onSuccess: async (_data, { conversationId }) => {
      // Limpa optimistic ANTES do refetch trazer a real, pra não piscar duplicado.
      clearLocal(conversationId);
      await queryClient.invalidateQueries({
        queryKey: ['empreiteiro', 'chat', 'messages', conversationId],
      });
      void queryClient.invalidateQueries({ queryKey: ['empreiteiro', 'chat', 'conversations'] });
    },
    onError: (err, { conversationId }) => {
      console.error('[useEmpreiteiroSendMessage] falha:', err);
      clearLocal(conversationId);
    },
  });
}
