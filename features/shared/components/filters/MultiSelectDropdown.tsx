'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Input } from '@shared/components/ui/input';
import { cn } from '@shared/lib/utils';
import { RiArrowDownSLine, RiSearchLine } from 'react-icons/ri';

export interface MultiSelectDropdownOption<T extends string | number> {
  value: T;
  label: string;
}

interface MultiSelectDropdownProps<T extends string | number> {
  label: string;
  options: MultiSelectDropdownOption<T>[];
  values: T[];
  onChange: (next: T[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  /** Esconde a busca quando a lista é pequena. Default: mostra se options.length > 6. */
  showSearch?: boolean;
  testIdPrefix?: string;
}

/**
 * Dropdown com lista de opções selecionáveis por checkbox + busca opcional.
 * Compacta listas grandes (UF, especialidades) em um único trigger.
 */
export function MultiSelectDropdown<T extends string | number>({
  label,
  options,
  values,
  onChange,
  placeholder = 'Selecionar...',
  searchPlaceholder = 'Buscar...',
  showSearch,
  testIdPrefix,
}: MultiSelectDropdownProps<T>) {
  const [search, setSearch] = useState('');

  const shouldShowSearch = showSearch ?? options.length > 6;
  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggle = (v: T) => {
    if (values.includes(v)) {
      onChange(values.filter((x) => x !== v));
    } else {
      onChange([...values, v]);
    }
  };

  const triggerLabel =
    values.length === 0
      ? placeholder
      : values.length === 1
      ? options.find((o) => o.value === values[0])?.label ?? String(values[0])
      : `${values.length} selecionados`;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer',
              values.length > 0
                ? 'bg-primary/5 border-primary/30 text-gray-900 dark:text-gray-100'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            )}
            data-testid={testIdPrefix ? `${testIdPrefix}-trigger` : undefined}
          >
            <span className="truncate">{triggerLabel}</span>
            <span className="flex items-center gap-1.5 shrink-0">
              {values.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold tabular-nums">
                  {values.length}
                </span>
              )}
              <RiArrowDownSLine className="w-4 h-4 text-gray-400" />
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={6} className="w-72 p-0">
          {shouldShowSearch && (
            <div className="p-2 border-b border-gray-100 dark:border-gray-800">
              <div className="relative">
                <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-sm"
                />
              </div>
            </div>
          )}
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-xs text-center text-muted-foreground">
                Nenhum resultado.
              </p>
            ) : (
              filtered.map((opt) => {
                const checked = values.includes(opt.value);
                return (
                  <label
                    key={String(opt.value)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    data-testid={testIdPrefix ? `${testIdPrefix}-option-${opt.value}` : undefined}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(opt.value)} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                  </label>
                );
              })
            )}
          </div>
          {values.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-800 p-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full text-xs text-primary font-semibold hover:underline cursor-pointer"
              >
                Limpar seleção ({values.length})
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
