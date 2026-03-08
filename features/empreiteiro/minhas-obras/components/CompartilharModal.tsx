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

  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      setUrl(window.location.href);
      setCopied(false);
    }
  }, [open]);

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
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
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
            <p className="text-xs font-semibold text-gray-500 mb-2">Link da obra</p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={url}
                className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 cursor-text"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                type="button"
                size="sm"
                variant={copied ? 'outline' : 'default'}
                onClick={handleCopiar}
                className="shrink-0"
              >
                {copied ? <IconCheck className="text-sm mr-1" /> : <IconContentCopy className="text-sm mr-1" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>

          {/* Compartilhar via */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3">Compartilhar via</p>
            <div className="flex gap-3">
              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all"
              >
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 2.122.549 4.116 1.51 5.853L.054 23.5a.5.5 0 00.609.61l5.76-1.502A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.664-.509-5.19-1.4l-.373-.213-3.87 1.01 1.03-3.763-.232-.385A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">WhatsApp</span>
              </a>

              {/* E-mail */}
              <a
                href={emailUrl}
                className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all"
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
                className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
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
