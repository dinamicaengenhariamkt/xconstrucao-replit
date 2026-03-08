'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@shared/lib/utils';
import type { ContratanteMessage } from '../types';
import { IconHomeWork } from '@shared/components/icons';

const STATUS_LABEL: Record<string, string> = {
  em_execucao: 'Em execução',
  com_atrasos: 'Com atrasos',
  com_pendencias: 'Com pendências',
  planejamento: 'Planejamento',
  finalizada: 'Finalizada',
};

interface MessageAreaProps {
  messages: ContratanteMessage[];
  isLoading: boolean;
}

export function MessageArea({ messages, isLoading }: MessageAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
            <div className="h-12 w-64 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-3" data-testid="message-area">
      {messages.map((msg) => (
        <div key={msg.id} className={cn('flex', msg.isOwn ? 'justify-end' : 'justify-start')}>
          <div className="max-w-[70%] flex flex-col gap-1">
            {/* Attachment card */}
            {msg.attachment?.type === 'obra_ref' && (
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs',
                  msg.isOwn
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
                )}
              >
                <IconHomeWork className="text-base leading-none" />
                <div className="min-w-0">
                  <p className="font-semibold truncate">{msg.attachment.obraNome}</p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {STATUS_LABEL[msg.attachment.obraStatus] ?? msg.attachment.obraStatus} ·{' '}
                    {msg.attachment.progresso}%
                  </p>
                </div>
              </div>
            )}

            {/* Message bubble */}
            {msg.content && (
              <div
                className={cn(
                  'px-4 py-2.5 rounded-2xl',
                  msg.isOwn
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md',
                )}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className={cn('text-[10px] mt-1', msg.isOwn ? 'text-white/60' : 'text-gray-400')}>
                  {msg.timestamp}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
