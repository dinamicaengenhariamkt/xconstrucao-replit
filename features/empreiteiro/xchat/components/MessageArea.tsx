'use client';

import { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../types';

interface MessageAreaProps {
  messages: Message[];
  isLoading: boolean;
}

export function MessageArea({ messages, isLoading }: MessageAreaProps) {
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

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
}
