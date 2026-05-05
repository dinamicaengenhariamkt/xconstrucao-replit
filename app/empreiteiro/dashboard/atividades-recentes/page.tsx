'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  RiSearchLine,
  RiCheckboxCircleLine,
  RiMoneyDollarCircleLine,
  RiArchiveLine,
  RiFileTextLine,
  RiAlertLine,
} from 'react-icons/ri';
import type { IconType } from 'react-icons';
import { cn } from '@shared/lib/utils';
import { IconOpenInNew, IconExpandMore } from '@shared/components/icons';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@shared/components/ui/breadcrumb';
import { Input } from '@shared/components/ui/input';
import { PageHeader } from '@features/shared/components/PageHeader';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
import { useRecentActivities } from '@features/empreiteiro/dashboard/hooks/use-recent-activities';
import { getRelativeTime } from '@features/empreiteiro/dashboard/utils';
import type { Activity, ActivityType } from '@features/empreiteiro/dashboard/types';

const PAGE_SIZE = 20;
const LOAD_MORE_SIZE = 10;

const ICON_MAP: Record<string, IconType> = {
  CheckCircle2: RiCheckboxCircleLine,
  DollarSign: RiMoneyDollarCircleLine,
  Package: RiArchiveLine,
  FileText: RiFileTextLine,
  Alert: RiAlertLine,
};

const COLOR_CLASSES: Record<Activity['color'], string> = {
  success: 'bg-success/10 text-success',
  info: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
  primary: 'bg-primary/10 text-primary',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
};

const TIPO_LABEL: Record<ActivityType, string> = {
  payment: 'Pagamento',
  milestone: 'Marco',
  delivery: 'Entrega',
  contract: 'Contrato',
  alert: 'Alerta',
};

const TIPO_OPTIONS: { value: ActivityType; label: string }[] = (
  Object.keys(TIPO_LABEL) as ActivityType[]
).map((value) => ({ value, label: TIPO_LABEL[value] }));

function getDateGroup(timestamp: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const weekAgo = new Date(today.getTime() - 6 * 86_400_000);
  const monthAgo = new Date(today.getTime() - 29 * 86_400_000);
  const ts = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate());

  if (ts >= today) return 'Hoje';
  if (ts >= yesterday) return 'Ontem';
  if (ts >= weekAgo) return 'Esta semana';
  if (ts >= monthAgo) return 'Este mês';
  return 'Mais antigos';
}

const GROUP_ORDER = ['Hoje', 'Ontem', 'Esta semana', 'Este mês', 'Mais antigos'];

function ActivityRow({ activity }: { activity: Activity }) {
  const Icon = ICON_MAP[activity.icon] ?? RiCheckboxCircleLine;
  const colorClass = COLOR_CLASSES[activity.color];

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          colorClass,
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {activity.title}
          </p>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">
            {getRelativeTime(activity.timestamp)}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {activity.description}
        </p>
        {activity.obraId && activity.obraNome && (
          <Link
            href={`/empreiteiro/minhas-obras/${activity.obraId}`}
            className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-primary hover:underline"
          >
            <IconOpenInNew className="text-xs" />
            {activity.obraNome}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function AtividadesRecentesPage() {
  const { data: activities = [], isLoading } = useRecentActivities('12meses');
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoSelected, setTipoSelected] = useState<ActivityType[]>([]);
  const [obraSelected, setObraSelected] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const onFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setVisibleCount(PAGE_SIZE);
  };

  const obraOptions = useMemo(() => {
    const set = new Set(
      activities.filter((a) => a.obraNome).map((a) => a.obraNome as string),
    );
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((nome) => ({ value: nome, label: nome }));
  }, [activities]);

  const filtered = useMemo(() => {
    let result = activities;
    if (tipoSelected.length > 0) {
      result = result.filter((a) => tipoSelected.includes(a.type));
    }
    if (obraSelected.length > 0) {
      result = result.filter((a) => a.obraNome && obraSelected.includes(a.obraNome));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          (a.obraNome?.toLowerCase().includes(q) ?? false),
      );
    }
    return result;
  }, [activities, tipoSelected, obraSelected, searchQuery]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const grouped = useMemo(() => {
    const map: Record<string, Activity[]> = {};
    for (const a of visible) {
      const group = getDateGroup(a.timestamp);
      (map[group] ??= []).push(a);
    }
    return GROUP_ORDER.filter((g) => map[g]?.length).map((g) => ({
      label: g,
      items: map[g],
    }));
  }, [visible]);

  const advancedActiveCount =
    (tipoSelected.length > 0 ? 1 : 0) + (obraSelected.length > 0 ? 1 : 0);

  const clearAllAdvanced = () => {
    setTipoSelected([]);
    setObraSelected([]);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="p-10 flex flex-col gap-10" data-testid="atividades-empreiteiro-page">
      <div className="flex flex-col gap-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/empreiteiro/dashboard" data-testid="breadcrumb-dashboard">
                  Dashboard
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Atividades Recentes</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <PageHeader
          title="Atividades Recentes"
          subtitle="Histórico completo de eventos das suas obras."
        />

        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <AdvancedFiltersPopover
              activeCount={advancedActiveCount}
              onClearAll={clearAllAdvanced}
            >
              <MultiSelectDropdown
                label="Tipo"
                options={TIPO_OPTIONS}
                values={tipoSelected}
                onChange={onFilterChange(setTipoSelected)}
                placeholder="Todos os tipos"
                testIdPrefix="filter-tipo"
              />
              <MultiSelectDropdown
                label="Obra"
                options={obraOptions}
                values={obraSelected}
                onChange={onFilterChange(setObraSelected)}
                placeholder="Todas as obras"
                searchPlaceholder="Buscar obra..."
                testIdPrefix="filter-obra"
              />
            </AdvancedFiltersPopover>

            <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por descrição ou obra..."
                value={searchQuery}
                onChange={(e) => onFilterChange(setSearchQuery)(e.target.value)}
                className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                data-testid="input-search-atividades"
              />
            </div>
          </div>

          {advancedActiveCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {tipoSelected.map((t) => (
                <ActiveFilterChip
                  key={t}
                  label={`Tipo: ${TIPO_LABEL[t]}`}
                  onRemove={() =>
                    onFilterChange(setTipoSelected)(tipoSelected.filter((x) => x !== t))
                  }
                  testId={`active-chip-tipo-${t}`}
                />
              ))}
              {obraSelected.map((nome) => (
                <ActiveFilterChip
                  key={nome}
                  label={`Obra: ${nome}`}
                  onRemove={() =>
                    onFilterChange(setObraSelected)(obraSelected.filter((x) => x !== nome))
                  }
                  testId={`active-chip-obra-${nome}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden luminous-section">
        {isLoading ? (
          <div className="p-6 space-y-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma atividade encontrada com os filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {grouped.map(({ label, items }) => (
              <div key={label}>
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                  <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {label}
                  </span>
                </div>
                <div className="px-2">
                  {items.map((activity) => (
                    <ActivityRow key={activity.id} activity={activity} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + LOAD_MORE_SIZE)}
              className="w-full py-2 text-sm font-bold text-primary hover:bg-primary/5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              data-testid="atividades-load-more"
            >
              <IconExpandMore className="text-lg" />
              Carregar mais {Math.min(LOAD_MORE_SIZE, filtered.length - visibleCount)} atividades
            </button>
          </div>
        )}
      </div>

      {!isLoading && (
        <p className="text-xs text-center text-gray-400">
          Mostrando {Math.min(visibleCount, filtered.length)} de {filtered.length} atividade
          {filtered.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
