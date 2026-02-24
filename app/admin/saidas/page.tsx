'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  RiArrowDownLine,
  RiBuildingLine,
  RiMoneyDollarCircleLine,
  RiFileChartLine,
  RiTimeLine,
  RiArrowUpLine,
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
import { SaidaChart } from '@features/admin/saidas/components/SaidaChart';
import type {
  SaidaPeriodo,
  SaidaTipo,
  SaidaStatus,
  SaidaDestinoPerfil,
  Saida,
  SaidaFutura,
} from '@features/admin/saidas/types';
import {
  useSaidaKpi,
  useSaidas,
  useSaidaChart,
  useSaidasFuturas,
} from '@features/admin/saidas/hooks/use-saidas';

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

const formatDate = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

// ─── Label / Style Maps ───────────────────────────────────────────────────────

const tipoSaidaLabels: Record<SaidaTipo, string> = {
  pagamento_medicao: 'Pagamento de medição',
  reembolso: 'Reembolso',
  custo_operacional: 'Custo operacional',
};

const tipoSaidaClasses: Record<SaidaTipo, string> = {
  pagamento_medicao: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  reembolso: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  custo_operacional: 'bg-primary/10 text-primary',
};

const statusLabels: Record<SaidaStatus, string> = {
  pago: 'Pago',
  agendado: 'Agendado',
  pendente_aprovacao: 'Pendente aprovação',
  atrasado: 'Atrasado',
};

