'use client';

import { cn } from '@shared/lib/utils';
import { formatCurrency } from '@shared/lib/formatters';
import type { ObraPublicaPagamentos } from '../types';

/**
 * XG30 — o que o cliente pagou e o que falta pagar.
 *
 * Só existe no link em que o dono ligou "Pagamentos". A projeção já entrega
 * apenas o lado do recebimento; aqui não há nada a filtrar, só a exibir.
 */
const STATUS: Record<ObraPublicaPagamentos['parcelas'][number]['status'], { label: string; classe: string }> = {
  pago: { label: 'Pago', classe: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  pendente: { label: 'A pagar', classe: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
  atrasado: { label: 'Atrasado', classe: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

function formatarData(valor: string): string {
  const somenteData = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (somenteData) return `${somenteData[3]}/${somenteData[2]}/${somenteData[1]}`;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? valor : data.toLocaleDateString('pt-BR');
}

export function TabPagamentosPublica({ pagamentos }: { pagamentos: ObraPublicaPagamentos }) {
  const resumo = [
    { label: 'Valor da obra', valor: pagamentos.valorTotal, destaque: 'text-gray-900 dark:text-white' },
    { label: 'Pago', valor: pagamentos.recebido, destaque: 'text-emerald-700 dark:text-emerald-400' },
    { label: 'Falta pagar', valor: pagamentos.saldo, destaque: 'text-gray-900 dark:text-white' },
  ];

  return (
    <div className="space-y-5" data-testid="obra-publica-pagamentos">
      <dl className="grid gap-3 sm:grid-cols-3">
        {resumo.map((item) => (
          <div key={item.label} className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
            <dt className="text-xs font-bold uppercase tracking-wider text-gray-500">{item.label}</dt>
            <dd className={cn('mt-1 text-lg font-extrabold', item.destaque)}>{formatCurrency(item.valor)}</dd>
          </div>
        ))}
      </dl>

      {pagamentos.parcelas.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">Nenhum pagamento registrado ainda.</p>
      ) : (
        <ul className="space-y-3">
          {pagamentos.parcelas.map((parcela) => {
            const status = STATUS[parcela.status];
            return (
              <li
                key={parcela.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 p-4 dark:border-gray-800"
              >
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 break-words dark:text-white">{parcela.descricao}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {parcela.pagoEm
                      ? `Pago em ${formatarData(parcela.pagoEm)}`
                      : parcela.vencimento
                        ? `Vence em ${formatarData(parcela.vencimento)}`
                        : 'Sem vencimento definido'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(parcela.valor)}</span>
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', status.classe)}>
                    {status.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
