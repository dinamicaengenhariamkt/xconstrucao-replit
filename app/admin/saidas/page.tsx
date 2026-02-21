'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  RiMoneyDollarCircleLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiCalendarScheduleLine,
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
import type { SaidaCategoria, Saida } from '@features/admin/saidas/types';
import { useSaidaResumo, useSaidas } from '@features/admin/saidas/hooks/use-saidas';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const statusClasses: Record<string, string> = {
  pago: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  pendente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  agendado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const statusLabels: Record<string, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  agendado: 'Agendado',
};

const categoriaLabels: Record<SaidaCategoria, string> = {
  pagamento_empreiteira: 'Pgto Empreiteira',
  material: 'Material',
  operacional: 'Operacional',
  impostos: 'Impostos',
  outros: 'Outros',
};

const categoriaClasses: Record<SaidaCategoria, string> = {
  pagamento_empreiteira: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  material: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  operacional: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  impostos: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  outros: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

type FilterCategoria = 'todas' | SaidaCategoria;

const filterOptions: { value: FilterCategoria; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'pagamento_empreiteira', label: 'Pgto Empreiteira' },
  { value: 'material', label: 'Material' },
  { value: 'operacional', label: 'Operacional' },
  { value: 'impostos', label: 'Impostos' },
  { value: 'outros', label: 'Outros' },
];

function SaidasSkeleton() {
  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
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

export default function AdminSaidasPage() {
  const [categoriaFilter, setCategoriaFilter] = useState<FilterCategoria>('todas');
  const [search, setSearch] = useState('');
  const { data: resumo, isLoading: isLoadingResumo } = useSaidaResumo();
  const { data: saidas, isLoading: isLoadingSaidas } = useSaidas();

  const isLoading = isLoadingResumo || isLoadingSaidas;

  const filtered = useMemo(() => {
    let result = saidas ?? [];
    if (categoriaFilter !== 'todas') {
      result = result.filter((s) => s.categoria === categoriaFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.descricao.toLowerCase().includes(q) ||
          s.fornecedor.toLowerCase().includes(q) ||
          (s.obra && s.obra.toLowerCase().includes(q))
      );
    }
    return result;
  }, [saidas, categoriaFilter, search]);

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
        label: 'Pago',
        value: formatCurrency(resumo.totalPago),
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
        label: 'Agendado',
        value: formatCurrency(resumo.totalAgendado),
        icon: RiCalendarScheduleLine,
        iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      },
    ];
  }, [resumo]);

  if (isLoading) {
    return <SaidasSkeleton />;
  }

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-page-title">
            Saídas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão de despesas e pagamentos
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
            placeholder="Buscar saída..."
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
                <TableHead>Fornecedor</TableHead>
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
                    Nenhuma saída encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((sai: Saida) => (
                  <TableRow key={sai.id} data-testid={`row-saida-${sai.id}`}>
                    <TableCell className="whitespace-nowrap">{formatDate(sai.data)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{sai.descricao}</TableCell>
                    <TableCell>{sai.fornecedor}</TableCell>
                    <TableCell>{sai.obra ?? '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn('no-default-hover-elevate no-default-active-elevate', categoriaClasses[sai.categoria])}
                        data-testid={`badge-categoria-${sai.id}`}
                      >
                        {categoriaLabels[sai.categoria]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold whitespace-nowrap text-red-600 dark:text-red-400">
                      {formatCurrency(sai.valor)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn('no-default-hover-elevate no-default-active-elevate', statusClasses[sai.status])}
                        data-testid={`badge-status-${sai.id}`}
                      >
                        {statusLabels[sai.status]}
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
