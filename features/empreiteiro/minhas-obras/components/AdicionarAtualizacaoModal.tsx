'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import type { TimelineEvent } from '../types';
import { IconAddTask, IconPerson, IconCalendarToday, IconAdd, IconStickyNote, IconTrendingUp, IconTaskAlt, IconWarning, IconDescription } from '@shared/components/icons';
import type { ComponentType } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type EventTipo = TimelineEvent['tipo'];

interface AdicionarAtualizacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (event: TimelineEvent) => void;
}

// ─── Configs ──────────────────────────────────────────────────────────────────

const TIPOS: { value: EventTipo; label: string; Icon: ComponentType<{ className?: string }> }[] = [
  { value: 'nota', label: 'Nota', Icon: IconStickyNote },
  { value: 'progresso', label: 'Progresso', Icon: IconTrendingUp },
  { value: 'tarefa', label: 'Tarefa', Icon: IconTaskAlt },
  { value: 'problema', label: 'Problema', Icon: IconWarning },
  { value: 'documento', label: 'Documento', Icon: IconDescription },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function AdicionarAtualizacaoModal({
  open,
  onOpenChange,
  onAdd,
}: AdicionarAtualizacaoModalProps) {
  const [tipo, setTipo] = useState<EventTipo>('nota');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');

  const resetForm = () => {
    setTipo('nota');
    setTitulo('');
    setDescricao('');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const now = new Date();
    const data = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    onAdd({
      id: `local-${Date.now()}`,
      tipo,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      autor: 'Empreiteiro',
      data,
    });

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="w-full max-w-md p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconAddTask className="text-primary text-xl" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Adicionar Atualização
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                Nova entrada na timeline da obra
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 flex flex-col gap-5">
            {/* Tipo */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Tipo de atualização</p>
              <div className="flex flex-wrap gap-2">
                {TIPOS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTipo(t.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      tipo === t.value
                        ? 'bg-primary text-white border-primary'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    }`}
                  >
                    <t.Icon className="text-sm" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Título */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                Título <span className="text-red-500">*</span>
              </label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Fundação concluída com sucesso"
                className="text-sm"
                required
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                Descrição
              </label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes adicionais sobre esta atualização..."
                className="text-sm resize-none"
                rows={3}
              />
            </div>

            {/* Autor + Data (display only) */}
            <div className="flex gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <IconPerson className="text-sm" />
                <span>Empreiteiro</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <IconCalendarToday className="text-sm" />
                <span>{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="p-5 pt-0 flex flex-row justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={!titulo.trim()}>
              <IconAdd className="text-sm mr-1" />
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
