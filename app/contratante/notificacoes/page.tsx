'use client';

import { NotificationsListView } from '@features/shared/notifications/components/NotificationsListView';
import { useContratanteNotifications } from '@features/contratante/notifications/hooks/use-notifications';

export default function NotificacoesPage() {
  const state = useContratanteNotifications();
  return <NotificationsListView {...state} luminous />;
}
