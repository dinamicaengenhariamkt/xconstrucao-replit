'use client';

import { useRef, useEffect, Fragment, useState, useMemo } from 'react';
import { RiSearchLine, RiCloseLine } from 'react-icons/ri';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../types';

interface MessageAreaProps {
  messages: Message[];
  isLoading: boolean;
  basePath: string;
  /** Quando true, mostra um indicador "..." animado no fim da lista. */
  isTyping?: boolean;
}

function TypingIndicator() {
  return (
    <div className="flex justify-start" data-testid="chat-typing-indicator">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
      </div>
    </div>
  );
}

function getDateLabel(rawTimestamp: string): string {
  const date = rawTimestamp.includes('T') ? new Date(rawTimestamp) : null;
  if (!date || isNaN(date.getTime())) return rawTimestamp;

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return 'Hoje';
  if (isSameDay(date, yesterday)) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function groupByDate(messages: Message[]): Array<{ label: string; messages: Message[] }> {
  const groups: Array<{ label: string; messages: Message[] }> = [];
  let currentLabel = '';

  for (const msg of messages) {
    const label = getDateLabel(msg.timestamp);
    if (label !== currentLabel) {
      groups.push({ label, messages: [msg] });
      currentLabel = label;
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }

  return groups;
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
      <span className="text-[11px] font-medium text-gray-400 px-2 whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

export function MessageArea({ messages, isLoading, basePath, isTyping }: MessageAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    } else {
      setSearchQuery('');
    }
  }, [searchOpen]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => m.content?.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="animate-pulse flex flex-col gap-4 w-full max-w-md px-6">
          <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl w-3/4" />
          <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl w-2/3 self-end" />
          <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl w-4/5" />
        </div>
      </div>
    );
  }

  const isEmpty = filteredMessages.length === 0 && !isTyping;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Search bar */}
      <div className="flex-shrink-0 px-4 py-1.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        {searchOpen ? (
          <>
            <RiSearchLine className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar nessa conversa…"
              data-testid="chat-search-input"
              className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
            />
            {searchQuery && (
              <span className="text-[11px] text-gray-400 flex-shrink-0">
                {filteredMessages.length} resultado{filteredMessages.length !== 1 ? 's' : ''}
              </span>
            )}
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Fechar busca"
              data-testid="chat-search-close"
              className="flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <RiCloseLine className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-end">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar na conversa"
              data-testid="chat-search-toggle"
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <RiSearchLine className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      {isEmpty ? (
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <p className="text-sm text-gray-400" data-testid="chat-empty-state">
            {searchQuery.trim()
              ? 'Nenhuma mensagem encontrada.'
              : 'Nenhuma mensagem ainda. Diga olá!'}
          </p>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-4 flex flex-col gap-2">
          {groupByDate(filteredMessages).map((group) => (
            <Fragment key={group.label}>
              <DateSeparator label={group.label} />
              {group.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} basePath={basePath} />
              ))}
            </Fragment>
          ))}
          {isTyping && !searchQuery && <TypingIndicator />}
        </div>
      )}
    </div>
  );
}
