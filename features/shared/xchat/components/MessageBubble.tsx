'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import { STATUS_LABELS } from '@shared/constants/status';
import type { MessageBubbleProps } from '../types';
import { IconHomeWork, IconArrowForward, IconDone, IconDoneAll } from '@shared/components/icons';

const STATUS_COLOR: Record<string, string> = {
  em_execucao: '#16a34a',
  com_atrasos: '#dc2626',
  com_pendencias: '#d97706',
  planejamento: '#6366f1',
  finalizada: '#64748b',
};

function formatTimestamp(raw: string): string {
  if (!raw.includes('T')) return raw;
  const date = new Date(raw);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function FileMimeIcon({ mime }: { mime: string }) {
  if (mime === 'application/pdf') {
    return (
      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 2h7l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm7 1.5V8h4.5L14 3.5zm-5 8.5h6v1H9v-1zm0 2.5h6v1H9v-1zm0-5h3v1H9v-1z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export function MessageBubble({ message, basePath }: MessageBubbleProps) {
  const timestamp = formatTimestamp(message.timestamp);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isImage = message.type === 'image' || (!!message.fileMime && message.fileMime.startsWith('image/'));
  const isFile = (message.type === 'file' || !!message.fileUrl) && !isImage;

  return (
    <>
      {lightboxOpen && message.fileUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxOpen(false)}
          data-testid="image-lightbox"
        >
          <img
            src={message.fileUrl}
            alt={message.fileName ?? 'Imagem'}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-full w-9 h-9 flex items-center justify-center transition-colors"
            onClick={() => setLightboxOpen(false)}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
      )}
    <div className={cn('flex', message.isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] px-4 py-3 rounded-2xl',
          message.isOwn
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md',
        )}
      >
        {!message.isOwn && (
          <p className="text-xs font-semibold mb-1 text-primary">{message.senderName}</p>
        )}

        {isImage && message.fileUrl && (
          <div className="mb-1">
            <img
              src={message.fileUrl}
              alt={message.fileName ?? 'Imagem'}
              className="max-w-full rounded-xl cursor-zoom-in object-cover"
              style={{ maxHeight: '280px' }}
              onClick={() => setLightboxOpen(true)}
              data-testid={`img-chat-${message.id}`}
            />
            {message.fileName && (
              <p className={cn('text-[10px] mt-1', message.isOwn ? 'text-white/60' : 'text-gray-400')}>
                {message.fileName}
              </p>
            )}
          </div>
        )}

        {isFile && message.fileUrl && (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={message.fileName}
            className={cn(
              'flex items-center gap-2 mb-1 px-3 py-2 rounded-xl border text-sm transition-opacity hover:opacity-80',
              message.isOwn
                ? 'border-white/20 bg-white/10'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900',
            )}
            data-testid={`link-file-${message.id}`}
          >
            <span className={message.isOwn ? 'text-white/70' : 'text-gray-500'}>
              <FileMimeIcon mime={message.fileMime ?? ''} />
            </span>
            <span className="flex-1 min-w-0">
              <span className={cn('block truncate font-medium text-xs', message.isOwn ? 'text-white' : 'text-gray-800 dark:text-gray-200')}>
                {message.fileName ?? 'Arquivo'}
              </span>
              <span className={cn('text-[10px]', message.isOwn ? 'text-white/60' : 'text-gray-400')}>
                Baixar arquivo
              </span>
            </span>
          </a>
        )}

        {message.content && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}

        {message.attachment?.type === 'obra_ref' && (
          <div
            className={cn(
              'mt-2 rounded-xl overflow-hidden border text-sm',
              message.isOwn
                ? 'border-white/20 bg-white/10'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900',
            )}
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-inherit">
              <IconHomeWork className="text-base leading-none opacity-70" />
              <span
                className={cn(
                  'text-[11px] font-semibold uppercase tracking-wide',
                  message.isOwn ? 'text-white/70' : 'text-gray-400',
                )}
              >
                Obra referenciada
              </span>
            </div>
            <div className="px-3 py-2.5">
              <p
                className={cn(
                  'font-semibold text-sm leading-tight',
                  message.isOwn ? 'text-white' : 'text-gray-900 dark:text-white',
                )}
              >
                {message.attachment.obraNome}
              </p>
              <p
                className={cn(
                  'text-xs mt-0.5',
                  message.isOwn ? 'text-white/60' : 'text-gray-500',
                )}
              >
                {message.attachment.endereco}
              </p>

              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-[11px] font-medium"
                    style={{
                      color: message.isOwn
                        ? 'rgba(255,255,255,0.8)'
                        : STATUS_COLOR[message.attachment.obraStatus] ?? '#64748b',
                    }}
                  >
                    {STATUS_LABELS[message.attachment.obraStatus] ?? message.attachment.obraStatus}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] font-semibold',
                      message.isOwn ? 'text-white/80' : 'text-gray-700 dark:text-gray-300',
                    )}
                  >
                    {message.attachment.progresso}%
                  </span>
                </div>
                <div
                  className={cn(
                    'h-1.5 rounded-full overflow-hidden',
                    message.isOwn ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700',
                  )}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${message.attachment.progresso}%`,
                      backgroundColor: message.isOwn
                        ? 'rgba(255,255,255,0.85)'
                        : STATUS_COLOR[message.attachment.obraStatus] ?? '#16a34a',
                    }}
                  />
                </div>
              </div>

              <Link
                href={`${basePath}/minhas-obras/${message.attachment.obraId}`}
                className={cn(
                  'inline-flex items-center gap-1 text-[11px] font-semibold mt-2 hover:underline',
                  message.isOwn ? 'text-white/80' : 'text-primary',
                )}
              >
                Ver obra
                <IconArrowForward className="text-sm leading-none" />
              </Link>
            </div>
          </div>
        )}

        <div
          className={cn(
            'flex items-center justify-end gap-1 mt-1',
            message.isOwn ? 'text-white/60' : 'text-gray-400',
          )}
        >
          <span className="text-[10px]">{timestamp}</span>
          {message.isOwn && message.status && (
            message.status === 'read' ? (
              <IconDoneAll className="text-[13px] leading-none text-blue-400" />
            ) : (
              <IconDone className="text-[13px] leading-none" />
            )
          )}
        </div>
      </div>
    </div>
    </>
  );
}
