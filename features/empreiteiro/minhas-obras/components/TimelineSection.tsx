'use client';

import { useState, useMemo } from 'react';
import { cn } from '@shared/lib/utils';
import type { TimelineEvent } from '../types';

type TimelineFilter = 'todos' | 'progresso' | 'tarefa' | 'problema';

const FILTER_LABELS: Record<TimelineFilter, string> = {
  todos: 'Todos',
  progresso: 'Progresso',
  tarefa: 'Tarefas',
  problema: 'Problemas',
};

const EVENT_CONFIG: Record<TimelineEvent['tipo'], {
  icon: string;
  bgDot: string;
  badgeLabel: string;
  badgeClasses: string;
}> = {
  progresso: {
    icon: 'trending_up',
    bgDot: 'bg-success',
    badgeLabel: 'Progresso',
    badgeClasses: 'text-success bg-success/10',
  },
  tarefa: {
    icon: 'task_alt',
    bgDot: 'bg-purple-500',
    badgeLabel: 'Tarefa',
    badgeClasses: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30',
  },
  documento: {
    icon: 'description',
    bgDot: 'bg-blue-500',
    badgeLabel: 'Documento',
    badgeClasses: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
  },
  problema: {
    icon: 'warning',
    bgDot: 'bg-amber-500',
    badgeLabel: 'Problema',
    badgeClasses: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  },
  nota: {
    icon: 'sticky_note_2',
    bgDot: 'bg-primary',
    badgeLabel: 'Nota',
    badgeClasses: 'text-primary bg-primary/10',
  },
};

interface TimelineEventRowProps {
  event: TimelineEvent;
  isLast: boolean;
}

function TimelineEventRow({ event, isLast }: TimelineEventRowProps) {
  const config = EVENT_CONFIG[event.tipo];
  const isProblema = event.tipo === 'problema';

  return (
    <div className={cn('relative flex gap-6', !isLast && 'pb-8')}>
      <div className={cn('relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white', config.bgDot)}>
        <span className="material-symbols-outlined text-sm">{config.icon}</span>
      </div>
      <div
        className={cn(
          'flex-1 pt-1',
          isProblema && 'bg-amber-50 dark:bg-amber-900/10 -ml-3 pl-6 pr-4 py-3 rounded-lg border-l-4 border-amber-500'
        )}
      >
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h4 className="font-bold text-gray-900 dark:text-white text-sm">{event.titulo}</h4>
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider', config.badgeClasses)}>
            {config.badgeLabel}
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-1">{event.descricao}</p>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>{event.data}</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">person</span>
            {event.autor}
          </span>
        </div>
      </div>
    </div>
  );
}

interface TimelineSectionProps {
  events: TimelineEvent[];
}

export function TimelineSection({ events }: TimelineSectionProps) {
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>('todos');

  const filters: TimelineFilter[] = ['todos', 'progresso', 'tarefa', 'problema'];

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'todos') return events;
    return events.filter((e) => e.tipo === activeFilter);
  }, [events, activeFilter]);

  return (
    <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Timeline Operacional</h3>
          <p className="text-sm text-gray-500">Histórico completo de atividades</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                activeFilter === filter
                  ? 'text-primary bg-primary/10 font-bold'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {FILTER_LABELS[filter]}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
        <div>
          {filteredEvents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 pl-12">Nenhum evento encontrado</p>
          ) : (
            filteredEvents.map((event, index) => (
              <TimelineEventRow
                key={event.id}
                event={event}
                isLast={index === filteredEvents.length - 1}
              />
            ))
          )}
        </div>
      </div>

      <button className="w-full mt-6 py-3 text-sm font-bold text-primary hover:bg-primary/5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer">
        <span className="material-symbols-outlined text-lg">expand_more</span>
        Carregar mais eventos
      </button>
    </div>
  );
}
