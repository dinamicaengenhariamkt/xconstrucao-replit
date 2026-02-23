'use client';

import { cn } from '@shared/lib/utils';
import { Skeleton } from '@shared/components/ui/skeleton';
import {
  RiLoginCircleLine,
  RiEdit2Line,
  RiMoneyDollarCircleLine,
  RiFileUploadLine,
  RiCheckboxCircleLine,
  RiHistoryLine,
} from 'react-icons/ri';
import type { ClienteAtividade, AtividadeTipo } from '../types';

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
      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6">Histórico de Atividades</h3>
      <div className="relative">
        {/* Timeline vertical line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />

        <div className="flex flex-col gap-6">
          {atividades.map((atividade, index) => {
            const cfg = ATIVIDADE_CONFIG[atividade.tipo];
            const Icon = cfg.icon;
            const isLast = index === atividades.length - 1;
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
  );
}
