'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConversationList } from '@features/empreiteiro/xchat/components/ConversationList';
import { ChatHeader } from '@features/empreiteiro/xchat/components/ChatHeader';
import { MessageArea } from '@features/empreiteiro/xchat/components/MessageArea';
import { ChatInput } from '@features/empreiteiro/xchat/components/ChatInput';
import { EmptyChat } from '@features/empreiteiro/xchat/components/EmptyChat';
import { useConversations, useMessages } from '@features/empreiteiro/xchat/hooks/use-chat';
import { useEmpreiteiroSendMessage } from '@features/empreiteiro/xchat/hooks/use-send-message';
import { useEmpreiteiroMarcarLida } from '@features/empreiteiro/xchat/hooks/use-marcar-lida';
import { useChatStore } from '@features/empreiteiro/xchat/store/chat-store';
import { sortMessagesCanonical } from '@features/shared/xchat/lib/sort-messages';
import { useMinhasObras } from '@features/empreiteiro/minhas-obras/hooks/use-minhas-obras';
import type { MessageAttachment } from '@features/empreiteiro/xchat/types';
import { cn } from '@shared/lib/utils';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const { data: conversations, isLoading: convLoading } = useConversations();
  const { data: obras } = useMinhasObras();
  const {
    selectedConversationId,
    localMessages,
    typingConversationIds,
    sendMessage,
    setSelectedConversation,
  } = useChatStore();
  const { data: serverMessages, isLoading: msgLoading } = useMessages(selectedConversationId);
  const sendMutation = useEmpreiteiroSendMessage();
  const marcarLidaMutation = useEmpreiteiroMarcarLida();

  // Auto-select the thread from ?thread= URL param once conversations load.
  // Espelha o comportamento do contratante (app/contratante/chat/page.tsx).
  const threadParam = searchParams.get('thread');
  const didAutoSelectRef = useRef(false);
  useEffect(() => {
    if (!threadParam || convLoading || didAutoSelectRef.current) return;
    const found = conversations?.find((c) => c.id === threadParam);
    if (found) {
      didAutoSelectRef.current = true;
      setSelectedConversation(threadParam);
    }
  }, [threadParam, conversations, convLoading, setSelectedConversation]);

  const selectedConversation =
    conversations?.find((c) => c.id === selectedConversationId) ?? null;
  const isServerConversation = !!selectedConversation;

  const isTyping =
    !!selectedConversationId && typingConversationIds.includes(selectedConversationId);

  // Ao abrir conversa real, marca mensagens do outro lado como lidas no backend
  // e invalida o cache de conversas/notificações pra atualizar badges imediatamente.
  useEffect(() => {
    if (!selectedConversationId || !isServerConversation) return;
    marcarLidaMutation.mutate(selectedConversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId, isServerConversation]);

  // Marca lida quando chega nova mensagem do counterpart com a aba visível.
  // O ref reseta a cada troca de conversa pra não disparar marcação espúria
  // ao reabrir uma thread antiga (len > prev seria true por motivos errados).
  const prevServerLenRef = useRef(0);
  useEffect(() => {
    prevServerLenRef.current = 0;
  }, [selectedConversationId]);
  useEffect(() => {
    if (!selectedConversationId || !isServerConversation || !serverMessages) return;
    const len = serverMessages.length;
    const prev = prevServerLenRef.current;
    prevServerLenRef.current = len;
    if (len > prev && prev > 0) {
      const last = serverMessages[len - 1];
      if (last && !last.isOwn && typeof document !== 'undefined' && document.visibilityState === 'visible') {
        marcarLidaMutation.mutate(selectedConversationId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverMessages, selectedConversationId, isServerConversation]);

  // Quando a aba volta a ficar visível, re-marca lida (usuário voltou a ler).
  useEffect(() => {
    if (!selectedConversationId || !isServerConversation) return;
    if (typeof document === 'undefined') return;
    const handle = () => {
      if (document.visibilityState === 'visible') {
        marcarLidaMutation.mutate(selectedConversationId);
      }
    };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId, isServerConversation]);

  // Merge server messages with locally sent messages.
  // 1) Dedupe por serverId: quando a versão do servidor da otimista já chegou,
  //    descarta a local (evita duplicata e faz a otimista sumir sem "gap").
  // 2) Sort canônico por `seq` (fonte de verdade da ordem); otimistas sem seq
  //    ficam no fim até o refetch — ordem cronológica estável, nada pula.
  const allMessages = useMemo(() => {
    const server = serverMessages ?? [];
    const serverIds = new Set(server.map((m) => m.id));
    const local = selectedConversationId
      ? (localMessages[selectedConversationId] ?? []).filter(
          (m) => !(m.serverId && serverIds.has(m.serverId)),
        )
      : [];
    return sortMessagesCanonical([...server, ...local]);
  }, [serverMessages, localMessages, selectedConversationId]);

  const handleSend = (content: string, attachment?: MessageAttachment) => {
    if (!selectedConversationId) return;
    if (isServerConversation) {
      sendMutation.mutate({ conversationId: selectedConversationId, content, attachment });
    } else {
      // Conversa efêmera (sem thread real ainda) — só local.
      sendMessage(selectedConversationId, content, attachment);
    }
  };

  if (convLoading) {
    return (
      <div className="h-full p-3 sm:p-6">
        <div className="flex h-full animate-pulse bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="w-96 border-r border-gray-100 dark:border-gray-800 p-4 space-y-3 flex-shrink-0">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-32" />
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1" />
        </div>
      </div>
    );
  }

  const hasSelection = !!selectedConversation;

  return (
    <div className="h-full p-3 sm:p-6" data-testid="chat-empreiteiro-page">
      <div className="flex h-full bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            'w-full md:w-80 flex-shrink-0 min-h-0',
            hasSelection ? 'hidden md:block' : 'block',
          )}
        >
          <ConversationList conversations={conversations ?? []} />
        </div>

        {/* Chat area */}
        <div
          className={cn(
            'flex-1 flex-col min-w-0 min-h-0',
            hasSelection ? 'flex' : 'hidden md:flex',
          )}
        >
          {selectedConversation ? (
            <>
              <ChatHeader
                conversation={selectedConversation}
                isTyping={isTyping}
                onBack={() => setSelectedConversation(null)}
              />
              <MessageArea messages={allMessages} isLoading={msgLoading} isTyping={isTyping} />
              <ChatInput onSend={handleSend} obras={obras ?? []} threadId={selectedConversationId ?? undefined} />
            </>
          ) : (
            <EmptyChat />
          )}
        </div>
      </div>
    </div>
  );
}
