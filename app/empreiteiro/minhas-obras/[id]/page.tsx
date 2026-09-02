'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useMinhaObraDetalhe } from '@features/empreiteiro/minhas-obras/hooks/use-minhas-obras';
import type { MinhaObraDetalhe } from '@features/empreiteiro/minhas-obras/types';
import {
  STATUS_LABELS,
  PROGRESS_COLORS,
  OBRA_STATUS_DB_BADGE_CLASSES,
  obraStatusDbLabel,
} from '@shared/constants/status';
import { TaskManagerSection } from '@features/empreiteiro/minhas-obras/components/TaskManagerSection';
import { ChecklistsSection } from '@features/empreiteiro/minhas-obras/components/ChecklistsSection';
import { TimelineSection } from '@features/empreiteiro/minhas-obras/components/TimelineSection';
import { DocumentosSection } from '@features/empreiteiro/minhas-obras/components/DocumentosSection';
import { OcorrenciasSection } from '@features/empreiteiro/minhas-obras/components/OcorrenciasSection';
import { FinanceiroSection } from '@features/empreiteiro/minhas-obras/components/FinanceiroSection';
import { EquipeSection } from '@features/empreiteiro/minhas-obras/components/EquipeSection';
import { ContatoContratanteCard } from '@features/empreiteiro/minhas-obras/components/ContatoContratanteCard';
import { ContratoCard } from '@features/contratos/components/ContratoCard';
import { EtapasJ06Card } from '@features/obras/medicoes/components/EtapasJ06Card';
import { DiarioJ06Card } from '@features/obras/medicoes/components/DiarioJ06Card';
import { OcorrenciasJ06Card } from '@features/obras/medicoes/components/OcorrenciasJ06Card';
import { TabDisputas, type DisputaAlvoOption } from '@features/disputas/components/TabDisputas';
import { FotosJ06Card } from '@features/obras/medicoes/components/FotosJ06Card';
import { useAuthStore } from '@features/auth/store/auth-store';
import { LocalizacaoCard } from '@features/shared/components/LocalizacaoCard';
import { RegistrarMedicaoModal } from '@features/empreiteiro/minhas-obras/components/RegistrarMedicaoModal';
import { cn } from '@shared/lib/utils';
import { formatCurrencyRounded as formatCurrency } from '@shared/lib/formatters';
import React from 'react';
import { IconArrowBack, IconChevronRight, IconLocationOn, IconEvent, IconGroups, IconAddTask, IconCheckCircle, IconSchedule, IconTaskAlt, IconErrorOutline, IconFactCheck, IconTimeline, IconPhotoLibrary, IconFolderOpen, IconCalendarMonth, IconWarning, IconConstruction, IconPayments, IconHealthAndSafety, IconHelpOutline } from '@shared/components/icons';
import { HealthCard, HealthDetailPanel, computeHealthFromObra } from '@features/shared/health';
import { ProfitCard, computeProfitFromObra } from '@features/shared/profit';
import { CompartilharModal } from '@features/empreiteiro/minhas-obras/components/CompartilharModal';
import { GuidedTour, type TourStep } from '@features/xgestao/components/GuidedTour';
import { useGuidedTour } from '@features/xgestao/hooks/use-guided-tour';

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

type ObraTab = 'tarefas' | 'checklists' | 'timeline' | 'fotos' | 'documentos' | 'cronograma' | 'ocorrencias' | 'disputas' | 'saude' | 'lucro';

const TABS: { key: ObraTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'saude', label: 'Saúde', Icon: IconHealthAndSafety },
  { key: 'tarefas', label: 'Tarefas', Icon: IconTaskAlt },
  { key: 'checklists', label: 'Checklists', Icon: IconFactCheck },
  { key: 'timeline', label: 'Timeline', Icon: IconTimeline },
  { key: 'fotos', label: 'Fotos', Icon: IconPhotoLibrary },
  { key: 'documentos', label: 'Documentos', Icon: IconFolderOpen },
  { key: 'cronograma', label: 'Cronograma', Icon: IconCalendarMonth },
  { key: 'ocorrencias', label: 'Ocorrências', Icon: IconWarning },
  { key: 'disputas', label: 'Disputas', Icon: IconWarning },
  { key: 'lucro', label: 'Lucro', Icon: IconPayments },
];

