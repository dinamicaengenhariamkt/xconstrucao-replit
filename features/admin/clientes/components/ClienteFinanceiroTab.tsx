'use client';

import { cn } from '@shared/lib/utils';
import { Skeleton } from '@shared/components/ui/skeleton';
import { RiDownload2Line, RiLineChartLine } from 'react-icons/ri';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { ClienteFinanceiro, ClientePagamento, PagamentoStatus } from '../types';
import { formatCurrency } from '@shared/lib/formatters';

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

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('pt-BR');

function buildChartData(pagamentos: ClientePagamento[]) {
  const map: Record<string, { mes: string; recebido: number; aReceber: number }> = {};
  for (const p of pagamentos) {
    const date = new Date(p.data);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    if (!map[key]) map[key] = { mes: label, recebido: 0, aReceber: 0 };
    if (p.status === 'pago') map[key].recebido += p.valor;
    else map[key].aReceber += p.valor;
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

interface ClienteFinanceiroTabProps {
  financeiro: ClienteFinanceiro | undefined;
  isLoading: boolean;
}

export function ClienteFinanceiroTab({ financeiro, isLoading }: ClienteFinanceiroTabProps) {
  function handleDownloadComprovante(pagamento: ClientePagamento) {
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF({ unit: 'mm', format: 'a5' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('COMPROVANTE DE PAGAMENTO', 74, 20, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`ID: ${pagamento.id}`,                       14, 38);
      doc.text(`Data: ${formatDate(pagamento.data)}`,       14, 46);
      doc.text(`Descrição: ${pagamento.descricao}`,         14, 54);
      doc.text(`Valor: ${formatCurrency(pagamento.valor)}`, 14, 62);
      doc.text(`Status: Pago`,                              14, 70);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
        74, 130, { align: 'center' },
      );
      doc.save(`comprovante-${pagamento.id}.pdf`);
    });
  }

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

      {/* Chart */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">
          Entradas vs A Receber
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={buildChartData(financeiro.pagamentos)} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="recebido" name="Recebido"  fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="aReceber" name="A receber" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
                          onClick={() => handleDownloadComprovante(pagamento)}
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
