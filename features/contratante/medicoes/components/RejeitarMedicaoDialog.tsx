'use client';

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/components/ui/alert-dialog';
import { Textarea } from '@shared/components/ui/textarea';
import type { MedicaoContratante } from '../types';

interface RejeitarMedicaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicao: MedicaoContratante | null;
  onConfirmar: (motivo: string) => void;
}

export function RejeitarMedicaoDialog({
  open,
  onOpenChange,
  medicao,
  onConfirmar,
}: RejeitarMedicaoDialogProps) {
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    if (open) setMotivo('');
  }, [open]);

  const motivoTrim = motivo.trim();
  const isValid = motivoTrim.length >= 10;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rejeitar medição #{medicao?.numero}?</AlertDialogTitle>
          <AlertDialogDescription>
            Você está prestes a rejeitar a medição de{' '}
            <strong className="text-gray-900 dark:text-white">{medicao?.obraNome}</strong>.
            Descreva o motivo — o empreiteiro receberá esse retorno e poderá enviar uma nova
            medição.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-2 flex flex-col gap-2">
          <label
            htmlFor="motivo-rejeicao"
            className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
          >
            Motivo da rejeição (mín. 10 caracteres)
          </label>
          <Textarea
            id="motivo-rejeicao"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: quantitativos divergentes do projeto estrutural; favor revisar e reenviar."
            rows={4}
            data-testid="textarea-motivo-rejeicao"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel data-testid="btn-cancelar-rejeicao">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={!isValid}
            onClick={(e) => {
              if (!isValid) {
                e.preventDefault();
                return;
              }
              onConfirmar(motivoTrim);
            }}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="btn-confirmar-rejeicao"
          >
            Confirmar rejeição
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