/** Roteiro do console: o ciclo de manter a obra atualizada, na ordem de uso. */
const TOUR_CONSOLE: TourStep[] = [
  {
    target: '[data-tour="progresso-geral"]',
    title: 'Progresso geral',
    description:
      'O avanço consolidado da obra. Ele sobe sozinho a cada atualização registrada — não precisa digitar.',
  },
  {
    target: '[data-tour="adicionar-atualizacao"]',
    title: 'Adicionar atualização',
    description:
      'Aqui você registra o que foi feito: o percentual avançado, a descrição e as fotos. É o que move o progresso e aparece para o cliente.',
  },
  {
    target: '[data-tour="detalhes-obra"]',
    title: 'Detalhes da obra',
    description:
      'Descrição, tipo, área e prazos. É o mesmo conteúdo que aparece no link público — use "Editar informações" para completar.',
  },
  {
    target: '[data-tour="abas-obra"]',
    title: 'Organização do dia a dia',
    description:
      'Tarefas, checklists, fotos, documentos e ocorrências. Cada aba guarda um tipo de registro da obra.',
  },
  {
    target: '[data-tour="compartilhar-link"]',
    title: 'Compartilhar com o cliente',
    description:
      'Gere um link para o cliente acompanhar sem criar conta. Valores, equipe e endereço exato nunca são compartilhados. Você pode revogar quando quiser.',
  },
];

function BotaoAjuda({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-primary/40 hover:text-primary dark:border-gray-700 dark:text-gray-300"
      data-testid="botao-ajuda"
    >
      <IconHelpOutline className="text-base" />
      Ajuda
    </button>
  );
}

function formatAreaM2(value: string): string {
  const area = Number(value);
  if (!Number.isFinite(area)) return `${value} m²`;
  return `${area.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m²`;
}

/**
 * Espelha a seção "Detalhes da obra" do link público. O que o dono preenche na
 * edição precisa reaparecer aqui — antes `descricao` e `areaM2` eram salvos e
 * só existiam na página pública, o que lia como "a edição não salvou".
 */
