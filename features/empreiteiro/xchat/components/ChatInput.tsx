'use client';

import { useState } from 'react';
import type { ChatInputProps } from '../types';

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) return;
    onSend(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Digite sua mensagem..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1 px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-50"
          data-testid="input-chat-message"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="w-10 h-10 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors"
          data-testid="button-send-message"
          aria-label="Enviar mensagem"
        >
          <span className="material-symbols-outlined text-lg">send</span>
        </button>
      </div>
    </div>
  );
}
