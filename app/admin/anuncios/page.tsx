'use client';

import { useState, useMemo, useEffect } from 'react';
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
  RiPlayCircleLine,
} from 'react-icons/ri';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { cn } from '@shared/lib/utils';
import { StatsCard } from '@features/admin/financeiro/components/StatsCard';
import { VincularZonaModal } from '@features/admin/anuncios/components/VincularZonaModal';
import { CampanhaModal } from '@features/admin/anuncios/components/CampanhaModal';
import { AnuncianteModal } from '@features/admin/anuncios/components/AnuncianteModal';
import { MercadoEmFocoToggle } from '@features/admin/anuncios/components/MercadoEmFocoToggle';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
import { RangeNumberInput } from '@features/shared/components/filters/RangeNumberInput';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@shared/components/ui/pagination';
import { getPaginationRange } from '@shared/lib/pagination';
import {
  useAnuncioKpi,
  useZonasAnuncio,
  useCampanhas,
  useAnunciantes,
} from '@features/admin/anuncios/hooks/use-anuncios';
import type { AnuncioStatus, AnuncianteStatus, ZonaAnuncio, Campanha, Anunciante } from '@features/admin/anuncios/types';
import type { EditarAnuncianteFormData } from '@features/admin/anuncios/schemas';
import { SolicitacoesAnunciosSection } from '@features/admin/anuncios/components/SolicitacoesAnunciosSection';
import { formatCurrencyRounded as formatCurrency, formatDate, formatRange } from '@shared/lib/formatters';
import {
  PAGE_SIZE_CAMPANHAS,
  PAGE_SIZE_ANUNCIANTES,
  statusClasses,
  statusLabels,
  STATUS_CAMPANHA_OPTIONS,
  ZONA_OPTIONS,
  STATUS_ANUNCIANTE_OPTIONS,
} from '@features/admin/anuncios/constants';

