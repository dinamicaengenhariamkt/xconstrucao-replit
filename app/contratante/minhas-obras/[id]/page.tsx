'use client';

import { useCallback, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useUpload } from '@features/shared/hooks/use-uploads';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { useObraContratanteDetalhe } from '@features/contratante/minhas-obras/hooks/use-minhas-obras';
import {
  useObraChecklists,
  useObraEquipe,
  useObraTarefasResumo,
} from '@features/contratante/minhas-obras/hooks/use-obra-detalhe-extra';
import { STATUS_LABELS, STATUS_BADGE_VARIANTS, PROGRESS_COLORS } from '@shared/constants/status';
import { TabVisaoGeral } from '@features/contratante/minhas-obras/components/TabVisaoGeral';
import { TabEtapas } from '@features/contratante/minhas-obras/components/TabEtapas';
import { TabFinanceiro } from '@features/contratante/minhas-obras/components/TabFinanceiro';
import { TabEquipe } from '@features/contratante/minhas-obras/components/TabEquipe';
import { TabFotos } from '@features/contratante/minhas-obras/components/TabFotos';
import { TabTimeline } from '@features/contratante/minhas-obras/components/TabTimeline';
import { TabOcorrencias } from '@features/contratante/minhas-obras/components/TabOcorrencias';
import { TabDisputas, type DisputaAlvoOption } from '@features/disputas/components/TabDisputas';
import { TabDocumentos } from '@features/contratante/minhas-obras/components/TabDocumentos';
import { TabChecklists } from '@features/contratante/minhas-obras/components/TabChecklists';
import { ContatoEmpreiteiroCard } from '@features/contratante/minhas-obras/components/ContatoEmpreiteiroCard';
import { CandidaturasCard } from '@features/contratante/minhas-obras/components/CandidaturasCard';
import { LocalizacaoCard } from '@features/shared/components/LocalizacaoCard';
import { ObraVisibilidadeActions } from '@features/contratante/minhas-obras/components/ObraVisibilidadeActions';
import { ContratoCard } from '@features/contratos/components/ContratoCard';
import { Skeleton } from '@shared/components/ui/skeleton';
import {
  RiArrowLeftLine,
  RiMapPinLine,
  RiCalendarLine,
  RiMoneyDollarCircleLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiTeamLine,
  RiImageLine,
  RiLayoutGridLine,
  RiListCheck2,
  RiAlertLine,
  RiHistoryLine,
  RiHeartPulseLine,
  RiFolderLine,
  RiFileList3Line,
  RiCameraLine,
} from 'react-icons/ri';
import { HealthDetailPanel, useObraHealth } from '@features/shared/health';
import { formatCurrencyRounded as formatCurrency } from '@shared/lib/formatters';
import type { ProgressColor } from '@features/contratante/minhas-obras/types';
import { IconGroups } from '@shared/components/icons';
import { useToast } from '@shared/hooks/use-toast';

type ObraTab =
  | 'visao-geral'
  | 'saude'
  | 'etapas'
  | 'timeline'
  | 'ocorrencias'
  | 'financeiro'
  | 'disputas'
  | 'documentos'
  | 'checklists'
  | 'equipe'
  | 'fotos';

const TABS: { key: ObraTab; label: string; icon: React.ElementType }[] = [
  { key: 'visao-geral', label: 'Visão Geral', icon: RiLayoutGridLine },
  { key: 'saude', label: 'Saúde', icon: RiHeartPulseLine },
  { key: 'etapas', label: 'Etapas', icon: RiListCheck2 },
  { key: 'timeline', label: 'Timeline', icon: RiHistoryLine },
  { key: 'ocorrencias', label: 'Ocorrências', icon: RiAlertLine },
  { key: 'financeiro', label: 'Financeiro', icon: RiMoneyDollarCircleLine },
  { key: 'disputas', label: 'Disputas', icon: RiAlertLine },
  { key: 'documentos', label: 'Documentos', icon: RiFolderLine },
  { key: 'checklists', label: 'Checklists', icon: RiFileList3Line },
  { key: 'equipe', label: 'Equipe', icon: RiTeamLine },
  { key: 'fotos', label: 'Fotos', icon: RiImageLine },
];

const PROGRESS_BAR_COLORS: Record<string, string> = {
  primary: 'bg-primary',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
  success: 'bg-green-500',
};

