'use client';

import { RiSearchLine } from 'react-icons/ri';
import { Input } from '@shared/components/ui/input';

interface FAQHeroSearchProps {
  title: string;
  subtitle?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  'data-testid'?: string;
}

export function FAQHeroSearch({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Buscar por palavra-chave...',
  'data-testid': testId = 'faq-search-input',
}: FAQHeroSearchProps) {
  return (
    <div className="text-center max-w-3xl mx-auto w-full">
      <h1
        className="text-5xl font-extrabold tracking-tighter text-gray-900 dark:text-white mb-4"
        data-testid="text-page-title"
      >
        {title}
      </h1>
      {subtitle && (
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">{subtitle}</p>
      )}
      <div className="relative max-w-2xl mx-auto">
        <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 pr-4 py-4 h-auto text-sm bg-gray-100 dark:bg-gray-800 border-none rounded-2xl placeholder:text-gray-400"
          data-testid={testId}
          aria-label="Buscar perguntas frequentes"
        />
      </div>
    </div>
  );
}
