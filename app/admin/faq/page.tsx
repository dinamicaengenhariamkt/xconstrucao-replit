'use client';

import { useState, useMemo } from 'react';
import { cn } from '@shared/lib/utils';
import { FilterChips } from '@features/shared/components/FilterChips';
import { FAQEmptyState } from '@features/shared/faq/FAQEmptyState';
import { useAdminFAQ } from '@features/admin/faq/hooks/use-faq';
import { ADMIN_FAQ_CATEGORIES, ADMIN_FAQ_CATEGORY_META } from '@features/admin/faq/constants';
import { Input } from '@shared/components/ui/input';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import { Skeleton } from '@shared/components/ui/skeleton';
import {
  RiSearchLine,
  RiArrowDownSLine,
  RiAddLine,
  RiCalendarLine,
  RiArrowRightSLine,
  RiGroupLine,
  RiUserLine,
  RiToolsLine,
  RiWalletLine,
  RiBuildingLine,
  RiSettings3Line,
} from 'react-icons/ri';
import type { FilterChipOption } from '@features/shared/types';
import type { AdminFAQItem } from '@features/admin/faq/types';
import type { IconType } from 'react-icons';

const CATEGORY_ICONS: Record<string, IconType> = {
  usuarios: RiGroupLine,
  clientes: RiUserLine,
  empreiteiras: RiToolsLine,
  financeiro: RiWalletLine,
  obras: RiBuildingLine,
  configuracoes: RiSettings3Line,
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

function FAQPageSkeleton() {
  return (
    <div className="p-10 flex flex-col gap-10 animate-pulse">
      <div className="flex justify-end">
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <div className="max-w-3xl mx-auto w-full space-y-4 text-center">
        <Skeleton className="h-14 w-3/4 mx-auto rounded-xl" />
        <Skeleton className="h-5 w-2/3 mx-auto rounded" />
        <Skeleton className="h-12 w-full max-w-2xl mx-auto rounded-2xl" />
      </div>
      <div className="flex justify-center gap-2 flex-wrap">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-8 w-64 rounded" />
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-16 rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminFAQCategoryCard({
  categoryKey,
  label,
  count,
  onSelect,
}: {
  categoryKey: string;
  label: string;
  count: number;
  onSelect: () => void;
}) {
  const meta = ADMIN_FAQ_CATEGORY_META[categoryKey];
  const Icon = CATEGORY_ICONS[categoryKey] ?? RiGroupLine;
  return (
    <div
      onClick={onSelect}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm hover:border-primary/30 hover:-translate-y-1 transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        <div className={cn('p-3 rounded-xl shrink-0', meta?.iconBg)}>
          <Icon className={cn('w-6 h-6', meta?.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 leading-snug">{label}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{meta?.description}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{count} perguntas</p>
        </div>
        <RiArrowRightSLine className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
      </div>
    </div>
  );
}

function AdminFAQSectionHeader({ category }: { category: string }) {
  const meta = ADMIN_FAQ_CATEGORY_META[category];
  const label = ADMIN_FAQ_CATEGORIES[category] || category;
  const Icon = CATEGORY_ICONS[category] ?? RiGroupLine;
  return (
    <div className="flex items-center gap-3">
      <div className={cn('p-2 rounded-lg', meta?.iconBg)}>
        <Icon className={cn('w-5 h-5', meta?.iconColor)} />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{label}</h2>
    </div>
  );
}

function AdminFAQAccordion({
  item,
  isOpen,
  onToggle,
}: {
  item: AdminFAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm"
      data-testid={`faq-item-${item.id}`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        data-testid={`faq-toggle-${item.id}`}
      >
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm text-gray-900 dark:text-white leading-snug">
            {item.question}
          </span>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge
              variant="secondary"
              className={cn(
                'no-default-hover-elevate no-default-active-elevate rounded-full text-xs',
                ADMIN_FAQ_CATEGORIES[item.category]
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              )}
              data-testid={`badge-category-${item.id}`}
            >
              {ADMIN_FAQ_CATEGORIES[item.category] || item.category}
            </Badge>
            <Badge
              variant="secondary"
              className={cn(
                'no-default-hover-elevate no-default-active-elevate rounded-full text-xs',
                item.ativo
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              )}
              data-testid={`badge-ativo-${item.id}`}
            >
              {item.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>
        <RiArrowDownSLine
          className={cn(
            'w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 mt-0.5',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.answer}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <RiCalendarLine className="w-3 h-3" />
              <span>Atualizado em {formatDate(item.atualizadoEm)}</span>
            </div>
            <span>Ordem: {item.ordem}</span>
            <span>Criado em: {formatDate(item.criadoEm)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminFAQPage() {
  const { data: items, isLoading } = useAdminFAQ();
  const [activeCategory, setActiveCategory] = useState('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const categoryOptions: FilterChipOption[] = useMemo(() => {
    if (!items) return [];
    return [
      { label: 'Todas', value: 'todas', count: items.length },
      ...Object.entries(ADMIN_FAQ_CATEGORIES).map(([value, label]) => ({
        label,
        value,
        count: items.filter((i) => i.category === value).length,
      })),
    ];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    let result = items;
    if (activeCategory !== 'todas') {
      result = result.filter((i) => i.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (i) => i.question.toLowerCase().includes(query) || i.answer.toLowerCase().includes(query)
      );
    }
    return result;
  }, [items, activeCategory, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, AdminFAQItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const showGrid = activeCategory === 'todas' && !searchQuery.trim();

  if (isLoading) {
    return <FAQPageSkeleton />;
  }

  return (
    <div className="p-10 flex flex-col gap-10" data-testid="admin-faq-page">
      {/* Botão Nova Pergunta */}
      <div className="flex justify-end">
        <Button data-testid="button-nova-pergunta">
          <RiAddLine className="w-4 h-4 mr-2" />
          Nova Pergunta
        </Button>
      </div>

      {/* Hero claro centralizado */}
      <div className="text-center max-w-3xl mx-auto w-full">
        <h1
          className="text-5xl font-extrabold tracking-tighter text-gray-900 dark:text-white mb-4"
          data-testid="text-page-title"
        >
          Perguntas Frequentes do Administrador
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">
          Respostas rápidas para a gestão de clientes, empreiteiras, financeiro e operação da plataforma.
        </p>
        <div className="relative max-w-2xl mx-auto">
          <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar por palavra-chave (cliente, empreiteira, financeiro...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-4 h-auto text-sm bg-gray-100 dark:bg-gray-800 border-none rounded-2xl placeholder:text-gray-400"
            data-testid="faq-search-input"
          />
        </div>
      </div>

      {/* FilterChips centralizados */}
      <div className="flex justify-center">
        <FilterChips options={categoryOptions} activeValue={activeCategory} onSelect={setActiveCategory} />
      </div>

      {/* Grid de categorias (visível apenas em "Todas" sem busca) */}
      {showGrid && items && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(ADMIN_FAQ_CATEGORIES).map(([key, label]) => (
            <AdminFAQCategoryCard
              key={key}
              categoryKey={key}
              label={label}
              count={items.filter((i) => i.category === key).length}
              onSelect={() => setActiveCategory(key)}
            />
          ))}
        </div>
      )}

      {/* Seções de acordeão */}
      <div className="space-y-8">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category}>
            <AdminFAQSectionHeader category={category} />
            <div className="space-y-3 mt-4">
              {categoryItems.map((item) => (
                <AdminFAQAccordion
                  key={item.id}
                  item={item}
                  isOpen={openItemId === item.id}
                  onToggle={() => setOpenItemId(openItemId === item.id ? null : item.id)}
                />
              ))}
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && <FAQEmptyState />}
      </div>
    </div>
  );
}
