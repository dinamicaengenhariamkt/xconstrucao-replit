'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import { UploadFotosModal } from './UploadFotosModal';
import { EditarEtiquetaModal } from './EditarEtiquetaModal';
import type { MinhaObraDetalhe, ObraFoto } from '../types';
import {
  IconSend,
  IconAddAPhoto,
  IconCompare,
  IconClose,
  IconPhotoLibrary,
  IconZoomIn,
  IconCheck,
  IconMoreVert,
  IconTimeline,
  IconLabel,
  IconMarkEmailUnread,
  IconDelete,
} from '@shared/components/icons';
import {
  FASE_ICON_MAP,
  FASE_CONFIG,
  gerarFotoId as gerarId,
  melhorFoto,
  type FaseOption,
  type FotoModalType as ModalType,
  type FotoModalState as ModalState,
} from './foto-gallery/foto-gallery-helpers';

// ─── Props ────────────────────────────────────────────────────────────────────

interface FotoGallerySectionProps {
  obra: MinhaObraDetalhe;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FotoGallerySection({ obra }: FotoGallerySectionProps) {
  const [fotos, setFotos] = useState<ObraFoto[]>(obra.fotos);
  const [activeFilter, setActiveFilter] = useState('todas');
  const [selectedFoto, setSelectedFoto] = useState<ObraFoto | null>(null);
  const [modoSelecao, setModoSelecao] = useState(false);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<ModalState>({ type: null, foto: null });

  const obraFinalizada = obra.status === 'finalizada';

  // ─── Modal helpers ─────────────────────────────────────────────────────────

  const openModal = useCallback((type: ModalType, foto?: ObraFoto) => {
    setModalState({ type, foto: foto ?? null });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ type: null, foto: null });
  }, []);

  // ─── Filters ───────────────────────────────────────────────────────────────

  const temEnviadas = useMemo(() => fotos.some((f) => f.enviadaAoContratante), [fotos]);

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const foto of fotos) {
      if (foto.tag) tagSet.add(foto.tag);
    }
    return Array.from(tagSet);
  }, [fotos]);

  const faseFilters = useMemo(
    () =>
      (['antes', 'durante', 'agora'] as NonNullable<FaseOption>[]).filter((f) =>
        fotos.some((foto) => foto.fase === f)
      ),
    [fotos]
  );

  const filters = useMemo(() => {
    const base = ['todas', 'hoje'];
    if (temEnviadas) base.push('enviadas');
    return [...base, ...faseFilters, ...tags];
  }, [temEnviadas, faseFilters, tags]);

  const filterLabel = (filter: string): string => {
    if (filter === 'todas') return `Todas (${fotos.length})`;
    if (filter === 'hoje') {
      const count = fotos.filter((f) => f.data.toLowerCase().startsWith('hoje')).length;
      return `Hoje (${count})`;
    }
    if (filter === 'enviadas') {
      const count = fotos.filter((f) => f.enviadaAoContratante).length;
      return `Enviadas (${count})`;
    }
    if (filter === 'antes' || filter === 'durante' || filter === 'agora') {
      const count = fotos.filter((f) => f.fase === filter).length;
      const labels: Record<string, string> = { antes: 'Antes', durante: 'Durante', agora: 'Agora' };
      return `${labels[filter]} (${count})`;
    }
    const count = fotos.filter((f) => f.tag === filter).length;
    return `${filter} (${count})`;
  };

  const filteredFotos = useMemo(() => {
    if (activeFilter === 'todas') return fotos;
    if (activeFilter === 'hoje') return fotos.filter((f) => f.data.toLowerCase().startsWith('hoje'));
    if (activeFilter === 'enviadas') return fotos.filter((f) => f.enviadaAoContratante);
    if (activeFilter === 'antes' || activeFilter === 'durante' || activeFilter === 'agora')
      return fotos.filter((f) => f.fase === activeFilter);
    return fotos.filter((f) => f.tag === activeFilter);
  }, [fotos, activeFilter]);

  // ─── Upload ────────────────────────────────────────────────────────────────

  const handleUploadConfirmar = (novasFotos: Omit<ObraFoto, 'id'>[]) => {
    const comIds: ObraFoto[] = novasFotos.map((f) => ({ ...f, id: gerarId() }));
    setFotos((prev) => [...comIds, ...prev]);
  };

  // ─── Modo seleção ──────────────────────────────────────────────────────────

  const entrarModoSelecao = () => {
    setModoSelecao(true);
    setSelecionadas(new Set());
    setSelectedFoto(null);
  };

  const sairModoSelecao = () => {
    setModoSelecao(false);
    setSelecionadas(new Set());
  };

  const toggleSelecionada = (id: string) => {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleEnviarConfirmar = () => {
    setFotos((prev) =>
      prev.map((f) => (selecionadas.has(f.id) ? { ...f, enviadaAoContratante: true } : f))
    );
    sairModoSelecao();
    closeModal();
  };

  // ─── Per-photo actions ─────────────────────────────────────────────────────

  const definirFase = (id: string, fase: FaseOption) => {
    setFotos((prev) => prev.map((f) => (f.id === id ? { ...f, fase } : f)));
  };

  const salvarEtiqueta = (tag: string | undefined) => {
    if (!modalState.foto) return;
    const id = modalState.foto.id;
    setFotos((prev) => prev.map((f) => (f.id === id ? { ...f, tag } : f)));
  };

  const toggleEnviada = (id: string) => {
    setFotos((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enviadaAoContratante: !f.enviadaAoContratante } : f))
    );
  };

  const excluirFoto = () => {
    if (!modalState.foto) return;
    const id = modalState.foto.id;
    setFotos((prev) => prev.filter((f) => f.id !== id));
    if (selectedFoto?.id === id) setSelectedFoto(null);
    closeModal();
  };

  // ─── Comparativo helpers ───────────────────────────────────────────────────

  const temFasesDefinidas = fotos.some((f) => f.fase);

  const fotoAntes = fotos.length > 0
    ? melhorFoto(fotos, 'antes', fotos[fotos.length - 1])
    : null;
  const fotoDurante = fotos.length > 0
    ? melhorFoto(fotos, 'durante', fotos[Math.floor(fotos.length / 2)] ?? fotos[0])
    : null;
  const fotoAgora = fotos.length > 0
    ? melhorFoto(fotos, 'agora', fotos[0])
    : null;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Galeria de Fotos</h3>
            <p className="text-sm text-gray-500">Registro fotográfico da evolução</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={entrarModoSelecao}
              disabled={obraFinalizada || fotos.length === 0 || modoSelecao}
              className="px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <IconSend className="text-sm" />
              Enviar ao Contratante
            </button>
            <button
              onClick={() => openModal('upload')}
              disabled={obraFinalizada}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <IconAddAPhoto className="text-sm" />
              Upload Múltiplo
            </button>
          </div>
        </div>

        {/* Empty state */}
        {fotos.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <IconPhotoLibrary className="text-5xl text-gray-200 dark:text-gray-700" />
            <p className="text-sm font-semibold text-gray-500">Nenhuma foto registrada</p>
            <p className="text-xs text-gray-400">
              Adicione fotos para acompanhar a evolução visual da obra.
            </p>
            {!obraFinalizada && (
              <button
                onClick={() => openModal('upload')}
                className="mt-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <IconAddAPhoto className="text-sm" />
                Upload de Fotos
              </button>
            )}
          </div>
        )}

        {fotos.length > 0 && (
          <>
            {/* Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    'px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer',
                    activeFilter === filter
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  {filterLabel(filter)}
                </button>
              ))}
            </div>

            {/* Selection bar */}
            <AnimatePresence>
              {modoSelecao && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between"
                >
                  <span className="text-sm font-semibold text-primary">
                    {selecionadas.size} foto{selecionadas.size !== 1 ? 's' : ''} selecionada
                    {selecionadas.size !== 1 ? 's' : ''}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={sairModoSelecao}>
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      disabled={selecionadas.size === 0}
                      onClick={() => openModal('enviar_confirm')}
                    >
                      <IconSend className="text-sm mr-1" />
                      Enviar{selecionadas.size > 0 ? ` (${selecionadas.size})` : ''}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {filteredFotos.map((foto) => {
                const isSelecionada = selecionadas.has(foto.id);
                const faseConfig = foto.fase ? FASE_CONFIG[foto.fase] : null;

                return (
                  <div
                    key={foto.id}
                    className="group relative aspect-square rounded-xl overflow-hidden"
                  >
                    {/* Image + overlay */}
                    <button
                      onClick={() => {
                        if (modoSelecao) {
                          toggleSelecionada(foto.id);
                        } else {
                          setSelectedFoto(foto);
                        }
                      }}
                      className="absolute inset-0 w-full h-full cursor-pointer"
                      aria-label={modoSelecao ? 'Selecionar foto' : 'Ver foto'}
                    >
                      <img
                        src={foto.url}
                        alt="Foto da obra"
                        className={cn(
                          'w-full h-full object-cover transition-transform duration-300',
                          !modoSelecao && 'group-hover:scale-105',
                          isSelecionada && 'brightness-75'
                        )}
                      />

                      {/* Normal mode hover */}
                      {!modoSelecao && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <IconZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl" />
                        </div>
                      )}

                      {/* Selection mode */}
                      {modoSelecao && (
                        <div
                          className={cn(
                            'absolute inset-0 flex items-center justify-center transition-colors',
                            isSelecionada ? 'bg-primary/30' : 'bg-black/10 group-hover:bg-black/20'
                          )}
                        >
                          <div
                            className={cn(
                              'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                              isSelecionada
                                ? 'bg-primary border-primary'
                                : 'border-white bg-white/20'
                            )}
                          >
                            {isSelecionada && (
                              <IconCheck className="text-white text-sm leading-none" />
                            )}
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Tag badge — top-left */}
                    {foto.tag && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold bg-white/90 dark:bg-gray-800/90 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300 pointer-events-none">
                        {foto.tag}
                      </span>
                    )}

                    {/* Fase badge — top-right */}
                    {faseConfig && !modoSelecao && (
                      <span
                        className={cn(
                          'absolute top-2 right-8 text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none',
                          faseConfig.badgeBg,
                          faseConfig.badgeText
                        )}
                      >
                        {faseConfig.label}
                      </span>
                    )}

                    {/* Enviada indicator — bottom-right */}
                    {foto.enviadaAoContratante && (
                      <span className="absolute bottom-2 right-2 pointer-events-none">
                        <IconSend className="text-white text-sm drop-shadow" />
                      </span>
                    )}

                    {/* ⋮ menu — top-right corner */}
                    {!modoSelecao && !obraFinalizada && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="w-7 h-7 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-lg text-white transition-colors cursor-pointer"
                              aria-label="Opções"
                            >
                              <IconMoreVert className="text-base leading-none" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <IconTimeline className="text-base mr-2 text-gray-500" />
                                Definir fase
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {(
                                  [
                                    { value: 'antes' as const, label: 'Antes', icon: 'history' },
                                    { value: 'durante' as const, label: 'Durante', icon: 'pending' },
                                    { value: 'agora' as const, label: 'Agora', icon: 'check_circle' },
                                    { value: undefined, label: 'Sem fase', icon: 'block' },
                                  ] as const
                                ).map((opt) => {
                                  const FaseIcon = FASE_ICON_MAP[opt.icon];
                                  return (
                                    <DropdownMenuItem
                                      key={String(opt.value)}
                                      onClick={() => definirFase(foto.id, opt.value)}
                                      className={cn(foto.fase === opt.value && 'bg-primary/5 text-primary')}
                                    >
                                      <FaseIcon className="text-base mr-2" />
                                      {opt.label}
                                      {foto.fase === opt.value && (
                                        <IconCheck className="text-sm ml-auto text-primary" />
                                      )}
                                    </DropdownMenuItem>
                                  );
                                })}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            <DropdownMenuItem onClick={() => openModal('etiqueta', foto)}>
                              <IconLabel className="text-base mr-2 text-gray-500" />
                              Editar etiqueta
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => toggleEnviada(foto.id)}>
                              {foto.enviadaAoContratante
                                ? <IconMarkEmailUnread className="text-base mr-2 text-gray-500" />
                                : <IconSend className="text-base mr-2 text-gray-500" />
                              }
                              {foto.enviadaAoContratante ? 'Cancelar envio' : 'Enviar ao contratante'}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => openModal('excluir', foto)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <IconDelete className="text-base mr-2" />
                              Excluir foto
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Comparativo de Evolução */}
            {fotoAntes && fotoDurante && fotoAgora && (
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
                  <IconCompare className="text-primary" />
                  Comparativo de Evolução
                </h4>
                {!temFasesDefinidas && (
                  <p className="text-xs text-gray-400 mb-4">
                    Defina fases (Antes / Durante / Agora) nas fotos para um comparativo mais preciso.
                  </p>
                )}
                {temFasesDefinidas && <div className="mb-4" />}

                <div className="grid grid-cols-3 gap-4">
                  <button onClick={() => setSelectedFoto(fotoAntes)} className="text-center cursor-pointer">
                    <div className="aspect-video rounded-lg overflow-hidden mb-2 bg-gray-200 dark:bg-gray-700">
                      <img className="w-full h-full object-cover grayscale" src={fotoAntes.url} alt="Antes" />
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase">Antes</span>
                    <p className="text-[10px] text-gray-400">{fotoAntes.data}</p>
                  </button>

                  <button onClick={() => setSelectedFoto(fotoDurante)} className="text-center cursor-pointer">
                    <div className="aspect-video rounded-lg overflow-hidden mb-2 bg-gray-200 dark:bg-gray-700">
                      <img className="w-full h-full object-cover" src={fotoDurante.url} alt="Durante" />
                    </div>
                    <span className="text-xs font-bold text-amber-600 uppercase">Durante</span>
                    <p className="text-[10px] text-gray-400">{fotoDurante.data}</p>
                  </button>

                  <button onClick={() => setSelectedFoto(fotoAgora)} className="text-center cursor-pointer">
                    <div className="aspect-video rounded-lg overflow-hidden mb-2 bg-gray-200 dark:bg-gray-700 ring-2 ring-success">
                      <img className="w-full h-full object-cover" src={fotoAgora.url} alt="Agora" />
                    </div>
                    <span className="text-xs font-bold text-success uppercase">Agora</span>
                    <p className="text-[10px] text-gray-400">{fotoAgora.data}</p>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Lightbox ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedFoto && !modoSelecao && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-8"
            onClick={() => setSelectedFoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedFoto.url}
                alt="Foto em tamanho real"
                className="max-w-full max-h-[80vh] rounded-2xl object-contain"
              />
              {/* Info bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl flex items-end justify-between">
                <div>
                  {selectedFoto.tag && (
                    <span className="text-xs font-bold text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                      {selectedFoto.tag}
                    </span>
                  )}
                  {selectedFoto.fase && (
                    <span className="ml-1 text-xs font-bold text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                      {FASE_CONFIG[selectedFoto.fase].label}
                    </span>
                  )}
                  <p className="text-xs text-white/60 mt-1">{selectedFoto.data}</p>
                </div>
                {selectedFoto.enviadaAoContratante && (
                  <span className="text-xs text-white/70 flex items-center gap-1">
                    <IconSend className="text-sm" />
                    Enviada
                  </span>
                )}
              </div>
            </motion.div>
            <button
              onClick={() => setSelectedFoto(null)}
              className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors cursor-pointer"
            >
              <IconClose className="text-3xl" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Upload Modal ─────────────────────────────────────────────────────── */}
      <UploadFotosModal
        open={modalState.type === 'upload'}
        onOpenChange={(open) => !open && closeModal()}
        onConfirmar={handleUploadConfirmar}
      />

      {/* ─── Editar etiqueta ──────────────────────────────────────────────────── */}
      <EditarEtiquetaModal
        open={modalState.type === 'etiqueta'}
        onOpenChange={(open) => !open && closeModal()}
        tagAtual={modalState.foto?.tag}
        onSalvar={salvarEtiqueta}
      />

      {/* ─── AlertDialog: confirmar envio ─────────────────────────────────────── */}
      <AlertDialog
        open={modalState.type === 'enviar_confirm'}
        onOpenChange={(open) => !open && closeModal()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar fotos ao contratante</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a enviar{' '}
              <strong>
                {selecionadas.size} foto{selecionadas.size !== 1 ? 's' : ''}
              </strong>{' '}
              ao contratante <strong>{obra.contratante.nome}</strong>. Deseja confirmar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEnviarConfirmar}>
              <IconSend className="text-sm mr-1" />
              Enviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── AlertDialog: confirmar exclusão ─────────────────────────────────── */}
      <AlertDialog
        open={modalState.type === 'excluir'}
        onOpenChange={(open) => !open && closeModal()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir foto</AlertDialogTitle>
            <AlertDialogDescription>
              Esta foto será removida permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={excluirFoto}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
