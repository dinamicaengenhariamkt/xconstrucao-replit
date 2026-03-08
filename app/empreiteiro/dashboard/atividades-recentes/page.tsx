'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  RiArrowLeftSLine,
  RiCheckboxCircleLine,
  RiMoneyDollarCircleLine,
  RiArchiveLine,
  RiFileTextLine,
  RiAlertLine,
} from 'react-icons/ri';
import type { IconType } from 'react-icons';
import { cn } from '@shared/lib/utils';
import { IconOpenInNew, IconExpandMore } from '@shared/components/icons';
import { useRecentActivities } from '@features/empreiteiro/dashboard/hooks/use-recent-activities';
import { getRelativeTime } from '@features/empreiteiro/dashboard/utils';
import type { Activity, ActivityType } from '@features/empreiteiro/dashboard/types';

// ─── Constants ────────────────────────────────────────────────────────────────

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

const TYPE_FILTERS: { value: ActivityType | 'all'; label: string; icon: IconType }[] = [
  { value: 'all', label: 'Todas', icon: RiCheckboxCircleLine },
  { value: 'payment', label: 'Pagamento', icon: RiMoneyDollarCircleLine },
  { value: 'milestone', label: 'Marco', icon: RiCheckboxCircleLine },
  { value: 'delivery', label: 'Entrega', icon: RiArchiveLine },
  { value: 'contract', label: 'Contrato', icon: RiFileTextLine },
  { value: 'alert', label: 'Alerta', icon: RiAlertLine },
];

// ─── Date grouping ────────────────────────────────────────────────────────────

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

// ─── Activity Row ─────────────────────────────────────────────────────────────

function ActivityRow({ activity }: { activity: Activity }) {
  const Icon = ICON_MAP[activity.icon] ?? RiCheckboxCircleLine;
  const colorClass = COLOR_CLASSES[activity.color];

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
      <div className={cn('flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center', colorClass)}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{activity.title}</p>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">
            {getRelativeTime(activity.timestamp)}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.description}</p>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AtividadesRecentesPage() {
  const { data: activities = [], isLoading } = useRecentActivities();
  const [activeFilter, setActiveFilter] = useState<ActivityType | 'all'>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(
    () => (activeFilter === 'all' ? activities : activities.filter((a) => a.type === activeFilter)),
    [activities, activeFilter]
  );

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const grouped = useMemo(() => {
    const map: Record<string, Activity[]> = {};
    for (const a of visible) {
      const group = getDateGroup(a.timestamp);
      (map[group] ??= []).push(a);
    }
    return GROUP_ORDER.filter((g) => map[g]?.length).map((g) => ({ label: g, items: map[g] }));
  }, [visible]);

  const handleFilterChange = (filter: ActivityType | 'all') => {
    setActiveFilter(filter);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/empreiteiro/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors font-medium"
      >
        <RiArrowLeftSLine className="w-4 h-4" />
        Dashboard
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Atividades Recentes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Histórico completo das suas atividades — últimos 30 dias
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleFilterChange(value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
              activeFilter === value
                ? 'bg-primary text-white border-primary'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary/50'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
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
            <p className="text-gray-400 text-sm">Nenhuma atividade encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {grouped.map(({ label, items }) => (
              <div key={label}>
                {/* Group header */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                  <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {label}
                  </span>
                </div>
                {/* Items */}
                <div className="px-2">
                  {items.map((activity) => (
                    <ActivityRow key={activity.id} activity={activity} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + LOAD_MORE_SIZE)}
              className="w-full py-2 text-sm font-bold text-primary hover:bg-primary/5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <IconExpandMore className="text-lg" />
              Carregar mais {Math.min(LOAD_MORE_SIZE, filtered.length - visibleCount)} atividades
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      {!isLoading && (
        <p className="text-xs text-center text-gray-400">
          Mostrando {Math.min(visibleCount, filtered.length)} de {filtered.length} atividade{filtered.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
