'use client';

import { Badge } from '@shared/components/ui/badge';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { cn } from '@shared/lib/utils';
import { formatCurrency } from '@features/admin/financeiro/utils';
import { useMovimentacoes } from '../hooks/use-caixa';
import type { Movimentacao, CaixaPeriodo, DateRange } from '../types';

const STATUS_CLASSES: Record<string, string> = {
  confirmado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pendente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  cancelado: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  confirmado: 'Confirmado',
  pendente: 'Pendente',
  cancelado: 'Cancelado',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function MovimentacaoRow({ mov }: { mov: Movimentacao }) {
  const isEntrada = mov.tipo === 'entrada';
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">{formatDate(mov.data)}</TableCell>
      <TableCell>
        <Badge
          variant="secondary"
          className={cn(
            'no-default-hover-elevate no-default-active-elevate',
            isEntrada
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          )}
        >
          {isEntrada ? 'Entrada' : 'Saída'}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[200px] truncate">{mov.descricao}</TableCell>
      <TableCell>{mov.categoria}</TableCell>
      <TableCell className="font-mono text-xs">{mov.referencia}</TableCell>
      <TableCell
        className={cn(
          'text-right font-semibold whitespace-nowrap',
          isEntrada ? 'text-[#22846D]' : 'text-red-600 dark:text-red-400'
        )}
      >
        {isEntrada ? '+' : '-'} {formatCurrency(mov.valor)}
      </TableCell>
      <TableCell>
        <Badge
          variant="secondary"
          className={cn('no-default-hover-elevate no-default-active-elevate', STATUS_CLASSES[mov.status])}
        >
          {STATUS_LABELS[mov.status]}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

interface MovimentacoesTableProps {
  periodo: CaixaPeriodo;
  customRange?: DateRange;
}

export function MovimentacoesTable({ periodo, customRange }: MovimentacoesTableProps) {
  const { data: movimentacoes } = useMovimentacoes(periodo, customRange);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Movimentações recentes
        </h2>
        <p className="text-sm text-muted-foreground">Últimas entradas e saídas do caixa</p>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Referência</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(movimentacoes ?? []).map((mov) => (
              <MovimentacaoRow key={mov.id} mov={mov} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
