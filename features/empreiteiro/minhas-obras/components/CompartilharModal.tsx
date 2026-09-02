'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { useToast } from '@shared/hooks/use-toast';
import type { MinhaObraDetalhe } from '../types';
import { IconShare, IconCheck, IconContentCopy, IconMail, IconLink } from '@shared/components/icons';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CompartilharModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obra: MinhaObraDetalhe;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CompartilharModal({
  open,
  onOpenChange,
  obra,
}: CompartilharModalProps) {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setCopied(false);
    setLoading(true);
    fetch(`/api/xgestao/obras/${obra.id}/share`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Não foi possível consultar o link.');
        return res.json() as Promise<{ share: { path: string } | null }>;
      })
      .then((payload) => {
        if (active) setUrl(payload.share ? new URL(payload.share.path, window.location.origin).toString() : '');
      })
      .catch(() => {
        if (active) {
          setUrl('');
          toast({ title: 'Erro ao consultar link', description: 'Tente novamente em instantes.', variant: 'destructive' });
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, obra.id, toast]);

  const handleGerar = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/xgestao/obras/${obra.id}/share`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const payload = await res.json() as { share: { path: string } };
      setUrl(new URL(payload.share.path, window.location.origin).toString());
      setCopied(false);
      toast({ title: 'Link público gerado', description: 'Envie este link para acompanhar a obra sem login.' });
    } catch {
      toast({ title: 'Erro ao gerar link', description: 'Não foi possível criar o link agora.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevogar = async () => {
    setRevoking(true);
    try {
      const res = await fetch(`/api/xgestao/obras/${obra.id}/share`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setUrl('');
      toast({ title: 'Link revogado', description: 'Quem tiver o link não conseguirá mais abrir esta obra.' });
    } catch {
      toast({ title: 'Erro ao revogar link', description: 'Não foi possível revogar o link agora.', variant: 'destructive' });
    } finally {
      setRevoking(false);
    }
  };

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: 'Link copiado!', description: 'URL copiada para a área de transferência.' });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível copiar o link.', variant: 'destructive' });
    }
  };

  const mensagem = `Acompanhe o andamento da obra "${obra.titulo}": ${url}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(`Obra: ${obra.titulo}`)}&body=${encodeURIComponent(mensagem)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconShare className="text-primary text-xl" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Compartilhar link
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {obra.titulo}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* URL + Copiar */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Link público da obra</p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={url}
                placeholder={loading ? 'Consultando link…' : 'Gere um link para compartilhar'}
                className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 cursor-text"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                type="button"
                size="sm"
                variant={copied ? 'outline' : 'default'}
                onClick={handleCopiar}
                disabled={!url || loading}
                className="shrink-0"
              >
                {copied ? <IconCheck className="text-sm mr-1" /> : <IconContentCopy className="text-sm mr-1" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <Button type="button" size="sm" variant="outline" onClick={handleGerar} disabled={loading}>
                {url ? 'Gerar novo link' : 'Gerar link'}
              </Button>
              {url && (
                <Button type="button" size="sm" variant="ghost" onClick={handleRevogar} disabled={revoking || loading} className="text-destructive hover:text-destructive">
                  {revoking ? 'Revogando…' : 'Revogar'}
                </Button>
              )}
            </div>
          </div>

          {/* Compartilhar via */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3">Compartilhar via</p>
            <div className="flex gap-3">
              {/* E-mail */}
              <a
                href={url ? emailUrl : undefined}
                aria-disabled={!url}
                className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all aria-disabled:pointer-events-none aria-disabled:opacity-50"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <IconMail className="text-white text-xl" />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">E-mail</span>
              </a>

              {/* Copiar direto */}
              <button
                type="button"
                onClick={handleCopiar}
                disabled={!url || loading}
                className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50"
              >
                <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                  <IconLink className="text-white text-xl" />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Copiar link</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-5 pt-0 flex flex-row justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
