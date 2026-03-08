'use client';

import { useState } from 'react';
import { cn } from '@shared/lib/utils';
import { formatCurrencyRounded as formatCurrency } from '@shared/lib/formatters';
import type { ObraContratanteDetalhe, ObraMedicaoContratante } from '../types';

interface TabFinanceiroProps {
  obra: ObraContratanteDetalhe;
}

const STATUS_CONFIG: Record<ObraMedicaoContratante['status'], { label: string; badge: string; rowBorder?: string }> = {
  aprovada: {
    label: 'Aprovada',
    badge: 'bg-success/10 text-success',
  },
  aguardando_aprovacao: {
    label: 'Aguardando Aprovação',
    badge: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
    rowBorder: 'border-l-4 border-amber-500',
  },
  rejeitada: {
    label: 'Rejeitada',
    badge: 'bg-red-50 text-red-600 dark:bg-red-900/20',
  },
};

const NUM_BADGE: Record<ObraMedicaoContratante['status'], string> = {
  aprovada: 'bg-success/20 text-success',
  aguardando_aprovacao: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30',
  rejeitada: 'bg-red-100 text-red-600 dark:bg-red-900/30',
};

export function TabFinanceiro({ obra }: TabFinanceiroProps) {
  const { financeiro } = obra;
  const [overrides, setOverrides] = useState<Record<string, 'aprovada' | 'rejeitada'>>({});

  const getStatus = (m: ObraMedicaoContratante): ObraMedicaoContratante['status'] =>
    overrides[m.id] ?? m.status;

  const handleAprovar = (id: string) =>
    setOverrides((prev) => ({ ...prev, [id]: 'aprovada' }));

  const handleRejeitar = (id: string) =>
    setOverrides((prev) => ({ ...prev, [id]: 'rejeitada' }));

  const pendentes = financeiro.medicoes.filter((m) => getStatus(m) === 'aguardando_aprovacao').length;
  const aLiberar = financeiro.valorTotal - financeiro.valorPago;

  return (
    <div className="flex flex-col gap-6" data-testid="tab-content-financeiro">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900 rounded-xl border-l-4 border-blue-500 border border-blue-100 dark:border-blue-900/30">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Valor Contratado</p>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-2">{formatCurrency(financeiro.valorContratado)}</p>
          {financeiro.aditivos > 0 && (
            <p className="text-xs text-blue-500 font-medium mt-1">
              + {formatCurrency(financeiro.aditivos)} em aditivos
            </p>
          )}
        </div>

        <div className="p-5 bg-gradient-to-br from-success/10 to-white dark:from-success/20 dark:to-gray-900 rounded-xl border-l-4 border-success border border-success/20">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Pago</p>
          <p className="text-2xl font-extrabold text-success mt-2">{formatCurrency(financeiro.valorPago)}</p>
          {financeiro.valorTotal > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((financeiro.valorPago / financeiro.valorTotal) * 100)}% do total
            </p>
          )}
        </div>

        <div className="p-5 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-900 rounded-xl border-l-4 border-amber-500 border border-amber-100 dark:border-amber-900/30">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">A Liberar</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-2">{formatCurrency(aLiberar)}</p>
          <p className="text-xs text-gray-500 mt-1">valor restante</p>
        </div>

        <div className={cn(
          'p-5 rounded-xl border-l-4 border',
          pendentes > 0
            ? 'bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-900 border-red-500 border-red-100 dark:border-red-900/30'
            : 'bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-gray-300 border-gray-100 dark:border-gray-700'
        )}>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pendentes</p>
          <p className={cn('text-2xl font-extrabold mt-2', pendentes > 0 ? 'text-red-600' : 'text-gray-400')}>{pendentes}</p>
          <p className="text-xs text-gray-500 mt-1">aguardando aprovação</p>
        </div>
      </div>

      {/* Medições */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Medições</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {financeiro.medicoes.length === 0
                ? 'Nenhuma medição enviada pelo empreiteiro ainda'
                : `${financeiro.medicoes.length} medição${financeiro.medicoes.length > 1 ? 'ões' : ''} no total`}
            </p>
          </div>
          {pendentes > 0 && (
            <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full">
              {pendentes} aguardando
            </span>
          )}
        </div>

        {financeiro.medicoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-gray-400 text-2xl">receipt_long</span>
            </div>
            <p className="text-sm font-semibold text-gray-500">Nenhuma medição enviada</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              O empreiteiro ainda não submeteu medições para esta obra. Você será notificado quando houver algo para aprovar.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {financeiro.medicoes.map((medicao) => {
              const status = getStatus(medicao);
              const cfg = STATUS_CONFIG[status];
              const numCls = NUM_BADGE[status];
              const isAguardando = status === 'aguardando_aprovacao';

              return (
                <div
                  key={medicao.id}
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors',
                    cfg.rowBorder
                  )}
                  data-testid={`medicao-row-${medicao.id}`}
                >
                  {/* Número */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0', numCls)}>
                      #{medicao.numero}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        Medição #{medicao.numero} — {medicao.periodo}
                      </p>
                      {medicao.descricao && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{medicao.descricao}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">Enviada em {medicao.dataEnvio}</p>
                    </div>
                  </div>

                  {/* Valor + status + ações */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                    <p className="text-base font-extrabold text-gray-900 dark:text-white">
                      {formatCurrency(medicao.valor)}
                    </p>

                    <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap', cfg.badge)}>
                      {cfg.label}
                    </span>

                    {isAguardando && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAprovar(medicao.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-success hover:bg-success/90 transition-colors cursor-pointer"
                          data-testid={`btn-aprovar-${medicao.id}`}
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleRejeitar(medicao.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                          data-testid={`btn-rejeitar-${medicao.id}`}
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Barra de progresso financeiro */}
      {financeiro.valorTotal > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Execução Financeira</span>
            <span className="text-lg font-extrabold text-success">
              {Math.round((financeiro.valorPago / financeiro.valorTotal) * 100)}%
            </span>
          </div>
          <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.round((financeiro.valorPago / financeiro.valorTotal) * 100))}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-xs text-gray-500">{formatCurrency(financeiro.valorPago)} pagos</p>
            <p className="text-xs text-gray-500">{formatCurrency(financeiro.valorTotal)} total</p>
          </div>
        </div>
      )}
    </div>
  );
}
