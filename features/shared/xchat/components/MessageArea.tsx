'use client';

import { useRef, useEffect, Fragment } from 'react';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../types';

interface MessageAreaProps {
  messages: Message[];
  isLoading: boolean;
  basePath: string;
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

export function MessageArea({ messages, isLoading, basePath }: MessageAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse flex flex-col gap-4 w-full max-w-md px-6">
          <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl w-3/4" />
          <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl w-2/3 self-end" />
          <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl w-4/5" />
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-400">Nenhuma mensagem ainda. Diga olá!</p>
      </div>
    );
  }

  const groups = groupByDate(messages);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
      {groups.map((group) => (
        <Fragment key={group.label}>
          <DateSeparator label={group.label} />
          {group.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} basePath={basePath} />
          ))}
        </Fragment>
      ))}
    </div>
  );
}
