'use client';

import { useMemo } from 'react';
import { RiCheckDoubleLine, RiSearchLine } from 'react-icons/ri';
import { cn } from '@shared/lib/utils';
import { Input } from '@shared/components/ui/input';
import { IconExpandMore, IconNotificationsOff } from '@shared/components/icons';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
import { RangeDateInput } from '@features/shared/components/filters/RangeDateInput';
import { formatRange } from '@shared/lib/formatters';
import { NotificationCard } from './NotificationCard';
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_DOT_CLASSES,
  type BaseNotification,
  type NotifFilter,
  type NotificacaoTipo,
} from '../types';
import type { UseNotificationsListReturn } from '../hooks/use-notifications-list';

const FILTER_TABS: { value: NotifFilter; label: (unread: number) => string }[] = [
  { value: 'todas', label: () => 'Todas' },
  { value: 'nao_lidas', label: (n) => `Não lidas${n > 0 ? ` (${n})` : ''}` },
  { value: 'lidas', label: () => 'Lidas' },
];

const TIPO_VALUES: NotificacaoTipo[] = ['lembrete', 'alerta', 'info', 'sucesso'];

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

interface NotificationsListViewProps<T extends BaseNotification>
  extends UseNotificationsListReturn<T> {
  title?: string;
  subtitleEmpty?: string;
  footerHint?: string;
  /** Aplica a borda luminosa de seção no container da lista. */
  luminous?: boolean;
}

export function NotificationsListView<T extends BaseNotification>({
  notifications,
  hasMore,
  loadMore,
  filterLida,
  setFilterLida,
  tipoSelected,
  setTipoSelected,
  dateMin,
  setDateMin,
  dateMax,
  setDateMax,
  searchQuery,
  setSearchQuery,
  advancedActiveCount,
  clearAllAdvanced,
  unreadCount,
  marcarTodasComoLidas,
  marcarComoLida,
  rawNotifications,
  title = 'Notificações',
  subtitleEmpty = 'Tudo em dia',
  footerHint = 'As notificações são mantidas por 30 dias',
  luminous = false,
}: NotificationsListViewProps<T>) {
  const tipoOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    rawNotifications.forEach((n) => {
      counts[n.tipo] = (counts[n.tipo] || 0) + 1;
    });
    return TIPO_VALUES.map((value) => ({
      value,
      label: `${NOTIFICATION_TYPE_LABELS[value]} (${counts[value] || 0})`,
    }));
  }, [rawNotifications]);

  const totalActiveFilters =
    (filterLida !== 'todas' ? 1 : 0) + advancedActiveCount;

  return (
    <div
      className="p-6 md:p-10 max-w-5xl mx-auto space-y-6"
      data-testid="notifications-page"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0
              ? `${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}`
              : subtitleEmpty}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={marcarTodasComoLidas}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/5 border border-primary/20 rounded-xl transition-colors cursor-pointer"
            data-testid="btn-mark-all-read"
          >
            <RiCheckDoubleLine className="w-4 h-4" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Filtros: tabs + popover + busca */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
            {FILTER_TABS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilterLida(value)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  filterLida === value
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
                )}
                data-testid={`tab-${value}`}
              >
                {label(unreadCount)}
              </button>
            ))}
          </div>

          <AdvancedFiltersPopover
            activeCount={advancedActiveCount}
            onClearAll={clearAllAdvanced}
          >
            <MultiSelectDropdown
              label="Tipo"
              options={tipoOptions}
              values={tipoSelected}
              onChange={(next) => setTipoSelected(next as NotificacaoTipo[])}
              placeholder="Todos os tipos"
              testIdPrefix="filter-tipo"
            />
            <RangeDateInput
              label="Período"
              min={dateMin}
              max={dateMax}
              onMinChange={setDateMin}
              onMaxChange={setDateMax}
              testIdPrefix="filter-data"
            />
          </AdvancedFiltersPopover>

          <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por título ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              data-testid="input-search-notifications"
            />
          </div>
        </div>

        {advancedActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {tipoSelected.map((t) => (
              <ActiveFilterChip
                key={t}
                label={`Tipo: ${NOTIFICATION_TYPE_LABELS[t]}`}
                onRemove={() => setTipoSelected(tipoSelected.filter((x) => x !== t))}
                dotClassName={NOTIFICATION_TYPE_DOT_CLASSES[t]}
                testId={`active-chip-tipo-${t}`}
              />
            ))}
            {(dateMin || dateMax) && (
              <ActiveFilterChip
                label={`Período: ${formatRange(
                  dateMin ? formatDateBR(dateMin) : '',
                  dateMax ? formatDateBR(dateMax) : '',
                )}`}
                onRemove={() => {
                  setDateMin('');
                  setDateMax('');
                }}
                testId="active-chip-data"
              />
            )}
            {searchQuery.trim() && (
              <ActiveFilterChip
                label={`Busca: "${searchQuery.trim()}"`}
                onRemove={() => setSearchQuery('')}
                testId="active-chip-busca"
              />
            )}
          </div>
        )}
      </div>

      {/* Lista */}
      <div
        className={cn(
          'bg-white dark:bg-gray-900 rounded-2xl overflow-hidden',
          luminous && 'luminous-section',
          !luminous && 'border border-gray-100 dark:border-gray-800 shadow-sm',
        )}
      >
        {notifications.length === 0 ? (
          <div className="py-16 text-center">
            <IconNotificationsOff className="text-4xl text-gray-300 dark:text-gray-600 block mb-3" />
            <p className="text-sm text-gray-400">
              {totalActiveFilters > 0
                ? 'Nenhuma notificação encontrada com os filtros aplicados.'
                : filterLida === 'nao_lidas'
                  ? 'Nenhuma notificação não lida'
                  : 'Nenhuma notificação encontrada'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((notif) => (
              <NotificationCard
                key={notif.id}
                notif={notif}
                onRead={marcarComoLida}
              />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-4">
            <button
              type="button"
              onClick={loadMore}
              className="w-full py-2 text-sm font-bold text-primary hover:bg-primary/5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              data-testid="btn-load-more-notifications"
            >
              <IconExpandMore className="text-lg" />
              Carregar mais notificações
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-xs text-center text-gray-400">{footerHint}</p>
    </div>
  );
}
