'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { ScrollArea } from '@shared/components/ui/scroll-area';
import { cn } from '@shared/lib/utils';
import type { MinhaObraChecklist } from '../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface VerRegistroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklist: MinhaObraChecklist | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<
  MinhaObraChecklist['tipo'],
  { icon: string; iconBg: string; iconText: string; label: string }
> = {
  seguranca: { icon: 'health_and_safety', iconBg: 'bg-red-100 dark:bg-red-900/30', iconText: 'text-red-600', label: 'Segurança' },
  diario: { icon: 'fact_check', iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconText: 'text-blue-600', label: 'Diário de Obra' },
  etapa: { icon: 'domain', iconBg: 'bg-purple-100 dark:bg-purple-900/30', iconText: 'text-purple-600', label: 'Validação de Etapa' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function VerRegistroModal({ open, onOpenChange, checklist }: VerRegistroModalProps) {
  if (!checklist) return null;

  const config = TIPO_CONFIG[checklist.tipo];
  const isCompleto = checklist.status === 'completo';
  const concluidos = checklist.itens.filter((i) => i.concluida).length;
  const total = checklist.itens.length;
  const progressoPct = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md max-h-[85vh] p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.iconBg)}>
              <span className={cn('material-symbols-outlined text-xl', config.iconText)}>
                {config.icon}
              </span>
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                {isCompleto ? 'Registro de conclusão' : 'Progresso atual'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                {checklist.nome}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-5">
            {/* Status geral */}
            <div
              className={cn(
                'p-4 rounded-xl border flex items-center justify-between',
                isCompleto
                  ? 'bg-success/5 border-success/20'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'material-symbols-outlined text-xl',
                    isCompleto ? 'text-success' : 'text-gray-400'
                  )}
                >
                  {isCompleto ? 'check_circle' : 'pending'}
                </span>
                <div>
                  <p className={cn('text-sm font-bold', isCompleto ? 'text-success' : 'text-gray-700 dark:text-gray-300')}>
                    {isCompleto ? 'Finalizado' : 'Em andamento'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {config.label} · {checklist.descricao}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'text-xs font-bold px-2 py-1 rounded',
                  isCompleto
                    ? 'text-success bg-success/20'
                    : 'text-primary bg-primary/10'
                )}
              >
                {progressoPct}%
              </span>
            </div>

            {/* Informações de conclusão */}
            {isCompleto && (
              <div className="flex flex-col gap-3">
                {checklist.completadoEm && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-base text-gray-400">schedule</span>
                    <span className="text-gray-500">Finalizado às</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{checklist.completadoEm}</span>
                  </div>
                )}
                {checklist.assinadoPor && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800 flex flex-col gap-2">
                    <p className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                      Assinado por
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center text-purple-700 font-bold text-sm">
                        {checklist.assinadoPor.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {checklist.assinadoPor}
                        </p>
                        {checklist.registroProfissional && (
                          <p className="text-xs text-gray-500">{checklist.registroProfissional}</p>
                        )}
                      </div>
                    </div>
                    {checklist.assinadoEm && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        {checklist.assinadoEm}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Lista de itens */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Itens verificados ({concluidos}/{total})
              </p>
              <div className="flex flex-col gap-1.5">
                {checklist.itens.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-lg',
                      item.concluida
                        ? 'bg-success/5'
                        : 'bg-gray-50 dark:bg-gray-800/50'
                    )}
                  >
                    <span
                      className={cn(
                        'material-symbols-outlined text-base flex-shrink-0',
                        item.concluida ? 'text-success' : 'text-gray-300'
                      )}
                    >
                      {item.concluida ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span
                      className={cn(
                        'text-sm',
                        item.concluida
                          ? 'text-gray-500 line-through'
                          : 'text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {item.titulo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
