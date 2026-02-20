'use client';

import { cn } from '@shared/lib/utils';
import type { MessageBubbleProps } from '../types';

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div className={cn('flex', message.isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[70%] px-4 py-3 rounded-2xl',
        message.isOwn
          ? 'bg-primary text-white rounded-br-md'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
      )}>
        {!message.isOwn && <p className="text-xs font-semibold mb-1 text-primary">{message.senderName}</p>}
        <p className="text-sm leading-relaxed">{message.content}</p>
        <p className={cn('text-[10px] mt-1 text-right', message.isOwn ? 'text-white/60' : 'text-gray-400')}>{message.timestamp}</p>
      </div>
    </div>
  );
}
