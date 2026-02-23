'use client';

import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import { Skeleton } from '@shared/components/ui/skeleton';
import { ProgressBar } from '@features/shared/components/ProgressBar';
import { RiExternalLinkLine, RiEdit2Line, RiBriefcaseLine } from 'react-icons/ri';
import type { AdminClienteObra } from '../types';

type ObraStatus = AdminClienteObra['status'];

const STATUS_CONFIG: Record<ObraStatus, { label: string; className: string; progressColor: 'info' | 'success' | 'warning' | 'error' }> = {
  em_andamento: {
    label: 'Em andamento',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    progressColor: 'info',
  },
  concluida: {
    label: 'Concluída',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    progressColor: 'success',
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

interface ClienteObrasTabProps {
  obras: AdminClienteObra[];
  isLoading: boolean;
}

export function ClienteObrasTab({ obras, isLoading }: ClienteObrasTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (obras.length === 0) {
    return (
      <div className="text-center py-12">
        <RiBriefcaseLine className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Nenhuma obra encontrada</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Este cliente ainda não possui obras cadastradas.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Obra</th>
            <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Status</th>
            <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider min-w-[160px]">Progresso</th>
            <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Valor</th>
            <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Prazo</th>
            <th className="text-right py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody>
          {obras.map((obra, index) => {
            const statusCfg = STATUS_CONFIG[obra.status];
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
                  {obra.localizacao && (
                    <p className="text-xs text-muted-foreground mt-0.5">{obra.localizacao}</p>
                  )}
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
                  <p className="text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                    {formatDate(obra.previsaoFim)}
                  </p>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/obras/${obra.id}`} title="Ver detalhes">
                      <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary dark:hover:text-white transition-colors cursor-pointer">
                        <RiExternalLinkLine className="w-4 h-4" />
                      </button>
                    </Link>
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary dark:hover:text-white transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <RiEdit2Line className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
