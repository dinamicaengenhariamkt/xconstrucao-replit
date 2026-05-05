'use client';

import { useState, useMemo, useEffect } from 'react';
import { cn } from '@shared/lib/utils';
import { Card, CardContent } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Skeleton } from '@shared/components/ui/skeleton';
import { StatsCard } from '@features/shared/components/StatsCard';
import { formatCurrency } from '@shared/lib/formatters';
import {
  usePlanosKpi,
  usePlanosContratante,
  usePlanosEmpreiteiro,
  useAssinantesContratante,
  useAssinantesEmpreiteiro,
} from '@features/admin/planos/hooks/use-planos';
import {
  PLANO_STATUS_LABEL,
  PLANO_STATUS_COLOR,
} from '@features/admin/planos/types';
import type { AdminPlano, AdminPlanoAssinante, PlanoStatus } from '@features/admin/planos/types';
import { PAGE_SIZE, STATUS_OPTIONS } from '@features/admin/planos/constants';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@shared/components/ui/pagination';
import { getPaginationRange } from '@shared/lib/pagination';
import {
  RiGroupLine,
  RiMoneyDollarCircleLine,
  RiArrowDownLine,
  RiVipCrownLine,
  RiCheckLine,
  RiSearchLine,
} from 'react-icons/ri';

type TabKey = 'contratante' | 'empreiteiro';

