'use client';

import { useRouter } from 'next/navigation';
import {
  RiAlarmLine,
  RiAlertLine,
  RiInformationLine,
  RiCheckboxCircleLine,
  RiCheckDoubleLine,
} from 'react-icons/ri';
import type { IconType } from 'react-icons';
import { cn } from '@shared/lib/utils';
import {
  useEmpreiteiroNotifications,
  type NotifFilter,
} from '@features/empreiteiro/notifications/hooks/use-notifications';
import type { NotificacaoTipo } from '@features/empreiteiro/notifications/types';
import type { EmpreiteiroNotification } from '@features/empreiteiro/notifications/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<NotificacaoTipo, IconType> = {
  lembrete: RiAlarmLine,
  alerta: RiAlertLine,
  info: RiInformationLine,
  sucesso: RiCheckboxCircleLine,
};

const ICON_COLOR: Record<NotificacaoTipo, string> = {
  lembrete: 'text-amber-500',
  alerta: 'text-red-500',
  info: 'text-blue-500',
  sucesso: 'text-green-500',
};

const ICON_BG: Record<NotificacaoTipo, string> = {
  lembrete: 'bg-amber-50 dark:bg-amber-900/20',
  alerta: 'bg-red-50 dark:bg-red-900/20',
  info: 'bg-blue-50 dark:bg-blue-900/20',
  sucesso: 'bg-green-50 dark:bg-green-900/20',
};

const DOT_COLOR: Record<NotificacaoTipo, string> = {
  lembrete: 'bg-amber-400',
  alerta: 'bg-red-500',
  info: 'bg-blue-500',
  sucesso: 'bg-green-500',
};

const FILTER_TABS: { value: NotifFilter; label: (unread: number) => string }[] = [
  { value: 'todas', label: () => 'Todas' },
  { value: 'nao_lidas', label: (n) => `Não lidas${n > 0 ? ` (${n})` : ''}` },
  { value: 'lidas', label: () => 'Lidas' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(isoDate: string): string {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 60) return 'agora mesmo';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return 'ontem';
  return `há ${Math.floor(diff / 86400)} dias`;
}

// ─── Notification Card ────────────────────────────────────────────────────────

function NotificationCard({
  notif,
  onRead,
}: {
  notif: EmpreiteiroNotification;
  onRead: (id: string) => void;
}) {
  const router = useRouter();
  const Icon = ICON_MAP[notif.tipo];

  const handleClick = () => {
    onRead(notif.id);
    router.push(notif.href);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'w-full text-left px-5 py-4 flex items-start gap-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60',
        !notif.lida
          ? 'bg-primary/[0.03] dark:bg-primary/10'
          : 'bg-white dark:bg-gray-900'
      )}
    >
      {/* Unread dot */}
      <div className="shrink-0 w-2 flex justify-center pt-2">
        {!notif.lida && <span className={cn('w-2 h-2 rounded-full', DOT_COLOR[notif.tipo])} />}
      </div>

      {/* Icon */}
      <div className={cn('shrink-0 w-10 h-10 rounded-full flex items-center justify-center', ICON_BG[notif.tipo])}>
        <Icon className={cn('w-5 h-5', ICON_COLOR[notif.tipo])} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className={cn(
            'text-sm leading-snug',
            !notif.lida
              ? 'font-bold text-gray-900 dark:text-white'
              : 'font-semibold text-gray-700 dark:text-gray-300'
          )}>
            {notif.titulo}
          </p>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">
            {formatTime(notif.criadoEm)}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
          {notif.descricao}
        </p>
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificacoesPage() {
  const {
    notifications,
    hasMore,
    filterLida,
    setFilterLida,
    loadMore,
    unreadCount,
    marcarComoLida,
    marcarTodasComoLidas,
  } = useEmpreiteiroNotifications();

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notificações</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}` : 'Tudo em dia'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={marcarTodasComoLidas}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/5 border border-primary/20 rounded-xl transition-colors cursor-pointer"
          >
            <RiCheckDoubleLine className="w-4 h-4" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Filter tabs */}
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
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            {label(unreadCount)}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 block mb-3">
              notifications_off
            </span>
            <p className="text-sm text-gray-400">
              {filterLida === 'nao_lidas' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação encontrada'}
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

        {/* Load more */}
        {hasMore && (
          <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-4">
            <button
              type="button"
              onClick={loadMore}
              className="w-full py-2 text-sm font-bold text-primary hover:bg-primary/5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">expand_more</span>
              Carregar mais notificações
            </button>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <p className="text-xs text-center text-gray-400">
        As notificações são mantidas por 30 dias
      </p>
    </div>
  );
}
