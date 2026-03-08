'use client';

import { useState, useMemo } from 'react';
import { RiArrowUpCircleLine, RiArrowDownCircleLine, RiWalletLine, RiMoneyDollarCircleLine, RiEyeLine } from 'react-icons/ri';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { StatsCard } from '@features/contratante/dashboard/components/StatsCard';
import { PagamentosEvolutionChart } from '@features/contratante/pagamentos/components/PagamentosEvolutionChart';
import { usePagamentos, usePagamentosKPI } from '@features/contratante/pagamentos/hooks/use-pagamentos';
import { PAGAMENTO_STATUS_LABELS, PAGAMENTO_STATUS_COLORS } from '@features/contratante/pagamentos/constants';
import type { PagamentoContratante } from '@features/contratante/pagamentos/types';

import { formatCurrency } from '@shared/lib/formatters';

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const PAGE_SIZE = 10;

export default function PagamentosPage() {
  const { data: pagamentos, isLoading: isLoadingPagamentos } = usePagamentos();
  const { data: kpi, isLoading: isLoadingKPI } = usePagamentosKPI();

  const [filterObra, setFilterObra] = useState('todas');
  const [filterPeriodo, setFilterPeriodo] = useState('30');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Local state for marking as paid
  const [localPaidIds, setLocalPaidIds] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Detail modal
  const [selectedPagamento, setSelectedPagamento] = useState<PagamentoContratante | null>(null);

  const obras = useMemo(() => {
    if (!pagamentos) return [];
    return [...new Set(pagamentos.map((p) => p.obraNome))].sort();
  }, [pagamentos]);

  const filteredPagamentos = useMemo(() => {
    if (!pagamentos) return [];
    return pagamentos.filter((p) => {
      if (filterObra !== 'todas' && p.obraNome !== filterObra) return false;
      if (filterTipo !== 'todos' && p.tipo !== filterTipo) return false;
      if (filterStatus !== 'todos') {
        const effectiveStatus = localPaidIds.has(p.id) ? 'pago' : p.status;
        if (effectiveStatus !== filterStatus) return false;
      }
      if (filterPeriodo !== 'todos') {
        const days = parseInt(filterPeriodo);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        if (new Date(p.data) < cutoff) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.descricao.toLowerCase().includes(q) &&
          !p.obraNome.toLowerCase().includes(q) &&
          !p.categoria.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [pagamentos, filterObra, filterPeriodo, filterTipo, filterStatus, search, localPaidIds]);

  // Pendentes usa a lista completa (sem filtro de período) para não esconder pendentes antigos
  const pendentes = useMemo(
    () => (pagamentos ?? []).filter((p) => p.status === 'pendente' && !localPaidIds.has(p.id)),
    [pagamentos, localPaidIds]
  );

  const totalPages = Math.max(1, Math.ceil(filteredPagamentos.length / PAGE_SIZE));
  const paginated = filteredPagamentos.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const saldoPercent = kpi && kpi.totalContratado > 0
    ? Math.round((kpi.saldo / kpi.totalContratado) * 100)
    : 65;

  async function handleMarcarComoPago(id: string) {
    setLoadingId(id);
    // Simulate async operation (future: real API call)
    await new Promise((r) => setTimeout(r, 600));
    setLocalPaidIds((prev) => new Set([...prev, id]));
    setLoadingId(null);
  }

  const pillSelect =
    'appearance-none h-10 pl-4 pr-8 rounded-full bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300';

  return (
    <div className="p-10 flex flex-col gap-10">
      {/* Heading + Filtros */}
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tighter text-[#101819] dark:text-white">
            Pagamentos
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Controle financeiro de todas as suas obras</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select
              value={filterObra}
              onChange={(e) => { setFilterObra(e.target.value); setCurrentPage(1); }}
              className={pillSelect}
              data-testid="filter-obra"
            >
              <option value="todas">Todas as obras</option>
              {obras.map((obra) => (
                <option key={obra} value={obra}>{obra}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">›</span>
          </div>

          <div className="relative">
            <select
              value={filterPeriodo}
              onChange={(e) => { setFilterPeriodo(e.target.value); setCurrentPage(1); }}
              className={pillSelect}
              data-testid="filter-periodo"
            >
              <option value="30">Últimos 30 dias</option>
              <option value="60">Últimos 60 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="todos">Todos os períodos</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">›</span>
          </div>

          <div className="relative">
            <select
              value={filterTipo}
              onChange={(e) => { setFilterTipo(e.target.value); setCurrentPage(1); }}
              className={pillSelect}
              data-testid="filter-tipo"
            >
              <option value="todos">Tipo: Todos</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">›</span>
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className={pillSelect}
              data-testid="filter-status"
            >
              <option value="todos">Status: Todos</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="atrasado">Atrasado</option>
              <option value="agendado">Agendado</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">›</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoadingKPI ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))
        ) : (
          <>
            <StatsCard
              label="Entradas"
              value={formatCurrency(kpi?.totalEntradas ?? 0)}
              icon={RiArrowUpCircleLine}
              iconBgColor="bg-[#22846D]/10 text-[#22846D]"
              badge={{ label: '+12% mês', variant: 'success' }}
            />
            <StatsCard
              label="Saídas"
              value={formatCurrency(kpi?.totalSaidas ?? 0)}
              icon={RiArrowDownCircleLine}
              iconBgColor="bg-red-50 text-red-600"
              badge={{ label: '-8% mês', variant: 'red' }}
            />

            {/* Saldo Restante — custom com progress bar */}
            <div className="rounded-xl overflow-hidden">
              <Card className="h-full transition-colors">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
                    <RiWalletLine className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full text-gray-500 bg-gray-100">
                    {saldoPercent}% restante
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Restante</p>
                  <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                    {formatCurrency(kpi?.saldo ?? 0)}
                  </p>
                  <div className="mt-3 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.min(saldoPercent, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <StatsCard
              label="Total Contratado"
              value={formatCurrency(kpi?.totalContratado ?? 0)}
              icon={RiMoneyDollarCircleLine}
              iconBgColor="bg-primary/10 text-primary"
            />
          </>
        )}
      </div>

      {/* Gráfico de Evolução */}
      <PagamentosEvolutionChart pagamentos={pagamentos ?? []} />

      {/* Tabela de Transações */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-border-light dark:border-gray-800 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Histórico de Transações</h3>
          <p className="text-sm text-gray-500">Todas as movimentações financeiras</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative w-full max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔍</span>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-9 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 placeholder:text-gray-400"
              placeholder="Buscar transações..."
              type="text"
            />
          </div>
        </div>

        {/* Tabela */}
        {isLoadingPagamentos ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="pagamentos-table">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {['Data', 'Obra', 'Tipo', 'Descrição', 'Valor', 'Status', 'Ações'].map((h) => (
                      <th
                        key={h}
                        className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((pag, idx) => {
                    const effectiveStatus = localPaidIds.has(pag.id) ? 'pago' : pag.status;
                    return (
                      <tr
                        key={pag.id}
                        className={`border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''}`}
                        data-testid={`pagamento-row-${pag.id}`}
                      >
                        <td className="py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {formatDate(pag.data)}
                        </td>
                        <td className="py-4 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {pag.obraNome}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded-full ${
                              pag.tipo === 'entrada'
                                ? 'bg-[#22846D]/20 text-[#22846D]'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {pag.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {pag.descricao}
                        </td>
                        <td
                          className={`py-4 px-4 text-sm font-bold ${
                            pag.tipo === 'entrada' ? 'text-[#22846D]' : 'text-red-600'
                          }`}
                          data-testid={`pagamento-valor-${pag.id}`}
                        >
                          {pag.tipo === 'entrada' ? '+' : '-'} {formatCurrency(pag.valor)}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${
                              PAGAMENTO_STATUS_COLORS[effectiveStatus] || ''
                            }`}
                            data-testid={`pagamento-status-${pag.id}`}
                          >
                            {PAGAMENTO_STATUS_LABELS[effectiveStatus] || effectiveStatus}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => setSelectedPagamento(pag)}
                            className="text-gray-400 hover:text-primary transition-colors"
                            title="Ver detalhes"
                          >
                            <RiEyeLine className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400 dark:text-gray-500">
                        Nenhum pagamento encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                      page === currentPage
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagamentos Pendentes */}
      {pendentes.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-l-amber-500 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-base font-bold text-amber-800">Pagamentos Pendentes</h3>
              <p className="text-sm text-amber-700">
                Você tem {pendentes.length} pagamento{pendentes.length > 1 ? 's' : ''} aguardando confirmação
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {pendentes.map((pag) => (
              <div
                key={pag.id}
                className="flex items-center justify-between bg-white p-4 rounded-lg border border-amber-200"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <span className="text-amber-600 text-lg">🧾</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{pag.obraNome} — {pag.descricao}</p>
                    <p className="text-xs text-gray-500">Data: {formatDate(pag.data)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-lg font-extrabold text-gray-900">{formatCurrency(pag.valor)}</p>
                  <button
                    onClick={() => handleMarcarComoPago(pag.id)}
                    disabled={loadingId === pag.id}
                    className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loadingId === pag.id ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Marcar como pago'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de detalhes */}
      <Dialog open={!!selectedPagamento} onOpenChange={(open) => { if (!open) setSelectedPagamento(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Pagamento</DialogTitle>
            <DialogDescription>
              Informações completas sobre a transação selecionada.
            </DialogDescription>
          </DialogHeader>

          {selectedPagamento && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-2">
              {[
                { label: 'Obra', value: selectedPagamento.obraNome },
                { label: 'Data', value: formatDate(selectedPagamento.data) },
                { label: 'Descrição', value: selectedPagamento.descricao, full: true },
                { label: 'Categoria', value: selectedPagamento.categoria },
                { label: 'Método de Pagamento', value: selectedPagamento.metodoPagamento },
                { label: 'Valor', value: `${selectedPagamento.tipo === 'entrada' ? '+' : '-'} ${formatCurrency(selectedPagamento.valor)}` },
              ].map(({ label, value, full }) => (
                <div key={label} className={full ? 'col-span-2' : ''}>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
                </div>
              ))}

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Tipo</p>
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                  selectedPagamento.tipo === 'entrada'
                    ? 'bg-[#22846D]/20 text-[#22846D]'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {selectedPagamento.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Status</p>
                <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${
                  PAGAMENTO_STATUS_COLORS[localPaidIds.has(selectedPagamento.id) ? 'pago' : selectedPagamento.status] || ''
                }`}>
                  {PAGAMENTO_STATUS_LABELS[localPaidIds.has(selectedPagamento.id) ? 'pago' : selectedPagamento.status] || selectedPagamento.status}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPagamento(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
