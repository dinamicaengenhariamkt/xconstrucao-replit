import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '@features/empreiteiro/xchat/store/chat-store';
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
  const response = await fetch(`/api/empreiteiro/chat/${args.conversationId}/messages`, {
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

export function useEmpreiteiroSendMessage() {
  const queryClient = useQueryClient();
  const sendOptimistic = useChatStore((s) => s.sendMessage);
  const clearLocalMessage = useChatStore((s) => s.clearLocalMessage);

  return useMutation({
    mutationFn: postMensagem,
    onMutate: ({ conversationId, content, attachment }) => {
      const localId = sendOptimistic(conversationId, content, attachment);
      return { localId };
    },
    onSuccess: async (_data, { conversationId }, context) => {
      if (context?.localId) clearLocalMessage(conversationId, context.localId);
      await queryClient.invalidateQueries({
        queryKey: ['empreiteiro', 'chat', 'messages', conversationId],
      });
      void queryClient.invalidateQueries({ queryKey: ['empreiteiro', 'chat', 'conversations'] });
    },
    onError: (err, { conversationId }, context) => {
      console.error('[useEmpreiteiroSendMessage] falha:', err);
      if (context?.localId) clearLocalMessage(conversationId, context.localId);
    },
  });
}
