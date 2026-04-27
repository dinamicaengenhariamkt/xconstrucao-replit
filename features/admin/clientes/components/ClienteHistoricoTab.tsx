'use client';

import { useState } from 'react';
import { cn } from '@shared/lib/utils';
import { Skeleton } from '@shared/components/ui/skeleton';
import {
  RiLoginCircleLine,
  RiEdit2Line,
  RiMoneyDollarCircleLine,
  RiFileUploadLine,
  RiCheckboxCircleLine,
  RiHistoryLine,
  RiStickyNoteLine,
  RiArrowDownSLine,
} from 'react-icons/ri';
import type { ClienteAtividade, AtividadeTipo } from '../types';

const INITIAL_VISIBLE = 5;
const LOAD_INCREMENT = 5;

type AtividadeConfig = {
  icon: React.ElementType;
  bgColor: string;
};

const ATIVIDADE_CONFIG: Record<AtividadeTipo, AtividadeConfig> = {
  login: {
    icon: RiLoginCircleLine,
    bgColor: 'bg-emerald-500',
  },
  obra_atualizada: {
    icon: RiEdit2Line,
    bgColor: 'bg-blue-500',
  },
  pagamento: {
    icon: RiMoneyDollarCircleLine,
    bgColor: 'bg-emerald-500',
  },
  documento: {
    icon: RiFileUploadLine,
    bgColor: 'bg-amber-500',
  },
  obra_concluida: {
    icon: RiCheckboxCircleLine,
    bgColor: 'bg-gray-800 dark:bg-gray-600',
  },
  nota: {
    icon: RiStickyNoteLine,
    bgColor: 'bg-gray-400 dark:bg-gray-600',
  },
};

function formatDataHora(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return `Hoje, ${timeStr}`;
  if (diffDays === 1) return `Ontem, ${timeStr}`;
  return `${date.toLocaleDateString('pt-BR')}, ${timeStr}`;
}

interface ClienteHistoricoTabProps {
  atividades: ClienteAtividade[];
  isLoading: boolean;
}

export function ClienteHistoricoTab({ atividades, isLoading }: ClienteHistoricoTabProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const visible = atividades.slice(0, visibleCount);
  const hasMore = visibleCount < atividades.length;
  const remaining = atividades.length - visibleCount;
  const nextLoad = Math.min(LOAD_INCREMENT, remaining);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-72" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (atividades.length === 0) {
    return (
      <div className="text-center py-12">
        <RiHistoryLine className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Sem atividades registradas</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-6">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Histórico de Atividades</h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          Mostrando {visible.length} de {atividades.length}
        </span>
      </div>

      <div className="max-h-[480px] overflow-y-auto pr-2">
        <div className="relative">
          {/* Timeline vertical line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />

          <div className="flex flex-col gap-6">
            {visible.map((atividade, index) => {
              const cfg = ATIVIDADE_CONFIG[atividade.tipo];
              const Icon = cfg.icon;
              const isLast = index === visible.length - 1;
              return (
                <div key={atividade.id} className="flex gap-4">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10',
                      cfg.bgColor,
                    )}
                  >
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  <div className={cn('flex-1', !isLast && 'pb-2')}>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{atividade.titulo}</p>
                      <span className="text-xs text-muted-foreground">{formatDataHora(atividade.dataHora)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{atividade.descricao}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + LOAD_INCREMENT)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-semibold bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            data-testid="historico-load-more"
          >
            <RiArrowDownSLine className="w-4 h-4" />
            Carregar mais ({nextLoad})
          </button>
        </div>
      )}
    </div>
  );
}
