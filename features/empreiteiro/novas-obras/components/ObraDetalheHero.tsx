'use client';

import { StatusBadge } from '@features/shared/components/StatusBadge';
import type { ObraDetalheHeroProps } from '../types';
import { COMPLEXIDADE_LABELS, COMPLEXIDADE_BADGE_VARIANTS } from '../constants';

export function ObraDetalheHero({ obra }: ObraDetalheHeroProps) {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="aspect-[16/7] relative overflow-hidden">
        <img className="w-full h-full object-cover" src={obra.imagemUrl} alt={obra.titulo} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <StatusBadge label="Disponível" variant="cyan" size="md" />
                <StatusBadge label={COMPLEXIDADE_LABELS[obra.complexidade] || obra.complexidade} variant={(COMPLEXIDADE_BADGE_VARIANTS[obra.complexidade] || 'neutral') as 'success' | 'warning' | 'error'} size="md" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{obra.titulo}</h1>
              <div className="flex items-center gap-4 mt-2 text-white/80 text-sm flex-wrap">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span>{obra.endereco}</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-right">
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wider">Orçamento</p>
                <p className="text-2xl font-extrabold">{formatCurrency(obra.orcamento)}</p>
              </div>
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wider">Prazo</p>
                <p className="text-xl font-bold">{obra.prazo}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
