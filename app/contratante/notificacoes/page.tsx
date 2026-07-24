'use client';

import { NotificationsListView } from '@features/shared/notifications/components/NotificationsListView';
import { useContratanteNotifications } from '@features/contratante/notifications/hooks/use-notifications';
import { SurveyPendenteCard } from '@features/surveys/components/SurveyPendenteCard';

export default function NotificacoesPage() {
  const state = useContratanteNotifications();
  return (
    <div className="space-y-6">
      <SurveyPendenteCard />
      <NotificationsListView {...state} luminous />
    </div>
  );
}
