import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useContratanteChatStore } from '@features/contratante/xchat/store/chat-store';
import type { MessageAttachment } from '@features/shared/xchat/types';

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
  const fileAttach = args.attachment?.type === 'file' ? args.attachment : null;
  const response = await fetch(`/api/contratante/chat/messages/${args.conversationId}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      texto: args.content,
      anexoObraId,
      ...(fileAttach ? { arquivoUrl: fileAttach.url, arquivoNome: fileAttach.nome, arquivoMime: fileAttach.mime } : {}),
    }),
  });
  if (!response.ok) {
    throw new Error('Falha ao enviar mensagem');
  }
  return (await response.json()) as SendResponse;
}

export function useContratanteSendMessage() {
  const queryClient = useQueryClient();
  const sendOptimistic = useContratanteChatStore((s) => s.sendMessage);
  const clearLocal = useContratanteChatStore((s) => s.clearLocalMessages);

  return useMutation({
    mutationFn: postMensagem,
    onMutate: ({ conversationId, content, attachment }) => {
      sendOptimistic(conversationId, content, attachment);
    },
    onSuccess: async (_data, { conversationId }) => {
      // Limpa optimistic ANTES do refetch trazer a real, pra não piscar duplicado.
      clearLocal(conversationId);
      await queryClient.invalidateQueries({
        queryKey: ['contratante', 'chat', 'messages', conversationId],
      });
      void queryClient.invalidateQueries({ queryKey: ['contratante', 'chat', 'conversations'] });
    },
    onError: (err, { conversationId }) => {
      console.error('[useContratanteSendMessage] falha:', err);
      clearLocal(conversationId);
    },
  });
}
