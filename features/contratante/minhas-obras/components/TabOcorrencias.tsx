'use client';

import { useState } from 'react';
import { cn } from '@shared/lib/utils';
import type { ObraContratanteDetalhe, OcorrenciaContratante } from '../types';

interface TabOcorrenciasProps {
  obra: ObraContratanteDetalhe;
}

type GravidadeFilter = 'todos' | OcorrenciaContratante['gravidade'] | 'resolvida';

const GRAVIDADE_CONFIG: Record<OcorrenciaContratante['gravidade'], {
  label: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
  icon: string;
}> = {
  critico: {
    label: 'Crítico',
    badgeBg: 'bg-red-100 dark:bg-red-900/30',
    badgeText: 'text-red-700 dark:text-red-400',
    borderClass: 'border-l-4 border-l-red-400 border-red-100 dark:border-red-800/40',
    icon: 'emergency',
  },
  medio: {
    label: 'Médio',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
    badgeText: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-l-4 border-l-amber-400 border-amber-100 dark:border-amber-800/40',
    icon: 'warning',
  },
  baixo: {
    label: 'Baixo',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/30',
    badgeText: 'text-blue-700 dark:text-blue-400',
    borderClass: 'border-l-4 border-l-blue-400 border-blue-100 dark:border-blue-800/40',
    icon: 'info',
  },
};

const FILTER_OPTIONS: { key: GravidadeFilter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'critico', label: 'Crítico' },
  { key: 'medio', label: 'Médio' },
  { key: 'baixo', label: 'Baixo' },
  { key: 'resolvida', label: 'Resolvidos' },
];

export function TabOcorrencias({ obra }: TabOcorrenciasProps) {
  const [activeFilter, setActiveFilter] = useState<GravidadeFilter>('todos');

  const ocorrencias = obra.ocorrencias ?? [];

  const total = ocorrencias.length;
  const abertas = ocorrencias.filter((o) => o.status === 'aberta').length;
  const criticas = ocorrencias.filter((o) => o.gravidade === 'critico' && o.status === 'aberta').length;
  const resolvidas = ocorrencias.filter((o) => o.status === 'resolvida').length;

  const filtered = activeFilter === 'todos'
    ? ocorrencias
    : activeFilter === 'resolvida'
    ? ocorrencias.filter((o) => o.status === 'resolvida')
    : ocorrencias.filter((o) => o.gravidade === activeFilter && o.status === 'aberta');

  return (
    <div data-testid="tab-content-ocorrencias">
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Ocorrências da Obra</h3>
        <p className="text-sm text-gray-500">Problemas e intercorrências registrados pelo empreiteiro</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total</p>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{total}</p>
          <p className="text-xs text-gray-400">ocorrências</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Abertas</p>
          <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">{abertas}</p>
          <p className="text-xs text-amber-500">em aberto</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
          <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Críticas</p>
          <p className="text-2xl font-extrabold text-red-700 dark:text-red-400 mt-1">{criticas}</p>
          <p className="text-xs text-red-500">requerem atenção</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
          <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Resolvidas</p>
          <p className="text-2xl font-extrabold text-green-700 dark:text-green-400 mt-1">{resolvidas}</p>
          <p className="text-xs text-green-500">concluídas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTER_OPTIONS.map((opt) => {
          const count = opt.key === 'todos'
            ? total
            : opt.key === 'resolvida'
            ? resolvidas
            : ocorrencias.filter((o) => o.gravidade === opt.key && o.status === 'aberta').length;
          return (
            <button
              key={opt.key}
              onClick={() => setActiveFilter(opt.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer',
                activeFilter === opt.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              {opt.label}
              <span className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                activeFilter === opt.key ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Ocorrências list */}
      {filtered.length === 0 ? (
        <div className="text-center py-14">
          <span className="material-symbols-outlined text-4xl text-gray-200 dark:text-gray-700">check_circle</span>
          <p className="text-sm font-semibold text-gray-500 mt-3">Nenhuma ocorrência encontrada</p>
          <p className="text-xs text-gray-400 mt-1">Sem problemas para o filtro selecionado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((oc) => {
            const config = GRAVIDADE_CONFIG[oc.gravidade];
            const isResolvida = oc.status === 'resolvida';

            return (
              <div
                key={oc.id}
                className={cn(
                  'rounded-xl border p-4',
                  isResolvida
                    ? 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 opacity-70'
                    : `bg-white dark:bg-gray-900 ${config.borderClass}`
                )}
              >
                <div className="flex gap-4">
                  {/* Photo thumbnail */}
                  {oc.fotoUrl && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <img src={oc.fotoUrl} alt="Foto da ocorrência" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {!isResolvida && (
                        <span className={cn(
                          'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
                          config.badgeBg,
                          config.badgeText
                        )}>
                          <span className="material-symbols-outlined text-[12px]">{config.icon}</span>
                          {config.label}
                        </span>
                      )}
                      {isResolvida && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          <span className="material-symbols-outlined text-[12px]">check_circle</span>
                          Resolvida
                        </span>
                      )}
                      <h4 className={cn(
                        'text-sm font-semibold text-gray-800 dark:text-gray-200',
                        isResolvida && 'line-through text-gray-400 dark:text-gray-500'
                      )}>
                        {oc.titulo}
                      </h4>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{oc.descricao}</p>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">person</span>
                        {oc.responsavel}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                        Aberta em {oc.dataAbertura}
                      </span>
                      {isResolvida && oc.dataResolucao && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <span className="material-symbols-outlined text-[12px]">task_alt</span>
                          Resolvida em {oc.dataResolucao}
                          {oc.resolvidoPor && ` por ${oc.resolvidoPor}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
