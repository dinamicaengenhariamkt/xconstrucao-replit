'use client';

import { useState, useMemo } from 'react';
import { FilterChips } from '@features/shared/components/FilterChips';
import { FAQHero } from '@features/shared/faq/FAQHero';
import { FAQAccordionItem } from '@features/shared/faq/FAQAccordionItem';
import { FAQCategoryGroup } from '@features/shared/faq/FAQCategoryGroup';
import { FAQSkeleton } from '@features/shared/faq/FAQSkeleton';
import { FAQEmptyState } from '@features/shared/faq/FAQEmptyState';
import { useContratanteFAQ } from '@features/contratante/faq/hooks/use-faq';
import { CONTRATANTE_FAQ_CATEGORIES } from '@features/contratante/faq/constants';
import type { FilterChipOption } from '@features/shared/types';

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
    const groups: Record<string, typeof filteredItems> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  if (isLoading) return <FAQSkeleton />;

  return (
    <div className="p-10 flex flex-col gap-8" data-testid="faq-contratante-page">
      <FAQHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        data-testid="faq-search-input"
      />
      <FilterChips options={categoryOptions} activeValue={activeCategory} onSelect={setActiveCategory} />
      <div className="flex flex-col gap-6">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <FAQCategoryGroup key={category} title={CONTRATANTE_FAQ_CATEGORIES[category] || category}>
            {categoryItems.map((item) => (
              <FAQAccordionItem
                key={item.id}
                id={item.id}
                question={item.question}
                isOpen={openItemId === item.id}
                onToggle={() => setOpenItemId(openItemId === item.id ? null : item.id)}
              >
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.answer}</p>
              </FAQAccordionItem>
            ))}
          </FAQCategoryGroup>
        ))}
        {filteredItems.length === 0 && <FAQEmptyState />}
      </div>
    </div>
  );
}