const statusClasses: Record<SaidaStatus, string> = {
  pago: 'bg-[#22846D]/10 text-[#22846D]',
  agendado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pendente_aprovacao: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  atrasado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const destinoPerfilLabels: Record<SaidaDestinoPerfil, string> = {
  empreiteira: 'Empreiteira',
  cliente: 'Cliente',
  outro: 'Outro',
};

const destinoPerfilClasses: Record<SaidaDestinoPerfil, string> = {
  empreiteira: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cliente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  outro: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

// ─── Period options ───────────────────────────────────────────────────────────

const periodOptions: { value: SaidaPeriodo; label: string }[] = [
  { value: '7dias', label: '7 dias' },
  { value: '30dias', label: 'Últimos 30 dias' },
  { value: '3meses', label: '3 meses' },
  { value: '12meses', label: '12 meses' },
  { value: 'personalizado', label: 'Personalizado' },
];

// ─── Pagination ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SaidasSkeleton() {
  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-9 w-32" />
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
      <Card>
        <CardContent className="p-0">
          <Skeleton className="h-48 w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminSaidasPage() {
  const [periodo, setPeriodo] = useState<SaidaPeriodo>('30dias');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [destinoFilter, setDestinoFilter] = useState<string>('todos');
  const [tabelaTipoFilter, setTabelaTipoFilter] = useState<string>('todas');
  const [tabelaStatusFilter, setTabelaStatusFilter] = useState<string>('todas');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: kpi, isLoading: isLoadingKpi } = useSaidaKpi(periodo);
  const { data: saidas, isLoading: isLoadingSaidas } = useSaidas(periodo);
  const { data: chartData, isLoading: isLoadingChart } = useSaidaChart(periodo);
  const { data: futuras, isLoading: isLoadingFuturas } = useSaidasFuturas();

  const isLoading = isLoadingKpi || isLoadingSaidas || isLoadingChart || isLoadingFuturas;

  const filtered = useMemo(() => {
    let result = saidas ?? [];
    if (tabelaTipoFilter !== 'todas') {
      result = result.filter((s) => s.tipoSaida === tabelaTipoFilter);
    }
    if (tabelaStatusFilter !== 'todas') {
      result = result.filter((s) => s.status === tabelaStatusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.descricao.toLowerCase().includes(q) ||
          s.destino.toLowerCase().includes(q) ||
          (s.obra && s.obra.toLowerCase().includes(q))
      );
    }
    return result;
  }, [saidas, tabelaTipoFilter, tabelaStatusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const kpiCards = useMemo(() => {
    if (!kpi) return [];
    return [
      {
        label: 'Total de saídas',
        value: formatCurrency(kpi.totalSaidas),
        icon: RiArrowDownLine,
        iconBgColor: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
        badge: {
          label: `+${kpi.crescimentoPercent.toFixed(1).replace('.', ',')}% vs. anterior`,
          variant: 'error' as const,
        },
      },
      {
        label: 'Pagamentos a empreiteiras',
        value: formatCurrency(kpi.pagamentosEmpreiteiras),
        icon: RiBuildingLine,
        iconBgColor: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        badge: {
          label: `${kpi.pagamentosEmpreiteirasPercent.toFixed(1).replace('.', ',')}% das saídas`,
          variant: 'info' as const,
        },
      },
      {
        label: 'Reembolsos a clientes',
        value: formatCurrency(kpi.reembolsos),
        icon: RiMoneyDollarCircleLine,
        iconBgColor: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
        badge: {
          label: `${kpi.reembolsosPercent.toFixed(1).replace('.', ',')}% das saídas`,
          variant: 'warning' as const,
        },
      },
      {
        label: 'Outros desembolsos',
        value: formatCurrency(kpi.outrosDesembolsos),
        icon: RiFileChartLine,
        iconBgColor: 'bg-primary/10 text-primary',
        badge: {
          label: `${kpi.outrosDesembolsosPercent.toFixed(1).replace('.', ',')}% das saídas`,
          variant: 'primary' as const,
        },
      },
      {
        label: 'Saídas previstas',
        value: formatCurrency(kpi.saidasPrevistas),
        icon: RiTimeLine,
        iconBgColor: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        badge: { label: 'Compromissos futuros', variant: 'info' as const },
      },
      {
        label: 'Maior pagamento no período',
        value: formatCurrency(kpi.maiorPagamento),
        icon: RiArrowUpLine,
        iconBgColor: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
        badge: { label: kpi.maiorPagamentoDescricao, variant: 'error' as const },
      },
    ];
  }, [kpi]);

  if (isLoading) return <SaidasSkeleton />;

  return (
    <div className="p-6 md:p-10 space-y-8">

      {/* ─── BLOCO 1: Header + Período + Filtros globais ─── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            {kpi && (
              <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-1">
                As saídas cresceram {kpi.crescimentoPercent.toFixed(1).replace('.', ',')}% em relação aos 30 dias anteriores
              </p>
            )}
            <h1
              className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight"
              data-testid="text-page-title"
            >
              Saídas
            </h1>
            <p className="text-muted-foreground mt-1">
              Detalhamento dos pagamentos e desembolsos da plataforma por período, destino e tipo.
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

        {/* Filtros de tipo de saída e destino */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <select
              value={tipoFilter}
              onChange={(e) => { setTipoFilter(e.target.value); setPage(1); }}
              className="appearance-none bg-gray-100 dark:bg-gray-800 border-none rounded-xl pl-4 pr-10 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="todos">Tipo de saída: Todos</option>
              <option value="pagamento_medicao">Pagamento a empreiteiras</option>
              <option value="reembolso">Reembolso a clientes</option>
              <option value="custo_operacional">Outros desembolsos</option>
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="relative">
            <select
              value={destinoFilter}
              onChange={(e) => { setDestinoFilter(e.target.value); setPage(1); }}
              className="appearance-none bg-gray-100 dark:bg-gray-800 border-none rounded-xl pl-4 pr-10 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="todos">Destino: Todos</option>
              <option value="empreiteira">Empreiteiras</option>
              <option value="cliente">Clientes</option>
              <option value="outro">Outros</option>
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
      <SaidaChart data={chartData?.chart} insights={chartData?.insights} />

      {/* ─── BLOCO 4: Tabela de saídas ─── */}
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
                placeholder="Buscar por empreiteira, cliente, obra ou descrição..."
                className="bg-gray-100 dark:bg-gray-800 border-none rounded-xl pl-9 pr-4 py-2 text-xs w-80 focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400 dark:text-gray-100 outline-none"
                data-testid="input-search"
              />
            </div>
            {/* Filtros rápidos de tipo */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              {[
                { value: 'todas', label: 'Todas' },
                { value: 'pagamento_medicao', label: 'Pag. empreiteiras' },
                { value: 'reembolso', label: 'Reembolsos' },
                { value: 'custo_operacional', label: 'Outros' },
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
              <option value="todas">Status: Todos</option>
              <option value="pago">Pago</option>
              <option value="agendado">Agendado</option>
              <option value="pendente_aprovacao">Pendente aprovação</option>
              <option value="atrasado">Atrasado</option>
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
                <TableHead className="text-xs font-bold uppercase tracking-wider">Descrição da saída</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Obra/Contexto</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Destino</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Tipo de saída</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Nenhuma saída encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((sai: Saida) => (
                  <TableRow
                    key={sai.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    data-testid={`row-saida-${sai.id}`}
                  >
                    <TableCell>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {formatDateTime(sai.dataHora)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-700 dark:text-gray-300 max-w-[220px] truncate">
                        {sai.descricao}
                      </p>
                    </TableCell>
                    <TableCell>
                      {sai.obra ? (
                        <>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{sai.obra}</p>
                          {sai.local && (
                            <p className="text-xs text-gray-400">{sai.local}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">Não vinculado a obra</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{sai.destino}</p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'no-default-hover-elevate no-default-active-elevate mt-0.5 text-[10px]',
                          destinoPerfilClasses[sai.destinoPerfil]
                        )}
                        data-testid={`badge-destino-${sai.id}`}
                      >
                        {destinoPerfilLabels[sai.destinoPerfil]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn('no-default-hover-elevate no-default-active-elevate', tipoSaidaClasses[sai.tipoSaida])}
                        data-testid={`badge-tipo-${sai.id}`}
                      >
                        {tipoSaidaLabels[sai.tipoSaida]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn('no-default-hover-elevate no-default-active-elevate', statusClasses[sai.status])}
                        data-testid={`badge-status-${sai.id}`}
                      >
                        {statusLabels[sai.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="text-sm font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                        {formatCurrency(sai.valor)}
                      </p>
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
            saídas
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

      {/* ─── BLOCO 5: Agenda de saídas futuras ─── */}
      {futuras && futuras.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Saídas previstas</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Compromissos de pagamento nos próximos 15 dias</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {futuras.map((fut: SaidaFutura) => (
              <div
                key={fut.id}
                className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                data-testid={`row-futura-${fut.id}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Badge de vencimento */}
                  <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400">
                    <span className="text-xs font-bold leading-none">{formatDate(fut.vencimento).split('/')[0]}</span>
                    <span className="text-[10px] font-medium leading-none mt-0.5">/{formatDate(fut.vencimento).split('/')[1]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{fut.descricao}</p>
                    {fut.obra && (
                      <p className="text-xs text-gray-400 truncate">{fut.obra}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{fut.destino}</p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'no-default-hover-elevate no-default-active-elevate text-[10px]',
                        destinoPerfilClasses[fut.destinoPerfil]
                      )}
                    >
                      {destinoPerfilLabels[fut.destinoPerfil]}
                    </Badge>
                  </div>
                  <p className="text-sm font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                    {formatCurrency(fut.valor)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
