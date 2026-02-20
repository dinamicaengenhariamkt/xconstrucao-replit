'use client';

import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import type { ObraDetalheSidebarProps } from '../types';

export function ObraDetalheSidebar({ obra, onApply, isApplying }: ObraDetalheSidebarProps) {
  const isApplied = obra.applicationStatus === 'aplicado';
  const isAccepted = obra.applicationStatus === 'aceito';

  return (
    <div className="flex flex-col gap-6 sticky top-28">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6" data-testid="sidebar-application">
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
            <p className="text-sm text-gray-500 mb-4">Envie sua proposta com valores, prazos e detalhes técnicos.</p>
            <Link
              href={`/empreiteiro/novas-obras/${obra.id}/aplicar`}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-xl py-3 px-4 text-sm text-center block transition-colors"
              data-testid="button-apply"
            >
              Candidatar-se a esta obra
            </Link>
          </>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6" data-testid="sidebar-contratante">
        <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Contratante</h4>
        <div className="flex items-center gap-3 mb-4">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold', obra.contratante.cor)}>
            {obra.contratante.iniciais}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm" data-testid="text-contratante-nome">{obra.contratante.nome}</p>
            <p className="text-xs text-gray-400">Contratante verificado</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6" data-testid="sidebar-info">
        <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-4">Informações</h4>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-500">Candidaturas</span>
            <span className="font-bold text-gray-900 dark:text-white" data-testid="text-candidaturas">{obra.candidaturas}</span>
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