const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR').format(value);

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

  const [localCampanhas, setLocalCampanhas] = useState<Campanha[]>([]);
  const [localAnunciantes, setLocalAnunciantes] = useState<Anunciante[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [novoAnuncianteOpen, setNovoAnuncianteOpen] = useState(false);
  const [selectedZona, setSelectedZona] = useState<ZonaAnuncio | null>(null);
  const [selectedCampanha, setSelectedCampanha] = useState<Campanha | null>(null);
  const [campanhaMode, setCampanhaMode] = useState<'view' | 'edit'>('view');
  const [selectedAnunciante, setSelectedAnunciante] = useState<Anunciante | null>(null);
  const [anuncianteMode, setAnuncianteMode] = useState<'view' | 'edit'>('view');
  const [searchCampanha, setSearchCampanha] = useState('');
  const [campanhaStatusSelected, setCampanhaStatusSelected] = useState<AnuncioStatus[]>([]);
  const [campanhaZonaSelected, setCampanhaZonaSelected] = useState<string[]>([]);
  const [campanhaAnuncianteSelected, setCampanhaAnuncianteSelected] = useState<string[]>([]);
  const [pageCampanha, setPageCampanha] = useState(1);

  const [searchAnunciante, setSearchAnunciante] = useState('');
  const [anuncianteStatusSelected, setAnuncianteStatusSelected] = useState<AnuncianteStatus[]>([]);
  const [anuncianteCampanhasMin, setAnuncianteCampanhasMin] = useState('');
  const [anuncianteCampanhasMax, setAnuncianteCampanhasMax] = useState('');
  const [anuncianteReceitaMin, setAnuncianteReceitaMin] = useState('');
  const [anuncianteReceitaMax, setAnuncianteReceitaMax] = useState('');
  const [pageAnunciante, setPageAnunciante] = useState(1);

  useEffect(() => { if (campanhas) setLocalCampanhas(campanhas); }, [campanhas]);
  useEffect(() => { if (anunciantes) setLocalAnunciantes(anunciantes); }, [anunciantes]);

  function handlePausar(c: Campanha) {
    setLocalCampanhas(prev =>
      prev.map(x => x.id === c.id
        ? { ...x, status: x.status === 'pausada' ? 'ativa' : 'pausada' }
        : x
      )
    );
  }

  function handleDelete(id: string) {
    setLocalCampanhas(prev => prev.filter(x => x.id !== id));
    setConfirmDeleteId(null);
  }

  function handleToggleAnuncianteStatus(a: Anunciante) {
    setLocalAnunciantes(prev =>
      prev.map(x => x.id === a.id
        ? { ...x, status: x.status === 'ativo' ? 'inativo' : 'ativo' }
        : x
      )
    );
  }

  function handleCreateAnunciante(data: EditarAnuncianteFormData) {
    const newAnunciante: Anunciante = {
      id: `anunc-${Date.now()}`,
      nome: data.nome,
      sigla: data.sigla,
      corBg: 'bg-blue-50',
      corTexto: 'text-blue-600',
      contato: data.contato,
      email: data.email,
      telefone: data.telefone,
      campanhasAtivas: 0,
      receitaTotal: 0,
      status: data.status,
    };
    setLocalAnunciantes(prev => [...prev, newAnunciante]);
  }

  const isLoading = loadingKpi || loadingZonas || loadingCampanhas || loadingAnunciantes;

  const anuncianteOptions = useMemo(() => {
    const set = new Set<string>();
    localCampanhas.forEach((c) => set.add(c.anunciante));
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((a) => ({ value: a, label: a }));
  }, [localCampanhas]);

  const filteredCampanhas = useMemo(() => {
    return localCampanhas.filter((c) => {
      const matchSearch =
        !searchCampanha ||
        c.titulo.toLowerCase().includes(searchCampanha.toLowerCase()) ||
        c.subtitulo.toLowerCase().includes(searchCampanha.toLowerCase()) ||
        c.anunciante.toLowerCase().includes(searchCampanha.toLowerCase());
      const matchStatus =
        campanhaStatusSelected.length === 0 || campanhaStatusSelected.includes(c.status);
      const matchZona =
        campanhaZonaSelected.length === 0 || campanhaZonaSelected.includes(c.zonaId);
      const matchAnunciante =
        campanhaAnuncianteSelected.length === 0 ||
        campanhaAnuncianteSelected.includes(c.anunciante);
      return matchSearch && matchStatus && matchZona && matchAnunciante;
    });
  }, [localCampanhas, searchCampanha, campanhaStatusSelected, campanhaZonaSelected, campanhaAnuncianteSelected]);

  const totalPagesCampanha = Math.max(1, Math.ceil(filteredCampanhas.length / PAGE_SIZE_CAMPANHAS));
  const paginatedCampanhas = filteredCampanhas.slice(
    (pageCampanha - 1) * PAGE_SIZE_CAMPANHAS,
    pageCampanha * PAGE_SIZE_CAMPANHAS
  );

  const campanhasActiveCount =
    (campanhaStatusSelected.length > 0 ? 1 : 0) +
    (campanhaZonaSelected.length > 0 ? 1 : 0) +
    (campanhaAnuncianteSelected.length > 0 ? 1 : 0);

  const clearCampanhasFilters = () => {
    setCampanhaStatusSelected([]);
    setCampanhaZonaSelected([]);
    setCampanhaAnuncianteSelected([]);
    setPageCampanha(1);
  };

  const onCampanhaFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPageCampanha(1);
  };

  // ─── Anunciantes filtros + paginação ─────────────────────────────────
  const campanhasMinNum =
    anuncianteCampanhasMin === '' ? undefined : Number(anuncianteCampanhasMin);
  const campanhasMaxNum =
    anuncianteCampanhasMax === '' ? undefined : Number(anuncianteCampanhasMax);
  const receitaMinNum = anuncianteReceitaMin === '' ? undefined : Number(anuncianteReceitaMin);
  const receitaMaxNum = anuncianteReceitaMax === '' ? undefined : Number(anuncianteReceitaMax);

  const filteredAnunciantes = useMemo(() => {
    return localAnunciantes.filter((a) => {
      if (searchAnunciante.trim()) {
        const q = searchAnunciante.toLowerCase();
        const match =
          a.nome.toLowerCase().includes(q) ||
          a.sigla.toLowerCase().includes(q) ||
          a.contato.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (anuncianteStatusSelected.length > 0 && !anuncianteStatusSelected.includes(a.status)) {
        return false;
      }
      if (campanhasMinNum !== undefined && a.campanhasAtivas < campanhasMinNum) return false;
      if (campanhasMaxNum !== undefined && a.campanhasAtivas > campanhasMaxNum) return false;
      if (receitaMinNum !== undefined && a.receitaTotal < receitaMinNum) return false;
      if (receitaMaxNum !== undefined && a.receitaTotal > receitaMaxNum) return false;
      return true;
    });
  }, [
    localAnunciantes,
    searchAnunciante,
    anuncianteStatusSelected,
    campanhasMinNum,
    campanhasMaxNum,
    receitaMinNum,
    receitaMaxNum,
  ]);

  const totalPagesAnunciante = Math.max(1, Math.ceil(filteredAnunciantes.length / PAGE_SIZE_ANUNCIANTES));
  const paginatedAnunciantes = filteredAnunciantes.slice(
    (pageAnunciante - 1) * PAGE_SIZE_ANUNCIANTES,
    pageAnunciante * PAGE_SIZE_ANUNCIANTES
  );

  const anunciantesActiveCount =
    (anuncianteStatusSelected.length > 0 ? 1 : 0) +
    (campanhasMinNum !== undefined || campanhasMaxNum !== undefined ? 1 : 0) +
    (receitaMinNum !== undefined || receitaMaxNum !== undefined ? 1 : 0);

  const clearAnunciantesFilters = () => {
    setAnuncianteStatusSelected([]);
    setAnuncianteCampanhasMin('');
    setAnuncianteCampanhasMax('');
    setAnuncianteReceitaMin('');
    setAnuncianteReceitaMax('');
    setPageAnunciante(1);
  };

  const onAnuncianteFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPageAnunciante(1);
  };

  const kpiCards = useMemo(() => {
    if (!kpi) return [];
    return [
      {
        label: 'Receita com anúncios',
        value: formatCurrency(kpi.receitaAnuncios),
        icon: RiMoneyDollarCircleLine,
        iconBgColor: 'bg-[#22846D]/10 text-[#22846D]',
        // Sem badge de variação: `receitaAnuncios` é o orçamento das campanhas
        // ATIVAS agora (estoque, não fluxo de período), então "vs. anterior" não
        // é bem definido. Antes o campo era `0` fixo e exibia "+0,0%" (J40 P1 #10).
        badge: { label: 'Campanhas ativas', variant: 'info' as const },
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
              luminous
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

      {/* J24 — master toggle da vitrine pública "Mercado em Foco" */}
      <MercadoEmFocoToggle />

      {/* BLOCO 4+5 — Tabela de campanhas */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Lista de campanhas</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gerencie todas as campanhas publicitárias da plataforma
        </p>
      </div>

      {/* Filtros campanhas */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <AdvancedFiltersPopover
            activeCount={campanhasActiveCount}
            onClearAll={clearCampanhasFilters}
          >
            <MultiSelectDropdown
              label="Status"
              options={STATUS_CAMPANHA_OPTIONS}
              values={campanhaStatusSelected}
              onChange={onCampanhaFilterChange(setCampanhaStatusSelected)}
              placeholder="Todos os status"
              testIdPrefix="campanhas-filter-status"
            />
            <MultiSelectDropdown
              label="Zona"
              options={ZONA_OPTIONS}
              values={campanhaZonaSelected}
              onChange={onCampanhaFilterChange(setCampanhaZonaSelected)}
              placeholder="Todas as zonas"
              testIdPrefix="campanhas-filter-zona"
            />
            <MultiSelectDropdown
              label="Anunciante"
              options={anuncianteOptions}
              values={campanhaAnuncianteSelected}
              onChange={onCampanhaFilterChange(setCampanhaAnuncianteSelected)}
              placeholder="Todos os anunciantes"
              testIdPrefix="campanhas-filter-anunciante"
            />
          </AdvancedFiltersPopover>

          <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por campanha ou anunciante..."
              value={searchCampanha}
              onChange={(e) => { setSearchCampanha(e.target.value); setPageCampanha(1); }}
              className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              data-testid="input-search-campanha"
            />
          </div>
        </div>

        {campanhasActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {campanhaStatusSelected.map((s) => (
              <ActiveFilterChip
                key={s}
                label={`Status: ${statusLabels[s]}`}
                onRemove={() =>
                  setCampanhaStatusSelected(campanhaStatusSelected.filter((x) => x !== s))
                }
                testId={`campanhas-active-chip-status-${s}`}
              />
            ))}
            {campanhaZonaSelected.map((z) => (
              <ActiveFilterChip
                key={z}
                label={`Zona: ${ZONA_OPTIONS.find((o) => o.value === z)?.label ?? z}`}
                onRemove={() =>
                  setCampanhaZonaSelected(campanhaZonaSelected.filter((x) => x !== z))
                }
                testId={`campanhas-active-chip-zona-${z}`}
              />
            ))}
            {campanhaAnuncianteSelected.map((a) => (
              <ActiveFilterChip
                key={a}
                label={`Anunciante: ${a}`}
                onRemove={() =>
                  setCampanhaAnuncianteSelected(campanhaAnuncianteSelected.filter((x) => x !== a))
                }
                testId={`campanhas-active-chip-anunciante-${a}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tabela de campanhas */}
      <Card className="overflow-hidden luminous-section border-transparent shadow-none">
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
                  onPausar={handlePausar}
                  onDelete={(camp) => setConfirmDeleteId(camp.id)}
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
          <div className="py-4 border-t border-gray-100 dark:border-gray-800">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPageCampanha((p) => Math.max(1, p - 1));
                    }}
                    aria-disabled={pageCampanha === 1}
                    className={pageCampanha === 1 ? 'pointer-events-none opacity-50' : ''}
                    data-testid="campanhas-pagination-prev"
                  />
                </PaginationItem>
                {getPaginationRange(pageCampanha, totalPagesCampanha).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <PaginationItem key={`campanhas-ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        isActive={pageCampanha === item}
                        onClick={(e) => {
                          e.preventDefault();
                          setPageCampanha(item);
                        }}
                        data-testid={`campanhas-pagination-page-${item}`}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPageCampanha((p) => Math.min(totalPagesCampanha, p + 1));
                    }}
                    aria-disabled={pageCampanha === totalPagesCampanha}
                    className={pageCampanha === totalPagesCampanha ? 'pointer-events-none opacity-50' : ''}
                    data-testid="campanhas-pagination-next"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
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
        <button
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-primary text-sm font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          onClick={() => setNovoAnuncianteOpen(true)}
        >
          <RiAddLine className="w-4 h-4" />
          Cadastrar novo anunciante
        </button>
      </div>

      {/* Filtros anunciantes */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <AdvancedFiltersPopover
            activeCount={anunciantesActiveCount}
            onClearAll={clearAnunciantesFilters}
          >
            <MultiSelectDropdown
              label="Status"
              options={STATUS_ANUNCIANTE_OPTIONS}
              values={anuncianteStatusSelected}
              onChange={onAnuncianteFilterChange(setAnuncianteStatusSelected)}
              placeholder="Todos os status"
              testIdPrefix="anunciantes-filter-status"
            />
            <RangeNumberInput
              label="Campanhas ativas"
              min={anuncianteCampanhasMin}
              max={anuncianteCampanhasMax}
              onMinChange={(v) => { setAnuncianteCampanhasMin(v); setPageAnunciante(1); }}
              onMaxChange={(v) => { setAnuncianteCampanhasMax(v); setPageAnunciante(1); }}
              placeholderMin="0"
              placeholderMax="10"
              testIdPrefix="anunciantes-filter-campanhas"
            />
            <RangeNumberInput
              label="Receita total"
              min={anuncianteReceitaMin}
              max={anuncianteReceitaMax}
              onMinChange={(v) => { setAnuncianteReceitaMin(v); setPageAnunciante(1); }}
              onMaxChange={(v) => { setAnuncianteReceitaMax(v); setPageAnunciante(1); }}
              prefix="R$ "
              placeholderMin="500"
              placeholderMax="50.000"
              testIdPrefix="anunciantes-filter-receita"
            />
          </AdvancedFiltersPopover>

          <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, contato ou e-mail..."
              value={searchAnunciante}
              onChange={(e) => { setSearchAnunciante(e.target.value); setPageAnunciante(1); }}
              className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              data-testid="input-search-anunciante"
            />
          </div>
        </div>

        {anunciantesActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {anuncianteStatusSelected.map((s) => (
              <ActiveFilterChip
                key={s}
                label={`Status: ${s === 'ativo' ? 'Ativo' : 'Inativo'}`}
                onRemove={() =>
                  setAnuncianteStatusSelected(anuncianteStatusSelected.filter((x) => x !== s))
                }
                testId={`anunciantes-active-chip-status-${s}`}
              />
            ))}
            {(campanhasMinNum !== undefined || campanhasMaxNum !== undefined) && (
              <ActiveFilterChip
                label={`Campanhas: ${formatRange(anuncianteCampanhasMin, anuncianteCampanhasMax)}`}
                onRemove={() => {
                  setAnuncianteCampanhasMin('');
                  setAnuncianteCampanhasMax('');
                }}
                testId="anunciantes-active-chip-campanhas"
              />
            )}
            {(receitaMinNum !== undefined || receitaMaxNum !== undefined) && (
              <ActiveFilterChip
                label={`Receita: ${formatRange(anuncianteReceitaMin, anuncianteReceitaMax, { prefix: 'R$ ' })}`}
                onRemove={() => {
                  setAnuncianteReceitaMin('');
                  setAnuncianteReceitaMax('');
                }}
                testId="anunciantes-active-chip-receita"
              />
            )}
          </div>
        )}
      </div>

      <Card className="overflow-hidden luminous-section border-transparent shadow-none">
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
              {paginatedAnunciantes.map((a) => (
                <AnuncianteRow
                  key={a.id}
                  anunciante={a}
                  onView={(anunc) => { setSelectedAnunciante(anunc); setAnuncianteMode('view'); }}
                  onEdit={(anunc) => { setSelectedAnunciante(anunc); setAnuncianteMode('edit'); }}
                  onToggleStatus={handleToggleAnuncianteStatus}
                />
              ))}
              {paginatedAnunciantes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                    Nenhum anunciante encontrado com os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPagesAnunciante > 1 && (
          <div className="py-4 border-t border-gray-100 dark:border-gray-800">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPageAnunciante((p) => Math.max(1, p - 1));
                    }}
                    aria-disabled={pageAnunciante === 1}
                    className={pageAnunciante === 1 ? 'pointer-events-none opacity-50' : ''}
                    data-testid="anunciantes-prev-page"
                  />
                </PaginationItem>
                {getPaginationRange(pageAnunciante, totalPagesAnunciante).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <PaginationItem key={`anunciantes-ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        isActive={pageAnunciante === item}
                        onClick={(e) => {
                          e.preventDefault();
                          setPageAnunciante(item);
                        }}
                        data-testid={`anunciantes-page-${item}`}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPageAnunciante((p) => Math.min(totalPagesAnunciante, p + 1));
                    }}
                    aria-disabled={pageAnunciante === totalPagesAnunciante}
                    className={pageAnunciante === totalPagesAnunciante ? 'pointer-events-none opacity-50' : ''}
                    data-testid="anunciantes-next-page"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
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
        isNew={novoAnuncianteOpen}
        onSave={handleCreateAnunciante}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAnunciante(null);
            setNovoAnuncianteOpen(false);
          }
        }}
      />

      {/* Confirmação de exclusão de campanha */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir campanha</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* J23 — fila de moderação de pedidos self-service */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pb-12">
        <SolicitacoesAnunciosSection />
      </div>
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
  onPausar,
  onDelete,
}: {
  campanha: Campanha;
  onView: (c: Campanha) => void;
  onEdit: (c: Campanha) => void;
  onPausar: (c: Campanha) => void;
  onDelete: (c: Campanha) => void;
}) {
  const isExpirada = c.status === 'expirada';
  const isPausada = c.status === 'pausada';
  return (
    <tr className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
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
          {/*
            Campanha expirada não tem ação secundária: o botão "Duplicar" que
            existia aqui não tinha onClick nem endpoint por trás (J40 P3 #27).
            Reintroduzir junto com POST /api/admin/anuncios/campanhas/[id]/duplicar.
          */}
          {isExpirada ? null : isPausada ? (
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-[#22846D] transition-colors"
              title="Retomar"
              onClick={() => onPausar(c)}
            >
              <RiPlayCircleLine className="w-5 h-5" />
            </button>
          ) : (
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-amber-600 transition-colors"
              title="Pausar"
              onClick={() => onPausar(c)}
            >
              <RiPauseCircleLine className="w-5 h-5" />
            </button>
          )}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600 transition-colors"
            title="Excluir"
            onClick={() => onDelete(c)}
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
  onToggleStatus,
}: {
  anunciante: Anunciante;
  onView: (a: Anunciante) => void;
  onEdit: (a: Anunciante) => void;
  onToggleStatus: (a: Anunciante) => void;
}) {
  return (
    <tr className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
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
          {a.status === 'inativo' ? (
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-[#22846D] transition-colors"
              title="Reativar"
              onClick={() => onToggleStatus(a)}
            >
              <RiPlayCircleLine className="w-5 h-5" />
            </button>
          ) : (
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600 transition-colors"
              title="Desativar"
              onClick={() => onToggleStatus(a)}
            >
              <RiProhibitedLine className="w-5 h-5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