function DetalhesObraCard({
  obra,
  basePath,
}: {
  obra: MinhaObraDetalhe;
  basePath: string;
}) {
  // O adapter devolve "—" para data ausente; tratar como vazio evita um card
  // que anuncia um travessão como se fosse informação.
  const preenchido = (valor: string | undefined) =>
    valor && valor !== '—' ? valor : null;

  const itens = [
    { label: 'Tipo de obra', value: obra.tipo && obra.tipo !== 'Obra' ? obra.tipo : null },
    { label: 'Área', value: obra.areaM2 ? formatAreaM2(obra.areaM2) : null },
    { label: 'Início', value: preenchido(obra.dataInicio) },
    { label: 'Previsão de término', value: preenchido(obra.dataPrevisaoFim) },
  ].filter((item) => Boolean(item.value));

  const vazio = itens.length === 0 && !obra.descricao;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6"
      aria-labelledby="detalhes-obra-console"
      data-testid="detalhes-obra-card"
      data-tour="detalhes-obra"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="detalhes-obra-console" className="text-lg font-extrabold text-gray-900 dark:text-white">
            Detalhes da obra
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Estas informações também aparecem para quem abrir o link público.
          </p>
        </div>
        <Link
          href={`${basePath}/${obra.id}/editar`}
          className="text-xs font-semibold text-primary underline underline-offset-2 hover:opacity-80"
        >
          Editar informações
        </Link>
      </div>

      {vazio ? (
        <p className="mt-4 text-sm text-gray-500" data-testid="detalhes-obra-vazio">
          Nenhum detalhe preenchido ainda. Adicione descrição, tipo, área e prazos para que o
          acompanhamento fique mais completo.
        </p>
      ) : (
        <>
          {obra.descricao && (
            <p
              className="mt-3 max-w-4xl whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-300"
              data-testid="detalhes-obra-descricao"
            >
              {obra.descricao}
            </p>
          )}
          {itens.length > 0 && (
            <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {itens.map((item) => (
                <div key={item.label} className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                  <dt className="text-xs font-bold uppercase tracking-wider text-gray-500">{item.label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </>
      )}
    </motion.section>
  );
}

export function ObraConsoleView({
  basePath,
  showMarketplaceContact = true,
  allowOwnWorkEdit = false,
}: {
  basePath: string;
  showMarketplaceContact?: boolean;
  allowOwnWorkEdit?: boolean;
}) {
  const params = useParams();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const id = params.id as string;
  const { data: obra, isLoading } = useMinhaObraDetalhe(id);
  const [activeTab, setActiveTab] = useState<ObraTab>('tarefas');
  const [showAtualizacao, setShowAtualizacao] = useState(false);
  const [showShare, setShowShare] = useState(false);
  // Ref para scroll até seção de medições via ?tab=medicoes (deep-link de notificações).
  const medicoesSectionRef = useRef<HTMLDivElement>(null);
  // O tour só faz sentido na obra própria do xgestão; a de marketplace tem
  // outro fluxo e outra contraparte.
  const tour = useGuidedTour('console', Boolean(allowOwnWorkEdit && obra?.isObraPropria));

  useEffect(() => {
    if (searchParams?.get('tab') === 'medicoes' && medicoesSectionRef.current) {
      // Aguarda a renderização completa antes de rolar.
      const timer = setTimeout(() => {
        medicoesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, obra]);

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
        <IconConstruction className="text-5xl text-gray-300 block mb-4" />
        <h3 className="text-lg font-bold text-gray-500">Obra não encontrada</h3>
        <Link href={basePath} className="text-primary font-semibold mt-2 inline-block" data-testid="link-back-not-found">
          Voltar para Minhas Obras
        </Link>
      </div>
    );
  }

  const progressColor = PROGRESS_COLORS[obra.status] || 'primary';
  const progressBarColor = PROGRESS_BAR_COLORS[progressColor] || 'bg-primary';
  // Obra própria do xgestão mostra o status que o dono escolheu; obra de
  // marketplace segue com o status derivado (que sinaliza atraso e pendências).
  const mostrarStatusProprio = Boolean(obra.isObraPropria && obra.statusObra);
  const statusBg = mostrarStatusProprio
    ? OBRA_STATUS_DB_BADGE_CLASSES[obra.statusObra!]
    : STATUS_BG[obra.status] || 'bg-gray-500/20 text-gray-200';
  const statusLabel = mostrarStatusProprio
    ? obraStatusDbLabel(obra.statusObra!)
    : STATUS_LABELS[obra.status];

  return (
    <div className="p-10 flex flex-col gap-8">

      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
        <Link
          href={basePath}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
          data-testid="link-back"
        >
          <IconArrowBack className="text-lg" />
          Voltar
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex items-center gap-2 text-sm flex-wrap">
            <Link href={basePath} className="text-gray-400 hover:text-primary transition-colors">
              Minhas Obras
            </Link>
            <IconChevronRight className="text-gray-300 text-base" />
            <span className="text-primary font-semibold" data-testid="text-breadcrumb-title">{obra.titulo}</span>
          </nav>
          {allowOwnWorkEdit && obra.isObraPropria && <BotaoAjuda onClick={tour.abrir} />}
        </div>
      </motion.div>

      {/* BLOCO 1: Hero da Obra */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm"
        data-testid="hero-minha-obra"
      >
        {/*
          Sem "Alterar foto de capa" aqui: a capa pertence à obra, e a obra é do
          contratante — `PATCH /api/obras/[id]` recusa empreiteiro por design
          ("empreiteiro nunca edita"). O controle existia mas só trocava a imagem
          via `URL.createObjectURL`, um blob local que sumia no F5 (J40 P0 #3).
          O empreiteiro registra imagens da obra pela aba Fotos, que persiste.
        */}
        <div className="aspect-[16/7] relative overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950">
          {obra.imagemUrl && (
            <img
              src={obra.imagemUrl}
              alt={obra.titulo}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span
                    className={cn('text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block backdrop-blur-sm', statusBg)}
                    data-testid="badge-status"
                  >
                    {statusLabel}
                  </span>
                  {/* Na obra própria o badge acima mostra o status escolhido pelo
                      dono; o atraso vira sinal adicional em vez de substituí-lo. */}
                  {mostrarStatusProprio && obra.diasAtraso > 0 && (
                    <span
                      className="inline-block rounded-full bg-red-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm"
                      data-testid="badge-atraso"
                    >
                      {obra.diasAtraso} {obra.diasAtraso === 1 ? 'dia' : 'dias'} de atraso
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3" data-testid="text-titulo">
                  {obra.titulo}
                </h1>
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <IconLocationOn className="text-lg" />
                  <span>{obra.endereco}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex items-center gap-2 text-white/90">
                  <IconEvent className="text-lg" />
                  <div>
                    <p className="text-white/60 text-xs">Entrega prevista</p>
                    <p className="font-bold text-sm">{obra.dataPrevisaoFim}</p>
                  </div>
                </div>
                {obra.temContratante && (
                  <div className="flex items-center gap-2 text-white/90">
                    <IconGroups className="text-lg" />
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
                )}
                {allowOwnWorkEdit && obra.isObraPropria && (
                  <>
                    <Link
                      href={`${basePath}/${obra.id}/editar`}
                      className="px-5 py-2 bg-white/15 text-white rounded-xl font-bold text-sm flex items-center gap-2 border border-white/25 hover:bg-white/25 transition-all"
                      data-testid="xgestao-editar-obra"
                      data-tour="editar-obra"
                    >
                      Editar obra
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowShare(true)}
                      className="px-5 py-2 bg-white/15 text-white rounded-xl font-bold text-sm flex items-center gap-2 border border-white/25 hover:bg-white/25 transition-all cursor-pointer"
                      data-tour="compartilhar-link"
                    >
                      Compartilhar link
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowAtualizacao(true)}
                  className="px-5 py-2 bg-primary text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  data-tour="adicionar-atualizacao"
                >
                  <IconAddTask className="text-lg" />
                  Adicionar Atualização
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar section */}
        <div className="p-8 bg-gray-50 dark:bg-gray-800/50" data-testid="progress-bar-section" data-tour="progresso-geral">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Progresso Geral</span>
              <p className="mt-1 text-xs text-gray-400">Avanço consolidado da execução da obra</p>
            </div>
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

      {allowOwnWorkEdit && obra.isObraPropria && (
        <GuidedTour steps={TOUR_CONSOLE} open={tour.open} onClose={tour.fechar} />
      )}

      {/* BLOCO 2.5: Detalhes da obra — espelha a seção do link público, para
          que o dono veja aqui exatamente o que preencheu na edição. */}
      {obra.isObraPropria && (
        <DetalhesObraCard obra={obra} basePath={basePath} />
      )}

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
              <IconCheckCircle />
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
              <IconSchedule />
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
              <IconTaskAlt />
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
              <IconErrorOutline />
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
              <IconGroups />
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

      {/* BLOCO 3.5: Indicador de Saúde */}
      <HealthCard health={computeHealthFromObra(obra)} />

      {/* BLOCOs 4–10: Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
      >
        {/* Tab bar */}
        <div
          className="flex overflow-x-auto border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"
          data-tour="abas-obra"
        >
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
              <tab.Icon className="text-[18px]" />
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
              {activeTab === 'timeline' && <TimelineSection obraId={obra.id} fallbackEvents={obra.timeline} />}
              {activeTab === 'fotos' && (
                <FotosJ06Card
                  obraId={obra.id}
                  canWrite
                  currentUserId={user?.id ?? null}
                  currentUserRole={user?.role}
                />
              )}
              {activeTab === 'documentos' && <DocumentosSection obra={obra} />}
              {activeTab === 'cronograma' && (
                <EtapasJ06Card
                  obraId={obra.id}
                  canWrite
                  canEditScope={obra.isObraPropria}
                />
              )}
              {activeTab === 'ocorrencias' && <OcorrenciasSection obra={obra} />}
              {activeTab === 'disputas' && (
                <TabDisputas
                  obraId={obra.id}
                  alvos={obra.financeiro.medicoes.map<DisputaAlvoOption>((m) => ({
                    tipo: 'medicao',
                    id: m.id,
                    label: `Medição #${m.numero}`,
                  }))}
                />
              )}
              {activeTab === 'saude' && (
                <HealthDetailPanel
                  health={computeHealthFromObra(obra)}
                  actionsByFactor={{
                    atraso: { label: 'Ver cronograma', onClick: () => setActiveTab('cronograma') },
                    financeiro: { label: 'Ver lucro', onClick: () => setActiveTab('lucro') },
                    tarefas: { label: 'Ver tarefas', onClick: () => setActiveTab('tarefas') },
                  }}
                />
              )}
              {activeTab === 'lucro' && <ProfitCard metrics={computeProfitFromObra(obra)} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* BLOCO J06: Medições, Diário, Ocorrências e Fotos (fonte de verdade) */}
      <div ref={medicoesSectionRef} id="secao-medicoes">
        <ObraJ06Section obraId={obra.id} />
      </div>

      {/* BLOCO 11: Resumo Financeiro */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <FinanceiroSection financeiro={obra.financeiro} />
      </motion.div>

      {/* BLOCO 12: Equipe e Colaboradores */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <EquipeSection obra={obra} xgestaoReadOnly={allowOwnWorkEdit && obra.isObraPropria} />
      </motion.div>

      {/* J58 — Contrato entre as partes (auto-oculta se a obra não tem contrato). */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
        <ContratoCard obraId={obra.id} />
      </motion.div>

      {/* O xgestão não expõe o chat do marketplace; obras próprias não têm contratante. */}
      {showMarketplaceContact && obra.temContratante && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.40 }}>
          <ContatoContratanteCard contratante={obra.contratante} obraId={obra.id} obraTitulo={obra.titulo} />
        </motion.div>
      )}

      {/* BLOCO 15: Localização */}
      {obra.localizacao && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <LocalizacaoCard localizacao={obra.localizacao} />
        </motion.div>
      )}

      <RegistrarMedicaoModal
        open={showAtualizacao}
        onOpenChange={setShowAtualizacao}
        obraId={obra.id}
        obraTitulo={obra.titulo}
        isOwnWork={obra.isObraPropria}
      />
      {allowOwnWorkEdit && obra.isObraPropria && (
        <CompartilharModal
          open={showShare}
          onOpenChange={setShowShare}
          obra={obra}
        />
      )}

    </div>
  );
}

export default function MinhaObraDetalhePage() {
  return <ObraConsoleView basePath="/empreiteiro/minhas-obras" />;
}

function ObraJ06Section({ obraId }: { obraId: string }) {
  const user = useAuthStore((s) => s.user);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Medições e diário da obra</h2>
        <span className="text-xs text-muted-foreground">(dados ao vivo)</span>
      </div>
      <DiarioJ06Card obraId={obraId} canWrite currentUserId={user?.id ?? null} />
      <OcorrenciasJ06Card obraId={obraId} canWrite />
      <FotosJ06Card obraId={obraId} canWrite currentUserId={user?.id ?? null} currentUserRole={user?.role} />
    </motion.div>
  );
}
