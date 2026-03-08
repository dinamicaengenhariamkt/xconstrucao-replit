'use client';

import { useState, useRef, useEffect } from 'react';
import type { ContratanteMessageAttachment } from '../types';
import { IconAttachFile, IconSend } from '@shared/components/icons';

interface ChatInputProps {
  onSend: (content: string, attachment?: ContratanteMessageAttachment) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [message]);

  const canSend = !disabled && message.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    onSend(message.trim());
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex items-end gap-2 p-3">
        {/* Attach button (disabled — obra picker not available for contratante yet) */}
        <button
          disabled
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 dark:text-gray-700"
          aria-label="Referenciar obra"
        >
          <IconAttachFile className="text-xl" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1 resize-none px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-50 leading-relaxed overflow-hidden"
          style={{ minHeight: '40px', maxHeight: '120px' }}
          data-testid="input-chat-message"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="flex-shrink-0 w-9 h-9 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors"
          data-testid="button-send-message"
          aria-label="Enviar mensagem"
        >
          <IconSend className="text-lg" />
        </button>
      </div>
    </div>
  );
}
