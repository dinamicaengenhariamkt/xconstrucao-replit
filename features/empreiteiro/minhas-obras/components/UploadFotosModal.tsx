'use client';

import { useRef, useState, useCallback } from 'react';
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
import { ScrollArea } from '@shared/components/ui/scroll-area';
import { cn } from '@shared/lib/utils';
import type { ObraFoto } from '../types';
import { IconAddAPhoto, IconClose, IconUploadFile } from '@shared/components/icons';

// ─── Types ────────────────────────────────────────────────────────────────────

type FaseOption = ObraFoto['fase'];

interface PreviewItem {
  id: string;
  objectUrl: string;
  tag: string;
  fase: FaseOption;
}

interface UploadFotosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: (fotos: Omit<ObraFoto, 'id'>[]) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FASES: { value: FaseOption; label: string; color: string }[] = [
  { value: undefined, label: '—', color: 'bg-gray-100 text-gray-500' },
  { value: 'antes', label: 'Antes', color: 'bg-gray-200 text-gray-700' },
  { value: 'durante', label: 'Durante', color: 'bg-amber-100 text-amber-700' },
  { value: 'agora', label: 'Agora', color: 'bg-success/10 text-success' },
];

function gerarId() {
  return `f${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadFotosModal({ open, onOpenChange, onConfirmar }: UploadFotosModalProps) {
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const novos: PreviewItem[] = Array.from(files).map((file) => ({
      id: gerarId(),
      objectUrl: URL.createObjectURL(file),
      tag: '',
      fase: undefined,
    }));
    setPreviews((prev) => [...prev, ...novos]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const remover = (id: string) => {
    setPreviews((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.objectUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const atualizarTag = (id: string, tag: string) => {
    setPreviews((prev) => prev.map((p) => (p.id === id ? { ...p, tag } : p)));
  };

  const atualizarFase = (id: string, fase: FaseOption) => {
    setPreviews((prev) => prev.map((p) => (p.id === id ? { ...p, fase } : p)));
  };

  const handleConfirmar = () => {
    const fotos: Omit<ObraFoto, 'id'>[] = previews.map((p) => ({
      url: p.objectUrl,
      data: 'Agora',
      tag: p.tag.trim() || undefined,
      fase: p.fase,
      enviadaAoContratante: false,
    }));
    onConfirmar(fotos);
    handleClose();
  };

  const handleClose = () => {
    previews.forEach((p) => URL.revokeObjectURL(p.objectUrl));
    setPreviews([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              <IconAddAPhoto className="text-primary text-xl" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                Upload de Fotos
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                Selecione as fotos e configure etiqueta e fase de cada uma
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-5">
            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer text-center"
            >
              <IconUploadFile className="text-gray-400 text-4xl mb-2 block" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Arraste fotos aqui ou clique para selecionar
              </p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — múltiplos arquivos</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {/* Previews */}
            {previews.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {previews.length} foto{previews.length !== 1 ? 's' : ''} selecionada{previews.length !== 1 ? 's' : ''}
                </p>
                {previews.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-200 dark:bg-gray-700">
                      <img
                        src={item.objectUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Controls */}
                    <div className="flex-1 flex flex-col gap-2">
                      {/* Tag */}
                      <Input
                        placeholder="Etiqueta (ex: Estrutura, Fundação...)"
                        value={item.tag}
                        onChange={(e) => atualizarTag(item.id, e.target.value)}
                        className="h-8 text-sm"
                      />

                      {/* Fase */}
                      <div className="flex gap-1.5 flex-wrap">
                        {FASES.map((f) => (
                          <button
                            key={String(f.value)}
                            type="button"
                            onClick={() => atualizarFase(item.id, f.value)}
                            className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border-2',
                              item.fase === f.value
                                ? `${f.color} border-current`
                                : 'border-transparent bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200'
                            )}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => remover(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer rounded self-start"
                      aria-label="Remover foto"
                    >
                      <IconClose className="text-lg" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0 flex flex-row justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmar}
            disabled={previews.length === 0}
          >
            <IconAddAPhoto className="text-sm mr-1" />
            Adicionar {previews.length > 0 ? `${previews.length} foto${previews.length !== 1 ? 's' : ''}` : 'fotos'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
