'use client';

import { cn } from '@shared/lib/utils';
import { formatCurrencyRounded as formatCurrency } from '@shared/lib/formatters';
import type { ObraFinanceiro, ObraMedicao } from '../types';

const MEDICAO_BADGE: Record<ObraMedicao['status'], { label: string; classes: string; rowBorder?: string }> = {
  aprovada: { label: 'Aprovada', classes: 'text-success bg-success/10' },
  aguardando: { label: 'Aguardando', classes: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', rowBorder: 'border-l-4 border-amber-500' },
  rejeitada: { label: 'Rejeitada', classes: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
};

const MEDICAO_DOT: Record<ObraMedicao['status'], string> = {
  aprovada: 'bg-success/20 text-success',
  aguardando: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30',
  rejeitada: 'bg-red-100 text-red-600 dark:bg-red-900/30',
};

interface FinanceiroSectionProps {
  financeiro: ObraFinanceiro;
}

export function FinanceiroSection({ financeiro }: FinanceiroSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Resumo Financeiro</h3>
          <p className="text-sm text-gray-500">Visão gerencial de valores (somente leitura)</p>
        </div>
        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">lock</span>
          Visualização
        </span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="p-5 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900 rounded-xl border-l-4 border-blue-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Valor Contratado</p>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-2">{formatCurrency(financeiro.valorContratado)}</p>
        </div>
        <div className="p-5 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-900 rounded-xl border-l-4 border-purple-500">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aditivos</p>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-2">{formatCurrency(financeiro.aditivos)}</p>
          {financeiro.aditivos > 0 && (
            <p className="text-xs text-purple-600 font-medium mt-1">
              +{Math.round((financeiro.aditivos / financeiro.valorContratado) * 100)}% do original
            </p>
          )}
        </div>
        <div className="p-5 bg-gradient-to-br from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border-l-4 border-primary">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Valor Total</p>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-2">{formatCurrency(financeiro.valorTotal)}</p>
        </div>
        <div className="p-5 bg-gradient-to-br from-success/10 to-white dark:from-success/20 dark:to-gray-900 rounded-xl border-l-4 border-success">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Saldo a Receber</p>
          <p className="text-2xl font-extrabold text-success mt-2">{formatCurrency(financeiro.saldoReceber)}</p>
        </div>
      </div>

      {/* Medições */}
      {financeiro.medicoes.length > 0 && (
        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl mb-6">
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Medições Realizadas</h4>
          <div className="space-y-3">
            {financeiro.medicoes.map((medicao) => {
              const badge = MEDICAO_BADGE[medicao.status];
              const dot = MEDICAO_DOT[medicao.status];
              return (
                <div key={medicao.id} className={cn('flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg', badge.rowBorder)}>
                  <div className="flex items-center gap-3">
                    <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold', dot)}>
                      #{medicao.numero}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">Medição #{medicao.numero}</p>
                      <p className="text-xs text-gray-500">{medicao.data} - {formatCurrency(medicao.valor)}</p>
                    </div>
                  </div>
                  <span className={cn('text-[10px] font-bold px-2 py-1 rounded', badge.classes)}>{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Percentual Recebido</span>
            <span className="text-lg font-extrabold text-success">{financeiro.percentualRecebido}%</span>
          </div>
          <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-success rounded-full" style={{ width: `${financeiro.percentualRecebido}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {formatCurrency(financeiro.valorTotal * financeiro.percentualRecebido / 100)} de {formatCurrency(financeiro.valorTotal)}
          </p>
        </div>
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Percentual Executado</span>
            <span className="text-lg font-extrabold text-primary">{financeiro.percentualExecutado}%</span>
          </div>
          <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${financeiro.percentualExecutado}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">Alinhado com medições</p>
        </div>
      </div>

      {/* Informativo */}
      {financeiro.percentualRecebido >= financeiro.percentualExecutado - 5 && (
        <div className="mt-6 p-4 bg-success/10 border border-success/30 rounded-xl flex items-start gap-3">
          <div className="p-2 bg-success/20 rounded-lg flex-shrink-0">
            <span className="material-symbols-outlined text-success">check_circle</span>
          </div>
          <div>
            <p className="text-sm font-bold text-success">Pagamentos em dia</p>
            <p className="text-xs text-success mt-1">O percentual recebido está alinhado com o percentual executado.</p>
          </div>
        </div>
      )}
    </div>
  );
}
