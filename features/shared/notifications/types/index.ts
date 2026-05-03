export type NotificacaoTipo = 'lembrete' | 'alerta' | 'info' | 'sucesso';

export type NotifFilter = 'todas' | 'nao_lidas' | 'lidas';

export interface BaseNotification {
  id: string;
  titulo: string;
  descricao: string;
  tipo: NotificacaoTipo;
  lida: boolean;
  /** ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`). */
  criadoEm: string;
  href: string;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificacaoTipo, string> = {
  lembrete: 'Lembrete',
  alerta: 'Alerta',
  info: 'Informativo',
  sucesso: 'Sucesso',
};

export const NOTIFICATION_TYPE_DOT_CLASSES: Record<NotificacaoTipo, string> = {
  lembrete: 'bg-amber-400',
  alerta: 'bg-red-500',
  info: 'bg-blue-500',
  sucesso: 'bg-green-500',
};
