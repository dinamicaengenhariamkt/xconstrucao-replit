'use client';

import { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@shared/components/ui/command';
import { Badge } from '@shared/components/ui/badge';
import { cn } from '@shared/lib/utils';
import { RiAddLine, RiArrowDownSLine, RiCloseLine } from 'react-icons/ri';

interface MultiSelectAddProps {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  maxItems?: number;
  minLength?: number;
  maxLength?: number;
  emptyText?: string;
  addLabel?: (term: string) => string;
  disabled?: boolean;
  className?: string;
  /** Quando true, apenas itens da lista de sugestões podem ser adicionados (Task #95). */
  disableCustom?: boolean;
  /** Notificado a cada keystroke no input — usado para fetch async de sugestões. */
  onQueryChange?: (q: string) => void;
  /** Renderização customizada de cada item de sugestão (mantém o key = string da suggestion). */
  renderSuggestion?: (s: string) => React.ReactNode;
  'data-testid'?: string;
}

function dedupeCI(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const k = trimmed.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(trimmed);
  }
  return out;
}

export function MultiSelectAdd({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Buscar ou adicionar…',
  maxItems = 25,
  minLength = 2,
  maxLength = 60,
  emptyText = 'Nenhuma sugestão.',
  addLabel = (t) => `Adicionar "${t}"`,
  disabled,
  className,
  disableCustom,
  onQueryChange,
  renderSuggestion,
  ...rest
}: MultiSelectAddProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const testid = rest['data-testid'] ?? 'multiselect-add';

  const handleQueryChange = (v: string) => {
    setQuery(v);
    onQueryChange?.(v);
  };

  const selectedSet = useMemo(() => new Set(value.map((v) => v.toLowerCase())), [value]);

  const filteredSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return suggestions.filter((s) => !selectedSet.has(s.toLowerCase()) && (!q || s.toLowerCase().includes(q)));
  }, [suggestions, selectedSet, query]);

  const trimmed = query.trim();
  const canAddCustom =
    !disableCustom &&
    trimmed.length >= minLength &&
    trimmed.length <= maxLength &&
    !selectedSet.has(trimmed.toLowerCase()) &&
    !suggestions.some((s) => s.toLowerCase() === trimmed.toLowerCase()) &&
    value.length < maxItems;

  const addItem = (raw: string) => {
    const t = raw.trim();
    if (!t || t.length < minLength || t.length > maxLength) return;
    if (selectedSet.has(t.toLowerCase())) return;
    if (value.length >= maxItems) return;
    onChange(dedupeCI([...value, t]));
    setQuery('');
  };

  const removeItem = (raw: string) => {
    onChange(value.filter((v) => v.toLowerCase() !== raw.toLowerCase()));
  };

  return (
    <div className={cn('flex flex-col gap-2', className)} data-testid={testid}>
      <div className="flex flex-wrap gap-1.5 min-h-[2.25rem]" data-testid={`${testid}-chips`}>
        {value.length === 0 && (
          <span className="text-xs text-muted-foreground self-center">Nenhum item selecionado.</span>
        )}
        {value.map((item) => (
          <Badge
            key={item.toLowerCase()}
            variant="secondary"
            className="gap-1 pl-2 pr-1 py-1 text-xs font-medium"
            data-testid={`${testid}-chip-${item}`}
          >
            {item}
            <button
              type="button"
              aria-label={`Remover ${item}`}
              onClick={() => removeItem(item)}
              disabled={disabled}
              className="ml-0.5 inline-flex w-4 h-4 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10"
              data-testid={`${testid}-remove-${item}`}
            >
              <RiCloseLine className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled || value.length >= maxItems}
            className={cn(
              'inline-flex items-center justify-between gap-2 h-9 px-3 rounded-md border border-input bg-transparent text-sm shadow-xs transition-colors',
              'hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed',
            )}
            data-testid={`${testid}-trigger`}
          >
            <span className="text-muted-foreground">
              {value.length >= maxItems ? `Limite de ${maxItems} atingido` : placeholder}
            </span>
            <RiArrowDownSLine className="w-4 h-4 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-[--radix-popover-trigger-width] min-w-[260px] z-[1100]"
          align="start"
          side="bottom"
          sideOffset={6}
          collisionPadding={12}
          avoidCollisions
          data-testid={`${testid}-popover`}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Digite para buscar…"
              value={query}
              onValueChange={handleQueryChange}
              data-testid={`${testid}-input`}
            />
            <CommandList>
              {filteredSuggestions.length === 0 && !canAddCustom && (
                <CommandEmpty>{emptyText}</CommandEmpty>
              )}
              {filteredSuggestions.length > 0 && (
                <CommandGroup heading="Sugestões">
                  {filteredSuggestions.map((s) => (
                    <CommandItem
                      key={s}
                      value={s}
                      onSelect={() => addItem(s)}
                      data-testid={`${testid}-option-${s}`}
                    >
                      {renderSuggestion ? renderSuggestion(s) : s}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {canAddCustom && (
                <CommandGroup heading="Personalizado">
                  <CommandItem
                    value={`__add__${trimmed}`}
                    onSelect={() => addItem(trimmed)}
                    data-testid={`${testid}-add-custom`}
                  >
                    <RiAddLine className="w-4 h-4 mr-1" />
                    {addLabel(trimmed)}
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
