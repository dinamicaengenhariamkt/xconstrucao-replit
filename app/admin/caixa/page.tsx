'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  RiWalletLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiLineChartLine,
} from 'react-icons/ri';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Button } from '@shared/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@shared/components/ui/table';
import { cn } from '@shared/lib/utils';
import type { CaixaPeriodo, Movimentacao } from '@features/admin/caixa/types';
import { useCaixaResumo, useMovimentacoes } from '@features/admin/caixa/hooks/use-caixa';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const statusClasses: Record<string, string> = {
  confirmado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pendente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  cancelado: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const statusLabels: Record<string, string> = {
  confirmado: 'Confirmado',
  pendente: 'Pendente',
  cancelado: 'Cancelado',
};

const periodoOptions: { value: CaixaPeriodo; label: string }[] = [
  { value: '7dias', label: 'Últimos 7 dias' },
  { value: '30dias', label: 'Últimos 30 dias' },
  { value: '3meses', label: 'Últimos 3 meses' },
];

function CaixaSkeleton() {
  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <Skeleton className="h-11 w-11 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-9 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminCaixaPage() {
  const [periodo, setPeriodo] = useState<CaixaPeriodo>('30dias');
  const { data: resumo, isLoading: isLoadingResumo } = useCaixaResumo();
  const { data: movimentacoes, isLoading: isLoadingMovimentacoes } = useMovimentacoes();

  const isLoading = isLoadingResumo || isLoadingMovimentacoes;

  const kpiCards = useMemo(() => {
    if (!resumo) return [];
    return [
      {
        label: 'Saldo Atual',
        value: formatCurrency(resumo.saldoAtual),
        icon: RiWalletLine,
        iconBg: 'bg-primary/10 text-primary',
      },
      {
        label: 'Entradas do Mês',
        value: formatCurrency(resumo.entradasMes),
        icon: RiArrowUpLine,
        iconBg: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      },
      {
        label: 'Saídas do Mês',
        value: formatCurrency(resumo.saidasMes),
        icon: RiArrowDownLine,
        iconBg: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
      },
      {
        label: 'Previsão Próx. Mês',
        value: formatCurrency(resumo.previsaoProximoMes),
        icon: RiLineChartLine,
        iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      },
    ];
  }, [resumo]);

  if (isLoading) {
    return <CaixaSkeleton />;
  }

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-page-title">
          Caixa
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fluxo de caixa consolidado
        </p>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
        initial="hidden"
        animate="show"
      >
        {kpiCards.map((kpi) => (
          <motion.div
            key={kpi.label}
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          >
            <Card className="h-full" data-testid={`card-kpi-${kpi.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <div className={cn('p-3 rounded-lg', kpi.iconBg)}>
                  <kpi.icon className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm font-medium text-muted-foreground mb-1">{kpi.label}</p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex flex-wrap items-center gap-2">
        {periodoOptions.map((opt) => (
          <Button
            key={opt.value}
            variant={periodo === opt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriodo(opt.value)}
            data-testid={`button-periodo-${opt.value}`}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Movimentações recentes
          </h2>
          <p className="text-sm text-muted-foreground">
            Últimas entradas e saídas do caixa
          </p>
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
              {(movimentacoes ?? []).map((mov: Movimentacao) => (
                <TableRow key={mov.id} data-testid={`row-movimentacao-${mov.id}`}>
                  <TableCell className="whitespace-nowrap">{formatDate(mov.data)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'no-default-hover-elevate no-default-active-elevate',
                        mov.tipo === 'entrada'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      )}
                      data-testid={`badge-tipo-${mov.id}`}
                    >
                      {mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{mov.descricao}</TableCell>
                  <TableCell>{mov.categoria}</TableCell>
                  <TableCell className="font-mono text-xs">{mov.referencia}</TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-semibold whitespace-nowrap',
                      mov.tipo === 'entrada' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {mov.tipo === 'entrada' ? '+' : '-'} {formatCurrency(mov.valor)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn('no-default-hover-elevate no-default-active-elevate', statusClasses[mov.status])}
                      data-testid={`badge-status-${mov.id}`}
                    >
                      {statusLabels[mov.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