function PlanoCard({ plano }: { plano: AdminPlano }) {
  const priceLabel = plano.preco === 0 ? 'Gratuito' : `R$ ${plano.preco}/mês`;
  return (
    <Card className="rounded-2xl h-full">
      <CardContent className="p-5 flex flex-col gap-3 h-full">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-base">{plano.nome}</p>
            <p className="text-sm font-semibold text-primary">{priceLabel}</p>
          </div>
          <span
            className={cn(
              'text-xs font-semibold px-2 py-1 rounded-full',
              plano.ativo
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800',
            )}
          >
            {plano.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-bold text-gray-900 dark:text-white">{plano.totalAssinantes}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ativos</p>
            <p className="font-bold text-emerald-600">{plano.assinantesAtivos}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Receita/mês</p>
            <p className="font-bold text-gray-900 dark:text-white">
              {formatCurrency(plano.preco * plano.assinantesAtivos)}
            </p>
          </div>
        </div>

        <ul className="flex-1 space-y-1 text-xs text-gray-600 dark:text-gray-400">
          {plano.features.map((f) => (
            <li key={f} className="flex items-start gap-1.5">
              <RiCheckLine className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function AssinantesTable({ assinantes }: { assinantes: AdminPlanoAssinante[] }) {
  if (assinantes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <RiVipCrownLine className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Nenhum assinante encontrado</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left px-5 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Nome</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden md:table-cell">Plano</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden lg:table-cell">Adesão</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Status</th>
              <th className="text-right px-5 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden sm:table-cell">Valor/mês</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {assinantes.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <td className="px-5 py-3">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{a.nome}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5 md:hidden">{a.planoNome}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{a.planoNome}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-sm text-gray-500">{a.dataAdesao}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', PLANO_STATUS_COLOR[a.status as PlanoStatus])}>
                    {PLANO_STATUS_LABEL[a.status as PlanoStatus] ?? a.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right hidden sm:table-cell">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {a.valorMensal === 0 ? '—' : formatCurrency(a.valorMensal)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminPlanosPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('contratante');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusSelected, setStatusSelected] = useState<PlanoStatus[]>([]);
  const [planoSelected, setPlanoSelected] = useState<string[]>([]);

  const { data: kpi, isLoading: kpiLoading } = usePlanosKpi();
  const { data: planosContratante, isLoading: pcLoading } = usePlanosContratante();
  const { data: planosEmpreiteiro, isLoading: peLoading } = usePlanosEmpreiteiro();
  const { data: assinantesContratante } = useAssinantesContratante();
  const { data: assinantesEmpreiteiro } = useAssinantesEmpreiteiro();

  const planos = activeTab === 'contratante' ? (planosContratante ?? []) : (planosEmpreiteiro ?? []);
  const allAssinantes = activeTab === 'contratante' ? (assinantesContratante ?? []) : (assinantesEmpreiteiro ?? []);
  const planosLoading = activeTab === 'contratante' ? pcLoading : peLoading;

  const planoOptions = useMemo(
    () => Array.from(new Set(planos.map((p) => p.nome))).map((nome) => ({ value: nome, label: nome })),
    [planos],
  );

  const filteredAssinantes = useMemo(() => {
    let result = allAssinantes;
    if (statusSelected.length > 0) {
      result = result.filter((a) => statusSelected.includes(a.status));
    }
    if (planoSelected.length > 0) {
      result = result.filter((a) => planoSelected.includes(a.planoNome));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.nome.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.planoNome.toLowerCase().includes(q),
      );
    }
    return result;
  }, [allAssinantes, statusSelected, planoSelected, search]);

  const advancedActiveCount =
    (statusSelected.length > 0 ? 1 : 0) + (planoSelected.length > 0 ? 1 : 0);

  const clearAllAdvanced = () => {
    setStatusSelected([]);
    setPlanoSelected([]);
  };

  const onFilterChange = <T,>(setter: (v: T) => void) => (v: T) => setter(v);

  useEffect(() => {
    setPage(1);
  }, [search, activeTab, statusSelected, planoSelected]);

  useEffect(() => {
    setPlanoSelected([]);
  }, [activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredAssinantes.length / PAGE_SIZE));
  const paginatedAssinantes = filteredAssinantes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showingFrom = filteredAssinantes.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, filteredAssinantes.length);

  const kpis = [
    {
      label: 'Total Assinantes',
      value: kpiLoading ? '—' : String(kpi?.totalAssinantes ?? 0),
      icon: RiGroupLine,
      iconBgColor: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    },
    {
      label: 'Receita Mensal',
      value: kpiLoading ? '—' : kpi ? formatCurrency(kpi.receitaMensal) : '—',
      icon: RiMoneyDollarCircleLine,
      iconBgColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
    },
    {
      label: 'Churn no mês',
      value: kpiLoading ? '—' : String(kpi?.churnMes ?? 0),
      icon: RiArrowDownLine,
      iconBgColor: 'bg-red-50 text-red-600 dark:bg-red-900/20',
    },
    {
      label: 'Assinantes Enterprise',
      value: kpiLoading ? '—' : String(kpi?.enterprise ?? 0),
      icon: RiVipCrownLine,
      iconBgColor: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-planos-page">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Planos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestão dos planos e assinaturas da plataforma
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpiCard) => (
          <StatsCard
            key={kpiCard.label}
            label={kpiCard.label}
            value={kpiCard.value}
            icon={kpiCard.icon}
            iconBgColor={kpiCard.iconBgColor}
            luminous
          />
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {(['contratante', 'empreiteiro'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-5 py-2 text-sm font-semibold rounded-lg transition-all capitalize',
              activeTab === tab
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            )}
          >
            {tab === 'contratante' ? 'Contratantes' : 'Empreiteiros'}
          </button>
        ))}
      </div>

      {/* Plans Grid */}
      {planosLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {planos.map((plano) => (
            <PlanoCard key={plano.id} plano={plano} />
          ))}
        </div>
      )}

      {/* Subscribers Table */}
      <div>
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Assinantes — {activeTab === 'contratante' ? 'Contratantes' : 'Empreiteiros'}
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <AdvancedFiltersPopover
                activeCount={advancedActiveCount}
                onClearAll={clearAllAdvanced}
              >
                <MultiSelectDropdown<PlanoStatus>
                  label="Status"
                  options={STATUS_OPTIONS}
                  values={statusSelected}
                  onChange={onFilterChange(setStatusSelected)}
                  placeholder="Todos os status"
                  testIdPrefix="filter-planos-status"
                />
                <MultiSelectDropdown<string>
                  label="Plano"
                  options={planoOptions}
                  values={planoSelected}
                  onChange={onFilterChange(setPlanoSelected)}
                  placeholder="Todos os planos"
                  testIdPrefix="filter-planos-plano"
                />
              </AdvancedFiltersPopover>

              <div className="relative w-full sm:w-64">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar assinante..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                />
              </div>
            </div>
          </div>

          {advancedActiveCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {statusSelected.map((s) => (
                <ActiveFilterChip
                  key={s}
                  label={`Status: ${PLANO_STATUS_LABEL[s]}`}
                  onRemove={() => setStatusSelected(statusSelected.filter((x) => x !== s))}
                  testId={`active-chip-planos-status-${s}`}
                />
              ))}
              {planoSelected.map((p) => (
                <ActiveFilterChip
                  key={p}
                  label={`Plano: ${p}`}
                  onRemove={() => setPlanoSelected(planoSelected.filter((x) => x !== p))}
                  testId={`active-chip-planos-plano-${p}`}
                />
              ))}
            </div>
          )}
        </div>

        <AssinantesTable assinantes={paginatedAssinantes} />

        {filteredAssinantes.length > 0 && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-gray-400">
            <span>
              Mostrando {showingFrom}–{showingTo} de {filteredAssinantes.length}
            </span>
            {totalPages > 1 && (
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.max(1, p - 1));
                      }}
                      aria-disabled={page <= 1}
                      className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                      data-testid="planos-pagination-prev"
                    />
                  </PaginationItem>
                  {getPaginationRange(page, totalPages).map((item, idx) =>
                    item === 'ellipsis' ? (
                      <PaginationItem key={`planos-ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          href="#"
                          isActive={page === item}
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(item);
                          }}
                          data-testid={`planos-pagination-page-${item}`}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.min(totalPages, p + 1));
                      }}
                      aria-disabled={page >= totalPages}
                      className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                      data-testid="planos-pagination-next"
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
