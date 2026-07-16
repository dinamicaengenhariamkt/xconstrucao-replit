'use client';

import { useState, useRef, useEffect } from 'react';
import { ObraPickerSheet } from './ObraPickerSheet';
import { STATUS_LABELS } from '@shared/constants/status';
import type { ChatInputProps, FileAttachment, MessageAttachment, ObraRefAttachment } from '../types';
import { IconHomeWork, IconClose, IconAttachFile, IconSend } from '@shared/components/icons';

const ACCEPTED_MIMES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const MAX_FILES = 3;
const IMAGE_MAX_BYTES = 8_000_000;
const DOC_MAX_BYTES = 10_000_000;

interface PendingFile {
  localId: string;
  publicUrl: string;
  nome: string;
  mime: string;
  progress: number;
  uploading: boolean;
  error?: string;
  previewUrl?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileIcon(mime: string): string {
  if (mime.startsWith('image/')) return '🖼️';
  if (mime === 'application/pdf') return '📄';
  return '📎';
}

export function ChatInput({ onSend, disabled, obras = [], threadId }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<ObraRefAttachment | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [message]);

  const anyUploading = pendingFiles.some((f) => f.uploading);
  const readyFiles = pendingFiles.filter((f) => !!f.publicUrl && !f.uploading);
  const canSend =
    !disabled &&
    !anyUploading &&
    (message.trim().length > 0 || pendingAttachment !== null || readyFiles.length > 0);

