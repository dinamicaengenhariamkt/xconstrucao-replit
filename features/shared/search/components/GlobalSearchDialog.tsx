'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RiArrowRightSLine, RiSearchLine } from 'react-icons/ri';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@shared/components/ui/command';
import type { SearchConfig, UseSearchResult, SearchHit } from '../types';

interface GlobalSearchDialogProps<TCategory extends string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: SearchConfig<TCategory>;
  /**
   * Hook que recebe a query atual e retorna grupos filtrados + loading.
   * Será chamado a cada render do dialog (regras dos hooks aplicam).
   */
  useSearch: (query: string) => UseSearchResult<TCategory>;
}

export function GlobalSearchDialog<TCategory extends string>({
  open,
  onOpenChange,
  config,
  useSearch,
}: GlobalSearchDialogProps<TCategory>) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { groups, isLoading } = useSearch(query);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  function handleSelect(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  const hasQuery = query.trim().length > 0;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Busca global"
      description={config.placeholder}
    >
      <CommandInput
        placeholder={config.placeholder}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[480px]">
        {!hasQuery && (
          <CommandGroup heading="Atalhos rápidos">
            {config.quickLinks.map((link) => {
              const Icon = config.categoryIcon[link.category] as React.ElementType;
              return (
                <CommandItem
                  key={link.href}
                  value={`atalho-${link.category}`}
                  onSelect={() => handleSelect(link.href)}
                  className="cursor-pointer"
                >
                  <span className={`p-1.5 rounded-md ${config.categoryIconBg[link.category]}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-medium">{link.label}</span>
                  <RiArrowRightSLine className="ml-auto w-4 h-4 text-muted-foreground" />
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {hasQuery && (
          <>
            <CommandEmpty>
              {isLoading ? (
                <span className="text-muted-foreground">Carregando...</span>
              ) : (
                <div className="flex flex-col items-center gap-1 py-2">
                  <RiSearchLine className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                  <span className="text-sm text-muted-foreground">
                    Nenhum resultado para “{query}”.
                  </span>
                </div>
              )}
            </CommandEmpty>

            {groups.map((group, idx) => {
              const Icon = config.categoryIcon[group.category];
              const iconBg = config.categoryIconBg[group.category];
              const remaining = group.totalMatches - group.hits.length;
              return (
                <div key={group.category}>
                  {idx > 0 && <CommandSeparator />}
                  <CommandGroup
                    heading={
                      <span className="flex items-center justify-between gap-2 pr-2">
                        <span>{group.label}</span>
                        <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                          {group.totalMatches}{' '}
                          {group.totalMatches === 1 ? 'resultado' : 'resultados'}
                        </span>
                      </span>
                    }
                  >
                    {group.hits.map((hit) => (
                      <SearchHitItem
                        key={`${hit.category}-${hit.id}`}
                        hit={hit}
                        Icon={Icon}
                        iconBg={iconBg}
                        onSelect={() => handleSelect(hit.href)}
                      />
                    ))}
                    {remaining > 0 && (
                      <CommandItem
                        value={`see-all-${group.category}`}
                        onSelect={() => handleSelect(group.seeAllHref)}
                        className="cursor-pointer text-xs text-primary font-medium justify-between"
                      >
                        <span>
                          Ver todos os {group.totalMatches} resultados em{' '}
                          {group.label.toLowerCase()}
                        </span>
                        <RiArrowRightSLine className="w-4 h-4" />
                      </CommandItem>
                    )}
                  </CommandGroup>
                </div>
              );
            })}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

interface SearchHitItemProps<TCategory extends string> {
  hit: SearchHit<TCategory>;
  Icon: React.ElementType;
  iconBg: string;
  onSelect: () => void;
}

function SearchHitItem<TCategory extends string>({
  hit,
  Icon,
  iconBg,
  onSelect,
}: SearchHitItemProps<TCategory>) {
  return (
    <CommandItem
      value={`${hit.category}-${hit.id}-${hit.title}`}
      onSelect={onSelect}
      className="cursor-pointer"
      data-testid={`search-hit-${hit.category}-${hit.id}`}
    >
      <span className={`p-1.5 rounded-md ${iconBg}`}>
        <Icon className="w-4 h-4" />
      </span>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {hit.title}
        </span>
        {hit.subtitle && (
          <span className="text-xs text-muted-foreground truncate">{hit.subtitle}</span>
        )}
      </div>
      {hit.meta && (
        <span className="text-[10px] text-muted-foreground font-mono shrink-0 ml-2">
          {hit.meta}
        </span>
      )}
    </CommandItem>
  );
}
