'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  RiMoneyDollarCircleLine,
  RiMegaphoneLine,
  RiEyeLine,
  RiCursorLine,
  RiGroupLine,
  RiTimeLine,
  RiLayoutLine,
  RiDashboardLine,
  RiQuestionLine,
  RiEditLine,
  RiArrowLeftRightLine,
  RiAddLine,
  RiSearchLine,
  RiDeleteBinLine,
  RiFileCopyLine,
  RiPauseCircleLine,
  RiExternalLinkLine,
  RiProhibitedLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from 'react-icons/ri';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';
import { cn } from '@shared/lib/utils';
import { StatsCard } from '@features/admin/financeiro/components/StatsCard';
import { VincularZonaModal } from '@features/admin/anuncios/components/VincularZonaModal';
import { CampanhaModal } from '@features/admin/anuncios/components/CampanhaModal';
import { AnuncianteModal } from '@features/admin/anuncios/components/AnuncianteModal';
import {
  useAnuncioKpi,
  useZonasAnuncio,
  useCampanhas,
  useAnunciantes,
} from '@features/admin/anuncios/hooks/use-anuncios';
import type { AnuncioStatus, ZonaAnuncio, Campanha, Anunciante } from '@features/admin/anuncios/types';

const PAGE_SIZE = 20;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR').format(value);

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const statusClasses: Record<AnuncioStatus, string> = {
  ativa: 'bg-[#22846D]/10 text-[#22846D]',
  pausada: 'bg-amber-50 text-amber-600 dark:bg-amber-900/10 dark:text-amber-500',
  expirada: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  agendada: 'bg-blue-50 text-blue-600 dark:bg-blue-900/10 dark:text-blue-400',
};

const statusLabels: Record<AnuncioStatus, string> = {
  ativa: 'Ativa',
  pausada: 'Pausada',
  expirada: 'Expirada',
  agendada: 'Agendada',
};

const zonaIcone = {
  web: RiLayoutLine,
  dashboard: RiDashboardLine,
  help: RiQuestionLine,
};

