'use client';

import { useState, useMemo } from 'react';
import { FAQHeroSearch } from '@features/shared/faq/FAQHeroSearch';
import { FAQCategoryCard } from '@features/shared/faq/FAQCategoryCard';
import { FAQSectionHeader } from '@features/shared/faq/FAQSectionHeader';
import { FAQAccordionCard } from '@features/shared/faq/FAQAccordionCard';
import { FAQSkeleton } from '@features/shared/faq/FAQSkeleton';
import { FAQEmptyState } from '@features/shared/faq/FAQEmptyState';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { useFAQ } from '@features/empreiteiro/faq/hooks/use-faq';
import {
  FAQ_CATEGORIES,
  FAQ_CATEGORY_META,
  FAQ_CATEGORY_ICONS,
  FAQ_SUBTITLE,
} from '@features/empreiteiro/faq/constants';
import { RiQuestionLine } from 'react-icons/ri';

const CATEGORY_OPTIONS = Object.entries(FAQ_CATEGORIES).map(([value, label]) => ({
  value,
  label,
}));

export default function FAQPage() {
  const { data: items, isLoading } = useFAQ();
  const [categorySelected, setCategorySelected] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    let result = items;
    if (categorySelected.length > 0) {
      result = result.filter((i) => categorySelected.includes(i.category));
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.question.toLowerCase().includes(query) ||
          i.answer.toLowerCase().includes(query)
      );
    }
    return result;
  }, [items, categorySelected, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof filteredItems> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const advancedActiveCount = categorySelected.length > 0 ? 1 : 0;
  const clearAllAdvanced = () => setCategorySelected([]);
  const showGrid = advancedActiveCount === 0 && !searchQuery.trim();

  if (isLoading) return <FAQSkeleton />;

  return (
    <div className="p-10 flex flex-col gap-10" data-testid="faq-empreiteiro-page">
      <FAQHeroSearch
        title="Perguntas Frequentes"
        subtitle={FAQ_SUBTITLE}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar por palavra-chave (cadastro, obras, pagamentos...)"
        data-testid="input-search-faq"
      />

      <div className="flex flex-col items-center gap-3">
        <AdvancedFiltersPopover
          activeCount={advancedActiveCount}
          onClearAll={clearAllAdvanced}
        >
          <MultiSelectDropdown<string>
            label="Categoria"
            options={CATEGORY_OPTIONS}
            values={categorySelected}
            onChange={setCategorySelected}
            placeholder="Todas as categorias"
            testIdPrefix="filter-faq-empreiteiro-categoria"
          />
        </AdvancedFiltersPopover>

        {advancedActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {categorySelected.map((c) => (
              <ActiveFilterChip
                key={c}
                label={`Categoria: ${FAQ_CATEGORIES[c] ?? c}`}
                onRemove={() =>
                  setCategorySelected(categorySelected.filter((x) => x !== c))
                }
                testId={`active-chip-faq-empreiteiro-categoria-${c}`}
              />
            ))}
          </div>
        )}
      </div>

      {showGrid && items && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(FAQ_CATEGORIES).map(([key, label]) => {
            const meta = FAQ_CATEGORY_META[key];
            const Icon = FAQ_CATEGORY_ICONS[key] ?? RiQuestionLine;
            return (
              <FAQCategoryCard
                key={key}
                categoryKey={key}
                label={label}
                description={meta?.description}
                count={items.filter((i) => i.category === key).length}
                iconBg={meta?.iconBg}
                iconColor={meta?.iconColor}
                Icon={Icon}
                onSelect={() => setCategorySelected([key])}
              />
            );
          })}
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(groupedItems).map(([category, categoryItems]) => {
          const meta = FAQ_CATEGORY_META[category];
          const Icon = FAQ_CATEGORY_ICONS[category] ?? RiQuestionLine;
          return (
            <div key={category}>
              <FAQSectionHeader
                label={FAQ_CATEGORIES[category] || category}
                iconBg={meta?.iconBg}
                iconColor={meta?.iconColor}
                Icon={Icon}
              />
              <div className="space-y-3 mt-4">
                {categoryItems.map((item) => (
                  <FAQAccordionCard
                    key={item.id}
                    id={item.id}
                    question={item.question}
                    answer={item.answer}
                    isOpen={openItemId === item.id}
                    onToggle={() =>
                      setOpenItemId(openItemId === item.id ? null : item.id)
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}
        {filteredItems.length === 0 && <FAQEmptyState />}
      </div>
    </div>
  );
}
