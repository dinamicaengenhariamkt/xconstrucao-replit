'use client';

import { useState, useMemo, useEffect } from 'react';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Skeleton } from '@shared/components/ui/skeleton';
import { StatsCard } from '@features/shared/components/StatsCard';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
import { RangeDateInput } from '@features/shared/components/filters/RangeDateInput';
import { useAuditoriaKpi, useAuditoriaEventos } from '@features/admin/auditoria/hooks/use-auditoria';
import type {
  AuditoriaEventTipo,
  AuditoriaModulo,
  AuditoriaCategoria,
} from '@features/admin/auditoria/types';
import {
  RiHistoryLine,
  RiSearchLine,
  RiFlashlightLine,
  RiAlertLine,
  RiErrorWarningLine,
  RiGroupLine,
  RiArrowDownLine,
  RiMoneyDollarCircleLine,
} from 'react-icons/ri';
import type { IconType } from 'react-icons';
import {
  INITIAL_DAYS,
  DAYS_INCREMENT,
  EVENTO_CONFIG,
  TIPO_LABEL,
  MODULO_LABEL,
  CATEGORIA_LABEL,
  CATEGORIA_BADGE_CLASS,
  getCategoria,
  TIPO_OPTIONS,
  MODULO_OPTIONS,
  CATEGORIA_OPTIONS,
} from '@features/admin/auditoria/constants';

function formatDataHora(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 0) return `Hoje, ${timeStr}`;
  if (diffDays === 1) return `Ontem, ${timeStr}`;
  return `${date.toLocaleDateString('pt-BR')}, ${timeStr}`;
}

