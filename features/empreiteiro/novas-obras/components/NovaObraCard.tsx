'use client';

import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import { COMPLEXIDADE_LABELS, COMPLEXIDADE_BADGE_CLASSES } from '../constants';
import type { NovaObraCardProps } from '../types';

export function NovaObraCard({ obra, isBlocked = false }: NovaObraCardProps) {

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="relative" data-testid={`nova-obra-card-${obra.id}`}>
      <Link href={isBlocked ? '#' : `/empreiteiro/novas-obras/${obra.id}`} className={cn(isBlocked && 'pointer-events-none')}>
        <div className={cn(
          'group bg-white dark:bg-gray-900 rounded-3xl overflow-hidden',
          'shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-gray-50 dark:border-gray-800',
          'transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]',
        )}>
          <div className="relative aspect-[16/9] overflow-hidden">
            <div
              className="w-full h-full bg-cover bg-center grayscale contrast-[1.1] group-hover:grayscale-0 group-hover:contrast-100 transition-[filter] duration-300"
              style={{ backgroundImage: `url('${obra.imagemUrl}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute top-4 left-4">
              <span className={cn(
                'inline-flex items-center font-bold rounded-full uppercase tracking-wider text-[10px] px-2.5 py-1 backdrop-blur-sm',
                COMPLEXIDADE_BADGE_CLASSES[obra.complexidade] || 'bg-gray-800/80 text-white'
              )}>
                {COMPLEXIDADE_LABELS[obra.complexidade] || obra.complexidade}
              </span>
            </div>
            {obra.destaque && (
              <div className="absolute top-4 right-4 flex items-center gap-1 bg-amber-400/90 text-amber-900 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-xs">star</span>
                Destaque
              </div>
            )}
          </div>

          <div className="p-6 flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{obra.tipo}</p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{obra.titulo}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm dark:text-gray-400">location_on</span>
                {obra.endereco}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Orcamento</p>
                <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(obra.orcamento)}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs">Prazo</p>
                <p className="font-semibold text-gray-700 dark:text-gray-300 text-xs">{obra.prazo}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">
              <div className="flex items-center gap-2">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold', obra.contratante.cor)}>
                  {obra.contratante.iniciais}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{obra.contratante.nome}</p>
                  <p className="text-[10px] text-gray-400">{obra.dataPublicacao}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <span className="material-symbols-outlined text-sm">group</span>
                <span className="text-xs font-semibold">{obra.candidaturas}</span>
              </div>
            </div>

            <span
              className={cn(
                'block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-colors',
                isBlocked
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              )}
              data-testid={`ver-detalhes-${obra.id}`}
            >
              Ver detalhes
            </span>
          </div>
        </div>
      </Link>

      {isBlocked && (
        <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-[2px] rounded-3xl flex items-center justify-center z-10">
          <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-gray-400">lock</span>
          </div>
        </div>
      )}
    </div>
  );
}
