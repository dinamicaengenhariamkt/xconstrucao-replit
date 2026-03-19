'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@shared/components/ui/popover';
import { cn } from '@shared/lib/utils';
import { STATUS_LABELS } from '@shared/constants/status';
import type { ObraPickerItem, ObraRefAttachment } from '../types';
import { IconSearch } from '@shared/components/icons';

const STATUS_DOT: Record<string, string> = {
  em_execucao: 'bg-green-500',
  com_atrasos: 'bg-red-500',
  com_pendencias: 'bg-amber-500',
  planejamento: 'bg-indigo-400',
  finalizada: 'bg-slate-400',
};

interface ObraPickerSheetProps {
  obras: ObraPickerItem[];
  onSelect: (attachment: ObraRefAttachment) => void;
  children: React.ReactNode;
}

export function ObraPickerSheet({ obras, onSelect, children }: ObraPickerSheetProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = obras.filter(
    (o) =>
      o.titulo.toLowerCase().includes(search.toLowerCase()) ||
      o.endereco.toLowerCase().includes(search.toLowerCase()),
  );

  function handleSelect(obra: ObraPickerItem) {
    onSelect({
      type: 'obra_ref',
      obraId: obra.id,
      obraNome: obra.titulo,
      obraStatus: obra.status,
      progresso: obra.progresso,
      endereco: obra.endereco,
    });
    setOpen(false);
    setSearch('');
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-80 p-0 shadow-xl rounded-2xl overflow-hidden"
      >
        <div className="p-3 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Referenciar obra
          </p>
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
            <input
              type="text"
              placeholder="Buscar obra..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white placeholder-gray-400"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma obra encontrada</p>
          ) : (
            filtered.map((obra) => (
              <button
                key={obra.id}
                onClick={() => handleSelect(obra)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full mt-1.5',
                      STATUS_DOT[obra.status] ?? 'bg-gray-400',
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {obra.titulo}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{obra.endereco}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${obra.progresso}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      {obra.progresso}% · {STATUS_LABELS[obra.status] ?? obra.status}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
