'use client';

import { cn } from '@shared/lib/utils';
import type { CandidaturaRecebida } from '../types';

interface CandidaturasCardProps {
  candidaturas: CandidaturaRecebida[];
  obraOrcamento: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

const STATUS_LABELS: Record<CandidaturaRecebida['status'], string> = {
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

const STATUS_CLASSES: Record<CandidaturaRecebida['status'], string> = {
  em_analise: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  aprovado: 'bg-green-500/10 text-green-600 dark:text-green-400',
  rejeitado: 'bg-gray-200 dark:bg-gray-700 text-gray-500',
};

export function CandidaturasCard({ candidaturas, obraOrcamento }: CandidaturasCardProps) {
  const emAnalise = candidaturas.filter((c) => c.status === 'em_analise').length;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <span className="material-symbols-outlined text-primary">groups</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Propostas Recebidas</h2>
            <p className="text-xs text-gray-500">Empreiteiros interessados nesta obra</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
            {candidaturas.length} proposta{candidaturas.length !== 1 ? 's' : ''}
          </span>
          {emAnalise > 0 && (
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold px-3 py-1 rounded-full">
              {emAnalise} em análise
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-50 dark:divide-gray-800">
        {candidaturas.map((candidatura, index) => {
          const diffPct = Math.round(((candidatura.valorProposto - obraOrcamento) / obraOrcamento) * 100);
          const diffSign = diffPct > 0 ? '+' : '';
          const diffColor = diffPct > 5 ? 'text-red-500' : diffPct < -5 ? 'text-green-600' : 'text-gray-500';

          return (
            <div key={candidatura.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Rank */}
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-500">{index + 1}</span>
              </div>

              {/* Avatar + info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0', candidatura.empreiteiro.cor)}>
                  {candidatura.empreiteiro.iniciais}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{candidatura.empreiteiro.nome}</p>
                  {candidatura.empreiteiro.empresa && (
                    <p className="text-xs text-gray-500 truncate">{candidatura.empreiteiro.empresa}</p>
                  )}
                </div>
              </div>

              {/* Valor proposto */}
              <div className="flex-shrink-0 text-right sm:text-left">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Valor Proposto</p>
                <p className="text-sm font-extrabold text-gray-900 dark:text-white">{formatCurrency(candidatura.valorProposto)}</p>
                <p className={cn('text-[10px] font-bold', diffColor)}>{diffSign}{diffPct}% do orçamento</p>
              </div>

              {/* Prazo */}
              <div className="flex-shrink-0 text-right sm:text-left">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Prazo</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{candidatura.prazoMeses} meses</p>
                <p className="text-[10px] text-gray-400">{candidatura.dataEnvio}</p>
              </div>

              {/* Status */}
              <div className="flex-shrink-0">
                <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider', STATUS_CLASSES[candidatura.status])}>
                  {STATUS_LABELS[candidatura.status]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
        <span className="material-symbols-outlined text-gray-400 text-base">info</span>
        <p className="text-xs text-gray-500">
          Analise as propostas, compare valores e prazos, e selecione o empreiteiro ideal para sua obra.
        </p>
      </div>
    </div>
  );
}
