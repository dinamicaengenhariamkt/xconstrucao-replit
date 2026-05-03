'use client';

import { useNotificationsList } from '@features/shared/notifications/hooks/use-notifications-list';
import { MOCK_CONTRATANTE_NOTIFICATIONS } from '../mocks';

export type { NotifFilter } from '@features/shared/notifications/types';

export const useContratanteNotifications = () =>
  useNotificationsList(MOCK_CONTRATANTE_NOTIFICATIONS);
