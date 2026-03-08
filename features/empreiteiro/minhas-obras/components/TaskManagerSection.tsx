'use client';

import { useState, useMemo } from 'react';
import { cn } from '@shared/lib/utils';
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
import { NovaTarefaModal } from './NovaTarefaModal';
import { BloquearTarefaModal } from './BloquearTarefaModal';
import { AtualizarProgressoModal } from './AtualizarProgressoModal';
import type { MinhaObraDetalhe, MinhaObraTarefa } from '../types';
import { IconBlock, IconPerson, IconEvent, IconAttachFile, IconMoreVert, IconEdit, IconPlayArrow, IconDataUsage, IconCheckCircle, IconLockOpen, IconUndo, IconContentCopy, IconDelete, IconAdd, IconTaskAlt, IconAddCircle } from '@shared/components/icons';

// ─── Constantes ───────────────────────────────────────────────────────────────

type TaskFilter = 'todos' | 'pendente' | 'em_andamento' | 'bloqueado' | 'concluido';

const FILTER_LABELS: Record<TaskFilter, string> = {
  todos: 'Todos',
  pendente: 'Pendentes',
  em_andamento: 'Em Andamento',
  bloqueado: 'Bloqueados',
  concluido: 'Concluídos',
};

const FILTER_TEXT_COLORS: Record<TaskFilter, string> = {
  todos: '',
  pendente: '',
  em_andamento: '',
  bloqueado: 'text-amber-600',
  concluido: 'text-success',
};

const STATUS_BADGE: Record<MinhaObraTarefa['status'], { label: string; classes: string }> = {
  pendente: { label: 'Pendente', classes: 'text-gray-500 bg-gray-200 dark:bg-gray-700 dark:text-gray-300' },
  em_andamento: { label: 'Em Andamento', classes: 'text-primary bg-primary/10' },
  bloqueado: { label: 'Bloqueado', classes: 'text-amber-600 bg-amber-100' },
  concluido: { label: 'Concluído', classes: 'text-success bg-success/20' },
};

// ─── Tipos de modal ───────────────────────────────────────────────────────────

type ModalType = 'nova' | 'editar' | 'bloquear' | 'progresso' | 'excluir' | null;

interface ModalState {
  type: ModalType;
  tarefa: MinhaObraTarefa | null;
}

// ─── TaskRow ──────────────────────────────────────────────────────────────────

interface TaskRowProps {
  tarefa: MinhaObraTarefa;
  onEditar: (t: MinhaObraTarefa) => void;
  onBloquear: (t: MinhaObraTarefa) => void;
  onDesbloquear: (t: MinhaObraTarefa) => void;
  onIniciar: (t: MinhaObraTarefa) => void;
  onConcluir: (t: MinhaObraTarefa) => void;
  onReabrir: (t: MinhaObraTarefa) => void;
  onAtualizarProgresso: (t: MinhaObraTarefa) => void;
  onDuplicar: (t: MinhaObraTarefa) => void;
  onExcluir: (t: MinhaObraTarefa) => void;
}

