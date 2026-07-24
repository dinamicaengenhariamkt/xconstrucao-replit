'use client';

import { NotificationsListView } from '@features/shared/notifications/components/NotificationsListView';
import { useEmpreiteiroNotifications } from '@features/empreiteiro/notifications/hooks/use-notifications';
import { SurveyPendenteCard } from '@features/surveys/components/SurveyPendenteCard';

export default function NotificacoesPage() {
  const state = useEmpreiteiroNotifications();
  return (
    <div className="space-y-6">
      <SurveyPendenteCard />
      <NotificationsListView {...state} luminous />
    </div>
  );
}
