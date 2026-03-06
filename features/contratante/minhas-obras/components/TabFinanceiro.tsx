'use client';

import { cn } from '@shared/lib/utils';
import type { ObraContratanteDetalhe } from '../types';

interface TabFinanceiroProps {
  obra: ObraContratanteDetalhe;
}

const STATUS_COLORS: Record<string, string> = {
  pago: 'bg-success/10 text-success',
  pendente: 'bg-warning/10 text-warning',
  atrasado: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  atrasado: 'Atrasado',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

export function TabFinanceiro({ obra }: TabFinanceiroProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden" data-testid="tab-content-financeiro">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Descrição</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Categoria</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Data</th>
              <th className="text-right px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Valor</th>
              <th className="text-center px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {obra.financeiro.map((item) => (
              <tr key={item.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.descricao}</td>
                <td className="px-6 py-4 text-gray-500">{item.categoria}</td>
                <td className="px-6 py-4 text-gray-500">{item.data}</td>
                <td className={cn('px-6 py-4 text-right font-bold', item.tipo === 'entrada' ? 'text-success' : 'text-gray-900 dark:text-white')}>
                  {item.tipo === 'entrada' ? '+' : '-'} {formatCurrency(item.valor)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={cn('inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase', STATUS_COLORS[item.status])}>
                    {STATUS_LABELS[item.status]}
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
