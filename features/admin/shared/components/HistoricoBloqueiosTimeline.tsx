'use client';

import { cn } from '@shared/lib/utils';
import { RiLockLine, RiLockUnlockLine } from 'react-icons/ri';
import type { HistoricoBloqueio } from '../types/historico-bloqueio';

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

interface HistoricoBloqueiosTimelineProps {
  historico?: HistoricoBloqueio[];
  emptyMessage?: string;
}

export function HistoricoBloqueiosTimeline({
  historico = [],
  emptyMessage = 'Nenhum bloqueio registrado.',
}: HistoricoBloqueiosTimelineProps) {
  if (historico.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  // Mais recentes primeiro.
  const ordered = [...historico].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <ol className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-3 space-y-5">
      {ordered.map((item) => {
        const isBloqueio = item.tipo === 'bloqueio';
        const Icon = isBloqueio ? RiLockLine : RiLockUnlockLine;
        return (
          <li
            key={item.id}
            className="ml-6 relative"
            data-testid={`historico-bloqueio-${item.id}`}
          >
            <span
              className={cn(
                'absolute -left-[34px] flex items-center justify-center w-7 h-7 rounded-full ring-4 ring-white dark:ring-gray-900',
                isBloqueio
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
              )}
            >
              <Icon className="w-3.5 h-3.5" />
            </span>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h4
                  className={cn(
                    'text-sm font-bold',
                    isBloqueio
                      ? 'text-red-700 dark:text-red-400'
                      : 'text-green-700 dark:text-green-400',
                  )}
                >
                  {isBloqueio ? 'Conta bloqueada' : 'Conta desbloqueada'}
                </h4>
                <span className="text-[11px] font-semibold text-gray-400 tabular-nums">
                  {formatDateBR(item.data)}
                </span>
              </div>
              {item.motivo && (
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong className="text-gray-500 dark:text-gray-400 font-semibold">
                    Motivo:
                  </strong>{' '}
                  {item.motivo}
                </p>
              )}
              {item.observacoes && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  {item.observacoes}
                </p>
              )}
              <p className="text-[11px] text-gray-400">
                Responsável: <span className="font-semibold">{item.responsavel}</span>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
