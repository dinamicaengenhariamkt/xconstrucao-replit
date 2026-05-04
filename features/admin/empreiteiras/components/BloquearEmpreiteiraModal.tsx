'use client';

import { useState, useEffect } from 'react';
import {
  RiIndeterminateCircleLine,
  RiCheckboxCircleLine,
  RiAlertLine,
} from 'react-icons/ri';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Textarea } from '@shared/components/ui/textarea';
import { useBloquearEmpreiteira } from '../hooks/use-empreiteiras';
import type { AdminEmpreiteira } from '../types';

interface BloquearEmpreiteiraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreiteira: AdminEmpreiteira;
}

export function BloquearEmpreiteiraModal({
  open,
  onOpenChange,
  empreiteira,
}: BloquearEmpreiteiraModalProps) {
  const [erro, setErro] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const { mutateAsync, isPending } = useBloquearEmpreiteira();

  const isBloqueada = empreiteira.status === 'suspensa' || empreiteira.status === 'inativa';
  const novoStatus: AdminEmpreiteira['status'] = isBloqueada ? 'ativa' : 'suspensa';
  const motivoTrim = motivo.trim();
  // Bloqueio exige motivo (min 10 chars). Reativação aceita motivo vazio.
  const motivoValid = isBloqueada ? true : motivoTrim.length >= 10;

  useEffect(() => {
    if (open) {
      setMotivo('');
      setObservacoes('');
      setErro(null);
    }
  }, [open]);

  const handleClose = () => {
    setErro(null);
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    setErro(null);
    if (!motivoValid) {
      setErro('Informe um motivo com pelo menos 10 caracteres.');
      return;
    }
    try {
      await mutateAsync({
        id: empreiteira.id,
        novoStatus,
        motivo: motivoTrim || undefined,
        observacoes: observacoes.trim() || undefined,
      });
      handleClose();
    } catch {
      setErro('Erro ao atualizar o acesso da empreiteira. Tente novamente.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="w-full max-w-md p-0 flex flex-col gap-0 overflow-hidden"
        data-testid="modal-bloquear-empreiteira"
      >
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isBloqueada
                  ? 'bg-emerald-50 dark:bg-emerald-900/20'
                  : 'bg-red-50 dark:bg-red-900/20'
              }`}
            >
              {isBloqueada ? (
                <RiCheckboxCircleLine className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <RiIndeterminateCircleLine className="w-6 h-6 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {isBloqueada ? 'Reativar Empreiteira' : 'Bloquear Empreiteira'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                {isBloqueada
                  ? 'Restaurar acesso da empreiteira à plataforma'
                  : 'Suspender acesso da empreiteira à plataforma'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          <div
            className={`flex items-start gap-3 p-4 rounded-xl border ${
              isBloqueada
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}
          >
            <RiAlertLine
              className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                isBloqueada
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            />
            <div className="flex flex-col gap-1">
              <p
                className={`text-sm font-semibold ${
                  isBloqueada
                    ? 'text-emerald-800 dark:text-emerald-300'
                    : 'text-red-800 dark:text-red-300'
                }`}
              >
                {isBloqueada ? 'Confirmar reativação?' : 'Tem certeza que quer bloquear?'}
              </p>
              <p
                className={`text-sm ${
                  isBloqueada
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-red-700 dark:text-red-400'
                }`}
              >
                {isBloqueada
                  ? `A empreiteira ${empreiteira.razaoSocial} voltará a ter acesso completo à plataforma e poderá executar obras normalmente.`
                  : `A empreiteira ${empreiteira.razaoSocial} será suspensa e perderá o acesso à plataforma imediatamente.`}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="motivo-bloqueio-emp"
              className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
            >
              {isBloqueada
                ? 'Motivo da reativação (opcional)'
                : 'Motivo do bloqueio (mín. 10 caracteres)'}
            </label>
            <Textarea
              id="motivo-bloqueio-emp"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={
                isBloqueada
                  ? 'Ex: documentação regularizada e pendências resolvidas.'
                  : 'Ex: inadimplência recorrente e duas reclamações formais pendentes.'
              }
              rows={3}
              data-testid="textarea-motivo-bloqueio-empreiteira"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="obs-bloqueio-emp"
              className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
            >
              Observações internas (opcional)
            </label>
            <Textarea
              id="obs-bloqueio-emp"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Notas para o time de compliance — não compartilhadas com a empreiteira."
              rows={2}
              data-testid="textarea-obs-bloqueio-empreiteira"
            />
          </div>

          <p className="text-sm text-gray-500">
            Esta ação pode ser revertida a qualquer momento acessando os detalhes da empreiteira e
            clicando em {isBloqueada ? '"Bloquear Empreiteira"' : '"Reativar Empreiteira"'}. O
            histórico de bloqueios fica registrado e visível na ficha.
          </p>

          {erro && (
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{erro}</p>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0 flex flex-row justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isPending}
            data-testid="button-cancelar-bloquear-empreiteira"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || !motivoValid}
            className={
              isBloqueada
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50'
                : 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50'
            }
            data-testid="button-confirmar-bloquear-empreiteira"
          >
            {isBloqueada ? (
              <RiCheckboxCircleLine className="w-4 h-4 mr-2" />
            ) : (
              <RiIndeterminateCircleLine className="w-4 h-4 mr-2" />
            )}
            {isPending
              ? isBloqueada ? 'Reativando...' : 'Bloqueando...'
              : isBloqueada ? 'Sim, reativar' : 'Sim, bloquear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
