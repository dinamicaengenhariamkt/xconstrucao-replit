import { RiBankLine, RiAddCircleLine } from 'react-icons/ri';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import { formatCurrency } from '../utils';
import type { ValoresContratadosProps } from '../types';

interface ValoresContratadosExtendedProps extends ValoresContratadosProps {
  luminous?: boolean;
}

export function ValoresContratados({ data, luminous = false }: ValoresContratadosExtendedProps) {
  return (
    <Card
      className={cn(
        'border-border-light dark:border-gray-800',
        luminous && 'luminous-section border-transparent shadow-none',
      )}
    >
      <CardHeader>
        <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
          Valores Contratados
        </CardTitle>
        <CardDescription className="text-xs text-gray-500">
          Resumo financeiro geral
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Contratado */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Valor Total Contratado</span>
            <RiBankLine className="text-gray-400 w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
            {formatCurrency(data.totalContratado)}
          </p>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${data.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Aditivos — só quando existem de fato.
            Não há tabela de aditivos no schema, então o serviço devolve 0
            fixo; exibir "R$ 0,00 / +0% do valor original" para todo mundo
            sugeria um dado real que a plataforma não tem. Mesmo tratamento
            que os blocos vizinhos já davam (TabFinanceiro, FinanceiroSection). */}
        {data.aditivos > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Aditivos Contratuais</span>
              <RiAddCircleLine className="text-gray-400 w-4 h-4" />
            </div>
            <p className="text-2xl font-extrabold text-[#22846D]">
              {formatCurrency(data.aditivos)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-bold text-[#22846D]">+{data.aditivosPercent}%</span> do valor
              original
            </p>
          </div>
        )}

        {/* Executado / A executar */}
        <div className="pt-4 border-t border-border-light dark:border-gray-800 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 font-medium">Executado</p>
            <p className="text-lg font-extrabold text-gray-900 dark:text-gray-100">
              {formatCurrency(data.executado)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">A executar</p>
            <p className="text-lg font-extrabold text-gray-900 dark:text-gray-100">
              {formatCurrency(data.aExecutar)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
