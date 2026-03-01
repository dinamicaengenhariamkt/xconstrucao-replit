'use client';

import { useState, useRef, useEffect } from 'react';
import { ObraPickerSheet } from './ObraPickerSheet';
import type { ChatInputProps, MessageAttachment, ObraRefAttachment } from '../types';

const STATUS_LABEL: Record<string, string> = {
  em_execucao: 'Em execução',
  com_atrasos: 'Com atrasos',
  com_pendencias: 'Com pendências',
  planejamento: 'Planejamento',
  finalizada: 'Finalizada',
};

export function ChatInput({ onSend, disabled, obras = [] }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<ObraRefAttachment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [message]);

  const canSend = !disabled && (message.trim().length > 0 || pendingAttachment !== null);

  const handleSend = () => {
    if (!canSend) return;
    const attachment: MessageAttachment | undefined = pendingAttachment ?? undefined;
    onSend(message.trim(), attachment);
    setMessage('');
    setPendingAttachment(null);
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
      {/* Obra reference preview */}
      {pendingAttachment && (
        <div className="mx-4 mt-3 flex items-center gap-2 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl px-3 py-2">
          <span className="material-symbols-outlined text-base text-primary">home_work</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary truncate">{pendingAttachment.obraNome}</p>
            <p className="text-[10px] text-gray-500 truncate">
              {STATUS_LABEL[pendingAttachment.obraStatus] ?? pendingAttachment.obraStatus} ·{' '}
              {pendingAttachment.progresso}%
            </p>
          </div>
          <button
            onClick={() => setPendingAttachment(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            aria-label="Remover referência"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        {/* Attach button */}
        {obras.length > 0 ? (
          <ObraPickerSheet obras={obras} onSelect={setPendingAttachment}>
            <button
              disabled={disabled}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors disabled:opacity-40"
              aria-label="Referenciar obra"
              title="Referenciar obra"
            >
              <span className="material-symbols-outlined text-xl">attach_file</span>
            </button>
          </ObraPickerSheet>
        ) : (
          <button
            disabled
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 dark:text-gray-700"
            aria-label="Referenciar obra"
          >
            <span className="material-symbols-outlined text-xl">attach_file</span>
          </button>
        )}

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
          <span className="material-symbols-outlined text-lg">send</span>
        </button>
      </div>
    </div>
  );
}
