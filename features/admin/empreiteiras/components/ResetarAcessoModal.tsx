'use client';

import { useState } from 'react';
import { RiLockPasswordLine, RiMailSendLine, RiCheckLine } from 'react-icons/ri';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { useResetarAcessoEmpreiteira } from '../hooks/use-empreiteiras';

interface ResetarAcessoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreiteiraId: string;
  nomeEmpreiteira: string;
  emailEmpreiteira: string;
}

export function ResetarAcessoModal({
  open,
  onOpenChange,
  empreiteiraId,
  nomeEmpreiteira,
  emailEmpreiteira,
}: ResetarAcessoModalProps) {
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { mutateAsync, isPending } = useResetarAcessoEmpreiteira();

  const handleClose = () => {
    setEnviado(false);
    setErro(null);
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    setErro(null);
    try {
      await mutateAsync(empreiteiraId);
      setEnviado(true);
    } catch {
      setErro('Erro ao enviar o e-mail de redefinição. Tente novamente.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="w-full max-w-md p-0 flex flex-col gap-0 overflow-hidden"
        data-testid="modal-resetar-acesso"
      >
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <RiLockPasswordLine className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Resetar Acesso
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                Envio de link para redefinição de credenciais
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-6">
          {enviado ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <RiCheckLine className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-white">E-mail enviado!</p>
                <p className="text-sm text-gray-500 mt-1">
                  O link de redefinição de acesso foi enviado para{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{emailEmpreiteira}</span>.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Será enviado um link de redefinição de acesso para o e-mail cadastrado de{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{nomeEmpreiteira}</span>:
              </p>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <RiMailSendLine className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {emailEmpreiteira}
                </span>
              </div>

              <p className="text-xs text-gray-400">
                O link expira em 24 horas. A empreiteira precisará acessar o e-mail para criar novas credenciais de acesso.
              </p>

              {erro && (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{erro}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0 flex flex-row justify-end gap-3">
          {enviado ? (
            <Button onClick={handleClose} data-testid="button-fechar-resetar-acesso">
              Fechar
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isPending}
                data-testid="button-cancelar-resetar-acesso"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isPending}
                className="bg-amber-500 hover:bg-amber-600 text-white"
                data-testid="button-confirmar-resetar-acesso"
              >
                <RiMailSendLine className="w-4 h-4 mr-2" />
                {isPending ? 'Enviando...' : 'Enviar link de redefinição'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
