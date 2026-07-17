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
  const confirmLocalMessage = useContratanteChatStore((s) => s.confirmLocalMessage);
  const clearLocalMessage = useContratanteChatStore((s) => s.clearLocalMessage);

  return useMutation({
    mutationFn: postMensagem,
    onMutate: ({ conversationId, content, attachment }) => {
      const localId = sendOptimistic(conversationId, content, attachment);
      return { localId };
    },
    onSuccess: (data, { conversationId }, context) => {
      // Não remove a otimista: confirma com o id real. O merge por serverId
      // a descarta quando o refetch trouxer a versão do servidor (sem flicker).
      if (context?.localId) confirmLocalMessage(conversationId, context.localId, data.id);
      void queryClient.invalidateQueries({
        queryKey: ['contratante', 'chat', 'messages', conversationId],
      });
      void queryClient.invalidateQueries({ queryKey: ['contratante', 'chat', 'conversations'] });
    },
    onError: (err, { conversationId }, context) => {
      console.error('[useContratanteSendMessage] falha:', err);
      if (context?.localId) clearLocalMessage(conversationId, context.localId);
    },
  });
}
