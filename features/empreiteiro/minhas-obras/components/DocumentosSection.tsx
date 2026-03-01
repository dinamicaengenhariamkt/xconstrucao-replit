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
import type { MinhaObraDetalhe, ObraDocumento } from '../types';
import { EnviarDocumentoModal } from './EnviarDocumentoModal';
import { EditarDocumentoModal } from './EditarDocumentoModal';

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORIA_CONFIG: Record<
  ObraDocumento['categoria'],
  { label: string; icone: string; iconeBg: string }
> = {
  contrato:  { label: 'Contratos',         icone: 'description',  iconeBg: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  art_rrt:   { label: 'ART / RRT',         icone: 'engineering',  iconeBg: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  planta:    { label: 'Plantas e Projetos', icone: 'architecture', iconeBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  relatorio: { label: 'Relatórios',        icone: 'insert_chart', iconeBg: 'bg-success/20 text-success dark:bg-success/10' },
  alvara:    { label: 'Alvarás',           icone: 'gavel',        iconeBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  laudo:     { label: 'Laudos Técnicos',   icone: 'fact_check',   iconeBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
};

const CATEGORIAS_ORDEM: ObraDocumento['categoria'][] = [
  'contrato', 'art_rrt', 'planta', 'relatorio', 'alvara', 'laudo',
];

const STATUS_BADGE: Record<NonNullable<ObraDocumento['status']>, { label: string; classes: string }> = {
  assinado: { label: 'Assinado', classes: 'text-success bg-success/10 dark:bg-success/20' },
  valido:   { label: 'Válido',   classes: 'text-success bg-success/10 dark:bg-success/20' },
  vencendo: { label: 'Vencendo', classes: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
  novo:     { label: 'Novo',     classes: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gerarId() {
  return `d${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalType = 'enviar' | 'editar' | 'renovar_confirm' | 'excluir' | null;

interface ModalState {
  type: ModalType;
  doc: ObraDocumento | null;
  categoriaParaEnvio?: ObraDocumento['categoria'];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DocumentosSectionProps {
  obra: MinhaObraDetalhe;
}

// ─── Sub-component: DocumentoRow ──────────────────────────────────────────────

interface DocumentoRowProps {
  doc: ObraDocumento;
  obraFinalizada: boolean;
  onAcao: (type: ModalType, doc: ObraDocumento) => void;
}

function DocumentoRow({ doc, obraFinalizada, onAcao }: DocumentoRowProps) {
  const cfg = CATEGORIA_CONFIG[doc.categoria];
  const isVencendo = doc.status === 'vencendo';

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border transition-colors group',
        isVencendo
          ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 border-l-4 border-l-amber-500'
          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
      )}
    >
      {/* Icon */}
      <div className={cn('p-2 rounded-lg flex-shrink-0', cfg.iconeBg)}>
        <span className="material-symbols-outlined text-[20px]">{cfg.icone}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{doc.nome}</p>
        {doc.observacoes && (
          <p className="text-xs text-gray-500 truncate">{doc.observacoes}</p>
        )}
        <p className={cn('text-xs mt-0.5', isVencendo ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-gray-400')}>
          {doc.tamanho ? `${doc.tamanho} · ` : ''}{doc.data}
          {doc.venceEmDias && ` · vence em ${doc.venceEmDias} dias`}
        </p>
      </div>

      {/* Status badge + actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {doc.status && !isVencendo && (
          <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full', STATUS_BADGE[doc.status].classes)}>
            {STATUS_BADGE[doc.status].label}
          </span>
        )}

        {isVencendo && !obraFinalizada && (
          <button
            type="button"
            onClick={() => onAcao('renovar_confirm', doc)}
            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">autorenew</span>
            Renovar
          </button>
        )}

        {/* ⋮ menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Ações do documento"
            >
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => window.open('#', '_blank')}
              className="gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Download
            </DropdownMenuItem>

            {!obraFinalizada && (
              <>
                <DropdownMenuItem
                  onClick={() => onAcao('editar', doc)}
                  className="gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Editar
                </DropdownMenuItem>

                {isVencendo && (
                  <DropdownMenuItem
                    onClick={() => onAcao('renovar_confirm', doc)}
                    className="gap-2 cursor-pointer text-amber-600 focus:text-amber-600"
                  >
                    <span className="material-symbols-outlined text-[16px]">autorenew</span>
                    Renovar
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => onAcao('excluir', doc)}
                  className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Excluir
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DocumentosSection({ obra }: DocumentosSectionProps) {
  const [documentos, setDocumentos] = useState<ObraDocumento[]>(obra.documentos);
  const [modalState, setModalState] = useState<ModalState>({ type: null, doc: null });

  const obraFinalizada = obra.status === 'finalizada';

  // ── Handlers ──────────────────────────────────────────────────────────────

  const abrirModal = (type: ModalType, doc: ObraDocumento | null, categoria?: ObraDocumento['categoria']) => {
    setModalState({ type, doc, categoriaParaEnvio: categoria });
  };

  const fecharModal = () => setModalState({ type: null, doc: null });

  const handleEnviar = (novoDoc: Omit<ObraDocumento, 'id'>) => {
    setDocumentos((prev) => [{ ...novoDoc, id: gerarId() }, ...prev]);
  };

  const handleEditar = (updates: Partial<ObraDocumento>) => {
    if (!modalState.doc) return;
    setDocumentos((prev) =>
      prev.map((d) => (d.id === modalState.doc!.id ? { ...d, ...updates } : d))
    );
  };

  const handleRenovar = () => {
    if (!modalState.doc) return;
    setDocumentos((prev) =>
      prev.map((d) =>
        d.id === modalState.doc!.id
          ? { ...d, status: 'valido', venceEmDias: undefined, data: 'Renovado hoje' }
          : d
      )
    );
    fecharModal();
  };

  const handleExcluir = () => {
    if (!modalState.doc) return;
    setDocumentos((prev) => prev.filter((d) => d.id !== modalState.doc!.id));
    fecharModal();
  };

  // ── Grouped data ──────────────────────────────────────────────────────────

  const docsVencendo = documentos.filter((d) => d.status === 'vencendo');
  const gruposPorCategoria = CATEGORIAS_ORDEM.map((cat) => ({
    categoria: cat,
    docs: documentos.filter((d) => d.categoria === cat),
  })).filter((g) => g.docs.length > 0);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Documentos da Obra</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {documentos.length} documento{documentos.length !== 1 ? 's' : ''} · {gruposPorCategoria.length} categori{gruposPorCategoria.length !== 1 ? 'as' : 'a'}
          </p>
        </div>
        {!obraFinalizada && (
          <Button
            size="sm"
            onClick={() => abrirModal('enviar', null)}
            className="gap-2 w-fit"
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            Enviar Documento
          </Button>
        )}
      </div>

      {/* Alerta de vencimento */}
      {docsVencendo.length > 0 && (
        <div className="mb-5 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
          <span className="material-symbols-outlined text-amber-500 text-xl flex-shrink-0 mt-0.5">warning</span>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {docsVencendo.length} documento{docsVencendo.length !== 1 ? 's' : ''} com validade próxima do vencimento
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              {docsVencendo.map((d) => d.nome).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {documentos.length === 0 && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-6xl mb-3 block">
            folder_open
          </span>
          <p className="text-base font-semibold text-gray-500 dark:text-gray-400">
            Nenhum documento cadastrado
          </p>
          <p className="text-sm text-gray-400 mt-1 mb-6">
            Adicione contratos, projetos, ARTs e outros arquivos da obra.
          </p>
          {!obraFinalizada && (
            <Button size="sm" onClick={() => abrirModal('enviar', null)} className="gap-2">
              <span className="material-symbols-outlined text-sm">upload_file</span>
              Enviar Documento
            </Button>
          )}
        </div>
      )}

      {/* Categorias */}
      {gruposPorCategoria.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {gruposPorCategoria.map(({ categoria, docs }) => {
            const cfg = CATEGORIA_CONFIG[categoria];
            return (
              <div key={categoria}>
                {/* Category header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('p-1 rounded', cfg.iconeBg)}>
                      <span className="material-symbols-outlined text-[16px]">{cfg.icone}</span>
                    </span>
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {cfg.label}
                    </h4>
                    <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full">
                      {docs.length}
                    </span>
                  </div>
                  {!obraFinalizada && (
                    <button
                      type="button"
                      onClick={() => abrirModal('enviar', null, categoria)}
                      className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-0.5 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Adicionar
                    </button>
                  )}
                </div>

                {/* Documents */}
                <div className="flex flex-col gap-2">
                  {docs.map((doc) => (
                    <DocumentoRow
                      key={doc.id}
                      doc={doc}
                      obraFinalizada={obraFinalizada}
                      onAcao={(type, d) => abrirModal(type, d)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      <EnviarDocumentoModal
        open={modalState.type === 'enviar'}
        onOpenChange={(v) => { if (!v) fecharModal(); }}
        categoriaInicial={modalState.categoriaParaEnvio}
        onConfirmar={handleEnviar}
      />

      <EditarDocumentoModal
        open={modalState.type === 'editar'}
        onOpenChange={(v) => { if (!v) fecharModal(); }}
        doc={modalState.doc}
        onSalvar={handleEditar}
      />

      {/* Renovar AlertDialog */}
      <AlertDialog
        open={modalState.type === 'renovar_confirm'}
        onOpenChange={(v) => { if (!v) fecharModal(); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar renovação</AlertDialogTitle>
            <AlertDialogDescription>
              O documento <strong className="text-gray-900 dark:text-white">{modalState.doc?.nome}</strong> será
              marcado como <strong>Válido</strong> e a data atualizada para hoje.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={fecharModal}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRenovar}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Confirmar Renovação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Excluir AlertDialog */}
      <AlertDialog
        open={modalState.type === 'excluir'}
        onOpenChange={(v) => { if (!v) fecharModal(); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{' '}
              <strong className="text-gray-900 dark:text-white">{modalState.doc?.nome}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={fecharModal}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
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
