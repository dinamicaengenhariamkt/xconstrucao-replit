'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useNovasObras } from '@features/empreiteiro/novas-obras/hooks/use-novas-obras';
import { useObrasSalvasStore } from '@features/empreiteiro/novas-obras/store/obras-salvas-store';
import { NovaObraCard } from '@features/empreiteiro/novas-obras/components/NovaObraCard';
import { IconBookmarks, IconBookmark, IconSearch, IconBookmarkFill } from '@shared/components/icons';

export default function ObrasSalvasPage() {
  const { data: todasObras, isLoading } = useNovasObras();
  const { savedIds, toggleSave, isSaved } = useObrasSalvasStore();

  const obrasSalvas = (todasObras ?? []).filter((o) => savedIds.includes(o.id));

  if (isLoading) {
    return (
      <div className="p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-800 aspect-[4/3]" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-10 flex flex-col gap-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <IconBookmarks className="text-primary text-3xl" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Obras Salvas</h1>
        </div>
        <p className="text-sm text-gray-500 ml-12">
          {obrasSalvas.length > 0
            ? `${obrasSalvas.length} obra${obrasSalvas.length !== 1 ? 's' : ''} salva${obrasSalvas.length !== 1 ? 's' : ''}`
            : 'Suas obras favoritas aparecem aqui'}
        </p>
      </motion.div>

      {/* Content */}
      {obrasSalvas.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 gap-4 text-center"
        >
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <IconBookmark className="text-gray-300 text-4xl" />
          </div>
          <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">Nenhuma obra salva ainda</h3>
          <p className="text-sm text-gray-400 max-w-xs">
            Explore as obras disponíveis e clique em "Salvar Obra" para guardar suas favoritas aqui.
          </p>
          <Link
            href="/empreiteiro/novas-obras"
            className="mt-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <IconSearch className="text-lg" />
            Explorar Novas Obras
          </Link>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {obrasSalvas.map((obra, i) => (
            <motion.div
              key={obra.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative group"
            >
              <NovaObraCard obra={obra} />
              {/* Remove bookmark button overlay */}
              <button
                onClick={() => toggleSave(obra.id)}
                className="absolute top-3 right-3 z-10 p-2 bg-white/90 dark:bg-gray-900/90 rounded-lg shadow hover:bg-white dark:hover:bg-gray-900 transition-colors opacity-0 group-hover:opacity-100"
                title="Remover dos salvos"
              >
                <IconBookmarkFill className="text-primary text-sm" />
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
