'use client';

import { useState, useMemo } from 'react';
import { cn } from '@shared/lib/utils';
import { FilterChips } from '@features/shared/components/FilterChips';
import { useAdminFAQ } from '@features/admin/faq/hooks/use-faq';
import { ADMIN_FAQ_CATEGORIES } from '@features/admin/faq/constants';
import { Input } from '@shared/components/ui/input';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import { Skeleton } from '@shared/components/ui/skeleton';
import { RiSearchLine, RiQuestionLine, RiArrowDownSLine, RiAddLine, RiCalendarLine } from 'react-icons/ri';
import type { FilterChipOption } from '@features/shared/types';
import type { AdminFAQItem } from '@features/admin/faq/types';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

function FAQSkeleton() {
  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
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

  if (isLoading) {
    return <FAQSkeleton />;
  }

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-faq-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-page-title">
            Perguntas Frequentes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as perguntas frequentes da plataforma
          </p>
        </div>
        <Button data-testid="button-nova-pergunta">
          <RiAddLine className="w-4 h-4 mr-2" />
          Nova Pergunta
        </Button>
      </div>

      <FilterChips options={categoryOptions} activeValue={activeCategory} onSelect={setActiveCategory} />

      <div className="relative max-w-md">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar perguntas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          data-testid="faq-search-input"
        />
      </div>

      <div className="flex flex-col gap-8">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {ADMIN_FAQ_CATEGORIES[category] || category}
            </h2>
            <div className="space-y-3">
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
        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <RiQuestionLine className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">Nenhuma pergunta encontrada</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente alterar os filtros ou a busca.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminFAQAccordion({ item, isOpen, onToggle }: { item: AdminFAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
      data-testid={`faq-item-${item.id}`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        data-testid={`faq-toggle-${item.id}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.question}</span>
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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RiCalendarLine className="w-3 h-3 shrink-0" />
            <span>Atualizado em {formatDate(item.atualizadoEm)}</span>
          </div>
        </div>
        <RiArrowDownSLine
          className={cn(
            'w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.answer}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span>Ordem: {item.ordem}</span>
            <span>Criado em: {formatDate(item.criadoEm)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