function AnunciosSkeleton() {
  return (
    <div className="p-6 md:p-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-52" />
        </div>
      </div>
      {/* KPI grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <Skeleton className="h-11 w-11 rounded-lg" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-36 mb-2" />
              <Skeleton className="h-9 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Zonas */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      {/* Tabela campanhas */}
      <Skeleton className="h-80 rounded-xl" />
      {/* Tabela anunciantes */}
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export default function AdminAnunciosPage() {
  const { data: kpi, isLoading: loadingKpi } = useAnuncioKpi();
  const { data: zonas, isLoading: loadingZonas } = useZonasAnuncio();
  const { data: campanhas, isLoading: loadingCampanhas } = useCampanhas();
  const { data: anunciantes, isLoading: loadingAnunciantes } = useAnunciantes();

  const [selectedZona, setSelectedZona] = useState<ZonaAnuncio | null>(null);
  const [selectedCampanha, setSelectedCampanha] = useState<Campanha | null>(null);
  const [campanhaMode, setCampanhaMode] = useState<'view' | 'edit'>('view');
  const [selectedAnunciante, setSelectedAnunciante] = useState<Anunciante | null>(null);
  const [anuncianteMode, setAnuncianteMode] = useState<'view' | 'edit'>('view');
  const [searchCampanha, setSearchCampanha] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterZona, setFilterZona] = useState('');
  const [pageCampanha, setPageCampanha] = useState(1);

  const isLoading = loadingKpi || loadingZonas || loadingCampanhas || loadingAnunciantes;

  const filteredCampanhas = useMemo(() => {
    if (!campanhas) return [];
    return campanhas.filter((c) => {
      const matchSearch =
        !searchCampanha ||
        c.titulo.toLowerCase().includes(searchCampanha.toLowerCase()) ||
        c.anunciante.toLowerCase().includes(searchCampanha.toLowerCase());
      const matchStatus = !filterStatus || c.status === filterStatus;
      const matchZona = !filterZona || c.zonaId.includes(filterZona);
      return matchSearch && matchStatus && matchZona;
    });
  }, [campanhas, searchCampanha, filterStatus, filterZona]);

  const totalPagesCampanha = Math.max(1, Math.ceil(filteredCampanhas.length / PAGE_SIZE));
  const paginatedCampanhas = filteredCampanhas.slice(
    (pageCampanha - 1) * PAGE_SIZE,
    pageCampanha * PAGE_SIZE
  );

  const kpiCards = useMemo(() => {
    if (!kpi) return [];
    return [
      {
        label: 'Receita com anúncios',
        value: formatCurrency(kpi.receitaAnuncios),
        icon: RiMoneyDollarCircleLine,
        iconBgColor: 'bg-[#22846D]/10 text-[#22846D]',
        badge: {
          label: `+${kpi.receitaCrescimentoPercent.toFixed(1).replace('.', ',')}% vs. anterior`,
          variant: 'success' as const,
        },
      },
      {
        label: 'Campanhas ativas',
        value: `${kpi.campanhasAtivas} campanhas`,
        icon: RiMegaphoneLine,
        iconBgColor: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        badge: { label: 'Em exibição agora', variant: 'info' as const },
      },
      {
        label: 'Impressões no período',
        value: formatNumber(kpi.impressoes),
        icon: RiEyeLine,
        iconBgColor: 'bg-primary/10 text-primary',
        badge: { label: 'Últimos 30 dias', variant: 'primary' as const },
      },
      {
        label: 'Cliques no período',
        value: formatNumber(kpi.cliques),
        icon: RiCursorLine,
        iconBgColor: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        badge: {
          label: `CTR médio: ${kpi.ctrMedio.toFixed(2).replace('.', ',')}%`,
          variant: 'info' as const,
        },
      },
      {
        label: 'Anunciantes ativos',
        value: `${kpi.anunciantesAtivos} empresas`,
        icon: RiGroupLine,
        iconBgColor: 'bg-[#22846D]/10 text-[#22846D]',
        badge: { label: 'Parceiros comerciais', variant: 'success' as const },
      },
      {
        label: 'Campanhas expirando',
        value: `${kpi.campanhasExpirando} campanhas`,
        icon: RiTimeLine,
        iconBgColor: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-500',
        badge: { label: 'Próximos 7 dias', variant: 'warning' as const },
      },
    ];
  }, [kpi]);

  if (isLoading) return <AnunciosSkeleton />;

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8" data-testid="admin-anuncios-page">

      {/* BLOCO 1 — Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            Anúncios
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestão dos espaços publicitários e campanhas ativas na plataforma.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 font-medium">
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {kpi?.campanhasAtivas ?? 0}
            </span>{' '}
            campanhas
          </span>
        </div>
      </div>

      {/* BLOCO 2 — 6 KPI Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.08 } },
        }}
        initial="hidden"
        animate="show"
      >
        {kpiCards.map((card) => (
          <motion.div
            key={card.label}
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          >
            <StatsCard
              label={card.label}
              value={card.value}
              icon={card.icon}
              iconBgColor={card.iconBgColor}
              badge={card.badge}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* BLOCO 3 — Mapa de zonas */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Zonas de exibição de anúncios
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Status atual de cada posição disponível na plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(zonas ?? []).map((zona) => (
          <ZonaCard
            key={zona.id}
            zona={zona}
            onVincular={setSelectedZona}
            onEditar={setSelectedZona}
          />
        ))}
      </div>

      {/* BLOCO 4+5 — Tabela de campanhas */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Lista de campanhas</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gerencie todas as campanhas publicitárias da plataforma
        </p>
      </div>

      {/* Filtros campanhas */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl pl-10 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400 dark:text-gray-200"
            placeholder="Buscar por campanha ou anunciante..."
            type="text"
            value={searchCampanha}
            onChange={(e) => { setSearchCampanha(e.target.value); setPageCampanha(1); }}
          />
        </div>
        <select
          className="bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary/20 min-w-[180px]"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPageCampanha(1); }}
        >
          <option value="">Todos os status</option>
          <option value="ativa">Ativas</option>
          <option value="pausada">Pausadas</option>
          <option value="expirada">Expiradas</option>
          <option value="agendada">Agendadas</option>
        </select>
        <select
          className="bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary/20 min-w-[200px]"
          value={filterZona}
          onChange={(e) => { setFilterZona(e.target.value); setPageCampanha(1); }}
        >
          <option value="">Todas as zonas</option>
          <option value="sidebar-sup-contratante">Sidebar Sup. Contratante</option>
          <option value="sidebar-inf-contratante">Sidebar Inf. Contratante</option>
          <option value="sidebar-sup-empreiteiro">Sidebar Sup. Empreiteiro</option>
          <option value="sidebar-inf-empreiteiro">Sidebar Inf. Empreiteiro</option>
          <option value="banner-dashboard">Dashboard</option>
          <option value="banner-qa">Q&A</option>
        </select>
      </div>

      {/* Tabela de campanhas */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                {['Campanha', 'Anunciante', 'Zona', 'Período', 'Impressões', 'Cliques', 'Receita', 'Status', ''].map(
                  (h) => (
                    <th
                      key={h}
                      className={cn(
                        'py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider',
                        h === '' ? 'text-right' : 'text-left'
                      )}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedCampanhas.map((c) => (
                <CampanhaRow
                  key={c.id}
                  campanha={c}
                  onView={(camp) => { setSelectedCampanha(camp); setCampanhaMode('view'); }}
                  onEdit={(camp) => { setSelectedCampanha(camp); setCampanhaMode('edit'); }}
                />
              ))}
              {paginatedCampanhas.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-sm text-gray-400">
                    Nenhuma campanha encontrada com os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPagesCampanha > 1 && (
          <div className="flex justify-center items-center gap-2 py-6 border-t border-gray-100 dark:border-gray-800">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 disabled:opacity-40"
              disabled={pageCampanha === 1}
              onClick={() => setPageCampanha((p) => p - 1)}
            >
              <RiArrowLeftSLine className="w-5 h-5" />
            </button>
            {Array.from({ length: totalPagesCampanha }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPageCampanha(p)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  p === pageCampanha
                    ? 'bg-primary text-white font-bold'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {p}
              </button>
            ))}
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 disabled:opacity-40"
              disabled={pageCampanha === totalPagesCampanha}
              onClick={() => setPageCampanha((p) => p + 1)}
            >
              <RiArrowRightSLine className="w-5 h-5" />
            </button>
          </div>
        )}
      </Card>

      {/* BLOCO 6 — Anunciantes cadastrados */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Anunciantes cadastrados
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Empresas parceiras com campanhas na plataforma
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-primary text-sm font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <RiAddLine className="w-4 h-4" />
          Cadastrar novo anunciante
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                {['Anunciante', 'Contato', 'Campanhas ativas', 'Receita total', 'Status', ''].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      'py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider',
                      h === '' ? 'text-right' : 'text-left'
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(anunciantes ?? []).map((a) => (
                <AnuncianteRow
                  key={a.id}
                  anunciante={a}
                  onView={(anunc) => { setSelectedAnunciante(anunc); setAnuncianteMode('view'); }}
                  onEdit={(anunc) => { setSelectedAnunciante(anunc); setAnuncianteMode('edit'); }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {/* Modal de vincular / editar zona */}
      <VincularZonaModal
        zona={selectedZona}
        anunciantes={anunciantes ?? []}
        onOpenChange={(open) => { if (!open) setSelectedZona(null); }}
      />
      {/* Modal de visualização / edição de campanha */}
      <CampanhaModal
        campanha={selectedCampanha}
        initialMode={campanhaMode}
        anunciantes={anunciantes ?? []}
        onOpenChange={(open) => { if (!open) setSelectedCampanha(null); }}
      />
      {/* Modal de visualização / edição de anunciante */}
      <AnuncianteModal
        anunciante={selectedAnunciante}
        initialMode={anuncianteMode}
        onOpenChange={(open) => { if (!open) setSelectedAnunciante(null); }}
      />
    </div>
  );
}

/* ── Sub-components ── */

function ZonaCard({
  zona,
  onVincular,
  onEditar,
}: {
  zona: ZonaAnuncio;
  onVincular: (zona: ZonaAnuncio) => void;
  onEditar: (zona: ZonaAnuncio) => void;
}) {
  const Icone = zonaIcone[zona.icone];
  const isAtivo = zona.status === 'ativo';

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-[0px_4px_15px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-lg',
              isAtivo
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            )}
          >
            <Icone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{zona.nome}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{zona.descricao}</p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex px-3 py-1 rounded-full text-xs font-bold',
            isAtivo
              ? 'bg-[#22846D]/10 text-[#22846D]'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
          )}
        >
          {isAtivo ? 'Ativo' : 'Vazio'}
        </span>
      </div>
      <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Anúncio atual</p>
          {zona.anuncioAtual ? (
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{zona.anuncioAtual}</p>
          ) : (
            <p className="text-sm font-medium text-gray-400 italic">Sem anúncio</p>
          )}
        </div>
        {isAtivo ? (
          <div className="flex items-center gap-1">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-primary transition-colors"
              title="Editar"
              onClick={() => onEditar(zona)}
            >
              <RiEditLine className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-primary transition-colors"
              title="Trocar anúncio"
              onClick={() => onEditar(zona)}
            >
              <RiArrowLeftRightLine className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            onClick={() => onVincular(zona)}
          >
            <RiAddLine className="w-4 h-4" />
            Vincular
          </button>
        )}
      </div>
    </div>
  );
}

function CampanhaRow({
  campanha: c,
  onView,
  onEdit,
}: {
  campanha: Campanha;
  onView: (c: Campanha) => void;
  onEdit: (c: Campanha) => void;
}) {
  const isExpirada = c.status === 'expirada';
  return (
    <tr className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
      <td className="py-4 px-6">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{c.titulo}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.subtitulo}</p>
      </td>
      <td className="py-4 px-6">
        <p className="text-sm text-gray-700 dark:text-gray-300">{c.anunciante}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.anuncianteEmail}</p>
      </td>
      <td className="py-4 px-6">
        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/10 dark:text-blue-400">
          {c.zona}
        </span>
      </td>
      <td className="py-4 px-6">
        <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(c.dataInicio)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(c.dataFim)}</p>
      </td>
      <td className="py-4 px-6">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {formatNumber(c.impressoes)}
        </p>
      </td>
      <td className="py-4 px-6">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {formatNumber(c.cliques)}
        </p>
        {c.impressoes > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            CTR {c.ctr.toFixed(2).replace('.', ',')}%
          </p>
        )}
      </td>
      <td className="py-4 px-6">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {formatCurrency(c.receita)}
        </p>
      </td>
      <td className="py-4 px-6">
        <span className={cn('inline-flex px-3 py-1 rounded-full text-xs font-bold', statusClasses[c.status])}>
          {statusLabels[c.status]}
        </span>
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center justify-end gap-1">
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-primary transition-colors"
            title="Ver detalhes"
            onClick={() => onView(c)}
          >
            <RiEyeLine className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-primary transition-colors"
            title="Editar"
            onClick={() => onEdit(c)}
          >
            <RiEditLine className="w-5 h-5" />
          </button>
          {isExpirada ? (
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-primary transition-colors"
              title="Duplicar"
            >
              <RiFileCopyLine className="w-5 h-5" />
            </button>
          ) : (
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-amber-600 transition-colors"
              title="Pausar"
            >
              <RiPauseCircleLine className="w-5 h-5" />
            </button>
          )}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600 transition-colors"
            title="Excluir"
          >
            <RiDeleteBinLine className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function AnuncianteRow({
  anunciante: a,
  onView,
  onEdit,
}: {
  anunciante: Anunciante;
  onView: (a: Anunciante) => void;
  onEdit: (a: Anunciante) => void;
}) {
  return (
    <tr className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
              a.corBg
            )}
          >
            <span className={cn('text-xs font-bold', a.corTexto)}>{a.sigla}</span>
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{a.nome}</p>
        </div>
      </td>
      <td className="py-4 px-6">
        <p className="text-sm text-gray-700 dark:text-gray-300">{a.contato}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{a.email}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{a.telefone}</p>
      </td>
      <td className="py-4 px-6">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {a.campanhasAtivas} {a.campanhasAtivas === 1 ? 'campanha' : 'campanhas'}
        </p>
      </td>
      <td className="py-4 px-6">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {formatCurrency(a.receitaTotal)}
        </p>
      </td>
      <td className="py-4 px-6">
        <span
          className={cn(
            'inline-flex px-3 py-1 rounded-full text-xs font-bold',
            a.status === 'ativo'
              ? 'bg-[#22846D]/10 text-[#22846D]'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
          )}
        >
          {a.status === 'ativo' ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center justify-end gap-1">
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-primary transition-colors"
            title="Ver detalhes"
            onClick={() => onView(a)}
          >
            <RiExternalLinkLine className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-primary transition-colors"
            title="Editar"
            onClick={() => onEdit(a)}
          >
            <RiEditLine className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600 transition-colors"
            title="Desativar"
          >
            <RiProhibitedLine className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
