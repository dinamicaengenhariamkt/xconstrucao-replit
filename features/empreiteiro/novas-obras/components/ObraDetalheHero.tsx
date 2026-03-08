'use client';

import type { ObraDetalheHeroProps } from '../types';
import { COMPLEXIDADE_LABELS } from '../constants';
import { formatCurrencyRounded as formatCurrency } from '@shared/lib/formatters';
import { IconLocationOn, IconHome, IconSquareFoot, IconWorkspacePremium, IconCalendarMonth, IconSchedule, IconPayments, IconSignalCellularAlt } from '@shared/components/icons';

export function ObraDetalheHero({ obra }: ObraDetalheHeroProps) {

  const complexidadeColors: Record<string, string> = {
    baixa: 'text-success',
    media: 'text-amber-600',
    alta: 'text-red-600',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm" data-testid="obra-detalhe-hero">
      <div className="aspect-[16/7] relative overflow-hidden">
        <img className="w-full h-full object-cover" src={obra.imagemUrl} alt={obra.titulo} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 text-white rounded-full text-[11px] font-bold uppercase tracking-wider mb-4 shadow-lg" data-testid="badge-disponivel">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Disponível
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3" data-testid="text-obra-titulo">{obra.titulo}</h1>
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <IconLocationOn className="text-lg" />
                <span data-testid="text-obra-endereco">{obra.endereco}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2 text-white/90">
                <IconHome className="text-lg" />
                <div>
                  <p className="text-white/60 text-xs">Tipo</p>
                  <p className="font-bold">{obra.tipoObra}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <IconSquareFoot className="text-lg" />
                <div>
                  <p className="text-white/60 text-xs">Área</p>
                  <p className="font-bold">{obra.areaTotal}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <IconWorkspacePremium className="text-lg" />
                <div>
                  <p className="text-white/60 text-xs">Acabamento</p>
                  <p className="font-bold">{obra.complexidade === 'alta' ? 'Alto Padrão' : obra.complexidade === 'media' ? 'Médio Padrão' : 'Padrão'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gray-50/80 dark:bg-gray-800/50 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <IconCalendarMonth className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Início Previsto</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{obra.inicioPrevisto ?? 'A definir'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <IconSchedule className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Duração</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{obra.prazo}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <IconPayments className="text-success" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Orçamento</p>
            <p className="text-sm font-bold text-success">{formatCurrency(obra.orcamento)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
            <IconSignalCellularAlt className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Complexidade</p>
            <p className={`text-sm font-bold ${complexidadeColors[obra.complexidade] || 'text-gray-900'}`}>
              {COMPLEXIDADE_LABELS[obra.complexidade] || obra.complexidade}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
