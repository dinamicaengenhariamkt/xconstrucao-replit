'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  RiArrowUpLine,
  RiFileChartLine,
  RiMedalLine,
  RiAddCircleLine,
  RiUserLine,
  RiBuildingLine,
  RiSearchLine,
  RiCalendarLine,
} from 'react-icons/ri';
import { Card, CardContent } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Skeleton } from '@shared/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@shared/components/ui/table';
import { cn } from '@shared/lib/utils';
import { StatsCard } from '@features/admin/financeiro/components/StatsCard';
import { EntradaChart } from '@features/admin/entradas/components/EntradaChart';
import { EntradaTopEntidades } from '@features/admin/entradas/components/EntradaTopEntidades';
import type {
  EntradaPeriodo,
  EntradaTipoReceita,
  EntradaOrigem,
  EntradaStatus,
  Entrada,
} from '@features/admin/entradas/types';
import {
  useEntradaKpi,
  useEntradas,
  useEntradaChart,
  useTopClientes,
  useTopEmpreiteiras,
} from '@features/admin/entradas/hooks/use-entradas';

// ─── Formatting ───────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

// ─── Label / Style Maps ───────────────────────────────────────────────────────

const tipoReceitaLabels: Record<EntradaTipoReceita, string> = {
  taxa_medicao: 'Taxa sobre medição',
  assinatura: 'Assinatura',
  outros_servicos: 'Outros serviços',
};

