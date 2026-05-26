'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { useToast } from '@shared/hooks/use-toast';
import type { MinhaObraTarefa } from '../types';
import { IconDataUsage, IconCheck } from '@shared/components/icons';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AtualizarProgressoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarefa: MinhaObraTarefa | null;
  obraId: string;
  onConfirmar: (progresso: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function postMedicao(body: {
  obraId: string;
  etapa: string;
  descricao?: string;
  percentual: number;
}): Promise<{ id: string }> {
  const res = await fetch('/api/empreiteiro/medicoes', {
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
      parsed && typeof parsed === 'object' && parsed && 'message' in parsed && typeof (parsed as { message?: string }).message === 'string'
        ? (parsed as { message: string }).message
        : `${res.status}: ${text || 'erro'}`;
    throw new Error(message);
  }
  return parsed as { id: string };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AtualizarProgressoModal({
  open,
  onOpenChange,
  tarefa,
  obraId,
  onConfirmar,
}: AtualizarProgressoModalProps) {
  const progressoAtual = tarefa?.progresso ?? 0;
  const [valor, setValor] = useState(progressoAtual);
  const { toast } = useToast();
  const qc = useQueryClient();

  // Sincroniza o slider quando o modal abre ou a tarefa alvo muda.
  // Não depende de onOpenChange(true) — em diálogos controlados,
  // o parent altera `open` direto e o callback nem sempre dispara.
  useEffect(() => {
    if (open) setValor(progressoAtual);
  }, [open, tarefa?.id, progressoAtual]);

  const handleClose = () => onOpenChange(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!tarefa) throw new Error('Tarefa não informada.');
      const delta = valor - progressoAtual;
      if (delta <= 0) return { skipped: true as const };
      const etapaRaw = tarefa.etapa && tarefa.etapa !== 'Sem etapa' ? tarefa.etapa : tarefa.titulo;
      const etapa = (etapaRaw ?? 'Etapa').slice(0, 120);
      await postMedicao({
        obraId,
        etapa,
        descricao: `Atualização de progresso da tarefa "${tarefa.titulo}" (${progressoAtual}% → ${valor}%).`,
        percentual: delta,
      });
      return { skipped: false as const };
    },
    onSuccess: (result) => {
      // Atualiza a tarefa (parent dispara useUpdateTarefa) em paralelo à medição.
      onConfirmar(valor);
      qc.invalidateQueries({ queryKey: ['empreiteiro', 'medicoes'] });
      qc.invalidateQueries({ queryKey: ['contratante', 'medicoes'] });
      qc.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras', obraId] });
      qc.invalidateQueries({ queryKey: ['contratante', 'minhas-obras', obraId] });
      qc.invalidateQueries({ queryKey: ['admin', 'obras', obraId] });
      qc.invalidateQueries({ queryKey: ['obras', obraId] });
      if (result.skipped) {
        toast({
          title: 'Progresso atualizado',
          description: 'Sem aumento de percentual — nenhuma medição nova foi enviada.',
        });
      } else {
        toast({
          title: 'Medição enviada para aprovação',
          description: 'O contratante já pode aprovar ou contestar.',
        });
      }
      handleClose();
    },
    onError: (err: unknown) => {
      toast({
        title: 'Não foi possível registrar a medição',
        description: err instanceof Error ? err.message : 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    },
  });

  const handleConfirmar = () => {
    if (!tarefa || mutation.isPending) return;
    mutation.mutate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !mutation.isPending) handleClose();
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
            <span className="text-5xl font-extrabold text-primary tabular-nums" data-testid="text-valor-progresso">
              {valor}%
            </span>
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-200"
                style={{ width: `${valor}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              Atual: <span className="font-semibold">{progressoAtual}%</span>
              {valor > progressoAtual && (
                <>
                  {' · '}
                  envia medição de{' '}
                  <span className="font-semibold text-primary">+{valor - progressoAtual}%</span> para aprovação
                </>
              )}
            </p>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={valor}
            onChange={(e) => setValor(Number(e.target.value))}
            disabled={mutation.isPending}
            className="w-full h-2 rounded-full accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            autoFocus
            data-testid="input-slider-progresso"
          />

          {/* Atalhos rápidos */}
          <div className="flex gap-2 flex-wrap justify-center">
            {[25, 50, 75, 100].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setValor(v)}
                disabled={mutation.isPending}
                className="px-3 py-1 rounded-full text-xs font-semibold border border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {v}%
              </button>
            ))}
          </div>
        </div>

        <DialogFooter className="p-6 pt-0 flex flex-row justify-end gap-3">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmar}
            disabled={mutation.isPending}
            data-testid="button-submit-progresso"
          >
            <IconCheck className="text-sm mr-1" />
            {mutation.isPending ? 'Enviando...' : 'Salvar progresso'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
