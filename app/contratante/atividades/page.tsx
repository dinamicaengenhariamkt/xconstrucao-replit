'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  RiSearchLine,
  RiCheckboxCircleLine,
  RiUploadLine,
  RiEditLine,
  RiBankCardLine,
} from 'react-icons/ri';
import { PageHeader } from '@features/shared/components/PageHeader';
import { Card, CardContent } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { cn } from '@shared/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@shared/components/ui/breadcrumb';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
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
import { mockActivities } from '@features/contratante/dashboard/mocks/activities.mock';
import type { ActivityColor } from '@features/contratante/dashboard/types';

const ITEMS_PER_PAGE = 10;

type ActivityIcon = 'check' | 'upload' | 'edit' | 'payment';

const ICON_COMPONENT: Record<ActivityIcon, React.ElementType> = {
  check: RiCheckboxCircleLine,
  upload: RiUploadLine,
  edit: RiEditLine,
  payment: RiBankCardLine,
};

const ICON_LABEL: Record<ActivityIcon, string> = {
  check: 'Conclusão',
  upload: 'Upload',
  edit: 'Edição',
  payment: 'Pagamento',
};

const COLOR_CLASSES: Record<ActivityColor, string> = {
  success: 'bg-[#22846D]/10 text-[#22846D]',
  info: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
};

const TIPO_OPTIONS: { value: ActivityIcon; label: string }[] = (
  Object.keys(ICON_LABEL) as ActivityIcon[]
).map((k) => ({ value: k, label: ICON_LABEL[k] }));

export default function AtividadesContratantePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoSelected, setTipoSelected] = useState<ActivityIcon[]>([]);
  const [obraSelected, setObraSelected] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const onFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setCurrentPage(1);
  };

  const obraOptions = useMemo(() => {
    const set = new Set(mockActivities.map((a) => a.obraNome));
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((nome) => ({ value: nome, label: nome }));
  }, []);

  const filteredActivities = useMemo(() => {
    let result = mockActivities;
    if (tipoSelected.length > 0) {
      result = result.filter((a) => tipoSelected.includes(a.icon as ActivityIcon));
    }
    if (obraSelected.length > 0) {
      result = result.filter((a) => obraSelected.includes(a.obraNome));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) => a.title.toLowerCase().includes(q) || a.obraNome.toLowerCase().includes(q),
      );
    }
    return result;
  }, [tipoSelected, obraSelected, searchQuery]);

  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const advancedActiveCount =
    (tipoSelected.length > 0 ? 1 : 0) + (obraSelected.length > 0 ? 1 : 0);

  const clearAllAdvanced = () => {
    setTipoSelected([]);
    setObraSelected([]);
    setCurrentPage(1);
  };

  return (
    <div className="p-10 flex flex-col gap-10" data-testid="atividades-contratante-page">
      <div className="flex flex-col gap-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/contratante/dashboard" data-testid="breadcrumb-dashboard">
                  Dashboard
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Atividades</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <PageHeader
          title="Atividades"
          subtitle="Histórico completo de eventos das suas obras."
        />

        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <AdvancedFiltersPopover
              activeCount={advancedActiveCount}
              onClearAll={clearAllAdvanced}
            >
              <MultiSelectDropdown
                label="Tipo"
                options={TIPO_OPTIONS}
                values={tipoSelected}
                onChange={onFilterChange(setTipoSelected)}
                placeholder="Todos os tipos"
                testIdPrefix="filter-tipo"
              />
              <MultiSelectDropdown
                label="Obra"
                options={obraOptions}
                values={obraSelected}
                onChange={onFilterChange(setObraSelected)}
                placeholder="Todas as obras"
                searchPlaceholder="Buscar obra..."
                testIdPrefix="filter-obra"
              />
            </AdvancedFiltersPopover>

            <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por descrição ou obra..."
                value={searchQuery}
                onChange={(e) => onFilterChange(setSearchQuery)(e.target.value)}
                className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                data-testid="input-search-atividades"
              />
            </div>
          </div>

          {advancedActiveCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {tipoSelected.map((t) => (
                <ActiveFilterChip
                  key={t}
                  label={`Tipo: ${ICON_LABEL[t]}`}
                  onRemove={() =>
                    onFilterChange(setTipoSelected)(tipoSelected.filter((x) => x !== t))
                  }
                  testId={`active-chip-tipo-${t}`}
                />
              ))}
              {obraSelected.map((nome) => (
                <ActiveFilterChip
                  key={nome}
                  label={`Obra: ${nome}`}
                  onRemove={() =>
                    onFilterChange(setObraSelected)(obraSelected.filter((x) => x !== nome))
                  }
                  testId={`active-chip-obra-${nome}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Card className="border-border-light dark:border-gray-800">
        <CardContent className="p-0">
          {paginatedActivities.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma atividade encontrada com os filtros aplicados.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginatedActivities.map((activity) => {
                const Icon =
                  ICON_COMPONENT[activity.icon as ActivityIcon] ?? RiCheckboxCircleLine;
                return (
                  <li
                    key={activity.id}
                    className="transition-colors hover:bg-accent/60 dark:hover:bg-accent/30"
                  >
                    <Link
                      href={`/contratante/minhas-obras/${activity.obraId}`}
                      className="flex gap-4 px-6 py-4 cursor-pointer"
                      data-testid={`atividade-row-${activity.id}`}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                          COLOR_CLASSES[activity.color],
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {activity.obraNome}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium shrink-0 self-center">
                        {activity.timestamp}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

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
                data-testid="atividades-pagination-prev"
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
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(item);
                    }}
                    data-testid={`atividades-pagination-page-${item}`}
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
                data-testid="atividades-pagination-next"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
