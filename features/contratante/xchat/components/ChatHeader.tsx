'use client';

import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import type { ContratanteConversation } from '../types';

interface ChatHeaderProps {
  conversation: ContratanteConversation | null;
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  if (!conversation) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      {/* Avatar with online indicator */}
      <div className="relative flex-shrink-0">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold',
            conversation.participantColor,
          )}
        >
          {conversation.participantInitials}
        </div>
        {conversation.isActive && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" />
        )}
      </div>

      {/* Name + obra */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">
            {conversation.participantName}
          </h3>
          {conversation.isActive && (
            <span className="text-[10px] text-green-600 font-medium flex-shrink-0">online</span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{conversation.obraNome}</p>
      </div>

      {/* Ver obra button */}
      {conversation.obraId && (
        <Link
          href={`/contratante/minhas-obras/${conversation.obraId}`}
          className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5"
        >
          <span className="material-symbols-outlined text-sm leading-none">home_work</span>
          Ver obra
        </Link>
      )}
    </div>
  );
}
