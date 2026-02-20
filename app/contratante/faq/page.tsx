'use client';

import { useState, useMemo } from 'react';
import { cn } from '@shared/lib/utils';
import { FilterChips } from '@features/shared/components/FilterChips';
import { useContratanteFAQ } from '@features/contratante/faq/hooks/use-faq';
import { CONTRATANTE_FAQ_CATEGORIES } from '@features/contratante/faq/constants';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Input } from '@shared/components/ui/input';
import { RiSearchLine, RiQuestionLine, RiArrowDownSLine } from 'react-icons/ri';
import type { FilterChipOption } from '@features/shared/types';
import type { ContratanteFAQItem } from '@features/contratante/faq/types';

export default function ContratanteFAQPage() {
  const { data: items, isLoading } = useContratanteFAQ();
  const [activeCategory, setActiveCategory] = useState('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const categoryOptions: FilterChipOption[] = useMemo(() => {
    if (!items) return [];
    return [
      { label: 'Todas', value: 'todas', count: items.length },
      ...Object.entries(CONTRATANTE_FAQ_CATEGORIES).map(([value, label]) => ({
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
    const groups: Record<string, ContratanteFAQItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  if (isLoading) {
    return (
      <div className="p-10 flex flex-col gap-8">
        <div className="text-center py-12">
          <Skeleton className="h-14 w-[400px] mx-auto" />
          <Skeleton className="h-6 w-[300px] mx-auto mt-4" />
          <Skeleton className="h-12 w-[500px] mx-auto mt-6 rounded-xl" />
        </div>
        <div className="flex gap-2 justify-center">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-32 rounded-full" />)}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 flex flex-col gap-8" data-testid="faq-contratante-page">
      <div className="text-center py-12">
        <h1 className="text-5xl font-extrabold tracking-tighter text-[#101819] dark:text-white">
          Perguntas Frequentes
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-3 text-lg">
          Encontre respostas para as dúvidas mais comuns sobre a plataforma.
        </p>
        <div className="relative max-w-lg mx-auto mt-6">
          <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar perguntas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl text-base"
            data-testid="faq-search-input"
          />
        </div>
      </div>

      <FilterChips options={categoryOptions} activeValue={activeCategory} onSelect={setActiveCategory} />

      <div className="flex flex-col gap-8">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {CONTRATANTE_FAQ_CATEGORIES[category] || category}
            </h2>
            <div className="space-y-3">
              {categoryItems.map((item) => (
                <FAQAccordion
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
            <RiQuestionLine className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-500">Nenhuma pergunta encontrada</h3>
            <p className="text-sm text-gray-400 mt-1">Tente alterar os filtros ou a busca.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FAQAccordion({ item, isOpen, onToggle }: { item: ContratanteFAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden" data-testid={`faq-item-${item.id}`}>
      <button
        onClick={onToggle}
        className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        data-testid={`faq-toggle-${item.id}`}
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.question}</span>
        <RiArrowDownSLine className={cn(
          'w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200',
          isOpen && 'rotate-180'
        )} />
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
}
