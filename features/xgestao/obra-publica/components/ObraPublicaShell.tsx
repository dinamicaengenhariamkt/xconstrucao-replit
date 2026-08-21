'use client';

import { useState } from 'react';
import { cn } from '@shared/lib/utils';
import { STATUS_LABELS } from '@shared/constants/status';
import { TabChecklists } from '@features/contratante/minhas-obras/components/TabChecklists';
import {
  IconCalendarMonth,
  IconFactCheck,
  IconPhotoLibrary,
  IconTaskAlt,
  IconTimeline,
  IconWarning,
} from '@shared/components/icons';
import type { ObraPublicaView } from '../types';
import { TabDiarioPublica } from './TabDiarioPublica';
import { TabEtapasPublica } from './TabEtapasPublica';
import { TabFotosPublica } from './TabFotosPublica';
import { TabOcorrenciasPublica } from './TabOcorrenciasPublica';

type PublicTab = 'etapas' | 'diario' | 'ocorrencias' | 'fotos' | 'checklists';

const tabs: Array<{
  key: PublicTab;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'etapas', label: 'Etapas', Icon: IconTaskAlt },
  { key: 'diario', label: 'Diário', Icon: IconTimeline },
  { key: 'ocorrencias', label: 'Ocorrências', Icon: IconWarning },
  { key: 'fotos', label: 'Fotos', Icon: IconPhotoLibrary },
  { key: 'checklists', label: 'Checklists', Icon: IconFactCheck },
];

function formatDate(value: string | null): string {
  if (!value) return 'Sem previsão';
  return value;
}

export function ObraPublicaShell({ view }: { view: ObraPublicaView }) {
  const [activeTab, setActiveTab] = useState<PublicTab>('etapas');
  const local = [view.obra.cidade, view.obra.uf].filter(Boolean).join(' · ');

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6">
        <header className="flex items-center justify-between gap-4">
          <p className="text-sm font-extrabold tracking-tight text-primary">xgestão</p>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Acompanhamento da obra
          </span>
        </header>

        <section
          className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
          data-testid="obra-publica-shell"
        >
          <div className="relative aspect-[16/7] min-h-64 overflow-hidden bg-gradient-to-br from-primary/90 to-primary">
            {view.obra.imagemUrl && (
              <img src={view.obra.imagemUrl} alt="" className="h-full w-full object-cover opacity-45" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6 text-white sm:p-8">
              <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                {STATUS_LABELS[view.obra.status] ?? view.obra.status}
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{view.obra.titulo}</h1>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/85">
                {local && <span>{local}</span>}
                <span className="flex items-center gap-1.5">
                  <IconCalendarMonth />
                  Previsão: {formatDate(view.obra.dataPrevisao)}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-6 dark:bg-gray-800/50">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Progresso geral</span>
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{view.obra.progresso}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${view.obra.progresso}%` }} />
            </div>
            {view.obra.ultimaAtualizacao && (
              <p className="mt-3 text-xs text-gray-500">
                Última atualização: {new Date(view.obra.ultimaAtualizacao).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex shrink-0 items-center gap-2 px-4 py-4 text-sm font-semibold transition-colors sm:px-5',
                  activeTab === tab.key
                    ? 'border-b-2 border-primary bg-white text-primary dark:bg-gray-900'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700/50 dark:hover:text-gray-300',
                )}
              >
                <tab.Icon className="text-lg" />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-4 sm:p-6">
            {activeTab === 'etapas' && <TabEtapasPublica obraId={view.obra.id} etapas={view.etapas} />}
            {activeTab === 'diario' && <TabDiarioPublica obraId={view.obra.id} diario={view.diario} />}
            {activeTab === 'ocorrencias' && <TabOcorrenciasPublica obraId={view.obra.id} ocorrencias={view.ocorrencias} />}
            {activeTab === 'fotos' && <TabFotosPublica obraId={view.obra.id} fotos={view.fotos} />}
            {activeTab === 'checklists' && <TabChecklists checklists={view.checklists} />}
          </div>
        </section>

        <p className="pb-4 text-center text-xs text-gray-400">
          Esta página é somente para acompanhamento. Não é possível alterar dados da obra por aqui.
        </p>
      </div>
    </main>
  );
}