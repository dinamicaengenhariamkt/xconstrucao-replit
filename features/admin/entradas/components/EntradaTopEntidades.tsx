'use client';

import { Card } from '@shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import type { EntradaTopItem } from '../types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

interface TopTableProps {
  title: string;
  description: string;
  entityLabel: string;
  items: EntradaTopItem[];
}

function TopTable({ title, description, entityLabel, items }: TopTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
              <TableHead className="text-xs font-bold uppercase tracking-wider">{entityLabel}</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider">Nº de obras</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider">Total de entradas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.nome} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                <TableCell className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {item.nome}
                </TableCell>
                <TableCell className="text-sm text-gray-700 dark:text-gray-300">
                  {item.obras}
                </TableCell>
                <TableCell className="text-sm font-semibold text-[#22846D]">
                  {formatCurrency(item.totalEntradas)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

interface EntradaTopEntidadesProps {
  clientes: EntradaTopItem[];
  empreiteiras: EntradaTopItem[];
}

export function EntradaTopEntidades({ clientes, empreiteiras }: EntradaTopEntidadesProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <TopTable
        title="Top clientes por receita"
        description="Clientes com maior volume de entradas no período"
        entityLabel="Cliente"
        items={clientes}
      />
      <TopTable
        title="Top empreiteiras por receita"
        description="Empreiteiras com maior volume de entradas no período"
        entityLabel="Empreiteira"
        items={empreiteiras}
      />
    </div>
  );
}