function getDateLabel(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function AdminAuditoriaPage() {
  const { data: kpi, isLoading: kpiLoading } = useAuditoriaKpi();
  const { data: eventos, isLoading: eventosLoading } = useAuditoriaEventos();

  const [searchQuery, setSearchQuery] = useState('');
  const [moduloSelected, setModuloSelected] = useState<AuditoriaModulo[]>([]);
  const [tipoSelected, setTipoSelected] = useState<AuditoriaEventTipo[]>([]);
  const [categoriaSelected, setCategoriaSelected] = useState<AuditoriaCategoria[]>([]);
  const [usuarioSelected, setUsuarioSelected] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [daysToShow, setDaysToShow] = useState(INITIAL_DAYS);

  useEffect(() => {
    setDaysToShow(INITIAL_DAYS);
  }, [moduloSelected, tipoSelected, categoriaSelected, usuarioSelected, searchQuery, dateFrom, dateTo]);

  const usuarioOptions = useMemo(() => {
    const set = new Set<string>();
    (eventos ?? []).forEach((e) => set.add(e.usuario));
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((u) => ({ value: u, label: u }));
  }, [eventos]);

  const filtered = useMemo(() => {
    if (!eventos) return [];
    let result = eventos;
    if (moduloSelected.length > 0) {
      result = result.filter((e) => moduloSelected.includes(e.modulo));
    }
    if (tipoSelected.length > 0) {
      result = result.filter((e) => tipoSelected.includes(e.tipo));
    }
    if (categoriaSelected.length > 0) {
      result = result.filter((e) => categoriaSelected.includes(getCategoria(e.tipo)));
    }
    if (usuarioSelected.length > 0) {
      result = result.filter((e) => usuarioSelected.includes(e.usuario));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.titulo.toLowerCase().includes(q) ||
          e.descricao.toLowerCase().includes(q) ||
          e.usuario.toLowerCase().includes(q),
      );
    }
    if (dateFrom) {
      result = result.filter((e) => e.dataHora >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((e) => e.dataHora <= dateTo + 'T23:59:59');
    }
    return result;
  }, [eventos, moduloSelected, tipoSelected, categoriaSelected, usuarioSelected, searchQuery, dateFrom, dateTo]);

  // Group events by date label
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const evt of filtered) {
      const label = getDateLabel(evt.dataHora);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(evt);
    }
    return Array.from(map.entries()).map(([dateLabel, eventos]) => ({ dateLabel, eventos }));
  }, [filtered]);

  const visibleGrouped = useMemo(() => grouped.slice(0, daysToShow), [grouped, daysToShow]);
  const hasMoreDays = grouped.length > daysToShow;
  const remainingDays = grouped.length - daysToShow;
  const nextChunk = Math.min(DAYS_INCREMENT, remainingDays);

  const advancedActiveCount =
    (moduloSelected.length > 0 ? 1 : 0) +
    (tipoSelected.length > 0 ? 1 : 0) +
    (categoriaSelected.length > 0 ? 1 : 0) +
    (usuarioSelected.length > 0 ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0);

  const clearAdvancedFilters = () => {
    setModuloSelected([]);
    setTipoSelected([]);
    setCategoriaSelected([]);
    setUsuarioSelected([]);
    setDateFrom('');
    setDateTo('');
  };

  const formatPeriodoLabel = () => {
    const formatBR = (iso: string) => {
      const [y, m, d] = iso.split('-');
      return `${d}/${m}/${y}`;
    };
    if (dateFrom && dateTo) return `${formatBR(dateFrom)} – ${formatBR(dateTo)}`;
    if (dateFrom) return `Desde ${formatBR(dateFrom)}`;
    if (dateTo) return `Até ${formatBR(dateTo)}`;
    return '';
  };

  // KPIs vêm agregados do servidor (J40 P1 #12). Antes eram calculados aqui a
  // partir de `eventos`, que a rota trunca em EVENTOS_LIMIT=100 — em dia com
  // mais de 100 ações os números ficavam silenciosamente subestimados.
  // O card "Logins hoje" foi removido: nenhuma action de login é registrada em
  // audit_logs (o ACTION_MAP não define nenhuma), então era sempre 0.
  const kpis: { label: string; value: string | number; icon: IconType; iconBgColor: string }[] = [
    {
      label: 'Ações hoje',
      value: kpiLoading ? '—' : (kpi?.acoesHoje ?? 0),
      icon: RiFlashlightLine,
      iconBgColor: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    },
    {
      label: 'Usuários ativos',
      value: kpiLoading ? '—' : (kpi?.usuariosAtivosHoje ?? 0),
      icon: RiGroupLine,
      iconBgColor: 'bg-primary/10 text-primary',
    },
    {
      label: 'Pagamentos hoje',
      value: kpiLoading ? '—' : (kpi?.pagamentosHoje ?? 0),
      icon: RiMoneyDollarCircleLine,
      iconBgColor: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
    },
    {
      label: 'Alertas',
      value: kpi?.alertas ?? 0,
      icon: RiAlertLine,
      iconBgColor: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
    },
    {
      label: 'Erros',
      value: kpi?.erros ?? 0,
      icon: RiErrorWarningLine,
      iconBgColor: 'bg-red-50 text-red-600 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-auditoria-page">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Auditoria
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registro de todas as ações realizadas na plataforma
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpiCard) => (
          <StatsCard
            key={kpiCard.label}
            label={kpiCard.label}
            value={kpiCard.value}
            icon={kpiCard.icon}
            iconBgColor={kpiCard.iconBgColor}
            luminous
          />
        ))}
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <AdvancedFiltersPopover
            activeCount={advancedActiveCount}
            onClearAll={clearAdvancedFilters}
            contentClassName="w-96"
          >
            <RangeDateInput
              label="Período"
              min={dateFrom}
              max={dateTo}
              onMinChange={setDateFrom}
              onMaxChange={setDateTo}
              testIdPrefix="auditoria-filter-periodo"
            />
            <MultiSelectDropdown
              label="Módulo"
              options={MODULO_OPTIONS}
              values={moduloSelected}
              onChange={setModuloSelected}
              placeholder="Todos os módulos"
              testIdPrefix="auditoria-filter-modulo"
            />
            <MultiSelectDropdown
              label="Tipo de evento"
              options={TIPO_OPTIONS}
              values={tipoSelected}
              onChange={setTipoSelected}
              placeholder="Todos os tipos"
              testIdPrefix="auditoria-filter-tipo"
            />
            <MultiSelectDropdown
              label="Categoria"
              options={CATEGORIA_OPTIONS}
              values={categoriaSelected}
              onChange={setCategoriaSelected}
              placeholder="Todas as categorias"
              testIdPrefix="auditoria-filter-categoria"
            />
            <MultiSelectDropdown
              label="Usuário"
              options={usuarioOptions}
              values={usuarioSelected}
              onChange={setUsuarioSelected}
              placeholder="Todos os usuários"
              testIdPrefix="auditoria-filter-usuario"
            />
          </AdvancedFiltersPopover>

          <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar eventos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              data-testid="input-search-auditoria"
            />
          </div>
        </div>

        {advancedActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {(dateFrom || dateTo) && (
              <ActiveFilterChip
                label={`Período: ${formatPeriodoLabel()}`}
                onRemove={() => { setDateFrom(''); setDateTo(''); }}
                testId="auditoria-active-chip-periodo"
              />
            )}
            {moduloSelected.map((m) => (
              <ActiveFilterChip
                key={m}
                label={`Módulo: ${MODULO_LABEL[m]}`}
                onRemove={() => setModuloSelected(moduloSelected.filter((x) => x !== m))}
                testId={`auditoria-active-chip-modulo-${m}`}
              />
            ))}
            {tipoSelected.map((t) => (
              <ActiveFilterChip
                key={t}
                label={`Tipo: ${TIPO_LABEL[t]}`}
                onRemove={() => setTipoSelected(tipoSelected.filter((x) => x !== t))}
                testId={`auditoria-active-chip-tipo-${t}`}
              />
            ))}
            {categoriaSelected.map((c) => (
              <ActiveFilterChip
                key={c}
                label={`Categoria: ${CATEGORIA_LABEL[c]}`}
                onRemove={() => setCategoriaSelected(categoriaSelected.filter((x) => x !== c))}
                testId={`auditoria-active-chip-categoria-${c}`}
              />
            ))}
            {usuarioSelected.map((u) => (
              <ActiveFilterChip
                key={u}
                label={`Usuário: ${u}`}
                onRemove={() => setUsuarioSelected(usuarioSelected.filter((x) => x !== u))}
                testId={`auditoria-active-chip-usuario-${u}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      {eventosLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-80" />
              </div>
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16">
          <RiHistoryLine className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">Nenhum evento encontrado</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente alterar os filtros ou a busca.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {visibleGrouped.map((group) => (
            <div key={group.dateLabel}>
              <div className="flex items-center gap-3 mb-4">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {group.dateLabel}
                </p>
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              </div>

              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-gray-800" />
                <div className="flex flex-col gap-1.5">
                  {group.eventos.map((evento) => {
                    const cfg = EVENTO_CONFIG[evento.tipo] ?? EVENTO_CONFIG.sistema;
                    const Icon = cfg.icon;
                    const categoria = getCategoria(evento.tipo);
                    return (
                      <div
                        key={evento.id}
                        className="flex gap-4 -mx-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors cursor-default"
                        data-testid={`evento-${evento.id}`}
                      >
                        <div
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 mt-0.5',
                            cfg.bgColor,
                          )}
                        >
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{evento.titulo}</p>
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                              {MODULO_LABEL[evento.modulo]}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full',
                                CATEGORIA_BADGE_CLASS[categoria],
                              )}
                            >
                              {CATEGORIA_LABEL[categoria]}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatDataHora(evento.dataHora)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{evento.descricao}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{evento.usuario}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-col items-center gap-2 pt-4">
            <p className="text-xs text-muted-foreground" data-testid="auditoria-days-counter">
              Mostrando {visibleGrouped.length} de {grouped.length} {grouped.length === 1 ? 'dia' : 'dias'}
            </p>
            {hasMoreDays && (
              <Button
                variant="outline"
                onClick={() => setDaysToShow((d) => d + DAYS_INCREMENT)}
                data-testid="auditoria-load-more"
              >
                <RiArrowDownLine className="w-4 h-4 mr-2" />
                Carregar mais {nextChunk} {nextChunk === 1 ? 'dia' : 'dias'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
