'use client';

import { RiReceiptLine, RiBarChartBoxLine, RiVipCrownLine, RiToolsLine } from 'react-icons/ri';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import type { ReceitaPlataforma, ReceitaTipo } from '../types';
import { formatCurrency } from '../utils';
import { cn } from '@shared/lib/utils';

interface ReceitasPlataformaTableProps {
  receitas: ReceitaPlataforma[];
  total: number;
}

const tipoIconMap: Record<ReceitaTipo, React.ElementType> = {
  medicoes: RiBarChartBoxLine,
  assinatura: RiVipCrownLine,
  outros: RiToolsLine,
};

export function ReceitasPlataformaTable({ receitas, total }: ReceitasPlataformaTableProps) {
  return (
    <Card className="border-border-light dark:border-gray-800 overflow-hidden">
      <CardHeader className="border-b border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
              Resumo de receitas da plataforma
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 mt-0.5">
              Fontes de receita da XConstrução no período
            </CardDescription>
          </div>
          <RiReceiptLine className="w-5 h-5 text-gray-400" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">
                  Tipo de receita
                </th>
                <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">
                  Valor
                </th>
                <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">
                  % do total
                </th>
              </tr>
            </thead>
            <tbody>
              {receitas.map((receita, idx) => {
                const Icon = tipoIconMap[receita.tipo];
                const isLast = idx === receitas.length - 1;
                return (
                  <tr
                    key={receita.id}
                    className={cn(
                      'hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors',
                      !isLast && 'border-b border-gray-50 dark:border-gray-800'
                    )}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg', receita.iconColor)}>
                          <Icon className="w-[18px] h-[18px]" />
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {receita.nome}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(receita.valor)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', receita.barColor)}
                            style={{ width: `${receita.percentTotal}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {receita.percentTotal.toFixed(1).replace('.', ',')}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Total footer */}
        <div className="px-6 py-5 bg-gray-50/80 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Total de taxas no período
          </span>
          <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
            {formatCurrency(total)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
