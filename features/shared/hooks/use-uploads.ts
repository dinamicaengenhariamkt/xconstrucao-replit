'use client';

import { useCallback, useState } from 'react';
import { useAuthStore } from '@features/auth/store/auth-store';

export type UploadKind = 'avatar' | 'portfolio_imagem' | 'portfolio_doc' | 'empreiteiro_documento';

export interface CommitResponse {
  id: string;
  documentoId: string | null;
  kind: UploadKind;
  visibility: 'public' | 'private';
  publicUrl: string | null;
  signedUrl: string | null;
  originalName: string;
  mime: string;
  size: number;
}

interface UploadOptions {
  file: File;
  kind: UploadKind;
  extras?: { tipoDocumento?: string; observacao?: string };
  onProgress?: (p: number) => void;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* keep null */
  }
  if (!res.ok) {
    const message =
      (parsed && typeof parsed === 'object' && 'message' in parsed && typeof (parsed as { message?: string }).message === 'string')
        ? (parsed as { message: string }).message
        : `${res.status}: ${text || 'erro'}`;
    throw new Error(message);
  }
  return parsed as T;
}

function putWithProgress(url: string, file: File, mime: string, onProgress?: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', mime);
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && onProgress) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Falha no upload (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Falha de rede no upload.'));
    xhr.send(file);
  });
}

export function useUpload() {
  const [progress, setProgress] = useState<number>(0);
  const [pending, setPending] = useState<boolean>(false);

  const upload = useCallback(async (opts: UploadOptions): Promise<CommitResponse> => {
    setPending(true);
    setProgress(0);
    try {
      const presign = await postJSON<{ uploadUrl: string; key: string }>('/api/uploads/presign', {
        kind: opts.kind,
        mime: opts.file.type || 'application/octet-stream',
        size: opts.file.size,
        filename: opts.file.name,
        extras: opts.extras,
      });

      await putWithProgress(presign.uploadUrl, opts.file, opts.file.type || 'application/octet-stream', (p) => {
        setProgress(p);
        opts.onProgress?.(p);
      });

      const commit = await postJSON<CommitResponse>('/api/uploads/commit', {
        kind: opts.kind,
        key: presign.key,
        mime: opts.file.type || 'application/octet-stream',
        size: opts.file.size,
        originalName: opts.file.name,
        extras: opts.extras,
      });
      setProgress(100);
      // Avatar mudou → recarrega o usuário no store (reflete em topbar/sidebar imediatamente).
      if (opts.kind === 'avatar') {
        try {
          await useAuthStore.getState().refreshToken();
        } catch {
          /* noop */
        }
      }
      return commit;
    } finally {
      setPending(false);
    }
  }, []);

  return { upload, pending, progress };
}

export async function deleteUpload(id: string): Promise<void> {
  const res = await fetch(`/api/uploads/${id}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `${res.status}`);
  }
}
