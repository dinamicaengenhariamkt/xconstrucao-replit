'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';
import type { MembroEquipe } from '../types';
import { IconKey, IconCheckCircle, IconSave, IconVisibility, IconEdit, IconAdminPanelSettings } from '@shared/components/icons';
import type { ComponentType } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

type Permissao = NonNullable<MembroEquipe['permissao']>;

const PERMISSAO_OPTIONS: {
  value: Permissao;
  label: string;
  descricao: string;
  Icon: ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    value: 'visualizar',
    label: 'Visualizar',
    descricao: 'Pode ver informações, documentos e relatórios da obra',
    Icon: IconVisibility,
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-200 dark:border-gray-700',
  },
  {
    value: 'editar',
    label: 'Editar',
    descricao: 'Pode criar e modificar registros, ocorrências e cronograma',
    Icon: IconEdit,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50/50 dark:bg-blue-900/10',
    border: 'border-blue-200 dark:border-blue-800',
  },
  {
    value: 'admin',
    label: 'Admin',
    descricao: 'Acesso total, incluindo gerenciar equipe e configurações',
    Icon: IconAdminPanelSettings,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50/50 dark:bg-emerald-900/10',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface PermissoesMembroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membro: MembroEquipe | null;
  onSalvar: (permissao: Permissao) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PermissoesMembroModal({
  open,
  onOpenChange,
  membro,
  onSalvar,
}: PermissoesMembroModalProps) {
  const [selected, setSelected] = useState<Permissao>('visualizar');

  useEffect(() => {
    if (open && membro) {
      setSelected(membro.permissao ?? 'visualizar');
    }
  }, [open, membro]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSalvar = () => {
    onSalvar(selected);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-sm p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg">
              <IconKey className="text-primary text-xl" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Permissões de acesso
              </DialogTitle>
              {membro && (
                <DialogDescription className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                  {membro.nome}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-5 flex flex-col gap-3">
          {PERMISSAO_OPTIONS.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(opt.value)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                  isSelected
                    ? cn(opt.bg, opt.border, 'ring-1 ring-inset', opt.border)
                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700',
                )}
              >
                <div className={cn('p-1.5 rounded-lg', isSelected ? opt.bg : 'bg-gray-100 dark:bg-gray-800')}>
                  <opt.Icon className={cn('text-base', isSelected ? opt.color : 'text-gray-400')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-bold', isSelected ? opt.color : 'text-gray-700 dark:text-gray-300')}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                    {opt.descricao}
                  </p>
                </div>
                {isSelected && (
                  <IconCheckCircle className={cn('text-base flex-shrink-0', opt.color)} />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <DialogFooter className="p-5 pt-0 flex flex-row justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="button" size="sm" onClick={handleSalvar}>
            <IconSave className="text-sm mr-1" />
            Salvar permissão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
