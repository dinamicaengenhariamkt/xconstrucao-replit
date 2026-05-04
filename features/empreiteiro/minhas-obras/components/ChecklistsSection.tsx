'use client';

import { useState, useCallback } from 'react';
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
import { ChecklistFormModal } from './ChecklistFormModal';
import { AssinarChecklistModal } from './AssinarChecklistModal';
import { VerRegistroModal } from './VerRegistroModal';
import type { MinhaObraChecklist, MinhaObraDetalhe } from '../types';
import {
  IconWarning,
  IconMoreVert,
  IconVisibility,
  IconEdit,
  IconContentCopy,
  IconDelete,
  IconDraw,
  IconCheckCircle,
  IconAdd,
  IconFactCheck,
} from '@shared/components/icons';
import {
  CHECKLIST_CONFIG,
  TIPO_ICON,
  STATUS_BADGE,
  calcularStatus,
  calcularProgresso,
  horaAtual,
  dataHoraAtual,
  type ChecklistModalType as ModalType,
  type ChecklistModalState as ModalState,
} from './checklists/checklists-helpers';

// ─── ChecklistCard ────────────────────────────────────────────────────────────

interface ChecklistCardProps {
  checklist: MinhaObraChecklist;
  obraFinalizada: boolean;
  onToggleItem: (checklistId: string, itemId: string) => void;
  onFinalizar: (c: MinhaObraChecklist) => void;
  onAssinar: (c: MinhaObraChecklist) => void;
  onVerRegistro: (c: MinhaObraChecklist) => void;
  onEditar: (c: MinhaObraChecklist) => void;
  onDuplicar: (c: MinhaObraChecklist) => void;
  onExcluir: (c: MinhaObraChecklist) => void;
}

function ChecklistCard({
  checklist,
  obraFinalizada,
  onToggleItem,
  onFinalizar,
  onAssinar,
  onVerRegistro,
  onEditar,
  onDuplicar,
  onExcluir,
}: ChecklistCardProps) {
  const [avisoAssinar, setAvisoAssinar] = useState(false);
  const config = CHECKLIST_CONFIG[checklist.tipo];
  const badge = STATUS_BADGE[checklist.status];
  const isCompleto = checklist.status === 'completo';
  const isReadOnly = isCompleto || obraFinalizada;
  const concluidos = checklist.itens.filter((i) => i.concluida).length;
  const total = checklist.itens.length;
  const todosMarcados = concluidos === total && total > 0;
  const pendentesCount = total - concluidos;

  const handleAssinar = () => {
    if (!todosMarcados) {
      setAvisoAssinar(true);
      setTimeout(() => setAvisoAssinar(false), 3000);
      return;
    }
    onAssinar(checklist);
  };

  const handleAcaoPrincipal = () => {
    if (checklist.tipo === 'diario') {
      if (isCompleto) {
        onVerRegistro(checklist);
      } else {
        onFinalizar(checklist);
      }
    } else if (checklist.tipo === 'etapa') {
      handleAssinar();
    } else {
      onFinalizar(checklist);
    }
  };

  return (
    <div className={cn('p-5 rounded-xl border group relative', config.bgWrapper, config.borderColor)}>
      {/* Aviso inline: itens pendentes ao tentar assinar */}
      {avisoAssinar && (
        <div className="absolute top-3 left-3 right-3 z-10 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-medium shadow-sm">
          <IconWarning className="text-sm" />
          Conclua {pendentesCount === 1 ? 'o item pendente' : `os ${pendentesCount} itens pendentes`} antes de assinar
        </div>
      )}

      {/* Header do card */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg flex-shrink-0', config.iconBg)}>
            {(() => { const TipoIcon = TIPO_ICON[checklist.tipo]; return <TipoIcon className="" />; })()}
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">{checklist.nome}</h4>
            <p className="text-xs text-gray-500">{checklist.descricao}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {checklist.tipo === 'etapa' && !isCompleto ? (
            <span className={cn('text-[10px] font-bold px-2 py-1 rounded', badge.classes)}>
              {calcularProgresso(checklist.itens)}%
            </span>
          ) : (
            <span className={cn('text-[10px] font-bold px-2 py-1 rounded', badge.classes)}>
              {badge.label}
            </span>
          )}

          {/* Menu ⋮ */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer rounded"
                aria-label="Opções do checklist"
              >
                <IconMoreVert className="text-base" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isCompleto ? (
                <DropdownMenuItem onClick={() => onVerRegistro(checklist)} className="cursor-pointer">
                  <IconVisibility className="text-sm mr-2 text-gray-500" />
                  Ver registro
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => onEditar(checklist)}
                  className="cursor-pointer"
                  disabled={obraFinalizada}
                >
                  <IconEdit className="text-sm mr-2 text-gray-500" />
                  Editar checklist
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDuplicar(checklist)} className="cursor-pointer">
                <IconContentCopy className="text-sm mr-2 text-gray-500" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onExcluir(checklist)}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                disabled={obraFinalizada}
              >
                <IconDelete className="text-sm mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Barra de progresso (tipo etapa) */}
      {checklist.tipo === 'etapa' && total > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-purple-200 dark:bg-purple-800/50 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isCompleto ? 'bg-success' : 'bg-purple-600'
              )}
              style={{ width: `${calcularProgresso(checklist.itens)}%` }}
            />
          </div>
        </div>
      )}

      {/* Lista de itens */}
      <div className="space-y-1.5 mb-4">
        {checklist.itens.map((item) => (
          <label
            key={item.id}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg transition-colors',
              item.concluida ? config.itemCheckedBg : config.itemHoverBg,
              isReadOnly ? 'cursor-default' : 'cursor-pointer'
            )}
          >
            <input
              type="checkbox"
              checked={item.concluida}
              disabled={isReadOnly}
              onChange={() => !isReadOnly && onToggleItem(checklist.id, item.id)}
              className={cn('w-4 h-4 rounded flex-shrink-0', config.checkboxAccent)}
            />
            <span
              className={cn(
                'text-xs',
                item.concluida
                  ? 'line-through text-gray-400'
                  : 'text-gray-700 dark:text-gray-300'
              )}
            >
              {item.titulo}
            </span>
          </label>
        ))}
      </div>

      {/* Footer */}
      <div className={cn('flex items-center justify-between pt-4 border-t', config.footerBorder)}>
        {isCompleto && checklist.assinadoPor ? (
          <span className="text-xs text-success font-medium flex items-center gap-1">
            <IconDraw className="text-sm" />
            Assinado por {checklist.assinadoPor}
          </span>
        ) : isCompleto && checklist.completadoEm ? (
          <span className="text-xs text-success font-medium flex items-center gap-1">
            <IconCheckCircle className="text-sm" />
            Concluído às {checklist.completadoEm}
          </span>
        ) : (
          <span className="text-xs text-gray-500">
            {concluidos}/{total} {total === 1 ? 'item' : 'itens'}
          </span>
        )}

        <button
          onClick={handleAcaoPrincipal}
          disabled={isCompleto && checklist.tipo !== 'diario'}
          className={cn(
            'px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1',
            isCompleto && checklist.tipo === 'diario'
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer'
              : isCompleto
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                : config.actionBtn + ' cursor-pointer'
          )}
        >
          {config.ActionBtnIcon && !isCompleto && (
            <config.ActionBtnIcon className="text-sm" />
          )}
          {isCompleto && checklist.tipo === 'diario'
            ? 'Ver registro'
            : isCompleto
              ? 'Concluído'
              : config.actionBtnLabel}
        </button>
      </div>
    </div>
  );
}

