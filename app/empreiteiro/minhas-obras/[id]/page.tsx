'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useMinhaObraDetalhe } from '@features/empreiteiro/minhas-obras/hooks/use-minhas-obras';
import { STATUS_LABELS, STATUS_BADGE_VARIANTS, PROGRESS_COLORS } from '@features/empreiteiro/minhas-obras/constants';
import { cn } from '@shared/lib/utils';
import type { MinhaObraDetalhe, MinhaObraTarefa, TimelineEvent } from '@features/empreiteiro/minhas-obras/types';

const STATUS_BG: Record<string, string> = {
  em_execucao: 'bg-primary/10 text-primary',
  com_atrasos: 'bg-red-500/10 text-red-600',
  com_pendencias: 'bg-amber-500/10 text-amber-600',
  planejamento: 'bg-blue-500/10 text-blue-600',
  finalizada: 'bg-green-500/10 text-green-600',
};

const PROGRESS_BAR_COLORS: Record<string, string> = {
  primary: 'bg-primary',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
  success: 'bg-green-500',
};

const TAREFA_STATUS_STYLE: Record<string, { bg: string; label: string }> = {
  pendente: { bg: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', label: 'Pendente' },
  em_andamento: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400', label: 'Em andamento' },
  bloqueado: { bg: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400', label: 'Bloqueado' },
  concluido: { bg: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400', label: 'Concluído' },
};

const PRIORIDADE_ICON: Record<string, { icon: string; color: string }> = {
  alta: { icon: 'keyboard_double_arrow_up', color: 'text-red-500' },
  media: { icon: 'drag_handle', color: 'text-amber-500' },
  baixa: { icon: 'keyboard_double_arrow_down', color: 'text-green-500' },
};

const TIMELINE_ICON: Record<string, { icon: string; bg: string }> = {
  progresso: { icon: 'trending_up', bg: 'bg-primary/10 text-primary' },
  tarefa: { icon: 'check_circle', bg: 'bg-green-100 text-green-600' },
  documento: { icon: 'description', bg: 'bg-blue-100 text-blue-600' },
  problema: { icon: 'warning', bg: 'bg-red-100 text-red-600' },
  nota: { icon: 'sticky_note_2', bg: 'bg-amber-100 text-amber-600' },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function KpiCard({ icon, label, value, subtext, variant = 'default' }: { icon: string; label: string; value: string | number; subtext?: string; variant?: string }) {
  const variantBg = variant === 'error' ? 'bg-red-50 dark:bg-red-900/20' : variant === 'success' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-900';
  const iconBg = variant === 'error' ? 'bg-red-100 text-red-600' : variant === 'success' ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary';
  return (
    <div className={cn('rounded-2xl border border-gray-100 dark:border-gray-800 p-5', variantBg)} data-testid={`kpi-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">{label}</span>
      </div>
      <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}

function EtapaChecklist({ obra }: { obra: MinhaObraDetalhe }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6" data-testid="bloco-etapas">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Etapas da Obra</h3>
      <div className="space-y-6">
        {obra.etapas.map((etapa) => (
          <div key={etapa.id}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">{etapa.nome}</h4>
              <span className="text-xs font-bold text-gray-500">{etapa.progresso}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
              <div className={cn('h-2 rounded-full transition-all', etapa.progresso === 100 ? 'bg-green-500' : 'bg-primary')} style={{ width: `${etapa.progresso}%` }} />
            </div>
            <div className="space-y-2 pl-2">
              {etapa.tarefas.map((t) => (
                <label key={t.id} className="flex items-center gap-3 text-sm cursor-pointer group">
                  <div className={cn('w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-colors', t.concluida ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-600 group-hover:border-primary')}>
                    {t.concluida && <span className="material-symbols-outlined text-sm">check</span>}
                  </div>
                  <span className={cn(t.concluida ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300')}>{t.titulo}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TarefasList({ tarefas }: { tarefas: MinhaObraTarefa[] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6" data-testid="bloco-tarefas">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tarefas Recentes</h3>
      </div>
      <div className="space-y-3">
        {tarefas.map((tarefa) => {
          const statusStyle = TAREFA_STATUS_STYLE[tarefa.status];
          const prioridadeIcon = PRIORIDADE_ICON[tarefa.prioridade];
          return (
            <div key={tarefa.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800" data-testid={`tarefa-${tarefa.id}`}>
              <span className={cn('material-symbols-outlined text-lg', prioridadeIcon.color)}>{prioridadeIcon.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{tarefa.titulo}</p>
                <p className="text-xs text-gray-500">{tarefa.etapa} • {tarefa.responsavel} • {tarefa.prazo}</p>
              </div>
              <span className={cn('text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider', statusStyle.bg)}>{statusStyle.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineList({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6" data-testid="bloco-timeline">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Atividade Recente</h3>
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-6">
          {events.map((event) => {
            const iconConfig = TIMELINE_ICON[event.tipo];
            return (
              <div key={event.id} className="relative flex gap-4 pl-0" data-testid={`timeline-${event.id}`}>
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10', iconConfig.bg)}>
                  <span className="material-symbols-outlined text-lg">{iconConfig.icon}</span>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{event.titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{event.descricao}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{event.autor} • {event.data}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FotoGallery({ fotos }: { fotos: MinhaObraDetalhe['fotos'] }) {
  const [selectedFoto, setSelectedFoto] = useState<string | null>(null);
  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6" data-testid="bloco-fotos">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Fotos da Obra</h3>
          <span className="text-xs text-gray-400 font-medium">{fotos.length} fotos</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {fotos.map((foto) => (
            <button key={foto.id} onClick={() => setSelectedFoto(foto.url)} className="group relative aspect-square rounded-xl overflow-hidden" data-testid={`foto-${foto.id}`}>
              <img src={foto.url} alt="Foto da obra" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl">zoom_in</span>
              </div>
              {foto.tag && <span className="absolute top-2 left-2 text-[10px] font-bold bg-white/90 dark:bg-gray-800/90 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300">{foto.tag}</span>}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedFoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-8"
            onClick={() => setSelectedFoto(null)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={selectedFoto}
              alt="Foto em tamanho real"
              className="max-w-full max-h-full rounded-2xl object-contain"
            />
            <button onClick={() => setSelectedFoto(null)} className="absolute top-6 right-6 text-white">
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function MinhaObraDetalhePage() {
  const params = useParams();
  const id = params.id as string;
  const { data: obra, isLoading } = useMinhaObraDetalhe(id);
  const [activeTab, setActiveTab] = useState<'overview' | 'tarefas' | 'timeline' | 'fotos'>('overview');

  if (isLoading) {
    return (
      <div className="p-10 animate-pulse space-y-6">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-40" />
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="p-10 text-center py-20">
        <span className="material-symbols-outlined text-5xl text-gray-300 block mb-4">construction</span>
        <h3 className="text-lg font-bold text-gray-500">Obra não encontrada</h3>
        <Link href="/empreiteiro/minhas-obras" className="text-primary font-semibold mt-2 inline-block" data-testid="link-back-not-found">Voltar para Minhas Obras</Link>
      </div>
    );
  }

  const progressColor = PROGRESS_COLORS[obra.status] || 'primary';
  const progressBarColor = PROGRESS_BAR_COLORS[progressColor] || 'bg-primary';
  const statusBg = STATUS_BG[obra.status] || 'bg-gray-100 text-gray-600';

  const tabs = [
    { id: 'overview' as const, label: 'Visão Geral', icon: 'dashboard' },
    { id: 'tarefas' as const, label: 'Tarefas', icon: 'task_alt' },
    { id: 'timeline' as const, label: 'Timeline', icon: 'timeline' },
    { id: 'fotos' as const, label: 'Fotos', icon: 'photo_library' },
  ];

  return (
    <div className="p-10 flex flex-col gap-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
        <Link href="/empreiteiro/minhas-obras" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors" data-testid="link-back">
          <span className="material-symbols-outlined text-lg">arrow_back</span>Voltar
        </Link>
        <nav className="flex items-center gap-2 text-sm flex-wrap">
          <Link href="/empreiteiro/minhas-obras" className="text-gray-400 hover:text-primary transition-colors">Minhas Obras</Link>
          <span className="material-symbols-outlined text-gray-300 text-base">chevron_right</span>
          <span className="text-primary font-semibold" data-testid="text-breadcrumb-title">{obra.titulo}</span>
        </nav>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="relative rounded-3xl overflow-hidden shadow-lg" data-testid="hero-minha-obra">
        <img src={obra.imagemUrl} alt={obra.titulo} className="w-full h-56 md:h-64 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <span className={cn('text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block', statusBg)} data-testid="badge-status">
              {STATUS_LABELS[obra.status]}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1" data-testid="text-titulo">{obra.titulo}</h1>
            <p className="text-white/70 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">location_on</span>{obra.endereco}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold', obra.contratante.cor)}>
              {obra.contratante.iniciais}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{obra.contratante.nome}</p>
              <p className="text-white/60 text-xs">Contratante</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6" data-testid="progress-bar-section">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Progresso Geral</span>
            <span className="text-xs text-gray-400">{obra.dataInicio} → {obra.dataPrevisaoFim}</span>
          </div>
          <span className="text-xl font-extrabold text-gray-900 dark:text-white">{obra.progresso}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${obra.progresso}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn('h-3 rounded-full', progressBarColor)}
          />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="attach_money" label="Valor Pago" value={formatCurrency(obra.valorPago)} subtext={`de ${formatCurrency(obra.orcamento)}`} variant="success" />
        <KpiCard icon="receipt_long" label="A Receber" value={formatCurrency(obra.aReceber)} />
        <KpiCard icon="event_busy" label="Dias de Atraso" value={obra.diasAtraso} variant={obra.diasAtraso > 0 ? 'error' : 'default'} />
        <KpiCard icon="group" label="Equipe Ativa" value={`${obra.equipeAtiva} pessoas`} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4" data-testid="kpi-tarefas-pendentes">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100 text-amber-600">
            <span className="material-symbols-outlined">pending_actions</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Tarefas Pendentes</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white">{obra.tarefasPendentes}/{obra.tarefasTotal}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4" data-testid="kpi-problemas">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-100 text-red-600">
            <span className="material-symbols-outlined">error</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Problemas Abertos</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white">{obra.problemasAbertos}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4" data-testid="kpi-tipo">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
            <span className="material-symbols-outlined">home_repair_service</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Tipo de Obra</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white">{obra.tipo}</p>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-1.5" data-testid="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors',
              activeTab === tab.id ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
            data-testid={`tab-${tab.id}`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EtapaChecklist obra={obra} />
              <TimelineList events={obra.timeline.slice(0, 4)} />
            </div>
          )}
          {activeTab === 'tarefas' && <TarefasList tarefas={obra.tarefas} />}
          {activeTab === 'timeline' && <TimelineList events={obra.timeline} />}
          {activeTab === 'fotos' && <FotoGallery fotos={obra.fotos} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
