'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ObraDetalheHero } from '@features/empreiteiro/novas-obras/components/ObraDetalheHero';
import { ObraDetalheContent } from '@features/empreiteiro/novas-obras/components/ObraDetalheContent';
import { ObraDetalheSidebar } from '@features/empreiteiro/novas-obras/components/ObraDetalheSidebar';
import { CompartilharModal } from '@features/empreiteiro/novas-obras/components/CompartilharModal';
import { useObraDetalhe } from '@features/empreiteiro/novas-obras/hooks/use-novas-obras';
import { useObrasSalvasIds, useToggleObraSalva } from '@features/empreiteiro/obras-salvas/hooks/use-obras-salvas';
import { IconArrowBack, IconChevronRight, IconCheckCircle, IconSend, IconArrowForward, IconBookmark, IconShare, IconConstruction } from '@shared/components/icons';

export default function ObraDetalhePage() {
  const params = useParams();
  const id = params.id as string;
  const { data: obra, isLoading } = useObraDetalhe(id);
  const [showShare, setShowShare] = useState(false);
  const savedIds = useObrasSalvasIds();
  const toggleSaveMutation = useToggleObraSalva();
  const isSaved = (oid: string) => savedIds.has(oid);
  const toggleSave = (oid: string) => toggleSaveMutation.mutate({ obraId: oid, isSaved: savedIds.has(oid) });

  if (isLoading) {
    return (
      <div className="p-10 animate-pulse space-y-6">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-40" />
        <div className="aspect-[16/7] bg-gray-200 dark:bg-gray-800 rounded-3xl" />
        <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          </div>
          <div className="h-60 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="p-10 text-center py-20">
        <IconConstruction className="text-5xl text-gray-300 block mb-4" />
        <h3 className="text-lg font-bold text-gray-500">Obra não encontrada</h3>
        <Link href="/empreiteiro/novas-obras" className="text-primary font-semibold mt-2 inline-block" data-testid="link-back-not-found">Voltar para Novas Obras</Link>
      </div>
    );
  }

  const showCtaBanner = obra.applicationStatus === 'nao_aplicado';

  return (
    <div className="p-10 flex flex-col gap-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
        <Link href="/empreiteiro/novas-obras" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors" data-testid="link-back">
          <IconArrowBack className="text-lg" />Voltar
        </Link>
        <nav className="flex items-center gap-2 text-sm flex-wrap" data-testid="breadcrumb-nav">
          <Link href="/empreiteiro/novas-obras" className="text-gray-400 hover:text-primary transition-colors" data-testid="link-breadcrumb-novas-obras">Novas Obras</Link>
          <IconChevronRight className="text-gray-300 text-base" />
          <span className="text-primary font-semibold" data-testid="text-breadcrumb-title">{obra.titulo}</span>
        </nav>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <ObraDetalheHero obra={obra} />
      </motion.div>

      {showCtaBanner && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-2xl p-8 shadow-sm relative overflow-hidden" data-testid="cta-banner">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern height="40" id="grid-cta" patternUnits="userSpaceOnUse" width="40">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect fill="url(#grid-cta)" height="100%" width="100%" />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <IconCheckCircle className="text-white text-3xl" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">Interessado nesta obra?</h3>
                <p className="text-white/80 text-sm mt-1">Envie sua proposta com valores, prazos e detalhes técnicos.</p>
              </div>
            </div>
            <Link
              href={`/empreiteiro/novas-obras/${obra.id}/aplicar`}
              className="px-8 py-3 bg-white text-primary font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 w-fit"
              data-testid="cta-apply-banner"
            >
              <IconSend className="text-lg" />
              Enviar Proposta
            </Link>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ObraDetalheContent obra={obra} />
        </div>
        <div>
          <ObraDetalheSidebar obra={obra} onApply={() => {}} isApplying={false} />
        </div>
      </motion.div>

      {/* CTA Dark — Pronto para se candidatar? */}
      {showCtaBanner && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-r from-primary to-gray-700 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern height="40" id="grid-cta-dark" patternUnits="userSpaceOnUse" width="40">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect fill="url(#grid-cta-dark)" height="100%" width="100%" />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                <IconCheckCircle className="text-white text-3xl" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">Pronto para se candidatar?</h3>
                <p className="text-white/80 text-sm mt-1">Sua candidatura será analisada pelo contratante em até 48 horas.</p>
              </div>
            </div>
            <Link
              href={`/empreiteiro/novas-obras/${obra.id}/aplicar`}
              className="px-8 py-4 bg-white text-primary rounded-xl font-extrabold text-base flex items-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105 transition-all w-fit flex-shrink-0"
            >
              Aplicar para esta obra
              <IconArrowForward />
            </Link>
          </div>
        </motion.div>
      )}

      {/* Ações secundárias */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-gray-100 dark:border-gray-800">
          <Link href="/empreiteiro/novas-obras" className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors">
            <IconArrowBack />
            <span className="text-sm font-medium">Voltar para Novas Obras</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleSave(obra.id)}
              className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors ${
                isSaved(obra.id)
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <IconBookmark />
              {isSaved(obra.id) ? 'Obra Salva' : 'Salvar Obra'}
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <IconShare />
              Compartilhar
            </button>
          </div>
        </div>
      </motion.div>

      <CompartilharModal open={showShare} onClose={() => setShowShare(false)} obraTitulo={obra.titulo} />
    </div>
  );
}
