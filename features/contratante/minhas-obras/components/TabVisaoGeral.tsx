'use client';

import { cn } from '@shared/lib/utils';
import { ProgressBar } from '@features/shared/components/ProgressBar';
import type { ObraContratanteDetalhe, ProgressColor, TimelineEventContratante } from '../types';
import { IconArrowForward, IconWarning } from '@shared/components/icons';

const TIPO_DOT: Record<TimelineEventContratante['tipo'], string> = {
  progresso: 'bg-green-500',
  tarefa: 'bg-blue-500',
  documento: 'bg-purple-500',
  problema: 'bg-amber-500',
  nota: 'bg-gray-400',
};

const TIPO_ICON: Record<TimelineEventContratante['tipo'], string> = {
  progresso: 'trending_up',
  tarefa: 'check_circle',
  documento: 'description',
  problema: 'warning',
  nota: 'sticky_note_2',
};

interface TabVisaoGeralProps {
  obra: ObraContratanteDetalhe;
  progressColor: ProgressColor;
  onNavigateToTimeline?: () => void;
}

export function TabVisaoGeral({ obra, progressColor, onNavigateToTimeline }: TabVisaoGeralProps) {
  const ultimasAtualizacoes = (obra.timeline ?? []).slice(0, 3);
  const ocorrenciasAbertas = (obra.ocorrencias ?? []).filter((o) => o.status === 'aberta').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" data-testid="tab-content-visao-geral">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Sobre a Obra</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{obra.descricao}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Progresso por Etapas</h3>
          <div className="space-y-4">
            {obra.etapas.map((etapa) => (
              <div key={etapa.id} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32 shrink-0">{etapa.nome}</span>
                <div className="flex-1">
                  <ProgressBar value={etapa.progresso} color={progressColor} size="sm" />
                </div>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 w-10 text-right">{etapa.progresso}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Últimas atualizações */}
        {ultimasAtualizacoes.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Últimas Atualizações</h3>
              {onNavigateToTimeline && (
                <button
                  onClick={onNavigateToTimeline}
                  className="text-xs text-primary font-semibold hover:underline cursor-pointer flex items-center gap-1"
                >
                  Ver todas
                  <IconArrowForward className="text-[14px]" />
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-gray-800" />
              <div className="space-y-4">
                {ultimasAtualizacoes.map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div className={cn('w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center', `${TIPO_DOT[event.tipo]}/20`)}>
                      <div className={cn('w-2.5 h-2.5 rounded-full', TIPO_DOT[event.tipo])} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          'text-sm font-semibold truncate',
                          event.tipo === 'problema' ? 'text-amber-700 dark:text-amber-400' : 'text-gray-800 dark:text-gray-200'
                        )}>
                          {event.titulo}
                        </p>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{event.data}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{event.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Empreiteiro</h3>
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold', obra.empreiteiro.cor)}>
              {obra.empreiteiro.iniciais}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{obra.empreiteiro.nome}</p>
              <p className="text-[10px] text-gray-400">Responsável</p>
            </div>
          </div>
        </div>

        {ocorrenciasAbertas > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/40 flex items-start gap-3">
            <IconWarning className="text-amber-500 text-xl shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                {ocorrenciasAbertas} ocorrência{ocorrenciasAbertas !== 1 ? 's' : ''} em aberto
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                O empreiteiro registrou problemas que precisam de atenção.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Informações</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Tipo</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{obra.tipo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Início</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{obra.dataInicio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Previsão</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{obra.dataPrevisaoFim}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
