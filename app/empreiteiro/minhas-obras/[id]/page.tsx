'use client';

import { useParams } from 'next/navigation';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useMinhaObraDetalhe } from '@features/empreiteiro/minhas-obras/hooks/use-minhas-obras';
import { STATUS_LABELS, PROGRESS_COLORS } from '@shared/constants/status';
import { TaskManagerSection } from '@features/empreiteiro/minhas-obras/components/TaskManagerSection';
import { ChecklistsSection } from '@features/empreiteiro/minhas-obras/components/ChecklistsSection';
import { TimelineSection } from '@features/empreiteiro/minhas-obras/components/TimelineSection';
import { FotoGallerySection } from '@features/empreiteiro/minhas-obras/components/FotoGallerySection';
import { DocumentosSection } from '@features/empreiteiro/minhas-obras/components/DocumentosSection';
import { CronogramaSection } from '@features/empreiteiro/minhas-obras/components/CronogramaSection';
import { OcorrenciasSection } from '@features/empreiteiro/minhas-obras/components/OcorrenciasSection';
import { FinanceiroSection } from '@features/empreiteiro/minhas-obras/components/FinanceiroSection';
import { EquipeSection } from '@features/empreiteiro/minhas-obras/components/EquipeSection';
import { ContatoContratanteCard } from '@features/empreiteiro/minhas-obras/components/ContatoContratanteCard';
import { LocalizacaoCard } from '@features/shared/components/LocalizacaoCard';
import { AdicionarAtualizacaoModal } from '@features/empreiteiro/minhas-obras/components/AdicionarAtualizacaoModal';
import type { TimelineEvent } from '@features/empreiteiro/minhas-obras/types';
import { cn } from '@shared/lib/utils';
import { formatCurrencyRounded as formatCurrency } from '@shared/lib/formatters';

const STATUS_BG: Record<string, string> = {
  em_execucao: 'bg-primary text-white',
  com_atrasos: 'bg-red-500 text-white',
  com_pendencias: 'bg-amber-500 text-white',
  planejamento: 'bg-blue-500 text-white',
  finalizada: 'bg-green-500 text-white',
};

const PROGRESS_BAR_COLORS: Record<string, string> = {
  primary: 'bg-primary',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
  success: 'bg-green-500',
};

type ObraTab = 'tarefas' | 'checklists' | 'timeline' | 'fotos' | 'documentos' | 'cronograma' | 'ocorrencias';

const TABS: { key: ObraTab; label: string; icon: string }[] = [
  { key: 'tarefas', label: 'Tarefas', icon: 'task_alt' },
  { key: 'checklists', label: 'Checklists', icon: 'fact_check' },
  { key: 'timeline', label: 'Timeline', icon: 'timeline' },
  { key: 'fotos', label: 'Fotos', icon: 'photo_library' },
  { key: 'documentos', label: 'Documentos', icon: 'folder_open' },
  { key: 'cronograma', label: 'Cronograma', icon: 'calendar_month' },
  { key: 'ocorrencias', label: 'Ocorrências', icon: 'warning' },
];