// ─── ChecklistsSection ────────────────────────────────────────────────────────

interface ChecklistsSectionProps {
  obra: MinhaObraDetalhe;
}

export function ChecklistsSection({ obra }: ChecklistsSectionProps) {
  const [checklists, setChecklists] = useState<MinhaObraChecklist[]>(obra.checklists);
  const [modalState, setModalState] = useState<ModalState>({ type: null, checklist: null });

  const obraFinalizada = obra.status === 'finalizada';

  const openModal = (type: ModalType, checklist?: MinhaObraChecklist) =>
    setModalState({ type, checklist: checklist ?? null });
  const closeModal = () => setModalState({ type: null, checklist: null });

  // ── Toggle de item ─────────────────────────────────────────────────────────

  const handleToggleItem = useCallback((checklistId: string, itemId: string) => {
    setChecklists((prev) =>
      prev.map((cl) => {
        if (cl.id !== checklistId) return cl;
        const novosItens = cl.itens.map((item) =>
          item.id === itemId ? { ...item, concluida: !item.concluida } : item
        );
        const novoStatus = calcularStatus(novosItens);
        const novoProgresso = cl.tipo === 'etapa' ? calcularProgresso(novosItens) : cl.progresso;
        return { ...cl, itens: novosItens, status: novoStatus, progresso: novoProgresso };
      })
    );
  }, []);

  // ── Finalizar ──────────────────────────────────────────────────────────────

  const handleFinalizar = (checklist: MinhaObraChecklist) => {
    const pendentes = checklist.itens.filter((i) => !i.concluida).length;
    if (pendentes > 0) {
      openModal('finalizar_confirm', checklist);
    } else {
      confirmarFinalizar(checklist);
    }
  };

  const confirmarFinalizar = (checklist: MinhaObraChecklist) => {
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklist.id
          ? {
              ...cl,
              status: 'completo' as const,
              completadoEm: horaAtual(),
              itens: cl.itens.map((i) => ({ ...i, concluida: true })),
            }
          : cl
      )
    );
    closeModal();
  };

  // ── Assinar ────────────────────────────────────────────────────────────────

  const handleConfirmarAssinatura = (assinadoPor: string, registroProfissional?: string) => {
    if (!modalState.checklist) return;
    const id = modalState.checklist.id;
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === id
          ? {
              ...cl,
              status: 'completo' as const,
              assinadoPor,
              assinadoEm: dataHoraAtual(),
              registroProfissional,
              completadoEm: horaAtual(),
              itens: cl.itens.map((i) => ({ ...i, concluida: true })),
            }
          : cl
      )
    );
  };

  // ── Salvar (criar / editar) ────────────────────────────────────────────────

  const handleSalvarChecklist = (checklist: MinhaObraChecklist) => {
    setChecklists((prev) => {
      const idx = prev.findIndex((c) => c.id === checklist.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = checklist;
        return next;
      }
      return [...prev, checklist];
    });
  };

  // ── Duplicar ───────────────────────────────────────────────────────────────

  const handleDuplicar = (checklist: MinhaObraChecklist) => {
    const copia: MinhaObraChecklist = {
      ...checklist,
      id: `cl${Date.now()}_copia`,
      nome: `${checklist.nome} (cópia)`,
      status: 'pendente',
      completadoEm: undefined,
      assinadoPor: undefined,
      assinadoEm: undefined,
      registroProfissional: undefined,
      progresso: 0,
      itens: checklist.itens.map((item) => ({ ...item, concluida: false })),
    };
    setChecklists((prev) => [...prev, copia]);
  };

  // ── Excluir ────────────────────────────────────────────────────────────────

  const handleExcluir = () => {
    if (!modalState.checklist) return;
    setChecklists((prev) => prev.filter((c) => c.id !== modalState.checklist!.id));
    closeModal();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const checklistAtualFinalizar = modalState.checklist;
  const pendentesConfirm = checklistAtualFinalizar
    ? checklistAtualFinalizar.itens.filter((i) => !i.concluida).length
    : 0;

  return (
    <>
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Checklists</h3>
            <p className="text-sm text-gray-500">Segurança, conformidade e controle de qualidade</p>
          </div>
          <button
            onClick={() => !obraFinalizada && openModal('novo')}
            disabled={obraFinalizada}
            title={obraFinalizada ? 'Obra finalizada — não é possível adicionar checklists' : undefined}
            className={cn(
              'px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2',
              obraFinalizada
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer'
            )}
          >
            <IconAdd className="text-sm" />
            Novo Checklist
          </button>
        </div>

        {/* Empty state */}
        {checklists.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4 text-center">
            <IconFactCheck className="text-5xl text-gray-200 dark:text-gray-700" />
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Nenhum checklist cadastrado
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Adicione checklists para controlar segurança e conformidade da obra.
              </p>
            </div>
            {!obraFinalizada && (
              <button
                onClick={() => openModal('novo')}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <IconAdd className="text-sm" />
                Novo Checklist
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {checklists.map((checklist) => (
              <ChecklistCard
                key={checklist.id}
                checklist={checklist}
                obraFinalizada={obraFinalizada}
                onToggleItem={handleToggleItem}
                onFinalizar={handleFinalizar}
                onAssinar={(c) => openModal('assinar', c)}
                onVerRegistro={(c) => openModal('registro', c)}
                onEditar={(c) => openModal('editar', c)}
                onDuplicar={handleDuplicar}
                onExcluir={(c) => openModal('excluir', c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modais ──────────────────────────────────────────────────────────── */}

      <ChecklistFormModal
        open={modalState.type === 'novo' || modalState.type === 'editar'}
        onOpenChange={(open) => { if (!open) closeModal(); }}
        checklistParaEditar={modalState.type === 'editar' ? modalState.checklist : null}
        onSalvar={handleSalvarChecklist}
      />

      <AssinarChecklistModal
        open={modalState.type === 'assinar'}
        onOpenChange={(open) => { if (!open) closeModal(); }}
        checklist={modalState.checklist}
        equipe={obra.equipe}
        onConfirmar={handleConfirmarAssinatura}
      />

      <VerRegistroModal
        open={modalState.type === 'registro'}
        onOpenChange={(open) => { if (!open) closeModal(); }}
        checklist={modalState.checklist}
      />

      {/* AlertDialog: Finalizar com itens pendentes */}
      <AlertDialog
        open={modalState.type === 'finalizar_confirm'}
        onOpenChange={(open) => { if (!open) closeModal(); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar com itens pendentes?</AlertDialogTitle>
            <AlertDialogDescription>
              Ainda {pendentesConfirm === 1 ? 'há' : 'existem'}{' '}
              <strong className="text-gray-900 dark:text-white">
                {pendentesConfirm} {pendentesConfirm === 1 ? 'item pendente' : 'itens pendentes'}
              </strong>{' '}
              em{' '}
              <strong className="text-gray-900 dark:text-white">
                {checklistAtualFinalizar?.nome}
              </strong>
              . Ao finalizar, todos serão marcados como concluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeModal}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                checklistAtualFinalizar && confirmarFinalizar(checklistAtualFinalizar)
              }
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Finalizar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: Excluir checklist */}
      <AlertDialog
        open={modalState.type === 'excluir'}
        onOpenChange={(open) => { if (!open) closeModal(); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir checklist?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-gray-900 dark:text-white">
                {modalState.checklist?.nome}
              </strong>{' '}
              será removido permanentemente.
              {modalState.checklist?.status === 'completo' && (
                <span className="block mt-1 text-amber-600 font-medium">
                  Atenção: este checklist já foi finalizado.
                </span>
              )}
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
