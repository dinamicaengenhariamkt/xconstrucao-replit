'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  RiUserLine,
  RiBuilding2Line,
  RiHammerLine,
  RiArrowRightUpLine,
  RiArrowRightDownLine,
  RiArrowRightSLine,
  RiSearchLine,
} from 'react-icons/ri';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@shared/components/ui/command';
import {
  useAdminGlobalSearch,
  type AdminSearchCategory,
  type AdminSearchHit,
} from '../hooks/use-global-search';

const CATEGORY_ICON: Record<AdminSearchCategory, React.ElementType> = {
  clientes: RiUserLine,
  empreiteiras: RiBuilding2Line,
  obras: RiHammerLine,
  entradas: RiArrowRightUpLine,
  saidas: RiArrowRightDownLine,
};

const CATEGORY_ICON_BG: Record<AdminSearchCategory, string> = {
  clientes: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  empreiteiras: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  obras: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  entradas: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  saidas: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const QUICK_LINKS: { label: string; href: string; category: AdminSearchCategory }[] = [
  { label: 'Ir para Clientes', href: '/admin/clientes', category: 'clientes' },
  { label: 'Ir para Empreiteiras', href: '/admin/empreiteiras', category: 'empreiteiras' },
  { label: 'Ir para Obras', href: '/admin/obras', category: 'obras' },
  { label: 'Ir para Entradas', href: '/admin/entradas', category: 'entradas' },
  { label: 'Ir para Saídas', href: '/admin/saidas', category: 'saidas' },
];

interface AdminSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminSearchDialog({ open, onOpenChange }: AdminSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { groups, isLoading } = useAdminGlobalSearch(query);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  function handleSelect(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  const hasQuery = query.trim().length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      {/* shouldFilter desabilitado: filtragem é feita no hook */}
      <CommandInput
        placeholder="Buscar clientes, empreiteiras, obras, entradas ou saídas..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[480px]">
        {!hasQuery && (
          <CommandGroup heading="Atalhos rápidos">
            {QUICK_LINKS.map((link) => {
              const Icon = CATEGORY_ICON[link.category];
              return (
                <CommandItem
                  key={link.href}
                  value={`atalho-${link.category}`}
                  onSelect={() => handleSelect(link.href)}
                  className="cursor-pointer"
                >
                  <span className={`p-1.5 rounded-md ${CATEGORY_ICON_BG[link.category]}`}>
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
              const Icon = CATEGORY_ICON[group.category];
              const remaining = group.totalMatches - group.hits.length;
              return (
                <div key={group.category}>
                  {idx > 0 && <CommandSeparator />}
                  <CommandGroup
                    heading={
                      <span className="flex items-center justify-between gap-2 pr-2">
                        <span>{group.label}</span>
                        <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                          {group.totalMatches} {group.totalMatches === 1 ? 'resultado' : 'resultados'}
                        </span>
                      </span>
                    }
                  >
                    {group.hits.map((hit) => (
                      <SearchHitItem
                        key={`${hit.category}-${hit.id}`}
                        hit={hit}
                        Icon={Icon}
                        onSelect={() => handleSelect(hit.href)}
                      />
                    ))}
                    {remaining > 0 && (
                      <CommandItem
                        value={`see-all-${group.category}`}
                        onSelect={() => handleSelect(group.seeAllHref)}
                        className="cursor-pointer text-xs text-primary font-medium justify-between"
                      >
                        <span>Ver todos os {group.totalMatches} resultados em {group.label.toLowerCase()}</span>
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

interface SearchHitItemProps {
  hit: AdminSearchHit;
  Icon: React.ElementType;
  onSelect: () => void;
}

function SearchHitItem({ hit, Icon, onSelect }: SearchHitItemProps) {
  return (
    <CommandItem
      value={`${hit.category}-${hit.id}-${hit.title}`}
      onSelect={onSelect}
      className="cursor-pointer"
      data-testid={`search-hit-${hit.category}-${hit.id}`}
    >
      <span className={`p-1.5 rounded-md ${CATEGORY_ICON_BG[hit.category]}`}>
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
