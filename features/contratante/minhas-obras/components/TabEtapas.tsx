'use client';

import { useState } from 'react';
import { cn } from '@shared/lib/utils';
import { ProgressBar } from '@features/shared/components/ProgressBar';
import {
  RiUserLine,
  RiCalendarLine,
  RiAlertLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiLoader4Line,
  RiLock2Line,
} from 'react-icons/ri';
import type { ObraContratanteDetalhe, ProgressColor, TarefaContratante } from '../types';

interface TabEtapasProps {
  obra: ObraContratanteDetalhe;
  progressColor: ProgressColor;
}

type StatusFilter = 'todos' | 'em_andamento' | 'bloqueado' | 'pendente' | 'concluido';

const STATUS_LABELS: Record<TarefaContratante['status'], string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  bloqueado: 'Bloqueado',
  concluido: 'Concluído',
};

const STATUS_BADGE_CLASSES: Record<TarefaContratante['status'], string> = {
  pendente: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  em_andamento: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  bloqueado: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  concluido: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
};

const STATUS_ICON: Record<TarefaContratante['status'], React.ElementType> = {
  pendente: RiTimeLine,
  em_andamento: RiLoader4Line,
  bloqueado: RiLock2Line,
  concluido: RiCheckboxCircleLine,
};

const PRIORIDADE_BADGE: Record<TarefaContratante['prioridade'], string> = {
  alta: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  media: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  baixa: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

const PRIORIDADE_LABELS: Record<TarefaContratante['prioridade'], string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

const FILTER_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: 'todos', label: 'Todas' },
  { key: 'em_andamento', label: 'Em Andamento' },
  { key: 'bloqueado', label: 'Bloqueadas' },
  { key: 'pendente', label: 'Pendentes' },
  { key: 'concluido', label: 'Concluídas' },
];

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function TabEtapas({ obra, progressColor }: TabEtapasProps) {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('todos');

  const tarefas = obra.tarefas ?? [];

  const totalTarefas = tarefas.length;
  const concluidas = tarefas.filter((t) => t.status === 'concluido').length;
  const emAndamento = tarefas.filter((t) => t.status === 'em_andamento').length;
  const bloqueadas = tarefas.filter((t) => t.status === 'bloqueado').length;

  const filteredTarefas = activeFilter === 'todos'
    ? tarefas
    : tarefas.filter((t) => t.status === activeFilter);

  return (
    <div className="space-y-6" data-testid="tab-content-etapas">

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total</span>
          <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{totalTarefas}</span>
          <span className="text-xs text-gray-400">tarefas</span>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Concluídas</span>
          <span className="text-2xl font-extrabold text-green-700 dark:text-green-400">{concluidas}</span>
          <span className="text-xs text-green-500">{totalTarefas > 0 ? Math.round((concluidas / totalTarefas) * 100) : 0}% do total</span>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Em Andamento</span>
          <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">{emAndamento}</span>
          <span className="text-xs text-blue-500">em execução</span>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Bloqueadas</span>
          <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-400">{bloqueadas}</span>
          <span className="text-xs text-amber-500">aguardando</span>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const count = opt.key === 'todos'
            ? totalTarefas
            : tarefas.filter((t) => t.status === opt.key).length;
          return (
            <button
              key={opt.key}
              onClick={() => setActiveFilter(opt.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer',
                activeFilter === opt.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              {opt.label}
              <span className={cn(
                'text-xs font-bold px-1.5 py-0.5 rounded-full',
                activeFilter === opt.key ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Etapas cards */}
      {obra.etapas.map((etapa) => {
        const etapaTarefas = filteredTarefas.filter((t) => t.etapa === etapa.nome);
        if (etapaTarefas.length === 0 && activeFilter !== 'todos') return null;

        const etapaTarefasAll = tarefas.filter((t) => t.etapa === etapa.nome);
        const etapaConcluidas = etapaTarefasAll.filter((t) => t.status === 'concluido').length;

        return (
          <div key={etapa.id} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            {/* Etapa header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{etapa.nome}</h3>
                <span className="text-xs text-gray-500 font-medium">
                  {etapaConcluidas}/{etapaTarefasAll.length} concluídas
                </span>
              </div>
              <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{etapa.progresso}%</span>
            </div>
            <ProgressBar value={etapa.progresso} color={progressColor} size="sm" />

            {/* Tasks list */}
            {etapaTarefas.length > 0 ? (
              <div className="mt-4 space-y-2">
                {etapaTarefas.map((tarefa) => {
                  const StatusIcon = STATUS_ICON[tarefa.status];
                  return (
                    <div
                      key={tarefa.id}
                      className={cn(
                        'rounded-xl border transition-colors',
                        tarefa.status === 'bloqueado'
                          ? 'border-l-4 border-l-amber-400 border-amber-100 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10'
                          : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      )}
                    >
                      <div className="flex items-start gap-3 p-3">
                        {/* Status icon */}
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                          tarefa.status === 'concluido' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                          tarefa.status === 'em_andamento' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                          tarefa.status === 'bloqueado' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                          'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        )}>
                          <StatusIcon className="w-3.5 h-3.5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Title + badges */}
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className={cn(
                              'text-sm font-semibold',
                              tarefa.status === 'concluido' ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'
                            )}>
                              {tarefa.titulo}
                            </span>
                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', STATUS_BADGE_CLASSES[tarefa.status])}>
                              {STATUS_LABELS[tarefa.status]}
                            </span>
                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', PRIORIDADE_BADGE[tarefa.prioridade])}>
                              {PRIORIDADE_LABELS[tarefa.prioridade]}
                            </span>
                          </div>

                          {/* Meta row */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <RiUserLine className="w-3 h-3" />
                              {tarefa.responsavel}
                            </span>
                            <span className="flex items-center gap-1">
                              <RiCalendarLine className="w-3 h-3" />
                              {formatDate(tarefa.prazo)}
                            </span>
                          </div>

                          {/* Progress bar for em_andamento */}
                          {tarefa.status === 'em_andamento' && tarefa.progresso !== undefined && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${tarefa.progresso}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">{tarefa.progresso}%</span>
                            </div>
                          )}

                          {/* Blockage info */}
                          {tarefa.status === 'bloqueado' && tarefa.bloqueioMotivo && (
                            <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                              <RiAlertLine className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>
                                <span className="font-bold">{tarefa.bloqueioMotivo}</span>
                                {tarefa.bloqueioInfo && <span className="font-normal opacity-80"> — {tarefa.bloqueioInfo}</span>}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-400 text-center py-4">
                Nenhuma tarefa nesta etapa para o filtro selecionado.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