export default function MinhaObraDetalhePage() {
  const params = useParams();
  const id = params.id as string;
  const { data: obra, isLoading } = useMinhaObraDetalhe(id);
  const [activeTab, setActiveTab] = useState<ObraTab>('tarefas');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localTimeline, setLocalTimeline] = useState<TimelineEvent[]>([]);
  const [showAtualizacao, setShowAtualizacao] = useState(false);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCoverUrl(URL.createObjectURL(file));
  };

  const handleAddAtualizacao = (event: TimelineEvent) => {
    setLocalTimeline(prev => [event, ...prev]);
    setActiveTab('timeline');
  };

  if (isLoading) {
    return (
      <div className="p-10 animate-pulse space-y-6">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-40" />
        <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-36 bg-gray-200 dark:bg-gray-800 rounded-2xl" />)}
        </div>
        <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="p-10 text-center py-20">
        <span className="material-symbols-outlined text-5xl text-gray-300 block mb-4">construction</span>
        <h3 className="text-lg font-bold text-gray-500">Obra não encontrada</h3>
        <Link href="/empreiteiro/minhas-obras" className="text-primary font-semibold mt-2 inline-block" data-testid="link-back-not-found">
          Voltar para Minhas Obras
        </Link>
      </div>
    );
  }

  const progressColor = PROGRESS_COLORS[obra.status] || 'primary';
  const progressBarColor = PROGRESS_BAR_COLORS[progressColor] || 'bg-primary';
  const statusBg = STATUS_BG[obra.status] || 'bg-gray-500/20 text-gray-200';

  return (
    <div className="p-10 flex flex-col gap-8">

      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
        <Link
          href="/empreiteiro/minhas-obras"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
          data-testid="link-back"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Voltar
        </Link>
        <nav className="flex items-center gap-2 text-sm flex-wrap">
          <Link href="/empreiteiro/minhas-obras" className="text-gray-400 hover:text-primary transition-colors">
            Minhas Obras
          </Link>
          <span className="material-symbols-outlined text-gray-300 text-base">chevron_right</span>
          <span className="text-primary font-semibold" data-testid="text-breadcrumb-title">{obra.titulo}</span>
        </nav>
      </motion.div>

      {/* BLOCO 1: Hero da Obra */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm"
        data-testid="hero-minha-obra"
      >
        <div className="aspect-[16/7] relative overflow-hidden group">
          <img
            src={coverUrl ?? obra.imagemUrl}
            alt={obra.titulo}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFotoChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute top-4 right-4 px-4 py-2 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-xl text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">photo_camera</span>
            Alterar foto de capa
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <span
                  className={cn('text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block backdrop-blur-sm', statusBg)}
                  data-testid="badge-status"
                >
                  {STATUS_LABELS[obra.status]}
                </span>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3" data-testid="text-titulo">
                  {obra.titulo}
                </h1>
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <span className="material-symbols-outlined text-lg">location_on</span>
                  <span>{obra.endereco}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex items-center gap-2 text-white/90">
                  <span className="material-symbols-outlined text-lg">event</span>
                  <div>
                    <p className="text-white/60 text-xs">Entrega prevista</p>
                    <p className="font-bold text-sm">{obra.dataPrevisaoFim}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <span className="material-symbols-outlined text-lg">groups</span>
                  <div>
                    <p className="text-white/60 text-xs">Contratante</p>
                    <div className="flex items-center gap-2">
                      <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold', obra.contratante.cor)}>
                        {obra.contratante.iniciais}
                      </div>
                      <p className="font-bold text-sm">{obra.contratante.nome}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowAtualizacao(true)}
                  className="px-5 py-2 bg-primary text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">add_task</span>
                  Adicionar Atualização
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar section */}
        <div className="p-8 bg-gray-50 dark:bg-gray-800/50" data-testid="progress-bar-section">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Progresso Geral</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{obra.progresso}</span>
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">%</span>
            </div>
          </div>
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${obra.progresso}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
              className={cn('h-full rounded-full', progressBarColor)}
            />
          </div>
        </div>
      </motion.div>

      {/* BLOCO 3: KPIs Operacionais */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {/* Progresso Real */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 hover:border-success/30 transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-success/10 text-success rounded-lg">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <span className="text-success text-xs font-bold bg-success/10 px-2 py-1 rounded-full">Atual</span>
          </div>
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Progresso Real</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{obra.progresso}%</p>
          </div>
          <div className="h-1.5 w-full bg-success/20 rounded-full overflow-hidden">
            <div className="h-full bg-success rounded-full" style={{ width: `${obra.progresso}%` }} />
          </div>
        </div>

        {/* Dias de Atraso */}
        <div className={cn(
          'bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 transition-all',
          obra.diasAtraso > 0 ? 'border-l-4 border-l-amber-500 hover:border-amber-300' : 'hover:border-success/30'
        )}>
          <div className="flex justify-between items-start">
            <div className={cn('p-2.5 rounded-lg', obra.diasAtraso > 0 ? 'bg-amber-50 text-amber-600' : 'bg-success/10 text-success')}>
              <span className="material-symbols-outlined">schedule</span>
            </div>
            {obra.diasAtraso > 0 && (
              <span className="text-amber-600 text-xs font-bold bg-amber-50 px-2 py-1 rounded-full">Alerta</span>
            )}
          </div>
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Dias em Atraso</p>
            <p className={cn('text-3xl font-extrabold mt-1', obra.diasAtraso > 0 ? 'text-amber-600' : 'text-gray-900 dark:text-white')}>
              {obra.diasAtraso}
            </p>
          </div>
          <p className="text-xs text-gray-500">{obra.diasAtraso > 0 ? '~7% do cronograma' : 'No prazo'}</p>
        </div>

        {/* Tarefas Pendentes */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 hover:border-purple-300 transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
              <span className="material-symbols-outlined">task_alt</span>
            </div>
            <span className="text-purple-600 text-xs font-bold bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-full">
              {obra.tarefasTotal} total
            </span>
          </div>
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Tarefas Pendentes</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{obra.tarefasPendentes}</p>
          </div>
          <p className="text-xs text-gray-500">{obra.tarefasTotal - obra.tarefasPendentes} concluídas</p>
        </div>

        {/* Problemas Abertos */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 hover:border-red-300 transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg">
              <span className="material-symbols-outlined">error_outline</span>
            </div>
            {obra.problemasAbertos > 0 && (
              <span className="text-red-600 text-xs font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">Atenção</span>
            )}
          </div>
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Problemas Abertos</p>
            <p className={cn('text-3xl font-extrabold mt-1', obra.problemasAbertos > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white')}>
              {obra.problemasAbertos}
            </p>
          </div>
          <p className="text-xs text-gray-500">{obra.problemasAbertos > 0 ? '1 crítico, 2 médios' : 'Nenhum problema'}</p>
        </div>

        {/* Equipe no Canteiro */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 hover:border-blue-300 transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
              <span className="material-symbols-outlined">groups</span>
            </div>
            <span className="text-blue-600 text-xs font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">Hoje</span>
          </div>
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Equipe no Canteiro</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{obra.equipeAtiva}</p>
          </div>
          <p className="text-xs text-gray-500">pessoas na obra</p>
        </div>
      </motion.div>

      {/* BLOCOs 4–10: Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
      >
        {/* Tab bar */}
        <div className="flex overflow-x-auto border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer flex-shrink-0',
                activeTab === tab.key
                  ? 'text-primary border-b-2 border-primary bg-white dark:bg-gray-900'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              )}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'tarefas' && <TaskManagerSection obra={obra} />}
              {activeTab === 'checklists' && <ChecklistsSection obra={obra} />}
              {activeTab === 'timeline' && <TimelineSection events={[...localTimeline, ...obra.timeline]} />}
              {activeTab === 'fotos' && <FotoGallerySection obra={obra} />}
              {activeTab === 'documentos' && <DocumentosSection obra={obra} />}
              {activeTab === 'cronograma' && <CronogramaSection obra={obra} />}
              {activeTab === 'ocorrencias' && <OcorrenciasSection obra={obra} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* BLOCO 11: Resumo Financeiro */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <FinanceiroSection financeiro={obra.financeiro} />
      </motion.div>

      {/* BLOCO 12: Equipe e Colaboradores */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <EquipeSection obra={obra} />
      </motion.div>

      {/* BLOCO 13: Contato do Contratante */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.40 }}>
        <ContatoContratanteCard contratante={obra.contratante} obraId={obra.id} obraTitulo={obra.titulo} />
      </motion.div>

      {/* BLOCO 15: Localização */}
      {obra.localizacao && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <LocalizacaoCard localizacao={obra.localizacao} />
        </motion.div>
      )}

      <AdicionarAtualizacaoModal
        open={showAtualizacao}
        onOpenChange={setShowAtualizacao}
        onAdd={handleAddAtualizacao}
      />

    </div>
  );
}
