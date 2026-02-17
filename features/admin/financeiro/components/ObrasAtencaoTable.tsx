import { cn } from '@shared/lib/utils';
import type { ObrasAtencaoTableProps, ProgressBarProps } from '../types';
import { SITUACAO_CONFIG } from '../constants';
import { formatCurrency } from '../utils';

function ProgressBar({ percent }: ProgressBarProps) {
  const barColor =
    percent >= 70 ? 'bg-[#22846D]' : percent >= 40 ? 'bg-[#F5A623]' : 'bg-[#E53935]';

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{percent}%</span>
    </div>
  );
}

export function ObrasAtencaoTable({ obras }: ObrasAtencaoTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-border-light dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">
                Obra
              </th>
              <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">
                Cliente
              </th>
              <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">
                Empreiteira
              </th>
              <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">
                Valor contratado
              </th>
              <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">
                Valor pago
              </th>
              <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">
                % Concluído
              </th>
              <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">
                Situação
              </th>
              <th className="text-right py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {obras.map((obra, idx) => {
              const config = SITUACAO_CONFIG[obra.situacao];
              const isLast = idx === obras.length - 1;
              return (
                <tr
                  key={obra.id}
                  className={cn(
                    'hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors',
                    !isLast && 'border-b border-gray-50 dark:border-gray-800'
                  )}
                >
                  <td className="py-4 px-6">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {obra.nome}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Cód. {obra.codigo}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{obra.cliente}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{obra.empreiteira}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(obra.valorContratado)}
                    </p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(obra.valorPago)}
                    </p>
                  </td>
                  <td className="py-4 px-6">
                    <ProgressBar percent={obra.percentConcluido} />
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={cn(
                        'inline-flex px-3 py-1 rounded-full text-xs font-bold',
                        config.className
                      )}
                    >
                      {config.label}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <a
                      href="#"
                      className="text-sm font-bold text-[#1E88E5] hover:underline"
                    >
                      Ver detalhes
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
