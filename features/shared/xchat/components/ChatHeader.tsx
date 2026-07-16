'use client';

import Link from 'next/link';
import { RiArrowLeftLine } from 'react-icons/ri';
import type { ChatHeaderProps } from '../types';
import { IconHomeWork } from '@shared/components/icons';
import { ChatAvatar } from './ChatAvatar';

export function ChatHeader({ conversation, basePath, onBack, isTyping }: ChatHeaderProps) {
  if (!conversation) return null;

  return (
    <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar para lista de conversas"
          className="md:hidden flex-shrink-0 -ml-1 p-2 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          data-testid="chat-back-to-list"
        >
          <RiArrowLeftLine className="w-5 h-5" />
        </button>
      )}

      <div className="relative flex-shrink-0">
        <ChatAvatar
          avatarUrl={conversation.avatarUrl}
          initials={conversation.participantInitials}
          color={conversation.participantColor}
          name={conversation.participantName}
        />
        {conversation.isActive && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">
            {conversation.participantName}
          </h3>
          {isTyping ? (
            <span className="text-[10px] text-primary font-medium flex-shrink-0 italic">
              digitando…
            </span>
          ) : conversation.isActive ? (
            <span className="text-[10px] text-green-600 font-medium flex-shrink-0">online</span>
          ) : null}
        </div>
        <p className="text-xs text-gray-500 truncate">{conversation.obraNome}</p>
      </div>

      {conversation.obraId && (
        <Link
          href={`${basePath}/minhas-obras/${conversation.obraId}`}
          className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5"
        >
          <IconHomeWork className="text-sm leading-none" />
          <span className="hidden sm:inline">Ver obra</span>
        </Link>
      )}
    </div>
  );
}