  const handleSend = () => {
    if (!canSend) return;

    const textContent = message.trim();

    // Text message (with optional obra ref — obra ref is mutually exclusive with files)
    if (textContent || pendingAttachment) {
      const attachment: MessageAttachment | undefined = pendingAttachment ?? undefined;
      onSend(textContent, attachment);
    }

    // Each file as a separate message
    for (const f of readyFiles) {
      const fileAttach: FileAttachment = { type: 'file', url: f.publicUrl, nome: f.nome, mime: f.mime };
      onSend('', fileAttach);
    }

    // Reset state
    setMessage('');
    setPendingAttachment(null);
    setPendingFiles((prev) => {
      prev.forEach((f) => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
      return [];
    });
    setGlobalError(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const uploadFile = async (file: File, localId: string) => {
    if (!threadId) return;

    try {
      const presignRes = await fetch(`/api/chat/${threadId}/upload/presign`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, mime: file.type, size: file.size }),
      });
      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message || 'Falha ao iniciar upload');
      }
      const { uploadUrl, publicUrl } = await presignRes.json() as { uploadUrl: string; publicUrl: string };

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setPendingFiles((prev) =>
              prev.map((f) => f.localId === localId ? { ...f, progress: pct } : f),
            );
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload falhou: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Erro de rede no upload'));
        xhr.send(file);
      });

      setPendingFiles((prev) =>
        prev.map((f) =>
          f.localId === localId
            ? { ...f, publicUrl, progress: 100, uploading: false }
            : f,
        ),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha no upload';
      setPendingFiles((prev) =>
        prev.map((f) =>
          f.localId === localId
            ? { ...f, uploading: false, error: msg }
            : f,
        ),
      );
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!files.length || !threadId) return;

    setGlobalError(null);

    const remaining = MAX_FILES - pendingFiles.length;
    if (remaining <= 0) {
      setGlobalError(`Máximo ${MAX_FILES} arquivos por mensagem.`);
      return;
    }

    const toAdd = files.slice(0, remaining);

    for (const file of toAdd) {
      if (!ACCEPTED_MIMES.includes(file.type)) {
        setGlobalError('Formato não suportado. Use imagem, PDF ou DOCX.');
        continue;
      }
      const maxBytes = file.type.startsWith('image/') ? IMAGE_MAX_BYTES : DOC_MAX_BYTES;
      if (file.size > maxBytes) {
        setGlobalError(`"${file.name}" excede o limite de ${formatBytes(maxBytes)}.`);
        continue;
      }

      const localId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;

      setPendingFiles((prev) => [
        ...prev,
        { localId, publicUrl: '', nome: file.name, mime: file.type, progress: 0, uploading: true, previewUrl },
      ]);

      void uploadFile(file, localId);
    }
  };

  const removeFile = (localId: string) => {
    setPendingFiles((prev) => {
      const file = prev.find((f) => f.localId === localId);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      return prev.filter((f) => f.localId !== localId);
    });
  };

  const attachButtonDisabled =
    disabled || anyUploading || pendingFiles.length >= MAX_FILES;

  const attachButtonTitle = pendingFiles.length >= MAX_FILES
    ? `Máximo ${MAX_FILES} arquivos por mensagem`
    : `Imagens até ${formatBytes(IMAGE_MAX_BYTES)} · PDFs/docs até ${formatBytes(DOC_MAX_BYTES)}`;

  return (
    <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      {/* Obra ref attachment */}
      {pendingAttachment && (
        <div className="mx-4 mt-3 flex items-center gap-2 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl px-3 py-2">
          <IconHomeWork className="text-base text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary truncate">{pendingAttachment.obraNome}</p>
            <p className="text-[10px] text-gray-500 truncate">
              {STATUS_LABELS[pendingAttachment.obraStatus] ?? pendingAttachment.obraStatus} ·{' '}
              {pendingAttachment.progresso}%
            </p>
          </div>
          <button
            onClick={() => setPendingAttachment(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            aria-label="Remover referência"
          >
            <IconClose className="text-base" />
          </button>
        </div>
      )}

      {/* File cards */}
      {pendingFiles.length > 0 && (
        <div className="mx-4 mt-3 flex flex-col gap-1.5">
          {pendingFiles.map((f) => (
            <div
              key={f.localId}
              className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2"
              data-testid={`pending-file-card-${f.localId}`}
            >
              {f.previewUrl ? (
                <img
                  src={f.previewUrl}
                  alt={f.nome}
                  className="w-9 h-9 object-cover rounded-md flex-shrink-0"
                  data-testid="pending-file-thumbnail"
                />
              ) : (
                <span className="text-base leading-none flex-shrink-0">{fileIcon(f.mime)}</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 truncate">
                  {f.nome}
                </p>
                {f.uploading && (
                  <>
                    <div className="mt-1 h-1 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-200"
                        style={{ width: `${f.progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-blue-500 mt-0.5">Enviando arquivo, aguarde…</p>
                  </>
                )}
                {!f.uploading && f.publicUrl && (
                  <p className="text-[10px] text-emerald-500">Pronto para enviar ✓</p>
                )}
                {!f.uploading && f.error && (
                  <p className="text-[10px] text-red-500">{f.error}</p>
                )}
              </div>
              {!f.uploading && (
                <button
                  onClick={() => removeFile(f.localId)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                  aria-label={`Remover ${f.nome}`}
                  data-testid={`button-remove-file-${f.localId}`}
                >
                  <IconClose className="text-base" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {globalError && (
        <p className="mx-4 mt-2 text-xs text-red-500 dark:text-red-400" data-testid="upload-error">
          {globalError}
        </p>
      )}

      <div className="flex items-end gap-2 p-3">
        {obras.length > 0 ? (
          <ObraPickerSheet obras={obras} onSelect={setPendingAttachment}>
            <button
              disabled={disabled}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors disabled:opacity-40"
              aria-label="Referenciar obra"
              title="Referenciar obra"
            >
              <IconAttachFile className="text-xl" />
            </button>
          </ObraPickerSheet>
        ) : (
          <button
            disabled
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 dark:text-gray-700"
            aria-label="Referenciar obra"
          >
            <IconAttachFile className="text-xl" />
          </button>
        )}

        {threadId && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_MIMES.join(',')}
              multiple
              className="hidden"
              onChange={handleFileChange}
              data-testid="input-file-upload"
            />
            <button
              disabled={attachButtonDisabled}
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-40"
              aria-label="Enviar arquivo"
              title={attachButtonTitle}
              data-testid="button-attach-file"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
          </>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Digite sua mensagem… (Shift+Enter para nova linha)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1 resize-none px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-50 leading-relaxed overflow-hidden"
          style={{ minHeight: '40px', maxHeight: '120px' }}
          data-testid="input-chat-message"
        />

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
