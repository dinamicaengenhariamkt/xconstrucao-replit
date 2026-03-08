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
import { AdicionarMembroModal } from './AdicionarMembroModal';
import { PermissoesMembroModal } from './PermissoesMembroModal';
import type { MembroEquipe, MinhaObraDetalhe } from '../types';
import { IconMoreVert, IconEdit, IconKey, IconPersonRemove, IconEngineering, IconCall, IconMail, IconGroup, IconPersonAdd, IconPersonOff, IconPersonCheck } from '@shared/components/icons';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalType = 'novo' | 'editar' | 'permissoes' | 'remover' | null;

interface ModalState {
  type: ModalType;
  membro: MembroEquipe | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _idCounter = 10;
function gerarId(): string {
  return `eq${++_idCounter}`;
}

// ─── Theme map ────────────────────────────────────────────────────────────────

const TIPO_THEME: Record<MembroEquipe['tipo'], { bg: string; border: string; papelColor: string }> = {
  contratante: { bg: 'bg-blue-50/50 dark:bg-blue-900/10', border: 'border-blue-100 dark:border-blue-800', papelColor: 'text-blue-600' },
  engenheiro:  { bg: 'bg-primary/5 dark:bg-primary/10',   border: 'border-primary/20',                    papelColor: 'text-primary' },
  mestre:      { bg: 'bg-gray-50 dark:bg-gray-800/50',    border: 'border-gray-100 dark:border-gray-700', papelColor: 'text-gray-500' },
  equipe:      { bg: 'bg-gray-50 dark:bg-gray-800/50',    border: 'border-gray-100 dark:border-gray-700', papelColor: 'text-gray-500' },
};

const PERMISSAO_BADGE: Record<NonNullable<MembroEquipe['permissao']>, { label: string; className: string }> = {
  visualizar: { label: 'Visualizar', className: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
  editar:     { label: 'Editar',     className: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
  admin:      { label: 'Admin',      className: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
};

// ─── MembroCard ───────────────────────────────────────────────────────────────

interface MembroCardProps {
  membro: MembroEquipe;
  obraFinalizada: boolean;
  onEditar: (m: MembroEquipe) => void;
  onPermissoes: (m: MembroEquipe) => void;
  onToggleAtivo: (m: MembroEquipe) => void;
  onRemover: (m: MembroEquipe) => void;
}

function MembroCard({
  membro,
  obraFinalizada,
  onEditar,
  onPermissoes,
  onToggleAtivo,
  onRemover,
}: MembroCardProps) {
  const theme = TIPO_THEME[membro.tipo];
  const permBadge = membro.permissao ? PERMISSAO_BADGE[membro.permissao] : null;

  return (
    <div className={cn('p-5 rounded-xl border relative', theme.bg, theme.border)}>
      {/* ⋮ Menu */}
      {!obraFinalizada && (
        <div className="absolute top-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                aria-label="Ações"
              >
                <IconMoreVert className="text-base" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEditar(membro)}>
                <IconEdit className="text-sm mr-2" />
                Editar
              </DropdownMenuItem>

              {membro.tipo === 'engenheiro' && (
                <DropdownMenuItem onClick={() => onPermissoes(membro)}>
                  <IconKey className="text-sm mr-2" />
                  Permissões
                </DropdownMenuItem>
              )}

              {(membro.tipo === 'mestre' || membro.tipo === 'equipe') && (
                <DropdownMenuItem onClick={() => onToggleAtivo(membro)}>
                  {membro.ativo ? (
                    <IconPersonOff className="text-sm mr-2" />
                  ) : (
                    <IconPersonCheck className="text-sm mr-2" />
                  )}
                  {membro.ativo ? 'Desativar' : 'Ativar'}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onRemover(membro)}
                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              >
                <IconPersonRemove className="text-sm mr-2" />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Avatar + Info */}
      <div className="flex items-center gap-4 mb-3 pr-8">
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0', membro.cor)}>
          {membro.iniciais}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-xs font-medium uppercase tracking-wider', theme.papelColor)}>{membro.papel}</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{membro.nome}</p>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {membro.ativo ? (
          <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            Ativo
          </span>
        ) : (
          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
            Inativo
          </span>
        )}

        {membro.tipo === 'engenheiro' && permBadge && (
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', permBadge.className)}>
            {permBadge.label}
          </span>
        )}
      </div>

      {/* Contact info */}
      <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
        {membro.registro && (
          <div className="flex items-center gap-2">
            <IconEngineering className="text-gray-400 text-sm" />
            {membro.registro}
          </div>
        )}
        {membro.telefone && (
          <div className="flex items-center gap-2">
            <IconCall className="text-gray-400 text-sm" />
            {membro.telefone}
          </div>
        )}
        {membro.email && (
          <div className="flex items-center gap-2">
            <IconMail className="text-gray-400 text-sm" />
            <span className="truncate">{membro.email}</span>
          </div>
        )}
        {membro.membros && (
          <div className="flex items-center gap-2">
            <IconGroup className="text-gray-400 text-sm" />
            <span className="truncate">{membro.membros}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EquipeSection ────────────────────────────────────────────────────────────

interface EquipeSectionProps {
  obra: MinhaObraDetalhe;
}

export function EquipeSection({ obra }: EquipeSectionProps) {
  const [membros, setMembros] = useState<MembroEquipe[]>(obra.equipe);
  const [modal, setModal] = useState<ModalState>({ type: null, membro: null });

  const obraFinalizada = obra.status === 'finalizada';

  // ─── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total: membros.length,
    ativos: membros.filter((m) => m.ativo === true).length,
    engenheiros: membros.filter((m) => m.tipo === 'engenheiro').length,
  }), [membros]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const openModal = (type: ModalType, membro: MembroEquipe | null = null) =>
    setModal({ type, membro });
  const closeModal = () => setModal({ type: null, membro: null });

  const handleSalvar = (data: Omit<MembroEquipe, 'id' | 'ativo' | 'permissao'>) => {
    if (modal.type === 'novo') {
      setMembros((prev) => [...prev, { id: gerarId(), ativo: true, ...data }]);
    } else if (modal.type === 'editar' && modal.membro) {
      setMembros((prev) =>
        prev.map((m) => (m.id === modal.membro!.id ? { ...m, ...data } : m)),
      );
    }
  };

  const handlePermissoes = (permissao: NonNullable<MembroEquipe['permissao']>) => {
    if (!modal.membro) return;
    setMembros((prev) =>
      prev.map((m) => (m.id === modal.membro!.id ? { ...m, permissao } : m)),
    );
  };

  const handleToggleAtivo = (membro: MembroEquipe) => {
    setMembros((prev) =>
      prev.map((m) => (m.id === membro.id ? { ...m, ativo: !m.ativo } : m)),
    );
  };

  const handleRemover = () => {
    if (!modal.membro) return;
    setMembros((prev) => prev.filter((m) => m.id !== modal.membro!.id));
    closeModal();
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Equipe e Colaboradores</h3>
            <p className="text-sm text-gray-500">Membros envolvidos no projeto</p>

            {/* Stats chips */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-full">
                Total: {stats.total}
              </span>
              <span className="text-xs font-semibold bg-success/10 text-success px-2.5 py-1 rounded-full">
                Ativos: {stats.ativos}
              </span>
              <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                Engenheiros: {stats.engenheiros}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={obraFinalizada}
            onClick={() => openModal('novo')}
            className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <IconPersonAdd className="text-sm" />
            Adicionar Membro
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {membros.map((membro) => (
            <MembroCard
              key={membro.id}
              membro={membro}
              obraFinalizada={obraFinalizada}
              onEditar={(m) => openModal('editar', m)}
              onPermissoes={(m) => openModal('permissoes', m)}
              onToggleAtivo={handleToggleAtivo}
              onRemover={(m) => openModal('remover', m)}
            />
          ))}

          {/* Add member dashed card */}
          {!obraFinalizada && (
            <button
              type="button"
              onClick={() => openModal('novo')}
              className="p-5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[120px]"
            >
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <IconPersonAdd className="text-gray-400 text-2xl" />
              </div>
              <span className="text-sm font-semibold text-gray-500">Adicionar Membro</span>
            </button>
          )}
        </div>

        {/* Empty state */}
        {membros.length === 0 && (
          <div className="text-center py-16">
            <IconGroup className="text-4xl text-gray-300 dark:text-gray-700" />
            <p className="text-sm font-medium text-gray-400 mt-2">Nenhum membro na equipe</p>
            {!obraFinalizada && (
              <button
                type="button"
                onClick={() => openModal('novo')}
                className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Adicionar primeiro membro
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── Modals ─────────────────────────────────────────────────────────── */}

      <AdicionarMembroModal
        open={modal.type === 'novo' || modal.type === 'editar'}
        onOpenChange={(open) => { if (!open) closeModal(); }}
        membro={modal.type === 'editar' ? modal.membro : null}
        onSalvar={handleSalvar}
      />

      <PermissoesMembroModal
        open={modal.type === 'permissoes'}
        onOpenChange={(open) => { if (!open) closeModal(); }}
        membro={modal.membro}
        onSalvar={handlePermissoes}
      />

      <AlertDialog open={modal.type === 'remover'} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro da equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              {modal.membro
                ? `"${modal.membro.nome}" será removido da equipe desta obra. Esta ação não pode ser desfeita.`
                : 'Esta ação não pode ser desfeita.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeModal}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemover}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
