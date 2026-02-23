'use client';

import { cn } from '@shared/lib/utils';
import { Skeleton } from '@shared/components/ui/skeleton';
import { RiDownload2Line, RiLineChartLine } from 'react-icons/ri';
import type { ClienteFinanceiro, PagamentoStatus } from '../types';

const PAGAMENTO_STATUS_CONFIG: Record<PagamentoStatus, { label: string; className: string }> = {
  pago: {
    label: 'Pago',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  },
  pendente: {
    label: 'Pendente',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  },
  atrasado: {
    label: 'Atrasado',
    className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('pt-BR');

interface ClienteFinanceiroTabProps {
  financeiro: ClienteFinanceiro | undefined;
  isLoading: boolean;
}

export function ClienteFinanceiroTab({ financeiro, isLoading }: ClienteFinanceiroTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!financeiro) {
    return (
      <div className="text-center py-12">
        <RiLineChartLine className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Sem dados financeiros</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
          <p className="text-sm text-muted-foreground font-medium">Total Pago</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
            {formatCurrency(financeiro.totalPago)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
          <p className="text-sm text-muted-foreground font-medium">Saldo Pendente</p>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2 tabular-nums">
            {formatCurrency(financeiro.saldoPendente)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
          <p className="text-sm text-muted-foreground font-medium">Próximo Vencimento</p>
          {financeiro.proximoVencimento ? (
            <>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-2 tabular-nums">
                {formatDate(financeiro.proximoVencimento)}
              </p>
              {financeiro.valorProximoVencimento && (
                <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                  {formatCurrency(financeiro.valorProximoVencimento)}
                </p>
              )}
            </>
          ) : (
            <p className="text-2xl font-extrabold text-gray-400 dark:text-gray-500 mt-2">—</p>
          )}
        </div>
      </div>

      {/* Chart placeholder */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 flex items-center justify-center min-h-[180px]">
        <div className="text-center">
          <RiLineChartLine className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Gráfico de Entradas vs Saídas</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Em breve</p>
        </div>
      </div>

      {/* Payment history */}
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Histórico de Pagamentos</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Data</th>
                <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Descrição</th>
                <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Valor</th>
                <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Status</th>
                <th className="text-right py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Comprovante</th>
              </tr>
            </thead>
            <tbody>
              {financeiro.pagamentos.map((pagamento, index) => {
                const statusCfg = PAGAMENTO_STATUS_CONFIG[pagamento.status];
                return (
                  <tr
                    key={pagamento.id}
                    className={cn(
                      'hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors',
                      index < financeiro.pagamentos.length - 1 && 'border-b border-gray-50 dark:border-gray-800/60',
                    )}
                  >
                    <td className="py-4 px-4 text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                      {formatDate(pagamento.data)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 dark:text-white">{pagamento.descricao}</td>
                    <td className="py-4 px-4 text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                      {formatCurrency(pagamento.valor)}
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-bold', statusCfg.className)}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {pagamento.status === 'pago' ? (
                        <button
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary dark:hover:text-white transition-colors cursor-pointer"
                          title="Baixar comprovante"
                        >
                          <RiDownload2Line className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
