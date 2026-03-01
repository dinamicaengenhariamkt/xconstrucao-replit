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
import { Button } from '@shared/components/ui/button';
import type { ObraOcorrencia, MinhaObraDetalhe } from '../types';
import { NovaOcorrenciaModal } from './NovaOcorrenciaModal';
import { ResolverOcorrenciaModal } from './ResolverOcorrenciaModal';

// ─── Types ────────────────────────────────────────────────────────────────────

type OcorrenciaFilter = 'todos' | 'critico' | 'medio' | 'baixo' | 'resolvido';
type ModalType = 'nova' | 'editar' | 'resolver' | 'excluir' | null;

interface ModalState {
  type: ModalType;
  ocorrencia: ObraOcorrencia | null;
}

// ─── ID generator ─────────────────────────────────────────────────────────────

let _oid = 0;
function gerarId(): string {
  return `ocorrencia-${Date.now()}-${++_oid}`;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const SEVERIDADE_CONFIG: Record<
  ObraOcorrencia['severidade'],
  { label: string; badgeClasses: string; cardBg: string; cardBorder: string }
> = {
  critico: {
    label: 'Crítico',
    badgeClasses: 'text-white bg-red-500',
    cardBg: 'bg-red-50 dark:bg-red-900/10',
    cardBorder: 'border-red-200 dark:border-red-800',
  },
  medio: {
    label: 'Médio',
    badgeClasses: 'text-white bg-amber-500',
    cardBg: 'bg-amber-50 dark:bg-amber-900/10',
    cardBorder: 'border-amber-200 dark:border-amber-800',
  },
  baixo: {
    label: 'Baixo',
    badgeClasses: 'text-white bg-blue-500',
    cardBg: 'bg-blue-50 dark:bg-blue-900/10',
    cardBorder: 'border-blue-200 dark:border-blue-800',
  },
};

// ─── OcorrenciaCard ───────────────────────────────────────────────────────────

interface OcorrenciaCardProps {
  ocorrencia: ObraOcorrencia;
  obraFinalizada: boolean;
  onEditar: (oc: ObraOcorrencia) => void;
  onResolver: (oc: ObraOcorrencia) => void;
  onReabrir: (oc: ObraOcorrencia) => void;
  onExcluir: (oc: ObraOcorrencia) => void;
}

function OcorrenciaCard({
  ocorrencia,
  obraFinalizada,
  onEditar,
  onResolver,
  onReabrir,
  onExcluir,
}: OcorrenciaCardProps) {
  const isResolvido = ocorrencia.status === 'resolvido';
  const config = SEVERIDADE_CONFIG[ocorrencia.severidade];

  if (isResolvido) {
    return (
      <div className="p-5 bg-success/5 dark:bg-success/10 border border-success/30 rounded-xl opacity-80">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {ocorrencia.fotoUrl && (
            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 relative">
              <img className="w-full h-full object-cover" src={ocorrencia.fotoUrl} alt="Foto" />
              <div className="absolute inset-0 bg-success/50 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-3xl">check_circle</span>
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h4 className="text-sm font-bold text-gray-500 line-through">{ocorrencia.titulo}</h4>
                <span className="text-[10px] font-bold text-white bg-success px-2 py-0.5 rounded uppercase shrink-0">
                  Resolvido
                </span>
              </div>
              {!obraFinalizada && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer">
                      <span className="material-symbols-outlined text-base text-gray-400">more_vert</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onEditar(ocorrencia)} className="cursor-pointer">
                      <span className="material-symbols-outlined text-sm mr-2">edit</span>
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onReabrir(ocorrencia)} className="cursor-pointer">
                      <span className="material-symbols-outlined text-sm mr-2">restart_alt</span>
                      Reabrir ocorrência
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onExcluir(ocorrencia)}
                      className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400"
                    >
                      <span className="material-symbols-outlined text-sm mr-2">delete</span>
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-2">{ocorrencia.descricao}</p>
            {ocorrencia.resolvidoEm && (
              <p className="text-xs text-gray-400">
                Resolvido em {ocorrencia.resolvidoEm}
                {ocorrencia.resolvidoPor ? ` por ${ocorrencia.resolvidoPor}` : ''}
              </p>
            )}
            {ocorrencia.observacoesResolucao && (
              <p className="text-xs text-gray-400 mt-0.5">
                Obs: {ocorrencia.observacoesResolucao}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('p-5 border rounded-xl', config.cardBg, config.cardBorder)}>
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {ocorrencia.fotoUrl && (
          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
            <img className="w-full h-full object-cover" src={ocorrencia.fotoUrl} alt="Foto do problema" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">{ocorrencia.titulo}</h4>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0', config.badgeClasses)}>
                {config.label}
              </span>
            </div>
            {!obraFinalizada && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer">
                    <span className="material-symbols-outlined text-base text-gray-400">more_vert</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => onEditar(ocorrencia)} className="cursor-pointer">
                    <span className="material-symbols-outlined text-sm mr-2">edit</span>
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onResolver(ocorrencia)} className="cursor-pointer">
                    <span className="material-symbols-outlined text-sm mr-2">task_alt</span>
                    Marcar como resolvida
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onExcluir(ocorrencia)}
                    className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400"
                  >
                    <span className="material-symbols-outlined text-sm mr-2">delete</span>
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{ocorrencia.descricao}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">person</span>
              Resp: {ocorrencia.responsavel}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">event</span>
              Aberto: {ocorrencia.dataAbertura}
            </span>
            {ocorrencia.prazo && (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                <span className="material-symbols-outlined text-sm">timer</span>
                Prazo: {ocorrencia.prazo}
              </span>
            )}
          </div>
          {!obraFinalizada && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => onEditar(ocorrencia)}
                className="px-3 py-1.5 bg-gray-700 dark:bg-gray-600 text-white text-xs font-bold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-500 transition-colors cursor-pointer"
              >
                Atualizar status
              </button>
              <button
                onClick={() => onResolver(ocorrencia)}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                Marcar resolvido
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface OcorrenciasSectionProps {
  obra: MinhaObraDetalhe;
}

export function OcorrenciasSection({ obra }: OcorrenciasSectionProps) {
  const [ocorrencias, setOcorrencias] = useState<ObraOcorrencia[]>(obra.ocorrencias);
  const [activeFilter, setActiveFilter] = useState<OcorrenciaFilter>('todos');
  const [modal, setModal] = useState<ModalState>({ type: null, ocorrencia: null });

  const obraFinalizada = obra.status === 'finalizada';

  const stats = useMemo(
    () => ({
      total: ocorrencias.length,
      abertas: ocorrencias.filter((o) => o.status === 'aberto').length,
      criticas: ocorrencias.filter((o) => o.severidade === 'critico' && o.status === 'aberto').length,
      resolvidas: ocorrencias.filter((o) => o.status === 'resolvido').length,
    }),
    [ocorrencias],
  );

  const counts = useMemo(
    () => ({
      todos: ocorrencias.length,
      critico: ocorrencias.filter((o) => o.severidade === 'critico' && o.status === 'aberto').length,
      medio: ocorrencias.filter((o) => o.severidade === 'medio' && o.status === 'aberto').length,
      baixo: ocorrencias.filter((o) => o.severidade === 'baixo' && o.status === 'aberto').length,
      resolvido: ocorrencias.filter((o) => o.status === 'resolvido').length,
    }),
    [ocorrencias],
  );

  const filtered = useMemo(() => {
    if (activeFilter === 'todos') return ocorrencias;
    if (activeFilter === 'resolvido') return ocorrencias.filter((o) => o.status === 'resolvido');
    return ocorrencias.filter((o) => o.severidade === activeFilter && o.status === 'aberto');
  }, [ocorrencias, activeFilter]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSalvar = (
    data: Omit<ObraOcorrencia, 'id' | 'status' | 'resolvidoEm' | 'resolvidoPor' | 'observacoesResolucao'>,
  ) => {
    if (modal.type === 'nova') {
      setOcorrencias((prev) => [...prev, { id: gerarId(), status: 'aberto', ...data }]);
    } else if (modal.type === 'editar' && modal.ocorrencia) {
      setOcorrencias((prev) =>
        prev.map((o) => (o.id === modal.ocorrencia!.id ? { ...o, ...data } : o)),
      );
    }
  };

  const handleResolver = (
    dados: Pick<ObraOcorrencia, 'resolvidoPor' | 'resolvidoEm' | 'observacoesResolucao'>,
  ) => {
    if (!modal.ocorrencia) return;
    setOcorrencias((prev) =>
      prev.map((o) =>
        o.id === modal.ocorrencia!.id ? { ...o, status: 'resolvido', ...dados } : o,
      ),
    );
  };

  const handleReabrir = (oc: ObraOcorrencia) => {
    setOcorrencias((prev) =>
      prev.map((o) =>
        o.id === oc.id
          ? { ...o, status: 'aberto', resolvidoEm: undefined, resolvidoPor: undefined, observacoesResolucao: undefined }
          : o,
      ),
    );
  };

  const handleExcluir = () => {
    if (!modal.ocorrencia) return;
    setOcorrencias((prev) => prev.filter((o) => o.id !== modal.ocorrencia!.id));
    setModal({ type: null, ocorrencia: null });
  };

  const openModal = (type: ModalType, ocorrencia: ObraOcorrencia | null = null) =>
    setModal({ type, ocorrencia });

  const closeModal = () => setModal({ type: null, ocorrencia: null });

  // ─── Filter chips config ─────────────────────────────────────────────────────

  const filters: { key: OcorrenciaFilter; label: string; textClass?: string }[] = [
    { key: 'todos', label: `Todos (${counts.todos})` },
    { key: 'critico', label: `Crítico (${counts.critico})`, textClass: 'text-red-600' },
    { key: 'medio', label: `Médio (${counts.medio})`, textClass: 'text-amber-600' },
    { key: 'baixo', label: `Baixo (${counts.baixo})`, textClass: 'text-blue-600' },
    { key: 'resolvido', label: `Resolvido (${counts.resolvido})`, textClass: 'text-emerald-600' },
  ];

  return (
    <>
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Registro de Ocorrências</h3>
            <p className="text-sm text-gray-500">Problemas, pendências e resoluções</p>
          </div>
          <Button
            onClick={() => openModal('nova')}
            disabled={obraFinalizada}
            size="sm"
            className="bg-red-500 hover:bg-red-600 text-white w-fit"
          >
            <span className="material-symbols-outlined text-sm mr-1">add</span>
            Reportar Problema
          </Button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { label: 'Total', value: stats.total, classes: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
            { label: 'Abertas', value: stats.abertas, classes: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
            { label: 'Críticas', value: stats.criticas, classes: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
            { label: 'Resolvidas', value: stats.resolvidas, classes: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
          ].map((s) => (
            <span key={s.label} className={cn('px-3 py-1 rounded-full text-xs font-semibold', s.classes)}>
              {s.label}: {s.value}
            </span>
          ))}
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer',
                activeFilter === f.key
                  ? 'bg-primary text-white'
                  : cn(
                      'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
                      f.textClass || 'text-gray-600 dark:text-gray-300',
                    ),
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">check_circle</span>
            <p className="text-sm font-semibold text-gray-500">Nenhuma ocorrência encontrada</p>
            <p className="text-xs text-gray-400 mt-1">
              {activeFilter === 'todos' && !obraFinalizada
                ? 'Clique em "Reportar Problema" para registrar.'
                : 'Tente outro filtro.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((ocorrencia) => (
              <OcorrenciaCard
                key={ocorrencia.id}
                ocorrencia={ocorrencia}
                obraFinalizada={obraFinalizada}
                onEditar={(oc) => openModal('editar', oc)}
                onResolver={(oc) => openModal('resolver', oc)}
                onReabrir={handleReabrir}
                onExcluir={(oc) => openModal('excluir', oc)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Nova / Editar modal */}
      <NovaOcorrenciaModal
        open={modal.type === 'nova' || modal.type === 'editar'}
        onOpenChange={(open) => { if (!open) closeModal(); }}
        ocorrencia={modal.type === 'editar' ? modal.ocorrencia : null}
        onSalvar={handleSalvar}
      />

      {/* Resolver modal */}
      <ResolverOcorrenciaModal
        open={modal.type === 'resolver'}
        onOpenChange={(open) => { if (!open) closeModal(); }}
        ocorrencia={modal.ocorrencia}
        onResolver={handleResolver}
      />

      {/* Excluir AlertDialog */}
      <AlertDialog
        open={modal.type === 'excluir'}
        onOpenChange={(open) => { if (!open) closeModal(); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ocorrência?</AlertDialogTitle>
            <AlertDialogDescription>
              {modal.ocorrencia
                ? `"${modal.ocorrencia.titulo}" será removida permanentemente. Esta ação não pode ser desfeita.`
                : 'Esta ação não pode ser desfeita.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
