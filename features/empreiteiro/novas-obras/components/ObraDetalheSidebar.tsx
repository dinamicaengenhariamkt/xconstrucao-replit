'use client';

import { cn } from '@shared/lib/utils';
import { Button } from '@shared/components/ui/button';
import type { ObraDetalheSidebarProps } from '../types';

export function ObraDetalheSidebar({ obra, onApply, isApplying }: ObraDetalheSidebarProps) {
  const isApplied = obra.applicationStatus === 'aplicado';
  const isAccepted = obra.applicationStatus === 'aceito';

  return (
    <div className="flex flex-col gap-6 sticky top-28">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        {isApplied ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-success text-3xl">check_circle</span>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Candidatura Enviada</h3>
            <p className="text-sm text-gray-500">Sua candidatura foi enviada com sucesso. Aguarde o retorno do contratante.</p>
          </div>
        ) : isAccepted ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-success text-3xl">verified</span>
            </div>
            <h3 className="font-bold text-success mb-1">Candidatura Aceita!</h3>
            <p className="text-sm text-gray-500">Parabéns! Sua candidatura foi aceita pelo contratante.</p>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Interessado nesta obra?</h3>
            <p className="text-sm text-gray-500 mb-4">Candidate-se para participar do processo seletivo.</p>
            <Button onClick={onApply} disabled={isApplying} className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-xl" data-testid="button-apply">
              {isApplying ? 'Enviando...' : 'Candidatar-se a esta obra'}
            </Button>
          </>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Contratante</h4>
        <div className="flex items-center gap-3 mb-4">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold', obra.contratante.cor)}>
            {obra.contratante.iniciais}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{obra.contratante.nome}</p>
            <p className="text-xs text-gray-400">Contratante verificado</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-4">Informações</h4>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-500">Candidaturas</span>
            <span className="font-bold text-gray-900 dark:text-white">{obra.candidaturas}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-500">Prazo</span>
            <span className="font-bold text-gray-900 dark:text-white">{obra.prazo}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-500">Publicado</span>
            <span className="font-bold text-gray-900 dark:text-white">{obra.dataPublicacao}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-500">Tipo</span>
            <span className="font-bold text-gray-900 dark:text-white">{obra.tipo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
