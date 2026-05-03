'use client';

import { NotificationsListView } from '@features/shared/notifications/components/NotificationsListView';
import { useEmpreiteiroNotifications } from '@features/empreiteiro/notifications/hooks/use-notifications';

export default function NotificacoesPage() {
  const state = useEmpreiteiroNotifications();
  return <NotificationsListView {...state} />;
}
