'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Skeleton } from '@shared/components/ui/skeleton';
import { cn } from '@shared/lib/utils';
import { useObraFotos } from '../hooks/use-obras-destaque';

/**
 * Modal de seleção da foto de capa do destaque (J25). Mostra as fotos que o
 * contratante já cadastrou na obra; o admin escolhe uma e ela fica "congelada"
 * como capa pública.
 */
export function SelecionarCapaModal({
  obraId,
  obraNome,
  open,
  onOpenChange,
  onConfirm,
  confirming,
}: {
  obraId: string | null;
  obraNome: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (fileId: string) => void;
  confirming?: boolean;
}) {
  const { data, isLoading } = useObraFotos(open ? obraId : null);
  const [selected, setSelected] = useState<string | null>(null);

  const fotos = (data?.rows ?? []).filter((f) => f.url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Escolher capa do destaque</DialogTitle>
          <DialogDescription>
            Selecione a foto de “{obraNome}” que aparecerá na home. A imagem fica fixa mesmo que o
            contratante altere as fotos da obra depois.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video w-full rounded-lg" />
            ))}
          </div>
        ) : fotos.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Esta obra ainda não tem fotos públicas cadastradas. Peça ao contratante para adicionar
            fotos antes de destacá-la.
          </p>
        ) : (
          <div className="grid max-h-[50vh] grid-cols-3 gap-3 overflow-y-auto p-1">
            {fotos.map((foto) => (
              <button
                key={foto.id}
                type="button"
                onClick={() => setSelected(foto.fileId)}
                className={cn(
                  'group relative aspect-video overflow-hidden rounded-lg border-2 transition-all',
                  selected === foto.fileId
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-transparent hover:border-slate-300',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!selected || confirming}
            onClick={() => selected && onConfirm(selected)}
          >
            {confirming ? 'Salvando…' : 'Destacar com esta capa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
