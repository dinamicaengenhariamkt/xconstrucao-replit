'use client';

import { useState, useMemo } from 'react';
import { RiMoneyDollarCircleLine, RiArrowUpCircleLine, RiArrowDownCircleLine, RiTimeLine } from 'react-icons/ri';
import { PageHeader } from '@features/shared/components/PageHeader';
import { Skeleton } from '@shared/components/ui/skeleton';
import { usePagamentos, usePagamentosKPI } from '@features/contratante/pagamentos/hooks/use-pagamentos';
import { PAGAMENTO_STATUS_LABELS, PAGAMENTO_STATUS_COLORS } from '@features/contratante/pagamentos/constants';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export default function PagamentosPage() {
  const { data: pagamentos, isLoading: isLoadingPagamentos } = usePagamentos();
  const { data: kpi, isLoading: isLoadingKPI } = usePagamentosKPI();

  const [filterObra, setFilterObra] = useState('todas');
  const [filterPeriodo, setFilterPeriodo] = useState('30');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');

  const obras = useMemo(() => {
    if (!pagamentos) return [];
    const uniqueObras = [...new Set(pagamentos.map((p) => p.obraNome))];
    return uniqueObras.sort();
  }, [pagamentos]);

  const filteredPagamentos = useMemo(() => {
    if (!pagamentos) return [];
    return pagamentos.filter((p) => {
      if (filterObra !== 'todas' && p.obraNome !== filterObra) return false;
      if (filterTipo !== 'todos' && p.tipo !== filterTipo) return false;
      if (filterStatus !== 'todos' && p.status !== filterStatus) return false;
      if (filterPeriodo !== 'todos') {
        const days = parseInt(filterPeriodo);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        if (new Date(p.data) < cutoff) return false;
      }
      return true;
    });
  }, [pagamentos, filterObra, filterPeriodo, filterTipo, filterStatus]);

  const kpiCards = [
    {
      label: 'Entradas',
      value: kpi?.totalEntradas ?? 0,
      icon: RiArrowUpCircleLine,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
    },
    {
      label: 'Saidas',
      value: kpi?.totalSaidas ?? 0,
      icon: RiArrowDownCircleLine,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/30',
    },
    {
      label: 'Saldo',
      value: kpi?.saldo ?? 0,
      icon: RiMoneyDollarCircleLine,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      label: 'Pendentes',
      value: kpi?.pendentes ?? 0,
      icon: RiTimeLine,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/30',
    },
  ];

  const selectClass =
    'h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Pagamentos" subtitle="Gerencie os pagamentos e recebimentos das suas obras" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5"
            data-testid={`kpi-card-${card.label.toLowerCase()}`}
          >
            {isLoadingKPI ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-32" />
              </div>
            ) : (
              <>
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${card.bgColor} mb-3`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className={`text-xl font-bold mt-1 ${card.color}`} data-testid={`kpi-value-${card.label.toLowerCase()}`}>
                  {formatCurrency(card.value)}
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <select
            value={filterObra}
            onChange={(e) => setFilterObra(e.target.value)}
            className={selectClass}
            data-testid="filter-obra"
          >
            <option value="todas">Todas as obras</option>
            {obras.map((obra) => (
              <option key={obra} value={obra}>
                {obra}
              </option>
            ))}
          </select>

          <select
            value={filterPeriodo}
            onChange={(e) => setFilterPeriodo(e.target.value)}
            className={selectClass}
            data-testid="filter-periodo"
          >
            <option value="30">Ultimos 30 dias</option>
            <option value="60">Ultimos 60 dias</option>
            <option value="90">Ultimos 90 dias</option>
            <option value="todos">Todos</option>
          </select>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className={selectClass}
            data-testid="filter-tipo"
          >
            <option value="todos">Todos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saida</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={selectClass}
            data-testid="filter-status"
          >
            <option value="todos">Todos</option>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
            <option value="atrasado">Atrasado</option>
            <option value="agendado">Agendado</option>
          </select>
        </div>

        {isLoadingPagamentos ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="pagamentos-table">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-gray-500 dark:text-gray-400">
                  <th className="pb-3 font-medium">Descricao</th>
                  <th className="pb-3 font-medium">Obra</th>
                  <th className="pb-3 font-medium">Data</th>
                  <th className="pb-3 font-medium text-right">Valor</th>
                  <th className="pb-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPagamentos.map((pag) => (
                  <tr
                    key={pag.id}
                    className="border-b border-gray-50 dark:border-gray-800/50 hover-elevate"
                    data-testid={`pagamento-row-${pag.id}`}
                  >
                    <td className="py-3 text-gray-800 dark:text-gray-200">{pag.descricao}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{pag.obraNome}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{formatDate(pag.data)}</td>
                    <td
                      className={`py-3 text-right font-medium ${
                        pag.tipo === 'entrada' ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'
                      }`}
                      data-testid={`pagamento-valor-${pag.id}`}
                    >
                      {pag.tipo === 'entrada' ? '+' : '-'} {formatCurrency(pag.valor)}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${
                          PAGAMENTO_STATUS_COLORS[pag.status] || ''
                        }`}
                        data-testid={`pagamento-status-${pag.id}`}
                      >
                        {PAGAMENTO_STATUS_LABELS[pag.status] || pag.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredPagamentos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 dark:text-gray-500">
                      Nenhum pagamento encontrado com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
