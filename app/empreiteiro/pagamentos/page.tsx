'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  RiMoneyDollarCircleLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiArrowRightLine,
  RiSearchLine,
} from 'react-icons/ri';
import { PageHeader } from '@features/shared/components/PageHeader';
import { StatsCard } from '@features/empreiteiro/dashboard/components/StatsCard';
import { usePagamentosEmpreiteiro, usePagamentosEmpriteiroKPI } from '@features/empreiteiro/pagamentos/hooks/use-pagamentos-empreiteiro';
import { formatCurrencyRounded } from '@shared/lib/formatters';
import { cn } from '@shared/lib/utils';
import type { MedicaoEmpreiteiro } from '@features/empreiteiro/pagamentos/types';

type StatusFilter = 'todos' | MedicaoEmpreiteiro['status'];

const STATUS_CONFIG: Record<MedicaoEmpreiteiro['status'], { label: string; badgeClass: string }> = {
  recebido: {
    label: 'Recebido',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  aguardando_aprovacao: {
    label: 'Aguardando Aprovação',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  pendente: {
    label: 'Pendente',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  rejeitado: {
    label: 'Rejeitado',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

const FILTER_CHIPS: { key: StatusFilter; label: string }[] = [
  { key: 'todos', label: 'Todas' },
  { key: 'recebido', label: 'Recebido' },
  { key: 'aguardando_aprovacao', label: 'Aguardando Aprovação' },
  { key: 'pendente', label: 'Pendente' },
  { key: 'rejeitado', label: 'Rejeitado' },
];

export default function PagamentosEmpreteiroPage() {
  const { data: medicoes } = usePagamentosEmpreiteiro();
  const { data: kpi } = usePagamentosEmpriteiroKPI();

  const [search, setSearch] = useState('');
  const [filterObra, setFilterObra] = useState('todas');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('todos');

  const obras = useMemo(() => {
    if (!medicoes) return [];
    return [...new Set(medicoes.map((m) => m.obraNome))].sort();
  }, [medicoes]);

  const filtered = useMemo(() => {
    if (!medicoes) return [];
    return medicoes.filter((m) => {
      if (filterObra !== 'todas' && m.obraNome !== filterObra) return false;
      if (filterStatus !== 'todos' && m.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!m.obraNome.toLowerCase().includes(q) && !m.descricao.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [medicoes, filterObra, filterStatus, search]);

  const progressoRecebido = kpi && kpi.totalContratado > 0
    ? Math.round((kpi.totalRecebido / kpi.totalContratado) * 100)
    : 0;

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8" data-testid="pagamentos-empreiteiro-page">
      <PageHeader
        title="Meus Recebimentos"
        subtitle="Acompanhe o status financeiro de todas as suas obras e medições."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          label="Total Contratado"
          value={kpi ? formatCurrencyRounded(kpi.totalContratado) : '—'}
          icon={RiMoneyDollarCircleLine}
          iconBgColor="bg-primary/10 text-primary"
        />
        <StatsCard
          label="Total Recebido"
          value={kpi ? formatCurrencyRounded(kpi.totalRecebido) : '—'}
          icon={RiCheckboxCircleLine}
          iconBgColor="bg-green-100 text-green-600 dark:bg-green-900/30"
          badge={{ label: `${progressoRecebido}% do total`, variant: 'success' }}
        />
        <StatsCard
          label="Aguardando Aprovação"
          value={kpi ? formatCurrencyRounded(kpi.aguardandoAprovacao) : '—'}
          icon={RiTimeLine}
          iconBgColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30"
        />
        <StatsCard
          label="A Liberar"
          value={kpi ? formatCurrencyRounded(kpi.aLiberar) : 'R$ 0'}
          icon={RiArrowRightLine}
          iconBgColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30"
        />
      </div>

      {/* Progress bar */}
      {kpi && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progresso de Recebimentos</span>
            <span className="text-sm font-bold text-primary">{progressoRecebido}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressoRecebido}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>Recebido: {formatCurrencyRounded(kpi.totalRecebido)}</span>
            <span>Total: {formatCurrencyRounded(kpi.totalContratado)}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por obra ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Obra filter */}
          <select
            value={filterObra}
            onChange={(e) => setFilterObra(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="todas">Todas as obras</option>
            {obras.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap gap-2">
          {FILTER_CHIPS.map((chip) => {
            const count = chip.key === 'todos'
              ? (medicoes?.length ?? 0)
              : (medicoes?.filter((m) => m.status === chip.key).length ?? 0);
            return (
              <button
                key={chip.key}
                onClick={() => setFilterStatus(chip.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer',
                  filterStatus === chip.key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {chip.label}
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                  filterStatus === chip.key ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Medições list */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <RiMoneyDollarCircleLine className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500">Nenhuma medição encontrada</p>
            <p className="text-xs text-gray-400 mt-1">Tente ajustar os filtros.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {/* Header row (desktop) */}
            <div className="hidden md:grid grid-cols-[2fr_auto_1fr_1fr_1fr_auto] gap-4 px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
              <span>Obra</span>
              <span>Medição</span>
              <span>Período</span>
              <span>Valor</span>
              <span>Status</span>
              <span />
            </div>

            {filtered.map((medicao) => {
              const config = STATUS_CONFIG[medicao.status];
              return (
                <Link
                  key={medicao.id}
                  href={`/empreiteiro/minhas-obras/${medicao.obraId}`}
                  className="grid grid-cols-1 md:grid-cols-[2fr_auto_1fr_1fr_1fr_auto] gap-2 md:gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                >
                  {/* Obra */}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                      {medicao.obraNome}
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5">{medicao.descricao}</span>
                  </div>

                  {/* Medição # */}
                  <div className="flex items-center">
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                      #{medicao.numero}
                    </span>
                  </div>

                  {/* Período */}
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{medicao.periodo}</span>
                  </div>

                  {/* Valor */}
                  <div className="flex items-center">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatCurrencyRounded(medicao.valor)}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center">
                    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', config.badgeClass)}>
                      {config.label}
                    </span>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:flex items-center">
                    <RiArrowRightLine className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
