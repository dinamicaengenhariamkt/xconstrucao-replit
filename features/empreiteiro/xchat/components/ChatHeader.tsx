'use client';

import { cn } from '@shared/lib/utils';
import type { ChatHeaderProps } from '../types';

export function ChatHeader({ conversation }: ChatHeaderProps) {
  if (!conversation) return null;

  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold', conversation.participantColor)}>
        {conversation.participantInitials}
      </div>
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{conversation.participantName}</h3>
        <p className="text-xs text-gray-500">{conversation.obraNome}</p>
      </div>
    </div>
  );
}
