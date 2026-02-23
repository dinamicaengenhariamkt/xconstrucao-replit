'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Skeleton } from '@shared/components/ui/skeleton';
import { FilterChips } from '@features/shared/components/FilterChips';
import { ClienteCard } from '@features/admin/clientes/components/ClienteCard';
import { NovoClienteModal } from '@features/admin/clientes/components/NovoClienteModal';
import { useAdminClientes } from '@features/admin/clientes/hooks/use-clientes';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@shared/components/ui/pagination';
import {
  RiSearchLine,
  RiUserAddLine,
  RiGroupLine,
  RiUserFollowLine,
  RiMoneyDollarCircleLine,
  RiAlertLine,
  RiUserLine,
} from 'react-icons/ri';
import type { FilterChipOption } from '@features/shared/types';

const ITEMS_PER_PAGE = 12;

function getPaginationRange(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis', total];
  if (current >= total - 3) return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function AdminClientesPage() {
  const { data: clientes, isLoading } = useAdminClientes();
  const [activeFilter, setActiveFilter] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleFilterChange(value: string) {
    setActiveFilter(value);
    setCurrentPage(1);
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  const stats = useMemo(() => {
    if (!clientes) return { total: 0, ativos: 0, volume: 0, inadimplencia: 0 };
    const ativos = clientes.filter((c) => c.status === 'ativo').length;
    const volume = clientes.reduce((sum, c) => sum + c.valorTotalContratado, 0);
    const totalContratado = clientes.reduce((sum, c) => sum + c.valorTotalContratado, 0);
    const totalPago = clientes.reduce((sum, c) => sum + c.valorTotalPago, 0);
    const inadimplencia = totalContratado > 0 ? ((totalContratado - totalPago) / totalContratado) * 100 : 0;
    return { total: clientes.length, ativos, volume, inadimplencia };
  }, [clientes]);

  const filterOptions: FilterChipOption[] = useMemo(() => {
    if (!clientes) return [];
    return [
      { label: 'Todos', value: 'todos', count: clientes.length },
      { label: 'Ativos', value: 'ativo', count: clientes.filter((c) => c.status === 'ativo').length },
      { label: 'Inativos', value: 'inativo', count: clientes.filter((c) => c.status === 'inativo').length },
      { label: 'Pendentes', value: 'pendente', count: clientes.filter((c) => c.status === 'pendente').length },
    ];
  }, [clientes]);

  const filteredClientes = useMemo(() => {
    if (!clientes) return [];
    let result = clientes;
    if (activeFilter !== 'todos') {
      result = result.filter((c) => c.status === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.nome.toLowerCase().includes(q) ||
          c.cpfCnpj.includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }
    return result;
  }, [clientes, activeFilter, searchQuery]);

  const totalPages = Math.ceil(filteredClientes.length / ITEMS_PER_PAGE);
  const paginatedClientes = filteredClientes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const kpis = [
    {
      label: 'Total Clientes',
      value: String(stats.total),
      icon: RiGroupLine,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    },
    {
      label: 'Clientes Ativos',
      value: String(stats.ativos),
      icon: RiUserFollowLine,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
    },
    {
      label: 'Volume Contratado',
      value: formatCurrency(stats.volume),
      icon: RiMoneyDollarCircleLine,
      iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
    },
    {
      label: 'Inadimplência',
      value: `${stats.inadimplencia.toFixed(1)}%`,
      icon: RiAlertLine,
      iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/20',
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-full max-w-sm rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-clientes-page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Clientes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os clientes cadastrados na plataforma
          </p>
        </div>
        <>
          <Button onClick={() => setIsModalOpen(true)} data-testid="button-novo-cliente">
            <RiUserAddLine className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
          <NovoClienteModal open={isModalOpen} onOpenChange={setIsModalOpen} />
        </>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <motion.div
            key={kpi.label}
            className="rounded-2xl overflow-visible"
            whileHover={{
              scale: 1.01,
              boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.06)',
            }}
            transition={{ duration: 0.2 }}
          >
            <Card className="h-full rounded-2xl" data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s/g, '-')}`}>
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
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <FilterChips options={filterOptions} activeValue={activeFilter} onSelect={handleFilterChange} />
        <div className="relative w-full sm:w-72">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nome, CPF/CNPJ..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            data-testid="input-search-clientes"
          />
        </div>
      </div>

      {filteredClientes.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedClientes.map((cliente) => (
              <ClienteCard key={cliente.id} cliente={cliente} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); setCurrentPage((p) => Math.max(1, p - 1)); }}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {getPaginationRange(currentPage, totalPages).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === item}
                        onClick={(e) => { e.preventDefault(); setCurrentPage(item); }}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); setCurrentPage((p) => Math.min(totalPages, p + 1)); }}
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <RiUserLine className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">Nenhum cliente encontrado</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente alterar os filtros ou a busca.</p>
        </div>
      )}
    </div>
  );
}