const tipoReceitaClasses: Record<EntradaTipoReceita, string> = {
  taxa_medicao: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  assinatura: 'bg-[#22846D]/10 text-[#22846D]',
  outros_servicos: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const origemLabels: Record<EntradaOrigem, string> = {
  cliente: 'Cliente',
  empreiteira: 'Empreiteira',
  outros: 'Outros',
};

const statusLabels: Record<EntradaStatus, string> = {
  recebido: 'Recebido',
  pendente: 'Pendente',
  em_processamento: 'Em processamento',
};

const statusClasses: Record<EntradaStatus, string> = {
  recebido: 'bg-[#22846D]/10 text-[#22846D]',
  pendente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  em_processamento: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

// ─── Period options ───────────────────────────────────────────────────────────

const periodOptions: { value: EntradaPeriodo; label: string }[] = [
  { value: '7dias', label: '7 dias' },
  { value: '30dias', label: 'Últimos 30 dias' },
  { value: '3meses', label: '3 meses' },
  { value: '12meses', label: '12 meses' },
  { value: 'personalizado', label: 'Personalizado' },
];

// ─── Items per page ───────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ─── Skeleton ────────────────────────────────────────────────────────────────

function EntradasSkeleton() {
  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-36">
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          <Skeleton className="h-72 w-full rounded-xl" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Skeleton className="h-96 w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminEntradasPage() {
  const [periodo, setPeriodo] = useState<EntradaPeriodo>('30dias');
  const [origemFilter, setOrigemFilter] = useState<string>('todos');
  const [tipoReceitaFilter, setTipoReceitaFilter] = useState<string>('todos');
  const [tabelaTipoFilter, setTabelaTipoFilter] = useState<string>('todas');
  const [tabelaStatusFilter, setTabelaStatusFilter] = useState<string>('todas');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: kpi, isLoading: isLoadingKpi } = useEntradaKpi(periodo);
  const { data: entradas, isLoading: isLoadingEntradas } = useEntradas(periodo);
  const { data: chartData, isLoading: isLoadingChart } = useEntradaChart(periodo);
  const { data: topClientes, isLoading: isLoadingClientes } = useTopClientes(periodo);
  const { data: topEmpreiteiras, isLoading: isLoadingEmpreiteiras } = useTopEmpreiteiras(periodo);

  const isLoading =
    isLoadingKpi || isLoadingEntradas || isLoadingChart || isLoadingClientes || isLoadingEmpreiteiras;

  const filtered = useMemo(() => {
    let result = entradas ?? [];
    if (tabelaTipoFilter !== 'todas') {
      result = result.filter((e) => e.tipoReceita === tabelaTipoFilter);
    }
    if (tabelaStatusFilter !== 'todas') {
      result = result.filter((e) => e.status === tabelaStatusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.descricao.toLowerCase().includes(q) ||
          e.clienteEmpreiteira.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entradas, tabelaTipoFilter, tabelaStatusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const kpiCards = useMemo(() => {
    if (!kpi) return [];
    return [
      {
        label: 'Total de entradas',
        value: formatCurrency(kpi.totalEntradas),
        icon: RiArrowUpLine,
        iconBgColor: 'bg-[#22846D]/10 text-[#22846D]',
        badge: {
          label: `+${kpi.crescimentoPercent.toFixed(1).replace('.', ',')}% vs. anterior`,
          variant: 'success' as const,
        },
      },
      {
        label: 'Taxas sobre medições',
        value: formatCurrency(kpi.taxasMedicoes),
        icon: RiFileChartLine,
        iconBgColor: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        badge: {
          label: `${kpi.taxasMedicoesPercent.toFixed(1).replace('.', ',')}% das entradas`,
          variant: 'info' as const,
        },
      },
      {
        label: 'Assinaturas',
        value: formatCurrency(kpi.assinaturas),
        icon: RiMedalLine,
        iconBgColor: 'bg-[#22846D]/10 text-[#22846D]',
        badge: {
          label: `${kpi.assinaturasPercent.toFixed(1).replace('.', ',')}% das entradas`,
          variant: 'success' as const,
        },
      },
      {
        label: 'Outros serviços',
        value: formatCurrency(kpi.outrosServicos),
        icon: RiAddCircleLine,
        iconBgColor: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
        badge: {
          label: `${kpi.outrosServicosPercent.toFixed(1).replace('.', ',')}% das entradas`,
          variant: 'warning' as const,
        },
      },
      {
        label: 'Ticket médio por cliente',
        value: formatCurrency(kpi.ticketMedioPorCliente),
        icon: RiUserLine,
        iconBgColor: 'bg-primary/10 text-primary',
        badge: { label: 'No período', variant: 'primary' as const },
      },
      {
        label: 'Ticket médio por obra',
        value: formatCurrency(kpi.ticketMedioPorObra),
        icon: RiBuildingLine,
        iconBgColor: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        badge: { label: 'No período', variant: 'info' as const },
      },
    ];
  }, [kpi]);

  if (isLoading) return <EntradasSkeleton />;

  return (
    <div className="p-6 md:p-10 space-y-8">
      {/* ─── BLOCO 1: Header + Período + Filtros globais ─── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            {kpi && (
              <p className="text-sm font-bold text-[#22846D] mb-1">
                Entradas cresceram {kpi.crescimentoPercent.toFixed(1).replace('.', ',')}% em relação aos 30 dias anteriores
              </p>
            )}
            <h1
              className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight"
              data-testid="text-page-title"
            >
              Entradas
            </h1>
            <p className="text-muted-foreground mt-1">
              Detalhamento das receitas da plataforma por período, origem e tipo.
            </p>
          </div>

          {/* Seletor de período */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setPeriodo(opt.value); setPage(1); }}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1',
                  periodo === opt.value
                    ? 'bg-primary text-white font-bold shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm'
                )}
              >
                {opt.value === 'personalizado' && (
                  <RiCalendarLine className="w-4 h-4" />
                )}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros de origem e tipo de receita */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <select
              value={origemFilter}
              onChange={(e) => { setOrigemFilter(e.target.value); setPage(1); }}
              className="appearance-none bg-gray-100 dark:bg-gray-800 border-none rounded-xl pl-4 pr-10 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="todos">Origem: Todos</option>
              <option value="cliente">Cliente</option>
              <option value="empreiteira">Empreiteira</option>
              <option value="outros">Outros</option>
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="relative">
            <select
              value={tipoReceitaFilter}
              onChange={(e) => { setTipoReceitaFilter(e.target.value); setPage(1); }}
              className="appearance-none bg-gray-100 dark:bg-gray-800 border-none rounded-xl pl-4 pr-10 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="todos">Tipo de receita: Todos</option>
              <option value="taxa_medicao">Taxas sobre medições</option>
              <option value="assinatura">Assinatura</option>
              <option value="outros_servicos">Outros serviços</option>
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* ─── BLOCO 2: 6 KPI Cards ─── */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.08 } },
        }}
        initial="hidden"
        animate="show"
      >
        {kpiCards.map((kpiCard) => (
          <motion.div
            key={kpiCard.label}
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          >
            <StatsCard {...kpiCard} />
          </motion.div>
        ))}
      </motion.div>

      {/* ─── BLOCO 3: Gráfico ─── */}
      <EntradaChart data={chartData?.chart} insights={chartData?.insights} />

      {/* ─── BLOCO 4: Tabela de lançamentos ─── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Barra de filtros */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Busca */}
            <div className="relative">
              <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar por cliente, empreiteira ou descrição..."
                className="bg-gray-100 dark:bg-gray-800 border-none rounded-xl pl-9 pr-4 py-2 text-xs w-72 focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400 dark:text-gray-100 outline-none"
                data-testid="input-search"
              />
            </div>
            {/* Filtros rápidos de tipo */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              {[
                { value: 'todas', label: 'Todas' },
                { value: 'taxa_medicao', label: 'Taxas' },
                { value: 'assinatura', label: 'Assinaturas' },
                { value: 'outros_servicos', label: 'Outros' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setTabelaTipoFilter(opt.value); setPage(1); }}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer',
                    tabelaTipoFilter === opt.value
                      ? 'bg-primary text-white font-bold shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm'
                  )}
                  data-testid={`filter-chip-${opt.value}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {/* Dropdown de status */}
          <div className="relative">
            <select
              value={tabelaStatusFilter}
              onChange={(e) => { setTabelaStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none bg-gray-100 dark:bg-gray-800 border-none rounded-xl pl-4 pr-10 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="todas">Status: Todas</option>
              <option value="recebido">Recebido</option>
              <option value="pendente">Pendente</option>
              <option value="em_processamento">Em processamento</option>
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                <TableHead className="text-xs font-bold uppercase tracking-wider">Data/Hora</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Descrição</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Cliente/Empreiteira</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Tipo de receita</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Origem</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-right">Valor</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Nenhuma entrada encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((ent: Entrada) => (
                  <TableRow
                    key={ent.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    data-testid={`row-entrada-${ent.id}`}
                  >
                    <TableCell>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {formatDateTime(ent.dataHora)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-700 dark:text-gray-300 max-w-[220px] truncate">
                        {ent.descricao}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{ent.clienteEmpreiteira}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn('no-default-hover-elevate no-default-active-elevate', tipoReceitaClasses[ent.tipoReceita])}
                        data-testid={`badge-tipo-${ent.id}`}
                      >
                        {tipoReceitaLabels[ent.tipoReceita]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="no-default-hover-elevate no-default-active-elevate bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                        data-testid={`badge-origem-${ent.id}`}
                      >
                        {origemLabels[ent.origem]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="text-sm font-bold text-[#22846D] whitespace-nowrap">
                        {formatCurrency(ent.valor)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn('no-default-hover-elevate no-default-active-elevate', statusClasses[ent.status])}
                        data-testid={`badge-status-${ent.id}`}
                      >
                        {statusLabels[ent.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Exibindo{' '}
            <span className="font-bold text-gray-700 dark:text-gray-200">
              {filtered.length === 0 ? '0' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)}`}
            </span>{' '}
            de{' '}
            <span className="font-bold text-gray-700 dark:text-gray-200">{filtered.length}</span>{' '}
            lançamentos
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors',
                      page === pageNum
                        ? 'bg-primary text-white font-bold'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── BLOCO 5: Top Entidades ─── */}
      {topClientes && topEmpreiteiras && (
        <EntradaTopEntidades clientes={topClientes} empreiteiras={topEmpreiteiras} />
      )}
    </div>
  );
}
