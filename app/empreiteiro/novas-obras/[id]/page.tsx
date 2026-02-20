'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ObraDetalheHero } from '@features/empreiteiro/novas-obras/components/ObraDetalheHero';
import { ObraDetalheContent } from '@features/empreiteiro/novas-obras/components/ObraDetalheContent';
import { ObraDetalheSidebar } from '@features/empreiteiro/novas-obras/components/ObraDetalheSidebar';
import { useObraDetalhe } from '@features/empreiteiro/novas-obras/hooks/use-novas-obras';

export default function ObraDetalhePage() {
  const params = useParams();
  const id = params.id as string;
  const { data: obra, isLoading } = useObraDetalhe(id);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsApplying(false);
  };

  if (isLoading) {
    return (
      <div className="p-10 animate-pulse space-y-6">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-40" />
        <div className="aspect-[16/7] bg-gray-200 dark:bg-gray-800 rounded-3xl" />
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
        <span className="material-symbols-outlined text-5xl text-gray-300 block mb-4">construction</span>
        <h3 className="text-lg font-bold text-gray-500">Obra não encontrada</h3>
        <Link href="/empreiteiro/novas-obras" className="text-primary font-semibold mt-2 inline-block" data-testid="link-back-not-found">Voltar para Novas Obras</Link>
      </div>
    );
  }

  return (
    <div className="p-10 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/empreiteiro/novas-obras" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors" data-testid="link-back">
          <span className="material-symbols-outlined text-lg">arrow_back</span>Voltar
        </Link>
        <nav className="flex items-center gap-2 text-sm flex-wrap">
          <Link href="/empreiteiro/novas-obras" className="text-gray-400 hover:text-primary transition-colors" data-testid="link-breadcrumb-novas-obras">Novas Obras</Link>
          <span className="material-symbols-outlined text-gray-300 text-base">chevron_right</span>
          <span className="text-primary font-semibold" data-testid="text-breadcrumb-title">{obra.titulo}</span>
        </nav>
      </div>

      <ObraDetalheHero obra={obra} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ObraDetalheContent obra={obra} />
        </div>
        <div>
          <ObraDetalheSidebar obra={obra} onApply={handleApply} isApplying={isApplying} />
        </div>
      </div>
    </div>
  );
}
