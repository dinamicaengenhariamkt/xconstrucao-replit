'use client';

import { useState } from 'react';
import { cn } from '@shared/lib/utils';

export type TimelineTipo = 'progresso' | 'tarefa' | 'documento' | 'problema' | 'nota';

export interface TimelineItem {
  id: string;
  tipo: TimelineTipo;
  titulo: string;
  descricao: string;
  autor: string;
  data: string;
}

interface TimelineDisplayProps {
  events: TimelineItem[];
  title?: string;
  subtitle?: string;
}

type TimelineFilter = 'todos' | TimelineTipo;

const TIPO_CONFIG: Record<TimelineTipo, {
  label: string;
  dotClass: string;
  badgeBg: string;
  badgeText: string;
  icon: string;
}> = {
  progresso: {
    label: 'Progresso',
    dotClass: 'bg-green-500',
    badgeBg: 'bg-green-100 dark:bg-green-900/30',
    badgeText: 'text-green-700 dark:text-green-400',
    icon: 'trending_up',
  },
  tarefa: {
    label: 'Tarefa',
    dotClass: 'bg-blue-500',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/30',
    badgeText: 'text-blue-700 dark:text-blue-400',
    icon: 'check_circle',
  },
  documento: {
    label: 'Documento',
    dotClass: 'bg-purple-500',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/30',
    badgeText: 'text-purple-700 dark:text-purple-400',
    icon: 'description',
  },
  problema: {
    label: 'Problema',
    dotClass: 'bg-amber-500',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
    badgeText: 'text-amber-700 dark:text-amber-400',
    icon: 'warning',
  },
  nota: {
    label: 'Nota',
    dotClass: 'bg-gray-400',
    badgeBg: 'bg-gray-100 dark:bg-gray-700',
    badgeText: 'text-gray-600 dark:text-gray-400',
    icon: 'sticky_note_2',
  },
};

const FILTER_OPTIONS: { key: TimelineFilter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'progresso', label: 'Progresso' },
  { key: 'tarefa', label: 'Tarefas' },
  { key: 'problema', label: 'Problemas' },
  { key: 'documento', label: 'Documentos' },
];

export function TimelineDisplay({ events, title = 'Timeline', subtitle }: TimelineDisplayProps) {
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>('todos');

  const filtered = activeFilter === 'todos'
    ? events
    : events.filter((e) => e.tipo === activeFilter);

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_OPTIONS.map((opt) => {
          const count = opt.key === 'todos'
            ? events.length
            : events.filter((e) => e.tipo === opt.key).length;
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

      {/* Timeline list */}
      {filtered.length === 0 ? (
        <div className="text-center py-14">
          <span className="material-symbols-outlined text-4xl text-gray-200 dark:text-gray-700">timeline</span>
          <p className="text-sm font-semibold text-gray-500 mt-3">Nenhuma atualização encontrada</p>
          <p className="text-xs text-gray-400 mt-1">Sem eventos para o filtro selecionado.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-gray-100 dark:bg-gray-800" />
          <div className="space-y-1">
            {filtered.map((event) => {
              const config = TIPO_CONFIG[event.tipo];
              const isProblema = event.tipo === 'problema';
              return (
                <div key={event.id} className="flex gap-4">
                  <div className="relative flex-shrink-0 mt-3">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center z-10 relative', `${config.dotClass}/20`)}>
                      <div className={cn('w-3 h-3 rounded-full', config.dotClass)} />
                    </div>
                  </div>
                  <div className={cn(
                    'flex-1 rounded-xl p-4 mb-2 border',
                    isProblema
                      ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40'
                      : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                  )}>
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
                          config.badgeBg,
                          config.badgeText
                        )}>
                          <span className="material-symbols-outlined text-[12px]">{config.icon}</span>
                          {config.label}
                        </span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {event.titulo}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{event.data}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{event.descricao}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">person</span>
                      {event.autor}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
