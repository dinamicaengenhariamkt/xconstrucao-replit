'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import { Input } from '@shared/components/ui/input';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
import { RangeNumberInput } from '@features/shared/components/filters/RangeNumberInput';
import { StarRatingFilter } from '@features/shared/components/filters/StarRatingFilter';
import { useAdminEmpreiteiras } from '@features/admin/empreiteiras/hooks/use-empreiteiras';
import { NovaEmpreiteiraModal } from '@features/admin/empreiteiras/components/NovaEmpreiteiraModal';
import {
  RiSearchLine,
  RiAddLine,
  RiBuilding2Line,
  RiBriefcaseLine,
  RiMoneyDollarCircleLine,
  RiStarFill,
  RiStarLine,
  RiMapPinLine,
} from 'react-icons/ri';
import type { AdminEmpreiteira, EmpreiteiraStatus } from '@features/admin/empreiteiras/types';
import { statusConfig, STATUS_OPTIONS, ITEMS_PER_PAGE } from '@features/admin/empreiteiras/constants';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@shared/components/ui/pagination';
import { getPaginationRange } from '@shared/lib/pagination';

import { formatCurrency, formatRange, getInitials } from '@shared/lib/formatters';

function StarRating({ nota }: { nota: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.round(nota)) {
      stars.push(<RiStarFill key={i} className="w-3.5 h-3.5 text-amber-400" />);
    } else {
      stars.push(<RiStarLine key={i} className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />);
    }
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

function EmpreiteiraCard({ empreiteira }: { empreiteira: AdminEmpreiteira }) {
  const status = statusConfig[empreiteira.status];

  return (
    <Link href={`/admin/empreiteiras/${empreiteira.id}`} data-testid={`link-empreiteira-${empreiteira.id}`}>
      <motion.div
        className="rounded-2xl overflow-visible"
        whileHover={{
          scale: 1.01,
          boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.06)',
        }}
        transition={{ duration: 0.2 }}
      >
        <Card className="h-full rounded-2xl transition-colors hover:border-primary/20">
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10" data-testid={`avatar-empreiteira-${empreiteira.id}`}>
                {empreiteira.avatarUrl && <AvatarImage src={empreiteira.avatarUrl} alt={empreiteira.razaoSocial} />}
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {getInitials(empreiteira.nomeFantasia)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{empreiteira.razaoSocial}</p>
                <p className="text-xs text-muted-foreground truncate">{empreiteira.cnpj}</p>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                  <RiMapPinLine className="w-3 h-3 shrink-0" />
                  {empreiteira.cidade} · {empreiteira.estado}
                </p>
              </div>
              <Badge
                className={cn('rounded-full text-[10px] font-bold px-2.5 py-0.5 no-default-hover-elevate no-default-active-elevate', status.className)}
                data-testid={`badge-status-${empreiteira.id}`}
              >
                {status.label}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {empreiteira.especialidades.slice(0, 3).map((esp) => (
                <Badge
                  key={esp}
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 rounded-full no-default-hover-elevate no-default-active-elevate"
                  data-testid={`badge-especialidade-${empreiteira.id}-${esp}`}
                >
                  {esp}
                </Badge>
              ))}
              {empreiteira.especialidades.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 rounded-full no-default-hover-elevate no-default-active-elevate"
                >
                  +{empreiteira.especialidades.length - 3}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <RiBriefcaseLine className="w-3.5 h-3.5" />
                  <span className="text-xs">{empreiteira.totalObras} obras</span>
                </div>
                <StarRating nota={empreiteira.nota} />
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {formatCurrency(empreiteira.valorTotalContratado)}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

export default function AdminEmpreiteirasPage() {
  const { data: empreiteiras, isLoading } = useAdminEmpreiteiras();
  const [statusSelected, setStatusSelected] = useState<EmpreiteiraStatus[]>([]);
  const [especialidadesSelected, setEspecialidadesSelected] = useState<string[]>([]);
  const [ufsSelected, setUfsSelected] = useState<string[]>([]);
  const [obrasMin, setObrasMin] = useState('');
  const [obrasMax, setObrasMax] = useState('');
  const [qualidadeMin, setQualidadeMin] = useState<number | undefined>(undefined);
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setCurrentPage(1);
  };

  const especialidadesOptions = useMemo(() => {
    if (!empreiteiras) return [];
    const set = new Set<string>();
    empreiteiras.forEach((e) => e.especialidades.forEach((esp) => set.add(esp)));
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((v) => ({ value: v, label: v }));
  }, [empreiteiras]);

  const ufsOptions = useMemo(() => {
    if (!empreiteiras) return [];
    const set = new Set<string>();
    empreiteiras.forEach((e) => set.add(e.estado));
    return Array.from(set)
      .sort()
      .map((v) => ({ value: v, label: v }));
  }, [empreiteiras]);

  const stats = useMemo(() => {
    if (!empreiteiras) return { total: 0, volume: 0 };
    const volume = empreiteiras.reduce((sum, e) => sum + e.valorTotalContratado, 0);
    return { total: empreiteiras.length, volume };
  }, [empreiteiras]);

  const obrasMinNum = obrasMin === '' ? undefined : Number(obrasMin);
  const obrasMaxNum = obrasMax === '' ? undefined : Number(obrasMax);
  const valorMinNum = valorMin === '' ? undefined : Number(valorMin);
  const valorMaxNum = valorMax === '' ? undefined : Number(valorMax);

  const filteredEmpreiteiras = useMemo(() => {
    if (!empreiteiras) return [];
    let result = empreiteiras;

    if (statusSelected.length > 0) {
      result = result.filter((e) => statusSelected.includes(e.status));
    }
    if (especialidadesSelected.length > 0) {
      result = result.filter((e) => e.especialidades.some((esp) => especialidadesSelected.includes(esp)));
    }
    if (ufsSelected.length > 0) {
      result = result.filter((e) => ufsSelected.includes(e.estado));
    }
    if (obrasMinNum !== undefined) {
      result = result.filter((e) => e.totalObras >= obrasMinNum);
    }
    if (obrasMaxNum !== undefined) {
      result = result.filter((e) => e.totalObras <= obrasMaxNum);
    }
    if (qualidadeMin !== undefined) {
      result = result.filter((e) => Math.round(e.nota) === qualidadeMin);
    }
    if (valorMinNum !== undefined) {
      result = result.filter((e) => e.valorTotalContratado >= valorMinNum);
    }
    if (valorMaxNum !== undefined) {
      result = result.filter((e) => e.valorTotalContratado <= valorMaxNum);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.razaoSocial.toLowerCase().includes(q) ||
          e.nomeFantasia.toLowerCase().includes(q) ||
          e.cnpj.includes(q) ||
          e.email.toLowerCase().includes(q)
      );
    }
    return result;
  }, [empreiteiras, statusSelected, especialidadesSelected, ufsSelected, obrasMinNum, obrasMaxNum, qualidadeMin, valorMinNum, valorMaxNum, searchQuery]);

  const advancedActiveCount =
    (statusSelected.length > 0 ? 1 : 0) +
    (especialidadesSelected.length > 0 ? 1 : 0) +
    (ufsSelected.length > 0 ? 1 : 0) +
    (obrasMinNum !== undefined || obrasMaxNum !== undefined ? 1 : 0) +
    (qualidadeMin !== undefined ? 1 : 0) +
    (valorMinNum !== undefined || valorMaxNum !== undefined ? 1 : 0);

  const clearAllAdvanced = () => {
    setStatusSelected([]);
    setEspecialidadesSelected([]);
    setUfsSelected([]);
    setObrasMin('');
    setObrasMax('');
    setQualidadeMin(undefined);
    setValorMin('');
    setValorMax('');
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredEmpreiteiras.length / ITEMS_PER_PAGE));
  const paginatedEmpreiteiras = filteredEmpreiteiras.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const kpis = [
    {
      label: 'Total Empreiteiras',
      value: String(stats.total),
      icon: RiBuilding2Line,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    },
    {
      label: 'Volume Contratado',
      value: formatCurrency(stats.volume),
      icon: RiMoneyDollarCircleLine,
      iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
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
          <Skeleton className="h-9 w-44" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 w-44 rounded-lg" />
          <Skeleton className="h-10 w-full sm:max-w-md sm:ml-auto rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-empreiteiras-page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Empreiteiras
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as empreiteiras cadastradas na plataforma
          </p>
        </div>
        <>
          <Button onClick={() => setIsModalOpen(true)} data-testid="button-nova-empreiteira">
            <RiAddLine className="w-4 h-4 mr-2" />
            Nova Empreiteira
          </Button>
          <NovaEmpreiteiraModal open={isModalOpen} onOpenChange={setIsModalOpen} />
        </>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <AdvancedFiltersPopover
            activeCount={advancedActiveCount}
            onClearAll={clearAllAdvanced}
            contentClassName="w-96"
          >
            <MultiSelectDropdown
              label="Status"
              options={STATUS_OPTIONS}
              values={statusSelected}
              onChange={onFilterChange(setStatusSelected)}
              placeholder="Todos os status"
              testIdPrefix="filter-status"
            />
            <MultiSelectDropdown
              label="Especialidade"
              options={especialidadesOptions}
              values={especialidadesSelected}
              onChange={onFilterChange(setEspecialidadesSelected)}
              placeholder="Todas as especialidades"
              searchPlaceholder="Buscar especialidade..."
              testIdPrefix="filter-especialidade"
            />
            <MultiSelectDropdown
              label="Estado (UF)"
              options={ufsOptions}
              values={ufsSelected}
              onChange={onFilterChange(setUfsSelected)}
              placeholder="Todos os estados"
              searchPlaceholder="Buscar UF..."
              testIdPrefix="filter-uf"
            />
            <RangeNumberInput
              label="Quantidade de obras"
              min={obrasMin}
              max={obrasMax}
              onMinChange={onFilterChange(setObrasMin)}
              onMaxChange={onFilterChange(setObrasMax)}
              testIdPrefix="filter-obras"
            />
            <StarRatingFilter
              label="Qualidade"
              value={qualidadeMin}
              onChange={onFilterChange(setQualidadeMin)}
              testIdPrefix="filter-qualidade"
            />
            <RangeNumberInput
              label="Volume contratado"
              min={valorMin}
              max={valorMax}
              onMinChange={onFilterChange(setValorMin)}
              onMaxChange={onFilterChange(setValorMax)}
              prefix="R$ "
              placeholderMin="100.000"
              placeholderMax="100.000.000"
              testIdPrefix="filter-valor"
            />
          </AdvancedFiltersPopover>

          <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, CNPJ..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              data-testid="input-search-empreiteiras"
            />
          </div>
        </div>

        {advancedActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {statusSelected.map((s) => {
              const opt = STATUS_OPTIONS.find((o) => o.value === s);
              return (
                <ActiveFilterChip
                  key={s}
                  label={`Status: ${opt?.label ?? s}`}
                  onRemove={() => {
                    setStatusSelected(statusSelected.filter((x) => x !== s));
                    setCurrentPage(1);
                  }}
                  testId={`active-chip-status-${s}`}
                />
              );
            })}
            {especialidadesSelected.map((esp) => (
              <ActiveFilterChip
                key={esp}
                label={`Especialidade: ${esp}`}
                onRemove={() => {
                  setEspecialidadesSelected(especialidadesSelected.filter((x) => x !== esp));
                  setCurrentPage(1);
                }}
                testId={`active-chip-especialidade-${esp}`}
              />
            ))}
            {ufsSelected.map((uf) => (
              <ActiveFilterChip
                key={uf}
                label={`UF: ${uf}`}
                onRemove={() => {
                  setUfsSelected(ufsSelected.filter((x) => x !== uf));
                  setCurrentPage(1);
                }}
                testId={`active-chip-uf-${uf}`}
              />
            ))}
            {(obrasMinNum !== undefined || obrasMaxNum !== undefined) && (
              <ActiveFilterChip
                label={`Obras: ${formatRange(obrasMin, obrasMax)}`}
                onRemove={() => {
                  setObrasMin('');
                  setObrasMax('');
                  setCurrentPage(1);
                }}
                testId="active-chip-obras"
              />
            )}
            {qualidadeMin !== undefined && (
              <ActiveFilterChip
                label={
                  qualidadeMin === 0
                    ? 'Qualidade: Sem avaliação'
                    : `Qualidade: ${qualidadeMin} ${qualidadeMin === 1 ? 'estrela' : 'estrelas'}`
                }
                onRemove={() => {
                  setQualidadeMin(undefined);
                  setCurrentPage(1);
                }}
                testId="active-chip-qualidade"
              />
            )}
            {(valorMinNum !== undefined || valorMaxNum !== undefined) && (
              <ActiveFilterChip
                label={`Volume: ${formatRange(valorMin, valorMax, { prefix: 'R$ ' })}`}
                onRemove={() => {
                  setValorMin('');
                  setValorMax('');
                  setCurrentPage(1);
                }}
                testId="active-chip-valor"
              />
            )}
          </div>
        )}
      </div>

      {filteredEmpreiteiras.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedEmpreiteiras.map((empreiteira) => (
              <EmpreiteiraCard key={empreiteira.id} empreiteira={empreiteira} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((p) => Math.max(1, p - 1));
                    }}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    data-testid="empreiteiras-pagination-prev"
                  />
                </PaginationItem>
                {getPaginationRange(currentPage, totalPages).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <PaginationItem key={`empreiteiras-ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === item}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(item);
                        }}
                        data-testid={`empreiteiras-pagination-page-${item}`}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                    }}
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    data-testid="empreiteiras-pagination-next"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <RiBuilding2Line className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">Nenhuma empreiteira encontrada</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente alterar os filtros ou a busca.</p>
        </div>
      )}
    </div>
  );
}
