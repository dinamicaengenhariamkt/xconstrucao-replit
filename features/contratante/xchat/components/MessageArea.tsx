'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import type { ContratanteMessage } from '../types';
import { IconHomeWork, IconArrowForward } from '@shared/components/icons';

const STATUS_LABEL: Record<string, string> = {
  em_execucao: 'Em execução',
  com_atrasos: 'Com atrasos',
  com_pendencias: 'Com pendências',
  planejamento: 'Planejamento',
  finalizada: 'Finalizada',
};

const STATUS_COLOR: Record<string, string> = {
  em_execucao: '#16a34a',
  com_atrasos: '#dc2626',
  com_pendencias: '#d97706',
  planejamento: '#6366f1',
  finalizada: '#64748b',
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
              <AttachmentCard attachment={msg.attachment} />
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

function AttachmentCard({
  attachment,
}: {
  attachment: NonNullable<ContratanteMessage['attachment']>;
}) {
  const statusColor = STATUS_COLOR[attachment.obraStatus] ?? '#64748b';

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <IconHomeWork className="text-base leading-none opacity-70" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Obra referenciada
        </span>
      </div>

      {/* Card body */}
      <div className="px-3 py-2.5">
        <p className="font-semibold text-sm leading-tight text-gray-900 dark:text-white">
          {attachment.obraNome}
        </p>
        <p className="text-xs mt-0.5 text-gray-500">{attachment.endereco}</p>

        {/* Progress bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium" style={{ color: statusColor }}>
              {STATUS_LABEL[attachment.obraStatus] ?? attachment.obraStatus}
            </span>
            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
              {attachment.progresso}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full"
              style={{ width: `${attachment.progresso}%`, backgroundColor: statusColor }}
            />
          </div>
        </div>

        <Link
          href={`/contratante/minhas-obras/${attachment.obraId}`}
          className="inline-flex items-center gap-1 text-[11px] font-semibold mt-2 hover:underline text-primary"
        >
          Ver obra
          <IconArrowForward className="text-sm leading-none" />
        </Link>
      </div>
    </div>
  );
}
