'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import type { MinhaObraTarefa } from '../types';
import { IconDataUsage, IconCheck } from '@shared/components/icons';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AtualizarProgressoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarefa: MinhaObraTarefa | null;
  onConfirmar: (progresso: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AtualizarProgressoModal({
  open,
  onOpenChange,
  tarefa,
  onConfirmar,
}: AtualizarProgressoModalProps) {
  const [valor, setValor] = useState(tarefa?.progresso ?? 0);

  // Sincroniza quando a tarefa muda
  const progresso = tarefa?.progresso ?? 0;

  const handleOpen = () => setValor(progresso);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleConfirmar = () => {
    onConfirmar(valor);
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (isOpen) handleOpen();
        else handleClose();
      }}
    >
      <DialogContent className="w-full max-w-sm p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              <IconDataUsage className="text-primary text-xl" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                Atualizar progresso
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                {tarefa?.titulo}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 flex flex-col gap-6">
          {/* Valor central em destaque */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-5xl font-extrabold text-primary tabular-nums">
              {valor}%
            </span>
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-200"
                style={{ width: `${valor}%` }}
              />
            </div>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={valor}
            onChange={(e) => setValor(Number(e.target.value))}
            className="w-full h-2 rounded-full accent-primary cursor-pointer"
            autoFocus
          />

          {/* Atalhos rápidos */}
          <div className="flex gap-2 flex-wrap justify-center">
            {[25, 50, 75, 100].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setValor(v)}
                className="px-3 py-1 rounded-full text-xs font-semibold border border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                {v}%
              </button>
            ))}
          </div>
        </div>

        <DialogFooter className="p-6 pt-0 flex flex-row justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirmar}>
            <IconCheck className="text-sm mr-1" />
            Salvar progresso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
