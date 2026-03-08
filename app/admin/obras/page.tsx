'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Skeleton } from '@shared/components/ui/skeleton';
import { FilterChips } from '@features/shared/components/FilterChips';
import { useAdminObras } from '@features/admin/obras/hooks/use-obras-list';
import {
  OBRA_STATUS_LABEL,
  OBRA_STATUS_COLOR,
  OBRA_PROGRESS_COLOR,
} from '@features/admin/obras/types/list';
import type { AdminObraStatus } from '@features/admin/obras/types/list';
import type { FilterChipOption } from '@features/shared/types';
import { formatCurrency } from '@shared/lib/formatters';
import {
  RiSearchLine,
  RiHammerLine,
  RiArrowRightLine,
  RiBuildingLine,
  RiCheckLine,
  RiPauseLine,
  RiCloseLine,
} from 'react-icons/ri';

const ITEMS_PER_PAGE = 10;

function getPaginationRange(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis', total];
  if (current >= total - 3) return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}

export default function AdminObrasPage() {
  const { data: obras, isLoading } = useAdminObras();
  const [activeFilter, setActiveFilter] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  function handleFilterChange(value: string) {
    setActiveFilter(value);
    setCurrentPage(1);
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  const stats = useMemo(() => {
    if (!obras) return { total: 0, emAndamento: 0, concluidas: 0, pausadas: 0, canceladas: 0 };
    return {
      total: obras.length,
      emAndamento: obras.filter((o) => o.status === 'em_andamento').length,
      concluidas: obras.filter((o) => o.status === 'concluida').length,
      pausadas: obras.filter((o) => o.status === 'pausada').length,
      canceladas: obras.filter((o) => o.status === 'cancelada').length,
    };
  }, [obras]);

  const filterOptions: FilterChipOption[] = useMemo(() => {
    if (!obras) return [];
    return [
      { label: 'Todas', value: 'todos', count: obras.length },
      { label: 'Em Andamento', value: 'em_andamento', count: stats.emAndamento },
      { label: 'Concluídas', value: 'concluida', count: stats.concluidas },
      { label: 'Pausadas', value: 'pausada', count: stats.pausadas },
      { label: 'Canceladas', value: 'cancelada', count: stats.canceladas },
    ];
  }, [obras, stats]);

  const filteredObras = useMemo(() => {
    if (!obras) return [];
    let result = obras;
    if (activeFilter !== 'todos') {
      result = result.filter((o) => o.status === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.nome.toLowerCase().includes(q) ||
          o.clienteNome.toLowerCase().includes(q) ||
          o.empreiteiraNome.toLowerCase().includes(q) ||
          o.codigo.toLowerCase().includes(q),
      );
    }
    return result;
  }, [obras, activeFilter, searchQuery]);

  const totalPages = Math.ceil(filteredObras.length / ITEMS_PER_PAGE);
  const paginatedObras = filteredObras.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const kpis = [
    {
      label: 'Total Obras',
      value: String(stats.total),
      icon: RiHammerLine,
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
    },
    {
      label: 'Em Andamento',
      value: String(stats.emAndamento),
      icon: RiBuildingLine,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
    },
    {
      label: 'Concluídas',
      value: String(stats.concluidas),
      icon: RiCheckLine,
      iconBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800',
    },
    {
      label: 'Pausadas / Canceladas',
      value: String(stats.pausadas + stats.canceladas),
      icon: RiPauseLine,
      iconBg: 'bg-red-50 text-red-500 dark:bg-red-900/20',
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 space-y-8">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-10 w-full max-w-sm rounded-md" />
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-obras-page">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Obras
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Listagem de todas as obras cadastradas na plataforma
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <motion.div
            key={kpi.label}
            className="rounded-2xl overflow-visible"
            whileHover={{ scale: 1.01, boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.06)' }}
            transition={{ duration: 0.2 }}
          >
            <Card className="h-full rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <div className={cn('p-3 rounded-lg', kpi.iconBg)}>
                  <kpi.icon className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm font-medium text-muted-foreground mb-1">{kpi.label}</p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <FilterChips options={filterOptions} activeValue={activeFilter} onSelect={handleFilterChange} />
        <div className="relative w-full sm:w-80">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nome, cliente, empreiteira..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            data-testid="input-search-obras"
          />
        </div>
      </div>

      {/* Table */}
      {filteredObras.length > 0 ? (
        <>
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Obra</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden md:table-cell">Cliente</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden lg:table-cell">Empreiteira</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden xl:table-cell">Progresso</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden lg:table-cell">Valor Total</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {paginatedObras.map((obra) => {
                    const statusColor = OBRA_STATUS_COLOR[obra.status as AdminObraStatus] ?? '';
                    const progressColor = OBRA_PROGRESS_COLOR[obra.status as AdminObraStatus] ?? 'bg-gray-400';
                    return (
                      <tr
                        key={obra.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{obra.nome}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{obra.codigo} · {obra.tipo}</p>
                          <p className="text-xs text-gray-400 mt-0.5 md:hidden">{obra.clienteNome}</p>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{obra.clienteNome}</p>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{obra.empreiteiraNome}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', statusColor)}>
                            {OBRA_STATUS_LABEL[obra.status as AdminObraStatus] ?? obra.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 hidden xl:table-cell">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all', progressColor)}
                                style={{ width: `${obra.progresso}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 font-medium w-8 text-right">{obra.progresso}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(obra.valorTotal)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Pago: {formatCurrency(obra.valorPago)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/admin/obras/${obra.id}`}
                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary transition-colors"
                            aria-label={`Ver detalhes de ${obra.nome}`}
                          >
                            <RiArrowRightLine className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Anterior
              </button>
              {getPaginationRange(currentPage, totalPages).map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setCurrentPage(item)}
                    className={cn(
                      'w-9 h-9 text-sm rounded-lg border transition-colors',
                      currentPage === item
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800',
                    )}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <RiCloseLine className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">Nenhuma obra encontrada</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente alterar os filtros ou a busca.</p>
        </div>
      )}
    </div>
  );
}