export default function ObraDetalhePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { data: obra, isLoading } = useObraContratanteDetalhe(id);
  const { data: obraHealth } = useObraHealth(id);
  // Entidades com rota própria (J40 Item 10): antes vinham [] / 0 do adapter.
  const { data: checklists } = useObraChecklists(id);
  const { data: equipe } = useObraEquipe(id);
  const { data: tarefasResumo } = useObraTarefasResumo(id);

  // Deep-link: ?tab=financeiro (ou qualquer ObraTab válida) ativa a aba diretamente.
  const tabFromParam = searchParams?.get('tab') as ObraTab | null;
  const validTabFromParam: ObraTab | null = tabFromParam && TABS.some((t) => t.key === tabFromParam)
    ? tabFromParam
    : null;
  const [activeTab, setActiveTab] = useState<ObraTab>(validTabFromParam ?? 'visao-geral');

  // ── Botão "Trocar capa" (Item 13 J40) ────────────────────────────────────
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { upload, pending: uploadingCapa } = useUpload();
  const capaInputRef = useRef<HTMLInputElement>(null);

  const handleCapaUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !obra) return;
      try {
        const result = await upload({ kind: 'obra_capa', file });
        const response = await fetch(`/api/obras/${id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fotoCapaFileId: result.id }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            typeof body?.message === 'string'
              ? body.message
              : 'A imagem foi enviada, mas não pôde ser vinculada à obra.',
          );
        }
        await queryClient.invalidateQueries({ queryKey: ['contratante', 'minhas-obras', id] });
        await queryClient.invalidateQueries({ queryKey: ['contratante', 'minhas-obras'] });
        toast({ title: 'Capa atualizada' });
      } catch (error) {
        toast({
          title: 'Não foi possível atualizar a capa',
          description: error instanceof Error ? error.message : 'Tente novamente.',
          variant: 'destructive',
        });
      } finally {
        if (capaInputRef.current) capaInputRef.current.value = '';
      }
    },
    [id, obra, upload, queryClient, toast],
  );

  if (isLoading) {
    return (
      <div className="p-10 animate-pulse space-y-6">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-40" />
        <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-gray-200 dark:bg-gray-800 rounded-2xl" />)}
        </div>
        <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="p-10 text-center py-20">
        <RiImageLine className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-500">Obra não encontrada</h3>
        <Link href="/contratante/minhas-obras" className="text-primary font-semibold mt-2 inline-block" data-testid="link-back-not-found">
          Voltar para Minhas Obras
        </Link>
      </div>
    );
  }

  const semEmpreiteiro = !obra.empreiteiroVinculado;
  const tarefasTotal = tarefasResumo?.total ?? obra.tarefasTotal;
  const tarefasConcluidas = tarefasResumo?.concluidas ?? obra.tarefasConcluidas;
  const badgeVariant = (STATUS_BADGE_VARIANTS[obra.status] || 'neutral') as 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral';
  const progressColor = (PROGRESS_COLORS[obra.status] || 'primary') as ProgressColor;
  const progressBarColor = PROGRESS_BAR_COLORS[progressColor] || 'bg-primary';
  const pagoPct = Math.min(100, Math.round((obra.valorPago / obra.orcamento) * 100));

  return (
    <div className="p-10 flex flex-col gap-8" data-testid="obra-detalhe-page">

      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
        <Link
          href="/contratante/minhas-obras"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
          data-testid="link-back"
        >
          <RiArrowLeftLine className="w-4 h-4" />
          Voltar
        </Link>
        <nav className="flex items-center gap-2 text-sm flex-wrap">
          <Link href="/contratante/minhas-obras" className="text-gray-400 hover:text-primary transition-colors">
            Minhas Obras
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-primary font-semibold" data-testid="text-breadcrumb-title">{obra.titulo}</span>
        </nav>
      </motion.div>

      {/* Visibilidade + anexos (J03 actions) */}
      {obra.visibilidade && (
        <ObraVisibilidadeActions
          obraId={id}
          visibilidade={obra.visibilidade}
          statusModeracao={(obra as any).statusModeracao ?? null}
          motivoModeracao={(obra as any).motivoModeracao ?? null}
        />
      )}

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm"
        data-testid="hero-obra"
      >
        <div className="aspect-[16/7] relative overflow-hidden">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url('${obra.imagemUrl}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Botão trocar foto de capa — visível ao contratante */}
          <div className="absolute top-4 right-4">
            <label
              className={cn(
                'cursor-pointer flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-xl backdrop-blur-sm transition-colors',
                uploadingCapa && 'opacity-60 pointer-events-none',
              )}
              data-testid="btn-trocar-capa"
            >
              <RiCameraLine className="w-3.5 h-3.5" />
              {uploadingCapa ? 'Enviando…' : 'Trocar capa'}
              <input
                ref={capaInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCapaUpload}
                data-testid="input-capa-upload"
              />
            </label>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <span
                  className={cn(
                    'text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block backdrop-blur-sm',
                    badgeVariant === 'primary' ? 'bg-primary text-white' :
                    badgeVariant === 'error' ? 'bg-red-500 text-white' :
                    badgeVariant === 'warning' ? 'bg-amber-500 text-white' :
                    badgeVariant === 'info' ? 'bg-blue-500 text-white' :
                    badgeVariant === 'success' ? 'bg-green-500 text-white' :
                    'bg-gray-500/20 text-gray-200'
                  )}
                  data-testid="badge-status"
                >
                  {STATUS_LABELS[obra.status] || obra.status}
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3" data-testid="text-titulo">
                  {obra.titulo}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                  <span className="flex items-center gap-1.5">
                    <RiMapPinLine className="w-4 h-4" />
                    {obra.endereco}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <RiCalendarLine className="w-4 h-4" />
                    {obra.dataInicio} - {obra.dataPrevisaoFim}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 items-end">
                <div className="text-right">
                  <p className="text-white/60 text-xs">Orçamento Total</p>
                  <p className="text-2xl font-extrabold text-white">{formatCurrency(obra.orcamento)}</p>
                </div>
                {semEmpreiteiro ? (
                  <div className="flex items-center gap-2 text-white/90">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 shrink-0">
                      <IconGroups className="text-white text-base" />
                    </div>
                    <div>
                      <p className="text-white/60 text-xs">Candidaturas</p>
                      <p className="font-bold text-sm">{obra.candidaturas} propostas recebidas</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-white/90">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0', obra.empreiteiro.cor)}>
                      {obra.empreiteiro.iniciais}
                    </div>
                    <div>
                      <p className="text-white/60 text-xs">Empreiteiro</p>
                      <p className="font-bold text-sm">{obra.empreiteiro.nome}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress section */}
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

      {/* KPI cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {semEmpreiteiro ? (
          <>
            {/* Candidaturas Recebidas */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 hover:border-primary/30 transition-all">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                  <RiTeamLine className="w-5 h-5" />
                </div>
                <span className="text-primary text-xs font-bold bg-primary/10 px-2 py-1 rounded-full">Em análise</span>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Candidaturas</p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{obra.candidaturas ?? 0}</p>
              </div>
              <p className="text-xs text-gray-500">propostas recebidas</p>
            </div>

            {/* Orçamento Disponível */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 hover:border-success/30 transition-all">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-success/10 text-success rounded-lg">
                  <RiMoneyDollarCircleLine className="w-5 h-5" />
                </div>
                <span className="text-success text-xs font-bold bg-success/10 px-2 py-1 rounded-full">Total</span>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Orçamento Disponível</p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{formatCurrency(obra.orcamento)}</p>
              </div>
              <p className="text-xs text-gray-500">valor total da obra</p>
            </div>

            {/* Início Previsto */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 hover:border-info/30 transition-all">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-info/10 text-info rounded-lg">
                  <RiCalendarLine className="w-5 h-5" />
                </div>
                <span className="text-info text-xs font-bold bg-info/10 px-2 py-1 rounded-full">Planejado</span>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Início Previsto</p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{obra.dataInicio}</p>
              </div>
              <p className="text-xs text-gray-500">data de início da obra</p>
            </div>

            {/* Prazo Final */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 hover:border-warning/30 transition-all">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-warning/10 text-warning rounded-lg">
                  <RiTimeLine className="w-5 h-5" />
                </div>
                <span className="text-warning text-xs font-bold bg-warning/10 px-2 py-1 rounded-full">Entrega</span>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Prazo Final</p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{obra.dataPrevisaoFim}</p>
              </div>
              <p className="text-xs text-gray-500">previsão de conclusão</p>
            </div>
          </>
        ) : (
          <>
            {/* Valor Pago */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 hover:border-success/30 transition-all" data-testid="kpi-valor-pago">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-success/10 text-success rounded-lg">
                  <RiMoneyDollarCircleLine className="w-5 h-5" />
                </div>
                <span className="text-success text-xs font-bold bg-success/10 px-2 py-1 rounded-full">Pago</span>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Valor Pago</p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1" data-testid="text-valor-pago">{formatCurrency(obra.valorPago)}</p>
              </div>
              <div className="h-1.5 w-full bg-success/20 rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: `${pagoPct}%` }} />
              </div>
            </div>

            {/* Valor Restante */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 hover:border-warning/30 transition-all" data-testid="kpi-valor-restante">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-warning/10 text-warning rounded-lg">
                  <RiMoneyDollarCircleLine className="w-5 h-5" />
                </div>
                <span className="text-warning text-xs font-bold bg-warning/10 px-2 py-1 rounded-full">Restante</span>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Valor Restante</p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{formatCurrency(obra.valorRestante)}</p>
              </div>
              <p className="text-xs text-gray-500">a liberar</p>
            </div>

            {/* Tarefas */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 hover:border-info/30 transition-all" data-testid="kpi-tarefas">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-info/10 text-info rounded-lg">
                  <RiCheckboxCircleLine className="w-5 h-5" />
                </div>
                <span className="text-info text-xs font-bold bg-info/10 px-2 py-1 rounded-full">{tarefasTotal} total</span>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Tarefas</p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{tarefasConcluidas}/{tarefasTotal}</p>
              </div>
              <p className="text-xs text-gray-500">{tarefasTotal - tarefasConcluidas} pendentes</p>
            </div>

            {/* Dias Restantes */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 hover:border-primary/30 transition-all" data-testid="kpi-dias-restantes">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                  <RiTimeLine className="w-5 h-5" />
                </div>
                <span className="text-primary text-xs font-bold bg-primary/10 px-2 py-1 rounded-full">Prazo</span>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Dias Restantes</p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{obra.diasRestantes}</p>
              </div>
              <p className="text-xs text-gray-500">dias para conclusão</p>
            </div>
          </>
        )}
      </motion.div>

      {/* Tabs card */}
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
              data-testid={`tab-${tab.key}`}
            >
              <tab.icon className="w-4 h-4" />
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
              {activeTab === 'visao-geral' && <TabVisaoGeral obra={obra} progressColor={progressColor} onNavigateToTimeline={() => setActiveTab('timeline')} onNavigateToHealth={() => setActiveTab('saude')} />}
              {activeTab === 'saude' && obraHealth && (
                <HealthDetailPanel
                  health={obraHealth}
                  actionsByFactor={{
                    atraso: { label: 'Ver etapas', onClick: () => setActiveTab('etapas') },
                    financeiro: { label: 'Ver financeiro', onClick: () => setActiveTab('financeiro') },
                    tarefas: { label: 'Ver ocorrências', onClick: () => setActiveTab('ocorrencias') },
                  }}
                />
              )}
              {activeTab === 'etapas' && <TabEtapas obra={obra} progressColor={progressColor} />}
              {activeTab === 'timeline' && <TabTimeline obra={obra} />}
              {activeTab === 'ocorrencias' && <TabOcorrencias obra={obra} />}
              {activeTab === 'financeiro' && <TabFinanceiro obra={obra} />}
              {activeTab === 'disputas' && (
                <TabDisputas
                  obraId={obra.id}
                  alvos={obra.financeiro.medicoes.map<DisputaAlvoOption>((m) => ({
                    tipo: 'medicao',
                    id: m.id,
                    label: `Medição #${m.numero} — ${m.periodo}`,
                  }))}
                />
              )}
              {activeTab === 'documentos' && <TabDocumentos documentos={obra.documentos} />}
              {activeTab === 'checklists' && <TabChecklists checklists={checklists ?? obra.checklists} />}
              {activeTab === 'equipe' && <TabEquipe equipe={equipe ?? obra.equipe} />}
              {activeTab === 'fotos' && <TabFotos obra={obra} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* J58 — Contrato entre as partes (auto-oculta se a obra não tem contrato). */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
        <ContratoCard obraId={obra.id} />
      </motion.div>

      {/* Contato do Empreiteiro / Candidaturas */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        {semEmpreiteiro ? (
          <CandidaturasCard obraId={obra.id} obraOrcamento={obra.orcamento} />
        ) : (
          <ContatoEmpreiteiroCard empreiteiro={obra.empreiteiro} obraId={obra.id} obraTitulo={obra.titulo} />
        )}
      </motion.div>

      {/* Localização da Obra */}
      {obra.localizacao && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.30 }}>
          <LocalizacaoCard localizacao={obra.localizacao} />
        </motion.div>
      )}

    </div>
  );
}
