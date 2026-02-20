'use client';

import { useState, useMemo } from 'react';
import { FilterChips } from '@features/shared/components/FilterChips';
import { FAQHero } from '@features/empreiteiro/faq/components/FAQHero';
import { FAQCategory } from '@features/empreiteiro/faq/components/FAQCategory';
import { FAQSkeleton } from '@features/empreiteiro/faq/components/FAQSkeleton';
import { useFAQ } from '@features/empreiteiro/faq/hooks/use-faq';
import { FAQ_CATEGORIES } from '@features/empreiteiro/faq/constants';
import type { FilterChipOption } from '@features/shared/types';

export default function FAQPage() {
  const { data: items, isLoading } = useFAQ();
  const [activeCategory, setActiveCategory] = useState('todas');
  const [searchQuery, setSearchQuery] = useState('');

  const categoryOptions: FilterChipOption[] = useMemo(() => {
    if (!items) return [];
    return [
      { label: 'Todas', value: 'todas', count: items.length },
      ...Object.entries(FAQ_CATEGORIES).map(([value, label]) => ({
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
    const groups: Record<string, typeof filteredItems> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  if (isLoading) return <FAQSkeleton />;

  return (
    <div className="p-10 flex flex-col gap-8">
      <FAQHero searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <FilterChips options={categoryOptions} activeValue={activeCategory} onSelect={setActiveCategory} />
      <div className="flex flex-col gap-6">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <FAQCategory key={category} title={FAQ_CATEGORIES[category] || category} items={categoryItems} />
        ))}
        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">search_off</span>
            <h3 className="text-lg font-bold text-gray-500">Nenhuma pergunta encontrada</h3>
            <p className="text-sm text-gray-400 mt-1">Tente alterar os filtros ou a busca.</p>
          </div>
        )}
      </div>
    </div>
  );
}
