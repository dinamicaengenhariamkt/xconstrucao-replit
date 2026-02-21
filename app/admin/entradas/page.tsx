'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  RiMoneyDollarCircleLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiArrowUpLine,
  RiAddLine,
  RiSearchLine,
} from 'react-icons/ri';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@shared/components/ui/table';
import { cn } from '@shared/lib/utils';
import type { EntradaCategoria, Entrada } from '@features/admin/entradas/types';
import { useEntradaResumo, useEntradas } from '@features/admin/entradas/hooks/use-entradas';

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

const categoriaLabels: Record<EntradaCategoria, string> = {
  medicao: 'Medição',
  assinatura: 'Assinatura',
  taxa: 'Taxa',
  multa: 'Multa',
  outros: 'Outros',
};

const categoriaClasses: Record<EntradaCategoria, string> = {
  medicao: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  assinatura: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  taxa: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  multa: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  outros: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

type FilterCategoria = 'todas' | EntradaCategoria;

const filterOptions: { value: FilterCategoria; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'medicao', label: 'Medição' },
  { value: 'assinatura', label: 'Assinatura' },
  { value: 'taxa', label: 'Taxa' },
  { value: 'multa', label: 'Multa' },
  { value: 'outros', label: 'Outros' },
];

function EntradasSkeleton() {
  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-5 w-56" />
        </div>
        <Skeleton className="h-9 w-40 rounded-md" />
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

export default function AdminEntradasPage() {
  const [categoriaFilter, setCategoriaFilter] = useState<FilterCategoria>('todas');
  const [search, setSearch] = useState('');
  const { data: resumo, isLoading: isLoadingResumo } = useEntradaResumo();
  const { data: entradas, isLoading: isLoadingEntradas } = useEntradas();

  const isLoading = isLoadingResumo || isLoadingEntradas;

  const filtered = useMemo(() => {
    let result = entradas ?? [];
    if (categoriaFilter !== 'todas') {
      result = result.filter((e) => e.categoria === categoriaFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.descricao.toLowerCase().includes(q) ||
          e.cliente.toLowerCase().includes(q) ||
          (e.obra && e.obra.toLowerCase().includes(q))
      );
    }
    return result;
  }, [entradas, categoriaFilter, search]);

  const kpiCards = useMemo(() => {
    if (!resumo) return [];
    return [
      {
        label: 'Total do Mês',
        value: formatCurrency(resumo.totalMes),
        icon: RiMoneyDollarCircleLine,
        iconBg: 'bg-primary/10 text-primary',
      },
      {
        label: 'Confirmado',
        value: formatCurrency(resumo.totalConfirmado),
        icon: RiCheckboxCircleLine,
        iconBg: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      },
      {
        label: 'Pendente',
        value: formatCurrency(resumo.totalPendente),
        icon: RiTimeLine,
        iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
      },
      {
        label: 'Crescimento',
        value: `${resumo.crescimentoMes.toFixed(1).replace('.', ',')}%`,
        icon: RiArrowUpLine,
        iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      },
    ];
  }, [resumo]);

  if (isLoading) {
    return <EntradasSkeleton />;
  }

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-page-title">
            Entradas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão de receitas e lançamentos de entrada
          </p>
        </div>
        <Button data-testid="button-novo-lancamento">
          <RiAddLine className="w-4 h-4 mr-2" />
          Novo Lançamento
        </Button>
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

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={categoriaFilter === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoriaFilter(opt.value)}
              data-testid={`button-filter-${opt.value}`}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar entrada..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma entrada encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((ent: Entrada) => (
                  <TableRow key={ent.id} data-testid={`row-entrada-${ent.id}`}>
                    <TableCell className="whitespace-nowrap">{formatDate(ent.data)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{ent.descricao}</TableCell>
                    <TableCell>{ent.cliente}</TableCell>
                    <TableCell>{ent.obra ?? '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn('no-default-hover-elevate no-default-active-elevate', categoriaClasses[ent.categoria])}
                        data-testid={`badge-categoria-${ent.id}`}
                      >
                        {categoriaLabels[ent.categoria]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold whitespace-nowrap text-green-600 dark:text-green-400">
                      {formatCurrency(ent.valor)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn('no-default-hover-elevate no-default-active-elevate', statusClasses[ent.status])}
                        data-testid={`badge-status-${ent.id}`}
                      >
                        {statusLabels[ent.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