function TaskRow({
  tarefa,
  onEditar,
  onBloquear,
  onDesbloquear,
  onIniciar,
  onConcluir,
  onReabrir,
  onAtualizarProgresso,
  onDuplicar,
  onExcluir,
}: TaskRowProps) {
  const badge = STATUS_BADGE[tarefa.status];
  const isConcluido = tarefa.status === 'concluido';
  const isBloqueado = tarefa.status === 'bloqueado';
  const isEmAndamento = tarefa.status === 'em_andamento';
  const isPendente = tarefa.status === 'pendente';

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border group transition-colors',
        isConcluido && 'bg-success/5 border-success/20',
        isBloqueado && 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 border-l-4 border-l-amber-500',
        isEmAndamento && 'bg-primary/5 border-primary/20',
        isPendente && 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
      )}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        readOnly
        checked={isConcluido}
        disabled={isBloqueado}
        className={cn(
          'w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0',
          isBloqueado && 'cursor-not-allowed opacity-50'
        )}
      />

      {/* Conteúdo principal */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold text-gray-900 dark:text-white', isConcluido && 'line-through text-gray-400')}>
          {tarefa.titulo}
        </p>

        {isBloqueado && tarefa.bloqueioMotivo ? (
          <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
            <IconBlock className="text-sm" />
            <span>Bloqueado: {tarefa.bloqueioMotivo}</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <IconPerson className="text-sm" />
              {tarefa.responsavel}
            </span>
            <span className="flex items-center gap-1">
              <IconEvent className="text-sm" />
              {tarefa.prazo}
            </span>
            {tarefa.anexos != null && tarefa.anexos > 0 && (
              <span className="flex items-center gap-1">
                <IconAttachFile className="text-sm" />
                {tarefa.anexos} {tarefa.anexos === 1 ? 'anexo' : 'anexos'}
              </span>
            )}
          </div>
        )}

        {isBloqueado && tarefa.bloqueioInfo && (
          <div className="mt-2 p-2 bg-amber-100/60 dark:bg-amber-900/20 rounded text-xs text-amber-700 dark:text-amber-400">
            {tarefa.bloqueioInfo}
          </div>
        )}

        {isEmAndamento && tarefa.progresso != null && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${tarefa.progresso}%` }} />
            </div>
            <span className="text-xs font-bold text-primary">{tarefa.progresso}%</span>
          </div>
        )}
      </div>

      {/* Lado direito: badge + menu */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={cn('text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider', badge.classes)}>
          {badge.label}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1.5 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Ações da tarefa"
            >
              <IconMoreVert className="text-lg" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {/* Editar — sempre disponível */}
            <DropdownMenuItem onClick={() => onEditar(tarefa)} className="cursor-pointer">
              <IconEdit className="text-sm mr-2 text-gray-500" />
              {isConcluido ? 'Ver / Editar detalhes' : 'Editar tarefa'}
            </DropdownMenuItem>

            {/* Ações de transição de status */}
            {isPendente && (
              <DropdownMenuItem onClick={() => onIniciar(tarefa)} className="cursor-pointer">
                <IconPlayArrow className="text-sm mr-2 text-primary" />
                Iniciar tarefa
              </DropdownMenuItem>
            )}

            {isEmAndamento && (
              <DropdownMenuItem onClick={() => onAtualizarProgresso(tarefa)} className="cursor-pointer">
                <IconDataUsage className="text-sm mr-2 text-primary" />
                Atualizar progresso...
              </DropdownMenuItem>
            )}

            {(isPendente || isEmAndamento) && (
              <DropdownMenuItem onClick={() => onConcluir(tarefa)} className="cursor-pointer">
                <IconCheckCircle className="text-sm mr-2 text-success" />
                Marcar como concluída
              </DropdownMenuItem>
            )}

            {(isPendente || isEmAndamento) && (
              <DropdownMenuItem onClick={() => onBloquear(tarefa)} className="cursor-pointer">
                <IconBlock className="text-sm mr-2 text-amber-500" />
                Bloquear...
              </DropdownMenuItem>
            )}

            {isBloqueado && (
              <>
                <DropdownMenuItem onClick={() => onDesbloquear(tarefa)} className="cursor-pointer">
                  <IconLockOpen className="text-sm mr-2 text-success" />
                  Desbloquear tarefa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onConcluir(tarefa)} className="cursor-pointer">
                  <IconCheckCircle className="text-sm mr-2 text-success" />
                  Marcar como concluída
                </DropdownMenuItem>
              </>
            )}

            {isConcluido && (
              <DropdownMenuItem onClick={() => onReabrir(tarefa)} className="cursor-pointer">
                <IconUndo className="text-sm mr-2 text-gray-500" />
                Reabrir tarefa
              </DropdownMenuItem>
            )}

            {/* Duplicar — sempre disponível */}
            <DropdownMenuItem onClick={() => onDuplicar(tarefa)} className="cursor-pointer">
              <IconContentCopy className="text-sm mr-2 text-gray-500" />
              Duplicar tarefa
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Excluir */}
            <DropdownMenuItem
              onClick={() => onExcluir(tarefa)}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
            >
              <IconDelete className="text-sm mr-2" />
              Excluir tarefa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── TaskGroup ────────────────────────────────────────────────────────────────

interface TaskGroupProps {
  etapaNome: string;
  tarefas: MinhaObraTarefa[];
  isActive: boolean;
  completedCount: number;
  rowProps: Omit<TaskRowProps, 'tarefa'>;
}

function TaskGroup({ etapaNome, tarefas, isActive, completedCount, rowProps }: TaskGroupProps) {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className={cn('w-2 h-2 rounded-full', isActive ? 'bg-primary animate-pulse' : 'bg-success')} />
        {etapaNome}
        <span className="text-xs font-normal text-gray-400 ml-1">
          {completedCount}/{tarefas.length} completas
        </span>
      </h4>
      <div className="space-y-3">
        {tarefas.map((tarefa) => (
          <TaskRow key={tarefa.id} tarefa={tarefa} {...rowProps} />
        ))}
      </div>
    </div>
  );
}

// ─── TaskManagerSection ───────────────────────────────────────────────────────

interface TaskManagerSectionProps {
  obra: MinhaObraDetalhe;
}

export function TaskManagerSection({ obra }: TaskManagerSectionProps) {
  // Estado local das tarefas (mutable durante a sessão)
  const [tarefas, setTarefas] = useState<MinhaObraTarefa[]>(obra.tarefas);
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('todos');

  // Controle unificado de modais
  const [modalState, setModalState] = useState<ModalState>({ type: null, tarefa: null });

  const openModal = (type: ModalType, tarefa?: MinhaObraTarefa) =>
    setModalState({ type, tarefa: tarefa ?? null });
  const closeModal = () => setModalState({ type: null, tarefa: null });

  const obraFinalizada = obra.status === 'finalizada';

  // ── Contagens para os filtros ──────────────────────────────────────────────

  const counts = useMemo(() => ({
    todos: tarefas.length,
    pendente: tarefas.filter((t) => t.status === 'pendente').length,
    em_andamento: tarefas.filter((t) => t.status === 'em_andamento').length,
    bloqueado: tarefas.filter((t) => t.status === 'bloqueado').length,
    concluido: tarefas.filter((t) => t.status === 'concluido').length,
  }), [tarefas]);

  const filteredTarefas = useMemo(() =>
    activeFilter === 'todos' ? tarefas : tarefas.filter((t) => t.status === activeFilter),
    [tarefas, activeFilter]
  );

  const etapaGroups = useMemo(() => {
    const groups: Record<string, MinhaObraTarefa[]> = {};
    for (const tarefa of filteredTarefas) {
      if (!groups[tarefa.etapa]) groups[tarefa.etapa] = [];
      groups[tarefa.etapa].push(tarefa);
    }
    return groups;
  }, [filteredTarefas]);

  // ── Handlers de CRUD e transições ─────────────────────────────────────────

  const handleSalvarTarefa = (tarefa: MinhaObraTarefa) => {
    setTarefas((prev) => {
      const idx = prev.findIndex((t) => t.id === tarefa.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = tarefa;
        return next;
      }
      return [...prev, tarefa];
    });
  };

  const updateStatus = (tarefa: MinhaObraTarefa, patch: Partial<MinhaObraTarefa>) => {
    setTarefas((prev) =>
      prev.map((t) => (t.id === tarefa.id ? { ...t, ...patch } : t))
    );
  };

  const handleIniciar = (tarefa: MinhaObraTarefa) =>
    updateStatus(tarefa, { status: 'em_andamento', progresso: tarefa.progresso ?? 0, bloqueioMotivo: undefined, bloqueioInfo: undefined });

  const handleConcluir = (tarefa: MinhaObraTarefa) =>
    updateStatus(tarefa, { status: 'concluido', progresso: undefined, bloqueioMotivo: undefined, bloqueioInfo: undefined });

  const handleReabrir = (tarefa: MinhaObraTarefa) =>
    updateStatus(tarefa, { status: 'pendente', progresso: undefined, bloqueioMotivo: undefined, bloqueioInfo: undefined });

  const handleDesbloquear = (tarefa: MinhaObraTarefa) =>
    updateStatus(tarefa, { status: 'pendente', bloqueioMotivo: undefined, bloqueioInfo: undefined });

  const handleConfirmarBloqueio = (motivo: string, info?: string) => {
    if (!modalState.tarefa) return;
    updateStatus(modalState.tarefa, { status: 'bloqueado', bloqueioMotivo: motivo, bloqueioInfo: info, progresso: undefined });
  };

  const handleConfirmarProgresso = (progresso: number) => {
    if (!modalState.tarefa) return;
    updateStatus(modalState.tarefa, { progresso });
  };

  const handleDuplicar = (tarefa: MinhaObraTarefa) => {
    const copia: MinhaObraTarefa = {
      ...tarefa,
      id: `tk${Date.now()}_copia`,
      titulo: `${tarefa.titulo} (cópia)`,
      status: 'pendente',
      progresso: undefined,
      bloqueioMotivo: undefined,
      bloqueioInfo: undefined,
    };
    setTarefas((prev) => [...prev, copia]);
  };

  const handleExcluir = () => {
    if (!modalState.tarefa) return;
    setTarefas((prev) => prev.filter((t) => t.id !== modalState.tarefa!.id));
    closeModal();
  };

  // ── Props compartilhadas do TaskRow ────────────────────────────────────────

  const rowProps: Omit<TaskRowProps, 'tarefa'> = {
    onEditar: (t) => openModal('editar', t),
    onBloquear: (t) => openModal('bloquear', t),
    onDesbloquear: handleDesbloquear,
    onIniciar: handleIniciar,
    onConcluir: handleConcluir,
    onReabrir: handleReabrir,
    onAtualizarProgresso: (t) => openModal('progresso', t),
    onDuplicar: handleDuplicar,
    onExcluir: (t) => openModal('excluir', t),
  };

  const filters: TaskFilter[] = ['todos', 'pendente', 'em_andamento', 'bloqueado', 'concluido'];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gerenciamento de Tarefas</h3>
            <p className="text-sm text-gray-500">Organize e acompanhe as atividades da obra</p>
          </div>
          <button
            onClick={() => !obraFinalizada && openModal('nova')}
            disabled={obraFinalizada}
            title={obraFinalizada ? 'Obra finalizada — não é possível adicionar tarefas' : undefined}
            className={cn(
              'px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 w-fit',
              obraFinalizada
                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500'
                : 'bg-primary hover:bg-primary/90 cursor-pointer'
            )}
          >
            <IconAdd className="text-sm" />
            Nova Tarefa
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer',
                activeFilter === filter
                  ? 'bg-primary text-white'
                  : cn('bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700', FILTER_TEXT_COLORS[filter] || 'text-gray-600 dark:text-gray-300')
              )}
            >
              {FILTER_LABELS[filter]} ({counts[filter]})
            </button>
          ))}
        </div>

        {/* Lista agrupada por etapa */}
        {Object.keys(etapaGroups).length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            <IconTaskAlt className="text-4xl block mb-2 opacity-40" />
            Nenhuma tarefa encontrada
          </div>
        ) : (
          Object.entries(etapaGroups).map(([etapaNome, tarefasGrupo]) => {
            const completedCount = tarefasGrupo.filter((t) => t.status === 'concluido').length;
            const isActive = tarefasGrupo.some((t) => t.status === 'em_andamento' || t.status === 'pendente');
            return (
              <TaskGroup
                key={etapaNome}
                etapaNome={etapaNome}
                tarefas={tarefasGrupo}
                isActive={isActive}
                completedCount={completedCount}
                rowProps={rowProps}
              />
            );
          })
        )}

        {/* Botão dashed no rodapé */}
        <button
          onClick={() => !obraFinalizada && openModal('nova')}
          disabled={obraFinalizada}
          title={obraFinalizada ? 'Obra finalizada — não é possível adicionar tarefas' : undefined}
          className={cn(
            'w-full py-3 border-2 border-dashed rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2',
            obraFinalizada
              ? 'border-gray-100 dark:border-gray-800 text-gray-300 cursor-not-allowed'
              : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-primary/40 hover:text-primary cursor-pointer'
          )}
        >
          <IconAddCircle className="text-lg" />
          Adicionar nova tarefa
        </button>
      </div>

      {/* ── Modais ──────────────────────────────────────────────────────────── */}

      <NovaTarefaModal
        open={modalState.type === 'nova' || modalState.type === 'editar'}
        onOpenChange={(open) => { if (!open) closeModal(); }}
        obra={obra}
        tarefaParaEditar={modalState.type === 'editar' ? modalState.tarefa : null}
        onSalvar={handleSalvarTarefa}
      />

      <BloquearTarefaModal
        open={modalState.type === 'bloquear'}
        onOpenChange={(open) => { if (!open) closeModal(); }}
        tarefa={modalState.tarefa}
        onConfirmar={handleConfirmarBloqueio}
      />

      <AtualizarProgressoModal
        open={modalState.type === 'progresso'}
        onOpenChange={(open) => { if (!open) closeModal(); }}
        tarefa={modalState.tarefa}
        onConfirmar={handleConfirmarProgresso}
      />

      {/* AlertDialog de exclusão */}
      <AlertDialog
        open={modalState.type === 'excluir'}
        onOpenChange={(open) => { if (!open) closeModal(); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-gray-900 dark:text-white">{modalState.tarefa?.titulo}</strong> será removida permanentemente.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeModal}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
