'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { RiImageLine } from 'react-icons/ri';
import type { ObraContratanteDetalhe, FotoObra } from '../types';
import { IconSend, IconCompare, IconClose, IconZoomIn } from '@shared/components/icons';

interface TabFotosProps {
  obra: ObraContratanteDetalhe;
}

type FaseOption = FotoObra['fase'];

const FASE_CONFIG: Record<NonNullable<FaseOption>, { label: string; badgeBg: string; badgeText: string }> = {
  antes: { label: 'Antes', badgeBg: 'bg-gray-200/90 dark:bg-gray-700/90', badgeText: 'text-gray-700 dark:text-gray-200' },
  durante: { label: 'Durante', badgeBg: 'bg-amber-100/90 dark:bg-amber-900/70', badgeText: 'text-amber-700 dark:text-amber-300' },
  agora: { label: 'Agora', badgeBg: 'bg-success/10 dark:bg-success/20', badgeText: 'text-success' },
};

function melhorFoto(fotos: FotoObra[], fase: FaseOption, fallback: FotoObra): FotoObra {
  const comFase = fotos.filter((f) => f.fase === fase);
  if (comFase.length > 0) return comFase[comFase.length - 1];
  return fallback;
}

export function TabFotos({ obra }: TabFotosProps) {
  // Only show photos sent to the contractor
  const fotosEnviadas = useMemo(
    () => obra.fotos.filter((f) => f.enviadaAoContratante !== false),
    [obra.fotos]
  );

  const [activeFilter, setActiveFilter] = useState('todas');
  const [selectedFoto, setSelectedFoto] = useState<FotoObra | null>(null);

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const foto of fotosEnviadas) {
      if (foto.tag) tagSet.add(foto.tag);
    }
    return Array.from(tagSet);
  }, [fotosEnviadas]);

  const faseFilters = useMemo(
    () =>
      (['antes', 'durante', 'agora'] as NonNullable<FaseOption>[]).filter((f) =>
        fotosEnviadas.some((foto) => foto.fase === f)
      ),
    [fotosEnviadas]
  );

  const filterLabel = (filter: string): string => {
    if (filter === 'todas') return `Todas (${fotosEnviadas.length})`;
    if (filter === 'antes' || filter === 'durante' || filter === 'agora') {
      const count = fotosEnviadas.filter((f) => f.fase === filter).length;
      const labels: Record<string, string> = { antes: 'Antes', durante: 'Durante', agora: 'Agora' };
      return `${labels[filter]} (${count})`;
    }
    const count = fotosEnviadas.filter((f) => f.tag === filter).length;
    return `${filter} (${count})`;
  };

  const filteredFotos = useMemo(() => {
    if (activeFilter === 'todas') return fotosEnviadas;
    if (activeFilter === 'antes' || activeFilter === 'durante' || activeFilter === 'agora')
      return fotosEnviadas.filter((f) => f.fase === activeFilter);
    return fotosEnviadas.filter((f) => f.tag === activeFilter);
  }, [fotosEnviadas, activeFilter]);

  const filters = ['todas', ...faseFilters, ...tags];

  // Evolution comparison helpers
  const temFasesDefinidas = fotosEnviadas.some((f) => f.fase);
  const fotoAntes = fotosEnviadas.length > 0 ? melhorFoto(fotosEnviadas, 'antes', fotosEnviadas[fotosEnviadas.length - 1]) : null;
  const fotoDurante = fotosEnviadas.length > 0 ? melhorFoto(fotosEnviadas, 'durante', fotosEnviadas[Math.floor(fotosEnviadas.length / 2)] ?? fotosEnviadas[0]) : null;
  const fotoAgora = fotosEnviadas.length > 0 ? melhorFoto(fotosEnviadas, 'agora', fotosEnviadas[0]) : null;

  return (
    <>
      <div data-testid="tab-content-fotos">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Galeria de Fotos</h3>
            <p className="text-sm text-gray-500">Registro fotográfico enviado pelo empreiteiro</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-xl">
            <IconSend className="text-sm text-primary" />
            <span>{fotosEnviadas.length} foto{fotosEnviadas.length !== 1 ? 's' : ''} recebida{fotosEnviadas.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {fotosEnviadas.length === 0 ? (
          <div className="text-center py-16">
            <RiImageLine className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">Nenhuma foto disponível</p>
            <p className="text-sm text-gray-400 mt-1">O empreiteiro ainda não enviou fotos desta obra.</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
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

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {filteredFotos.map((foto) => {
                const faseConfig = foto.fase ? FASE_CONFIG[foto.fase] : null;
                return (
                  <div key={foto.id} className="group relative aspect-square rounded-xl overflow-hidden">
                    <button
                      onClick={() => setSelectedFoto(foto)}
                      className="absolute inset-0 w-full h-full cursor-pointer"
                      aria-label="Ver foto"
                    >
                      <img
                        src={foto.url}
                        alt="Foto da obra"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <IconZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl" />
                      </div>
                    </button>

                    {/* Tag badge — top-left */}
                    {foto.tag && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold bg-white/90 dark:bg-gray-800/90 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300 pointer-events-none">
                        {foto.tag}
                      </span>
                    )}

                    {/* Fase badge — top-right */}
                    {faseConfig && (
                      <span className={cn(
                        'absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none',
                        faseConfig.badgeBg,
                        faseConfig.badgeText
                      )}>
                        {faseConfig.label}
                      </span>
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
                    Quando o empreiteiro definir fases nas fotos, o comparativo será mais preciso.
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

      {/* Lightbox */}
      <AnimatePresence>
        {selectedFoto && (
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
                <span className="text-xs text-white/70 flex items-center gap-1">
                  <IconSend className="text-sm" />
                  Enviada pelo empreiteiro
                </span>
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
    </>
  );
}
