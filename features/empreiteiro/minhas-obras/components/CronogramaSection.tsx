'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/components/ui/alert-dialog';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';
import { NovaAtividadeModal } from './NovaAtividadeModal';
import type { MinhaObraDetalhe, ObraAtividade } from '../types';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ObraAtividade['status'], {
  rowBg: string;
  icon: string;
  iconColor: string;
  textClass: string;
  barColor: string;
  barBg: string;
  badge: { label: string; classes: string };
}> = {
  concluido: {
    rowBg: 'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
    icon: 'check_circle',
    iconColor: 'text-success',
    textClass: 'text-gray-500 line-through',
    barColor: 'bg-success',
    barBg: 'bg-success/20',
    badge: { label: 'Concluído', classes: 'text-success bg-success/10' },
  },
  em_andamento: {
    rowBg: 'bg-primary/5 dark:bg-primary/10',
    icon: 'play_circle',
    iconColor: 'text-primary',
    textClass: 'text-gray-900 dark:text-white font-bold',
    barColor: 'bg-primary',
    barBg: 'bg-gray-200 dark:bg-gray-700',
    badge: { label: 'Andamento', classes: 'text-primary bg-primary/10' },
  },
  atrasado: {
    rowBg: 'bg-amber-50/50 dark:bg-amber-900/10',
    icon: 'warning',
    iconColor: 'text-amber-500',
    textClass: 'text-gray-900 dark:text-white font-bold',
    barColor: 'bg-amber-500',
    barBg: 'bg-amber-100 dark:bg-amber-900/30',
    badge: { label: 'Atrasado', classes: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  },
  pendente: {
    rowBg: 'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
    icon: 'schedule',
    iconColor: 'text-gray-400',
    textClass: 'text-gray-500',
    barColor: 'bg-gray-300',
    barBg: 'bg-gray-100 dark:bg-gray-800',
    badge: { label: 'Pendente', classes: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _counter = 100;
function gerarId(): string {
  return `at-new-${++_counter}`;
}

function exportarCSV(obra: MinhaObraDetalhe, atividades: ObraAtividade[]): void {
  const STATUS_LABELS: Record<ObraAtividade['status'], string> = {
    concluido: 'Concluído',
    em_andamento: 'Em Andamento',
    atrasado: 'Atrasado',
    pendente: 'Pendente',
  };

  const header = ['Atividade', 'Responsável', 'Início', 'Fim', 'Progresso (%)', 'Status', 'Descrição'];
  const rows = atividades.map((at) => [
    at.nome,
    at.responsavel,
    at.inicio,
    at.fim,
    String(at.progresso),
    STATUS_LABELS[at.status],
    at.descricao ?? '',
  ]);

  const csv = [header, ...rows].map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cronograma-${obra.titulo.replace(/\s+/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalType = 'nova' | 'editar' | 'excluir' | null;

interface ModalState {
  type: ModalType;
  atividade: ObraAtividade | null;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CronogramaSectionProps {
  obra: MinhaObraDetalhe;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CronogramaSection({ obra }: CronogramaSectionProps) {
  const [atividades, setAtividades] = useState<ObraAtividade[]>(obra.atividades);
  const [modal, setModal] = useState<ModalState>({ type: null, atividade: null });

  const obraFinalizada = obra.status === 'finalizada';

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const total = atividades.length;
  const concluidas = atividades.filter((a) => a.status === 'concluido').length;
  const atrasadas = atividades.filter((a) => a.status === 'atrasado').length;
  const progressoMedio = total > 0
    ? Math.round(atividades.reduce((acc, a) => acc + a.progresso, 0) / total)
    : 0;

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleNova = () => setModal({ type: 'nova', atividade: null });

  const handleEditar = (at: ObraAtividade) => setModal({ type: 'editar', atividade: at });

  const handleConcluir = (at: ObraAtividade) => {
    setAtividades((prev) =>
      prev.map((a) => a.id === at.id ? { ...a, status: 'concluido', progresso: 100 } : a)
    );
  };

  const handleExcluirConfirm = () => {
    if (!modal.atividade) return;
    setAtividades((prev) => prev.filter((a) => a.id !== modal.atividade!.id));
    setModal({ type: null, atividade: null });
  };

  const handleSalvar = (data: Omit<ObraAtividade, 'id'>) => {
    if (modal.type === 'nova') {
      setAtividades((prev) => [...prev, { id: gerarId(), ...data }]);
    } else if (modal.type === 'editar' && modal.atividade) {
      setAtividades((prev) =>
        prev.map((a) => a.id === modal.atividade!.id ? { ...a, ...data } : a)
      );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cronograma Operacional</h3>
          <p className="text-sm text-gray-500">Atividades, responsáveis e prazos</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportarCSV(obra, atividades)}
            className="gap-2"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Exportar
          </Button>
          <Button
            size="sm"
            onClick={handleNova}
            disabled={obraFinalizada}
            className="gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Nova Atividade
          </Button>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-gray-900 dark:text-white">{total}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total</p>
        </div>
        <div className="bg-success/5 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-success">{concluidas}</p>
          <p className="text-xs text-gray-500 mt-0.5">Concluídas</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-amber-600">{atrasadas}</p>
          <p className="text-xs text-gray-500 mt-0.5">Atrasadas</p>
        </div>
        <div className="bg-primary/5 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-primary">{progressoMedio}%</p>
          <p className="text-xs text-gray-500 mt-0.5">Progresso médio</p>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {atividades.length === 0 ? (
        <div className="py-16 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-300 block mb-3">
            calendar_today
          </span>
          <p className="text-sm font-medium text-gray-500">Nenhuma atividade no cronograma</p>
          {!obraFinalizada && (
            <Button variant="ghost" size="sm" className="mt-3 gap-1 text-primary" onClick={handleNova}>
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Adicionar atividade
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                <th className="text-left py-4 px-4 w-[35%]">Atividade</th>
                <th className="text-left py-4 px-2">Responsável</th>
                <th className="text-center py-4 px-2">Início</th>
                <th className="text-center py-4 px-2">Fim</th>
                <th className="text-center py-4 px-2 w-32">Progresso</th>
                <th className="text-center py-4 px-2">Status</th>
                {!obraFinalizada && <th className="py-4 px-2 w-10" />}
              </tr>
            </thead>
            <tbody>
              {atividades.map((atividade) => {
                const config = STATUS_CONFIG[atividade.status];
                return (
                  <tr
                    key={atividade.id}
                    className={cn('border-b border-gray-50 dark:border-gray-800', config.rowBg)}
                  >
                    {/* Nome + descrição */}
                    <td className="py-4 px-4">
                      <div className="flex items-start gap-3">
                        <span className={cn('material-symbols-outlined text-lg mt-0.5 shrink-0', config.iconColor)}>
                          {config.icon}
                        </span>
                        <div>
                          <span className={cn('text-sm', config.textClass)}>{atividade.nome}</span>
                          {atividade.descricao && (
                            <p className="text-xs text-gray-400 mt-0.5 leading-snug">{atividade.descricao}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Responsável */}
                    <td className="py-4 px-2 text-sm text-gray-600 dark:text-gray-400">
                      {atividade.responsavel}
                    </td>

                    {/* Início */}
                    <td className="py-4 px-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                      {atividade.inicio}
                    </td>

                    {/* Fim */}
                    <td className={cn(
                      'py-4 px-2 text-sm text-center',
                      atividade.status === 'atrasado' ? 'text-amber-600 font-bold' : 'text-gray-500 dark:text-gray-400'
                    )}>
                      {atividade.fim}
                    </td>

                    {/* Progresso */}
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2">
                        <div className={cn('flex-1 h-2 rounded-full overflow-hidden', config.barBg)}>
                          <div
                            className={cn('h-full rounded-full transition-all', config.barColor)}
                            style={{ width: `${atividade.progresso}%` }}
                          />
                        </div>
                        <span className={cn(
                          'text-xs font-bold tabular-nums w-8 text-right',
                          atividade.status === 'atrasado' ? 'text-amber-600'
                            : atividade.status === 'em_andamento' ? 'text-primary'
                            : atividade.status === 'concluido' ? 'text-success'
                            : 'text-gray-400'
                        )}>
                          {atividade.progresso}%
                        </span>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-4 px-2 text-center">
                      <span className={cn('text-[10px] font-bold px-2 py-1 rounded', config.badge.classes)}>
                        {config.badge.label}
                      </span>
                    </td>

                    {/* ⋮ Menu */}
                    {!obraFinalizada && (
                      <td className="py-4 px-2 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                              aria-label="Ações"
                            >
                              <span className="material-symbols-outlined text-base">more_vert</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleEditar(atividade)} className="cursor-pointer">
                              <span className="material-symbols-outlined text-sm mr-2">edit</span>
                              Editar
                            </DropdownMenuItem>
                            {atividade.status !== 'concluido' && (
                              <DropdownMenuItem
                                onClick={() => handleConcluir(atividade)}
                                className="cursor-pointer text-success focus:text-success"
                              >
                                <span className="material-symbols-outlined text-sm mr-2">task_alt</span>
                                Marcar como Concluída
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setModal({ type: 'excluir', atividade })}
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <span className="material-symbols-outlined text-sm mr-2">delete</span>
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add dashed button ───────────────────────────────────────────────── */}
      {!obraFinalizada && atividades.length > 0 && (
        <button
          onClick={handleNova}
          className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-500 hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Adicionar atividade ao cronograma
        </button>
      )}

      {/* ── Modal: Nova / Editar ────────────────────────────────────────────── */}
      <NovaAtividadeModal
        open={modal.type === 'nova' || modal.type === 'editar'}
        onOpenChange={(open) => { if (!open) setModal({ type: null, atividade: null }); }}
        atividade={modal.type === 'editar' ? modal.atividade : null}
        onSalvar={handleSalvar}
      />

      {/* ── AlertDialog: Excluir ────────────────────────────────────────────── */}
      <AlertDialog
        open={modal.type === 'excluir'}
        onOpenChange={(open) => { if (!open) setModal({ type: null, atividade: null }); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir atividade?</AlertDialogTitle>
            <AlertDialogDescription>
              {modal.atividade && (
                <>
                  A atividade <strong>&ldquo;{modal.atividade.nome}&rdquo;</strong> será removida permanentemente.
                  Esta ação não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluirConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
