'use client';

import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import { ProgressBar } from '@features/shared/components/ProgressBar';
import type { BlockedBannerProps } from '../types';

export function BlockedBanner({ perfilStatus }: BlockedBannerProps) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 flex flex-col gap-5" data-testid="blocked-banner">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-red-600 dark:text-red-400">lock</span>
        </div>
        <div>
          <h3 className="text-base font-bold text-red-700 dark:text-red-400">
            {perfilStatus.motivoBloqueio || 'Voce nao pode se candidatar a novas obras no momento.'}
          </h3>
          <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
            Resolva as pendencias abaixo para poder se candidatar a novas obras.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {perfilStatus.pendencias.map((pendencia) => (
          <div key={pendencia.id} className="flex items-center gap-3" data-testid={`pendencia-${pendencia.id}`}>
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
              pendencia.resolvido
                ? 'bg-green-100 dark:bg-green-900/40'
                : 'bg-red-100 dark:bg-red-900/40'
            )}>
              <span className={cn(
                'material-symbols-outlined text-sm',
                pendencia.resolvido
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}>
                {pendencia.resolvido ? 'check' : 'close'}
              </span>
            </div>
            <div>
              <p className={cn(
                'text-sm font-semibold',
                pendencia.resolvido
                  ? 'text-gray-500 dark:text-gray-400 line-through'
                  : 'text-gray-700 dark:text-gray-300'
              )}>
                {pendencia.titulo}
              </p>
              <p className="text-xs text-gray-400">{pendencia.descricao}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-gray-500">Perfil completo</span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{perfilStatus.completionPercentage}%</span>
        </div>
        <ProgressBar value={perfilStatus.completionPercentage} color={perfilStatus.completionPercentage >= 80 ? 'success' : 'error'} size="md" />
      </div>

      <Link
        href="/empreiteiro/perfil"
        className="self-start px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
        data-testid="button-regularizar-situacao"
      >
        Regularizar Situacao
      </Link>
    </div>
  );
}
