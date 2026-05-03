'use client';

import { useRouter } from 'next/navigation';
import {
  RiAlarmLine,
  RiAlertLine,
  RiInformationLine,
  RiCheckboxCircleLine,
} from 'react-icons/ri';
import type { IconType } from 'react-icons';
import { cn } from '@shared/lib/utils';
import type { BaseNotification, NotificacaoTipo } from '../types';
import { NOTIFICATION_TYPE_DOT_CLASSES } from '../types';

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

export function formatNotificationTime(isoDate: string): string {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 60) return 'agora mesmo';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return 'ontem';
  return `há ${Math.floor(diff / 86400)} dias`;
}

interface NotificationCardProps {
  notif: BaseNotification;
  onRead: (id: string) => void;
}

export function NotificationCard({ notif, onRead }: NotificationCardProps) {
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
        'w-full text-left px-5 py-4 flex items-start gap-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer',
        !notif.lida
          ? 'bg-primary/[0.03] dark:bg-primary/10'
          : 'bg-white dark:bg-gray-900',
      )}
      data-testid={`notification-card-${notif.id}`}
    >
      <div className="shrink-0 w-2 flex justify-center pt-2">
        {!notif.lida && (
          <span
            className={cn('w-2 h-2 rounded-full', NOTIFICATION_TYPE_DOT_CLASSES[notif.tipo])}
          />
        )}
      </div>

      <div
        className={cn(
          'shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          ICON_BG[notif.tipo],
        )}
      >
        <Icon className={cn('w-5 h-5', ICON_COLOR[notif.tipo])} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              'text-sm leading-snug',
              !notif.lida
                ? 'font-bold text-gray-900 dark:text-white'
                : 'font-semibold text-gray-700 dark:text-gray-300',
            )}
          >
            {notif.titulo}
          </p>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">
            {formatNotificationTime(notif.criadoEm)}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
          {notif.descricao}
        </p>
      </div>
    </button>
  );
}
