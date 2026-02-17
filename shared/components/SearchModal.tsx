'use client';

import { useState } from 'react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@shared/components/ui/command';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: string;
  icon?: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
}

export interface SearchModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
  results: SearchResult[];
  onSearch?: (query: string) => void;
  emptyMessage?: string;
}

export function SearchModal({
  isOpen,
  onOpenChange,
  placeholder = 'Buscar...',
  results,
  onSearch,
  emptyMessage = 'Nenhum resultado encontrado.',
}: SearchModalProps) {
  const [query, setQuery] = useState('');

  const handleValueChange = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  // Agrupa resultados por categoria
  const groupedResults = results.reduce(
    (acc, result) => {
      if (!acc[result.category]) acc[result.category] = [];
      acc[result.category].push(result);
      return acc;
    },
    {} as Record<string, SearchResult[]>
  );

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <CommandInput placeholder={placeholder} value={query} onValueChange={handleValueChange} />
      <CommandList>
        <CommandEmpty>{emptyMessage}</CommandEmpty>
        {Object.entries(groupedResults).map(([category, items]) => (
          <CommandGroup key={category} heading={category}>
            {items.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => {
                  result.onSelect();
                  onOpenChange(false);
                }}
              >
                {result.icon && <result.icon className="mr-2 h-4 w-4" />}
                <div className="flex flex-col">
                  <span>{result.title}</span>
                  {result.description && (
                    <span className="text-xs text-muted-foreground">{result.description}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
