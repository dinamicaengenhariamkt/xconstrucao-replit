'use client';

import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import { Card, CardContent } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';
import { ProgressBar } from '@features/shared/components/ProgressBar';
import { RiExternalLinkLine, RiHammerLine, RiArrowRightLine } from 'react-icons/ri';
import type { AdminEmpreiteiraObra } from '../types';

type ObraStatus = AdminEmpreiteiraObra['status'];

const OBRA_STATUS_CONFIG: Record<ObraStatus, {
  label: string;
  className: string;
  progressColor: 'info' | 'success' | 'warning' | 'error' | 'primary';
}> = {
  em_andamento: {
    label: 'Em execução',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    progressColor: 'info',
  },
  em_proposta: {
    label: 'Em proposta',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    progressColor: 'warning',
  },
  concluida: {
    label: 'Concluída',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    progressColor: 'success',
  },
  atrasada: {
    label: 'Atrasada',
    className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    progressColor: 'error',
  },
  pausada: {
    label: 'Pausada',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    progressColor: 'warning',
  },
  cancelada: {
    label: 'Cancelada',
    className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    progressColor: 'error',
  },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('pt-BR');

interface EmpreiteiraObrasSectionProps {
  empreiteiraId: string;
  obras: AdminEmpreiteiraObra[];
  isLoading: boolean;
}

export function EmpreiteiraObrasSection({ empreiteiraId, obras, isLoading }: EmpreiteiraObrasSectionProps) {
  const obrasEmAndamento = obras.filter((o) => o.status === 'em_andamento').length;
  const obrasConcluidas = obras.filter((o) => o.status === 'concluida').length;

  return (
    <Card className="rounded-3xl" data-testid="card-obras-empreiteira">
      <CardContent className="p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <RiHammerLine className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Obras desta empreiteira
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{obrasEmAndamento}</span> obras em andamento{' '}
                ·{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-300">{obrasConcluidas}</span> obras concluídas
              </p>
            </div>
          </div>
          <Link href={`/admin/empreiteiras/${empreiteiraId}/obras`}>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-primary text-sm font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer whitespace-nowrap">
              Ver todas as obras
              <RiArrowRightLine className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && obras.length === 0 && (
          <div className="text-center py-12">
            <RiHammerLine className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Nenhuma obra encontrada</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Esta empreiteira ainda não possui obras cadastradas.</p>
          </div>
        )}

        {/* Table */}
        {!isLoading && obras.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Obra</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Cliente</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider min-w-[160px]">Progresso</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Valor</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Prazo</th>
                  <th className="text-right py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {obras.map((obra, index) => {
                  const statusCfg = OBRA_STATUS_CONFIG[obra.status];
                  const isAtrasada = obra.status === 'atrasada';
                  return (
                    <tr
                      key={obra.id}
                      className={cn(
                        'hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors',
                        index < obras.length - 1 && 'border-b border-gray-50 dark:border-gray-800/60',
                      )}
                    >
                      <td className="py-4 px-4">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{obra.nome}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{obra.codigo}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{obra.cliente}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-bold', statusCfg.className)}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3 min-w-[140px]">
                          <div className="flex-1">
                            <ProgressBar value={obra.percentConcluido} color={statusCfg.progressColor} size="sm" />
                          </div>
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 tabular-nums w-8 text-right">
                            {obra.percentConcluido}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                          {formatCurrency(obra.valorContratado)}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className={cn(
                          'text-sm tabular-nums',
                          isAtrasada
                            ? 'text-red-600 dark:text-red-400 font-medium'
                            : obra.status === 'em_proposta'
                              ? 'text-gray-400 dark:text-gray-500'
                              : 'text-gray-700 dark:text-gray-300',
                        )}>
                          {obra.status === 'em_proposta' ? '—' : formatDate(obra.previsaoFim)}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end">
                          <Link href={`/admin/obras/${obra.id}`} title="Ver detalhes">
                            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary dark:hover:text-white transition-colors cursor-pointer">
                              <RiExternalLinkLine className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
