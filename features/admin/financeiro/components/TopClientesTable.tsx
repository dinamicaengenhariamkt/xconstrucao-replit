'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import type { TopCliente } from '../types';
import { formatCurrency } from '../utils';
import { cn } from '@shared/lib/utils';

interface TopClientesTableProps {
  clientes: TopCliente[];
}

export function TopClientesTable({ clientes }: TopClientesTableProps) {
  return (
    <Card className="border-border-light dark:border-gray-800 overflow-hidden">
      <CardHeader className="border-b border-gray-100 dark:border-gray-800">
        <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
          Top clientes por volume
        </CardTitle>
        <CardDescription className="text-xs text-gray-500">
          Maiores contratantes da plataforma
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                <th className="text-left py-3 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">
                  Cliente
                </th>
                <th className="text-left py-3 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">
                  Obras
                </th>
                <th className="text-left py-3 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">
                  Vol. contratado
                </th>
                <th className="text-left py-3 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">
                  Pago
                </th>
                <th className="text-left py-3 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente, idx) => {
                const isLast = idx === clientes.length - 1;
                return (
                  <tr
                    key={cliente.id}
                    className={cn(
                      'hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors',
                      !isLast && 'border-b border-gray-50 dark:border-gray-800'
                    )}
                  >
                    <td className="py-3 px-6 text-sm font-bold text-gray-900 dark:text-gray-100">
                      {cliente.nome}
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-700 dark:text-gray-300">
                      {cliente.obras}
                    </td>
                    <td className="py-3 px-6 text-sm font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(cliente.volContratado)}
                    </td>
                    <td className="py-3 px-6 text-sm font-semibold text-[#22846D]">
                      {formatCurrency(cliente.pago)}
                    </td>
                    <td className="py-3 px-6 text-sm font-semibold text-amber-600">
                      {formatCurrency(cliente.saldo)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
